const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

test('independent drafts, final answer editing, acknowledged statistics, safe routing and result actions', { timeout: 60000 }, async () => {
  const root = process.cwd();
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (error, data) => {
      if (error) { res.writeHead(404); return res.end(); }
      res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.jpg': 'image/jpeg' })[path.extname(file)] || 'application/octet-stream');
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser, complete, count = 0;
  let statsFail = false, chartAvailable = true;
  let statsRequests = 0, delayNextStats = false, releaseStaleStats;
  const events = [], errors = [];
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : process.platform === 'win32' ? { channel: 'msedge' } : {}) });
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/js/config.js') return route.fulfill({ contentType: 'text/javascript', body:
        `const GAS_URL = '${base}/analytics'; function getClientId(){return 'regression';} function getTrafficSource(){return 'direct';} function getDeviceType(){return 'desktop';} function getLocationPayload(){return {};}` });
      if (url.pathname === '/analytics') {
        if (route.request().method() === 'POST') {
          const payload = JSON.parse(route.request().postData());
          if (payload.action === 'quiz_completed') { events.push(payload); await new Promise(resolve => { complete = resolve; }); count = 1; }
          return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ok', eventId: payload.eventId,
            ...(payload.action === 'quiz_completed' ? { statistics: { counts: { red: 0, green: 0, blue: count, black: 0, white: 0 }, total: count } } : {}) }) });
        }
        statsRequests++;
        const statistics = statsFail ? { status: 'error' } : { counts: { red: 0, green: 0, blue: count, black: 0, white: 0 }, total: count };
        if (delayNextStats) { delayNextStats = false; await new Promise(resolve => { releaseStaleStats = resolve; }); }
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify(statistics) });
      }
      if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/chart.js')) return chartAvailable ? route.fulfill({ contentType: 'text/javascript', body: 'window.Chart = class { destroy() {} };' }) : route.abort();
      return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
    const a = await context.newPage();
    await a.goto(`${base}/index.html?page=quiz&restart=1`);
    await a.locator('.quiz-option-btn').first().click();
    await a.waitForFunction(() => qIndex === 1 && !advancing);
    const idA = await a.evaluate(() => attemptId);
    const b = await context.newPage();
    await b.goto(`${base}/index.html?page=quiz&restart=1`);
    await b.locator('.quiz-option-btn').nth(2).click();
    await b.waitForFunction(() => qIndex === 1 && !advancing);
    const idB = await b.evaluate(() => attemptId);
    assert.notEqual(idA, idB);
    await a.reload(); await a.locator('#resume-quiz').click();
    assert.equal(await a.evaluate(() => attemptId), idA);
    assert.deepEqual(await a.evaluate(() => answerHistory), [0]);
    // A new write and restart in A must not delete B's scoped draft.
    await a.evaluate(() => startQuiz());
    await b.reload(); await b.locator('#resume-quiz').click();
    assert.equal(await b.evaluate(() => attemptId), idB);
    assert.deepEqual(await b.evaluate(() => answerHistory), [2]);
    // Invalid persistent legacy data must not mask a valid tab draft.
    await b.evaluate(() => localStorage.setItem('academyQuizDraft', '{bad json'));
    await b.reload(); await b.locator('#resume-quiz').click();
    assert.equal(await b.evaluate(() => attemptId), idB);
    await b.close();

    for (const query of ['?page=unknown', '?page=constructor', '?page=result&academy=constructor', '?page=result&academy=__proto__', '?page=result']) {
      await a.goto(base + '/index.html' + query);
      assert.ok((await a.locator('#page-root').innerText()).trim());
      if (query.includes('page=result')) assert.equal(await a.locator('#result-wrap a[href="index.html"]').count(), 1);
      else assert.equal(await a.locator('.index_button').count(), 1);
    }

    const answers = [1,1,3,0,2,1,1,0,2,0,1,1,3,3,1,1,3,1,1,2,3,2,2,1,3,4,2,2,0];
    await a.evaluate(answers => {
      const draft = { version: QUIZ_RESULT_MODEL.VERSION, attemptId: 'final-edit', startedAt: Date.now() - 86400000,
        source: 'direct', answers, currentIndex: 29, seenStages: [0, 1], activeMilliseconds: 4000 };
      sessionStorage.setItem('academyQuizActiveAttempt', JSON.stringify(draft.attemptId));
      sessionStorage.setItem('academyQuizDraft', JSON.stringify(draft));
      localStorage.setItem('academyQuizDraft:final-edit', JSON.stringify(draft));
    }, answers);
    await a.goto(base + '/index.html?page=quiz'); await a.locator('#resume-quiz').click();
    await a.locator('.quiz-option-btn').nth(0).click();
    await a.locator('#review-card').waitFor({ state: 'visible' });
    assert.equal(events.length, 0);
    await a.locator('#review-back').click();
    assert.equal(await a.evaluate(() => qIndex), 29);
    await a.locator('.quiz-option-btn').nth(2).click();
    await a.locator('#review-card').waitFor({ state: 'visible' });
    await a.locator('.lang-btn[data-lang="en"]').click();
    assert.equal(await a.locator('#finish-quiz').innerText(), 'View result');
    await a.locator('.lang-btn[data-lang="zh-TW"]').click();
    await a.locator('#finish-quiz').click();
    await a.waitForURL('**/*page=result*');
    await a.waitForFunction(() => document.getElementById('academyGlobalStatsTotal')?.textContent === '完成次數：0');
    await a.waitForFunction(() => JSON.parse(localStorage.getItem('academyAnalyticsQueue') || '[]').some(item => item.payload.action === 'quiz_completed'));
    while (!complete) await new Promise(resolve => setTimeout(resolve, 10));
    // A GET started before the POST acknowledgement must not overwrite its newer snapshot.
    delayNextStats = true;
    await a.evaluate(() => { void loadGlobalAcademyStats('blue'); });
    while (!releaseStaleStats) await new Promise(resolve => setTimeout(resolve, 10));
    const beforeAcknowledgement = statsRequests;
    complete();
    await a.waitForFunction(() => document.getElementById('academyGlobalStatsTotal')?.textContent === '完成次數：1');
    assert.equal(statsRequests, beforeAcknowledgement, 'completion POST renders without an additional GET');
    const staleResponse = a.waitForResponse(response => new URL(response.url()).pathname === '/analytics' && response.request().method() === 'GET');
    releaseStaleStats();
    await (await staleResponse).finished();
    await a.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await a.locator('#academyGlobalStatsTotal').innerText(), '完成次數：1');
    await a.evaluate(() => initializeResultPage());
    assert.equal(statsRequests, beforeAcknowledgement, 'a render after acknowledgement reuses the in-page POST snapshot');
    assert.equal(events.length, 1);
    assert.ok(events[0].timeSpent >= 86400);
    assert.ok(events[0].activeTimeSpent >= 4 && events[0].activeTimeSpent < 30);
    assert.equal(events[0].scoringVersion, 'creative-traits-2');
    assert.deepEqual(await a.evaluate(() => window.currentQuizResult.scores), [6, 8, 28, 9, 7]);
    assert.equal(await a.locator('#save-result-card').count(), 0);
    assert.equal(await a.locator('.result-quiz-nav > *').count(), 2);
    async function footerLayout() {
      await a.mouse.move(0, 0);
      return a.evaluate(async () => {
        await document.fonts.ready;
        scrollTo({ top: 0, left: 0, behavior: 'instant' });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const nav = document.querySelector('.result-quiz-nav');
        const link = nav.querySelector('.result-utility-link').getBoundingClientRect();
        const retake = document.getElementById('retake-quiz').getBoundingClientRect();
        const label = nav.querySelector('.result-utility-label');
        // Read both controls in one frame; separate browser calls can span a scroll
        // or responsive reflow and make non-overlapping buttons appear to overlap.
        return {
          link: { x: link.x, y: link.y, width: link.width, height: link.height },
          retake: { x: retake.x, y: retake.y, width: retake.width, height: retake.height },
          label: { height: label.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(label).lineHeight) },
          direction: getComputedStyle(nav).flexDirection,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
    }
    // Footer controls keep their readable width instead of squeezing the label.
    for (const width of [768, 1440]) {
      await a.setViewportSize({ width, height: 900 });
      const { link, retake, label, direction } = await footerLayout();
      assert.equal(direction, 'row');
      assert.ok(label.height <= label.lineHeight + 1);
      assert.ok(link.x + link.width + 19 <= retake.x, `Desktop footer spacing: ${JSON.stringify({ link, retake })}`);
    }
    await a.locator('.lang-btn[data-lang="en"]').click();
    await a.setViewportSize({ width: 320, height: 720 });
    const mobile = await footerLayout();
    assert.equal(mobile.direction, 'column');
    assert.equal(mobile.overflow, false);
    assert.ok(mobile.link.y + mobile.link.height + 13 <= mobile.retake.y,
      `Mobile footer spacing: ${JSON.stringify(mobile)}`);
    statsFail = true;
    await a.goto(base + '/index.html?page=result&academy=blue');
    await a.locator('#academyGlobalBookShelf button').waitFor({ state: 'visible' });
    statsFail = false; await a.locator('#academyGlobalBookShelf button').click();
    await a.waitForFunction(() => document.getElementById('academyGlobalStatsTotal')?.textContent.includes('1'));
    statsFail = true;
    await a.goto(base + '/stats.html');
    await a.locator('#stats-retry').waitFor({ state: 'visible' });
    statsFail = false; await a.locator('#stats-retry').click();
    await a.waitForFunction(() => document.getElementById('stats-total')?.textContent.includes('1'));
    assert.equal(await a.locator('#stats-retry').isVisible(), false);
    chartAvailable = false; await a.reload();
    await a.waitForFunction(() => document.getElementById('stats-error')?.textContent.includes('Charts'));
    assert.ok((await a.locator('#stats-total').innerText()).includes('1'));
    assert.deepEqual(errors, []);
  } finally {
    complete?.();
    releaseStaleStats?.();
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
