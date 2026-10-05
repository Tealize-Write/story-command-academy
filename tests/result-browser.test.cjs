const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
// Use PLAYWRIGHT_MODULE to point to another installation if needed.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/CODE/Github_Mine/Oblivraith-game/Oblivraith-Game/node_modules/playwright');
const output = path.resolve('artifacts/player-review/phase1');

test('phase 1 result rendering and quiz completion', { timeout: 120000 }, async () => {
  fs.mkdirSync(output, { recursive: true });
  const root = process.cwd();
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end(); }
      res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png' })[path.extname(file)] || 'application/octet-stream');
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const errors = [], posts = [], observations = [];
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/js/config.js') return route.fulfill({ contentType: 'text/javascript', body: `const GAS_URL = '${base}/analytics'; function getClientId(){return 'test';} function getTrafficSource(){return new URLSearchParams(location.search).get('source') || 'direct';} function getDeviceType(){return 'test';} function getLocationPayload(){return {country:'unknown',city:'unknown'};}` });
      if (url.pathname === '/analytics') {
        if (route.request().method() === 'POST') posts.push(JSON.parse(route.request().postData()));
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ counts: { red: 5, green: 10, blue: 15, black: 10, white: 10 }, total: 50 }) });
      }
      return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(base);
    async function showScores(scores, primary, lang = 'zh-TW') {
      await page.evaluate(({ scores, primary, lang }) => {
        localStorage.setItem('lang', lang);
        sessionStorage.setItem('latestAcademyScores', JSON.stringify({ version: QUIZ_RESULT_MODEL.VERSION, scores, primary, selectionSource: 'automatic' }));
      }, { scores, primary, lang });
      await page.goto(`${base}/index.html?page=result&academy=${primary}`);
      await page.waitForFunction(() => document.querySelectorAll('#academyScoreComparison .score-comparison-row').length === 5);
    }
    await showScores([6, 8, 25, 12, 7], 'blue');
    assert.deepEqual(await page.locator('.result-report-wrap > .res_ack .res_ack-title').allTextContents(), ['── 藍行 ──', '藍行學院的創作視角', '次高傾向：墨佇']);
    assert.equal(await page.locator('.result-explore').getAttribute('open'), null);
    await page.waitForFunction(() => document.querySelectorAll('#academyGlobalBookShelf .academy-book-score').length === 5);
    assert.deepEqual(await page.locator('#academyGlobalBookShelf .academy-book-score').allTextContents(), ['10%', '20%', '30%', '20%', '20%']);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(output, 'desktop-result.png'), fullPage: true, animations: 'disabled' });
    await page.setViewportSize({ width: 390, height: 844 });

    for (const [name, scores, primary] of [
      ['negative', [17, 10, -3, 9, 10], 'red'],
      ['zero', [0, 0, 0, 0, 0], 'blue'],
      ['negative-total', [-1, -2, -3, -1, -1], 'red'],
      ['secondary-tie', [6, 12, 25, 12, 7], 'blue'],
    ]) {
      await showScores(scores, primary);
      const labels = await page.locator('#academyBookShelf .academy-book-score').allTextContents();
      assert.deepEqual(labels, scores.map(score => `${score} 分`));
      assert.equal((await page.locator('#academyScoreComparison').innerText()).includes('%'), false);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const geometry = await page.locator('.score-comparison-fill').evaluateAll(bars => bars.map(bar => ({ left: parseFloat(bar.style.left), width: parseFloat(bar.style.width) })));
      for (const bar of geometry) assert.ok(Number.isFinite(bar.left) && Number.isFinite(bar.width) && bar.left >= 0 && bar.width >= 0 && bar.left + bar.width <= 100.000001);
      observations.push({ name, labels, geometry });
      if (name === 'negative') await page.screenshot({ path: path.join(output, 'mobile-negative-result.png'), fullPage: true, animations: 'disabled' });
      if (name === 'secondary-tie') assert.equal(await page.locator('.result-report-wrap > .res_ack').count(), 4);
      if (name === 'zero') assert.equal(await page.locator('.result-report-wrap > .res_ack').count(), 6);
    }
    await showScores([6, 8, 25, 12, 7], 'blue', 'en');
    assert.ok((await page.locator('.result-report-wrap > .res_ack .res_ack-title').allTextContents()).includes('Secondary preference: Inkarbor'));
    await page.evaluate(() => applyLang('zh-TW'));
    assert.ok((await page.locator('.result-report-wrap > .res_ack .res_ack-title').allTextContents()).includes('次高傾向：墨佇'));
    await page.goto(`${base}/index.html?page=result&academy=red`);
    assert.equal(await page.locator('.res_title').innerText(), '學院介紹');
    assert.equal(await page.locator('.score-comparison-row').count(), 0);
    await page.evaluate(() => sessionStorage.setItem('latestAcademyScores', '{bad json'));
    await page.reload();
    assert.equal(await page.locator('.res_title').innerText(), '學院介紹');

    // Complete all 30 questions through real buttons after the scoring correction.
    const persona = [1,1,3,0,2,1,1,0,2,0,1,1,3,3,1,1,3,1,1,2,3,2,2,1,3,4,2,2,0,2];
    const beforeUnique = posts.length;
    await page.goto(`${base}/index.html?page=quiz`);
    for (let i = 0; i < persona.length; i++) {
      await page.waitForFunction(index => qIndex === index && !advancing, i);
      await page.locator('.quiz-option-btn').nth(persona[i]).click();
    }
    await page.waitForURL('**/*page=result*');
    await page.waitForFunction(() => document.querySelectorAll('.score-comparison-row').length === 5);
    const completed = await page.evaluate(() => JSON.parse(sessionStorage.getItem('latestAcademyScores')));
    assert.deepEqual(completed.scores, [6, 8, 28, 9, 7]);
    assert.equal(completed.primary, 'blue');
    assert.equal(posts.length - beforeUnique, 1);
    await page.reload();
    assert.equal(posts.length - beforeUnique, 1);

    // Find a legitimate full answer sequence with a top-score tie.
    const source = { window: {} }; vm.createContext(source);
    for (const file of ['js/i18n.js', 'js/quiz-result-model.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), source);
    const qs = source.window.QUIZ_QUESTIONS['zh-TW'], model = source.window.QUIZ_RESULT_MODEL;
    let seed = 20261005, answers, tiedScores;
    for (let attempt = 0; attempt < 1000; attempt++) {
      answers = qs.map(q => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return Math.floor(seed / 4294967296 * q.options.length); });
      tiedScores = model.scoreAnswers(answers, qs);
      if (model.classify(tiedScores).top.length > 1) break;
    }
    assert.ok(model.classify(tiedScores).top.length > 1);
    await page.goto(`${base}/index.html?page=quiz&source=smoke`);
    const beforeTie = posts.length;
    // Exercise the completion state and then its restoration using valid answers.
    await page.evaluate(answers => {
      answerHistory = answers;
      scores = QUIZ_RESULT_MODEL.scoreAnswers(answers, QUIZ_QUESTIONS[currentLang]);
      qIndex = answers.length;
      showResult();
    }, answers);
    assert.equal(posts.length, beforeTie);
    const candidates = await page.locator('#tie-options button').allTextContents();
    assert.equal(candidates.length, model.classify(tiedScores).top.length);
    await page.reload();
    await page.locator('#tie-decision').waitFor({ state: 'visible' });
    await page.evaluate(() => applyLang('en'));
    assert.equal(await page.locator('#tie-auto').innerText(), 'Decide from my original answers');
    await page.screenshot({ path: path.join(output, 'mobile-tie-decision.png'), fullPage: true, animations: 'disabled' });
    assert.equal(posts.length, beforeTie);
    const chosen = model.classify(tiedScores).top.at(-1);
    await page.evaluate(chosen => {
      // An invalid academy and a duplicate completion must not create extra records.
      completeResult('invalid', 'player');
      completeResult(chosen, 'player');
      completeResult(chosen, 'player');
    }, chosen);
    await page.waitForURL('**/*page=result*');
    assert.equal(posts.length - beforeTie, 1);
    assert.equal(posts.at(-1).source, 'smoke');
    const chosenRecord = await page.evaluate(() => JSON.parse(sessionStorage.getItem('latestAcademyScores')));
    assert.equal(chosenRecord.primary, chosen);
    assert.equal(chosenRecord.selectionSource, 'player');
    assert.deepEqual(chosenRecord.scores, [...tiedScores]);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('pendingAcademyTie')), null);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);

    // Automatic tie decision retains the original reverse-answer rule.
    await page.evaluate(({ answers, tiedScores }) => {
      sessionStorage.setItem('pendingAcademyTie', JSON.stringify({ version: QUIZ_RESULT_MODEL.VERSION, answers, scores: tiedScores, startedAt: Date.now(), source: 'auto' }));
      localStorage.setItem('lang', 'zh-TW');
    }, { answers: [...answers], tiedScores: [...tiedScores] });
    await page.goto(`${base}/index.html?page=quiz`);
    const automatic = await page.evaluate(() => ACADEMIES[breakTie(QUIZ_RESULT_MODEL.classify(scores).top.map(key => QUIZ_RESULT_MODEL.ORDER.indexOf(key)))].key);
    const beforeAuto = posts.length;
    await page.locator('#tie-auto').click();
    await page.waitForURL('**/*page=result*');
    const autoRecord = await page.evaluate(() => JSON.parse(sessionStorage.getItem('latestAcademyScores')));
    assert.equal(autoRecord.primary, automatic);
    assert.equal(autoRecord.selectionSource, 'automatic');
    assert.equal(posts.length - beforeAuto, 1);

    // A mid-reveal language change must not strand the result in its first act.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload();
    await page.evaluate(() => applyLang('en'));
    assert.equal(await page.locator('.result-reveal-stage').getAttribute('data-reveal-state'), 'act3');
    assert.deepEqual(errors, []);
    observations.push({ completed, tieScores: [...tiedScores], chosen, automatic, completedPosts: posts.length, errors });
    await context.close();
  } finally {
    fs.writeFileSync(path.join(output, 'checks.json'), JSON.stringify({ observations, errors, posts }, null, 2));
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
