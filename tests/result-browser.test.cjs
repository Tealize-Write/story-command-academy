const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
// Use PLAYWRIGHT_MODULE to point to another installation if needed.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const output = path.resolve('artifacts/player-review/phase1');

test('quiz progress, compact layout, result rendering and completion', { timeout: 120000 }, async () => {
  fs.mkdirSync(output, { recursive: true });
  const progressOutput = path.resolve('artifacts/player-review/phase2');
  fs.mkdirSync(progressOutput, { recursive: true });
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
  const errors = [], posts = [], events = [], observations = [];
  let statsFixture = { counts: { red: 5, green: 10, blue: 15, black: 10, white: 10 }, total: 50, uniqueParticipants: 32 };
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : process.platform === 'win32' ? { channel: 'msedge' } : {}) });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/js/config.js') return route.fulfill({ contentType: 'text/javascript', body: `const GAS_URL = '${base}/analytics'; function getClientId(){return 'test';} function getTrafficSource(){return new URLSearchParams(location.search).get('source') || 'direct';} function getDeviceType(){return 'test';} function getLocationPayload(){return {country:'unknown',city:'unknown'};}` });
      if (url.pathname === '/analytics') {
        if (route.request().method() === 'POST') {
          const payload = JSON.parse(route.request().postData());
          if (!events.some(event => event.eventId === payload.eventId)) {
            events.push(payload);
            if (payload.action === 'quiz_completed') posts.push(payload);
          }
          return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ok', eventId: payload.eventId }) });
        }
        return route.fulfill({ contentType: 'application/json', body: JSON.stringify(statsFixture) });
      }
      if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/chart.js')) return route.fulfill({ contentType: 'text/javascript', body: 'window.Chart = class { destroy() {} };' });
      return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', err => errors.push(err.message));
    async function checkConnectionTracking(expectedPage) {
      const selectors = [
        ['.result-works .result-utility-link', 'personal_website_clicked', ''],
        ...['penana', 'kadokado', 'cxc'].map((platform, i) => [`.result-reading-link:nth-of-type(${i + 1})`, 'work_link_clicked', platform]),
        ...['facebook', 'instagram', 'threads', 'plurk'].map(platform => [`.result-social-link[data-platform="${platform}"]`, 'social_link_clicked', platform]),
      ];
      for (const [selector, action, platform] of selectors) {
        const link = page.locator(selector);
        // Exercise the real click handler without leaving for third-party websites.
        await link.evaluate(element => element.addEventListener('click', e => e.preventDefault(), { once: true }));
        const sent = page.waitForRequest(request => request.url() === `${base}/analytics` && request.method() === 'POST' &&
          request.postDataJSON().action === action && request.postDataJSON().platform === platform);
        await link.click();
        const payload = (await sent).postDataJSON();
        assert.equal(payload.page, expectedPage);
        assert.equal(payload.language, await page.locator('html').getAttribute('lang'));
        assert.equal(payload.target, await link.getAttribute('href'));
        assert.ok(payload.eventId);
      }
    }
    await page.goto(base);
    assert.equal(await page.locator('.lang-btn').count(), 2);
    assert.equal(await page.locator('.lang-btn[data-lang="en"]').isVisible(), true);
    await page.locator('.lang-btn[data-lang="en"]').click();
    assert.equal(await page.locator('.index_button').innerText(), 'Start Quiz');
    assert.equal(await page.locator('.lang-btn[data-lang="en"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.lang-btn[data-lang="zh-TW"]').getAttribute('aria-pressed'), 'false');
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    await page.locator('.lang-btn[data-lang="zh-TW"]').click();
    await page.goto(`${base}/index.html?page=quiz&restart=1&source=progress-test`);
    assert.equal(await page.locator('#previous-question').isDisabled(), true);
    assert.equal(await page.locator('#section-card').getAttribute('open'), '');
    await page.evaluate(() => scrollTo(0, 0));
    assert.ok((await page.locator('#question-text').boundingBox()).y < 250);
    assert.equal(await page.locator('.degree-option').count(), 4);
    await page.screenshot({ path: path.join(progressOutput, 'mobile-quiz.png'), animations: 'disabled' });
    await page.locator('.quiz-option-btn').nth(1).click();
    await page.evaluate(() => document.querySelector('.quiz-option-btn').click());
    await page.waitForFunction(() => qIndex === 1 && !advancing);
    assert.equal(await page.evaluate(() => answerHistory.length), 1);
    assert.equal(await page.locator('#section-card').getAttribute('open'), null);
    await page.locator('#previous-question').click();
    assert.equal(await page.locator('.quiz-option-btn').nth(1).getAttribute('aria-pressed'), 'true');
    await page.locator('.quiz-option-btn').nth(2).click();
    await page.waitForFunction(() => qIndex === 1 && !advancing);
    await page.locator('.quiz-option-btn').nth(0).click();
    await page.waitForFunction(() => qIndex === 2 && !advancing);
    const edited = await page.evaluate(() => ({ scores, answers: answerHistory, startedAt: quizStartTime,
      expected: QUIZ_QUESTIONS[currentLang][0].options[2].scores.map((score, i) => score + QUIZ_QUESTIONS[currentLang][1].options[0].scores[i]) }));
    assert.deepEqual(edited.scores, edited.expected);
    assert.deepEqual(edited.answers, [2, 0]);
    await page.locator('.lang-btn[data-lang="en"]').click();
    assert.equal(await page.evaluate(() => qIndex), 2);
    assert.deepEqual(await page.evaluate(() => scores), edited.scores);
    assert.deepEqual(await page.evaluate(() => answerHistory), edited.answers);
    await page.locator('.lang-btn[data-lang="zh-TW"]').click();
    await page.locator('#previous-question').click();
    await page.locator('#previous-question').click();
    await page.locator('#continue-answer').click();
    await page.waitForFunction(() => qIndex === 1 && !advancing);
    assert.deepEqual(await page.evaluate(() => scores), edited.scores);
    await page.reload();
    await page.locator('#resume-card').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(progressOutput, 'mobile-resume.png'), animations: 'disabled' });
    await page.locator('.lang-btn[data-lang="en"]').click();
    assert.equal(await page.locator('#resume-quiz').innerText(), 'Continue quiz');
    await page.locator('#resume-quiz').click();
    assert.equal(await page.evaluate(() => qIndex), 1);
    assert.equal(await page.evaluate(() => quizStartTime), edited.startedAt);
    assert.deepEqual(await page.evaluate(() => scores), edited.scores);
    assert.equal(await page.locator('.quiz-option-btn').nth(0).getAttribute('aria-pressed'), 'true');
    const reopened = await context.newPage();
    await reopened.goto(`${base}/index.html?page=quiz`);
    await reopened.locator('#resume-card').waitFor({ state: 'visible' });
    await reopened.locator('#resume-quiz').click();
    assert.equal(await reopened.evaluate(() => qIndex), 1);
    assert.equal(await reopened.evaluate(() => quizSource), 'progress-test');
    assert.deepEqual(await reopened.evaluate(() => scores), edited.scores);
    await reopened.close();

    // Cross the chapter boundary and return without changing the saved answers.
    await page.goto(`${base}/index.html?page=quiz&restart=1`);
    await page.evaluate(() => {
      answerHistory = Array(20).fill(3); qIndex = 20;
      scores = QUIZ_RESULT_MODEL.scoreAnswers(answerHistory, QUIZ_QUESTIONS[currentLang], true);
      saveProgress(); renderQuestion(true);
    });
    assert.equal(await page.locator('.degree-option').count(), 0);
    assert.equal(await page.locator('#section-card').getAttribute('open'), '');
    assert.equal(/^\([A-Z]\)/.test(await page.locator('.quiz-option-btn').first().innerText()), false);
    await page.locator('#previous-question').click();
    assert.equal(await page.locator('.degree-option').count(), 4);
    await page.locator('#continue-answer').click();
    await page.waitForFunction(() => qIndex === 20 && !advancing);
    assert.equal(await page.locator('#section-card').getAttribute('open'), null);
    await page.setViewportSize({ width: 320, height: 720 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => sessionStorage.setItem('invalidate-draft-on-load', '1'));
    await page.addInitScript(() => {
      if (sessionStorage.getItem('invalidate-draft-on-load') !== '1') return;
      sessionStorage.removeItem('invalidate-draft-on-load');
      sessionStorage.removeItem('academyQuizActiveAttempt');
      for (const key of Object.keys(localStorage)) if (key.startsWith('academyQuizDraft:')) localStorage.removeItem(key);
      for (const storage of [localStorage, sessionStorage]) storage.setItem('academyQuizDraft', JSON.stringify({ version: 'old', answers: [999], currentIndex: 99 }));
    });
    await page.reload();
    assert.equal(await page.locator('#resume-card').isVisible(), false);
    assert.equal(await page.evaluate(() => qIndex), 0);
    await page.evaluate(() => applyLang('zh-TW'));

    async function showScores(scores, primary, lang = 'zh-TW') {
      if (!await page.evaluate(() => typeof QUIZ_RESULT_MODEL !== 'undefined')) await page.goto(base);
      await page.evaluate(({ scores, primary, lang }) => {
        localStorage.setItem('lang', lang);
        sessionStorage.setItem('latestAcademyScores', JSON.stringify({ version: QUIZ_RESULT_MODEL.VERSION, scores, primary, selectionSource: 'automatic' }));
      }, { scores, primary, lang });
      await page.goto(`${base}/index.html?page=result&academy=${primary}`);
      await page.waitForFunction(() => document.querySelectorAll('#academyBookShelf .academy-book-score').length === 5);
    }
    await showScores([6, 8, 25, 12, 7], 'blue');
    assert.deepEqual(await page.locator('.result-details > .res_ack .res_ack-title').allTextContents(), ['── 藍行 ──', '藍行學院的創作視角', '次高傾向：墨佇']);
    assert.equal(await page.locator('.result-explore').getAttribute('open'), null);
    assert.equal(await page.locator('.result-reasons').count(), 0);
    assert.equal(await page.locator('.result-score-details').count(), 0);
    assert.deepEqual(await page.locator('.result-reading-link').evaluateAll(links => links.map(link => link.href)), [
      'https://www.penana.com/story/16766/', 'https://www.kadokado.com.tw/book/1425',
      'https://cxc.today/zh/store/ApatiteBlue/work/20217',
    ]);
    assert.deepEqual(await page.locator('.result-social-link').evaluateAll(links => links.map(link => ({ name: link.getAttribute('aria-label'),
      href: link.href, icon: !!link.querySelector('svg'), rel: link.rel }))), [
      { name: 'Facebook', href: 'https://www.facebook.com/TealizeWrite/', icon: true, rel: 'noopener noreferrer' },
      { name: 'Instagram', href: 'https://www.instagram.com/tealize_write/', icon: true, rel: 'noopener noreferrer' },
      { name: 'Threads', href: 'https://www.threads.com/@tealize_write', icon: true, rel: 'noopener noreferrer' },
      { name: 'Plurk', href: 'https://www.plurk.com/Tealize', icon: true, rel: 'noopener noreferrer' },
    ]);
    const workAuthorLinks = await page.locator('.result-works a, .result-author a').evaluateAll(links =>
      links.map(link => ({ href: link.href, label: link.getAttribute('aria-label') || link.textContent.trim(), rel: link.rel })));
    await checkConnectionTracking('result');
    await page.waitForFunction(() => document.querySelectorAll('#academyGlobalBookShelf .academy-book-score').length === 5);
    assert.deepEqual(await page.locator('#academyGlobalBookShelf .academy-book-score').allTextContents(), ['10%', '20%', '30%', '20%', '20%']);
    assert.equal(await page.locator('#academyGlobalStatsTotal').innerText(), '完成次數：50 · 參與者：32');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(output, 'desktop-result.png'), fullPage: true, animations: 'disabled' });
    await page.locator('.result-connections').screenshot({ path: path.join(progressOutput, 'desktop-result-links.png'), animations: 'disabled' });
    // One condensed portrait follows the actual secondary ranking below the name.
    for (const primary of ['red', 'green', 'blue', 'black', 'white']) {
      const scores = [6, 5, 7, 6, 6];
      scores[['red', 'green', 'blue', 'black', 'white'].indexOf(primary)] = 12;
      await showScores(scores, primary);
      const summary = await page.locator('.result-preference').innerText();
      assert.equal(await page.locator('.result-winner-box .result-preference').count(), 1);
      assert.equal(await page.locator('#result-winner-name + .result-secondary + .result-preference').count(), 1);
      if (primary === 'black') {
        assert.equal(await page.locator('.result-secondary-label').innerText(), '次高傾向：藍行');
        assert.ok(summary.includes('文字') && summary.includes('邏輯'));
        assert.ok(summary.length < 65);
        await page.evaluate(() => applyLang('en'));
        assert.equal(await page.locator('.result-secondary-label').innerText(), 'Secondary preference: Cerulink');
        const englishSummary = await page.locator('.result-preference').innerText();
        assert.ok(englishSummary.includes('language') && englishSummary.includes('logic'));
        await page.evaluate(() => applyLang('zh-TW'));
      }
      const winner = await page.locator('.result-winner-box').boundingBox();
      const shelf = await page.locator('#academyBookShelf').boundingBox();
      const scrollOffset = await page.evaluate(() => scrollY);
      await page.screenshot({ path: path.join(progressOutput, `desktop-academy-${primary}.png`),
        fullPage: true, clip: { x: winner.x, y: winner.y + scrollOffset, width: winner.width, height: shelf.y + shelf.height - winner.y }, animations: 'disabled' });
    }
    await showScores([6, 5, 7, 12, 6], 'black');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => document.querySelector('.result-winner-box').scrollIntoView({ block: 'start' }));
    await page.screenshot({ path: path.join(progressOutput, 'mobile-academy-black.png'), animations: 'disabled' });
    await showScores([6, 8, 25, 12, 7], 'blue');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.result-connections').screenshot({ path: path.join(progressOutput, 'mobile-result-links.png'), animations: 'disabled' });

    for (const [name, scores, primary] of [
      ['negative', [17, 10, -3, 9, 10], 'red'],
      ['zero', [0, 0, 0, 0, 0], 'blue'],
      ['negative-total', [-1, -2, -3, -1, -1], 'red'],
      ['secondary-tie', [6, 12, 25, 12, 7], 'blue'],
    ]) {
      await showScores(scores, primary);
      const labels = await page.locator('#academyBookShelf .academy-book-score').allTextContents();
      assert.deepEqual(labels, scores.map(score => `${score} 分`));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.waitForFunction(() => [...document.querySelectorAll('#academyBookShelf .academy-score-book')].every(book => Math.abs(parseFloat(book.style.height) - parseFloat(book.style.getPropertyValue('--book-height'))) < 0.001));
      const geometry = await page.locator('#academyBookShelf .academy-score-book').evaluateAll(books => books.map(book => ({
        height: book.getBoundingClientRect().height,
        plotHeight: book.parentElement.getBoundingClientRect().height,
        empty: book.closest('.academy-book-item').classList.contains('is-zero'),
        negative: book.closest('.academy-book-item').classList.contains('is-negative'),
        nameInside: !!book.querySelector('.academy-book-name'),
      })));
      geometry.forEach((book, i) => {
        assert.ok(book.height >= 82 && book.height <= book.plotHeight);
        assert.equal(book.empty, scores[i] === 0);
        assert.equal(book.negative, scores[i] < 0);
        assert.equal(book.nameInside, true);
      });
      for (let i = 0; i < scores.length; i++) for (let j = 0; j < scores.length; j++) {
        if (scores[i] > Math.max(0, scores[j])) assert.ok(geometry[i].height > geometry[j].height);
      }
      observations.push({ name, labels, geometry });
      if (name === 'negative') await page.screenshot({ path: path.join(output, 'mobile-negative-result.png'), fullPage: true, animations: 'disabled' });
      if (name === 'secondary-tie') assert.equal(await page.locator('.result-details > .res_ack').count(), 4);
      if (name === 'zero') assert.equal(await page.locator('.result-details > .res_ack').count(), 6);
    }
    await showScores([6, 8, 25, 12, 7], 'blue', 'en');
    assert.ok((await page.locator('.result-details > .res_ack .res_ack-title').allTextContents()).includes('Secondary preference: Inkarbor'));
    await page.evaluate(() => applyLang('zh-TW'));
    assert.ok((await page.locator('.result-details > .res_ack .res_ack-title').allTextContents()).includes('次高傾向：墨佇'));
    await page.goto(`${base}/index.html?page=result&academy=red`);
    assert.equal(await page.locator('.res_title').innerText(), '學院介紹');
    assert.equal(await page.locator('.score-breakdown-table tbody tr').count(), 0);
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
    await page.locator('#finish-quiz').click();
    await page.waitForURL('**/*page=result*');
    await page.waitForFunction(() => document.querySelectorAll('#academyBookShelf .academy-book-score').length === 5);
    const completed = await page.evaluate(() => JSON.parse(sessionStorage.getItem('latestAcademyScores')));
    assert.deepEqual(completed.scores, [6, 8, 28, 9, 7]);
    assert.equal(completed.primary, 'blue');
    assert.equal(await page.locator('.result-details').evaluate(node => node.tagName), 'SECTION');
    assert.equal(await page.locator('.result-reasons').count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('academyQuizDraft')), null);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('academyQuizDraft')), null);
    const position = await page.evaluate(() => {
      const box = selector => document.querySelector(selector).getBoundingClientRect();
      return { winner: box('.result-winner-box').bottom, shelf: box('#academyBookShelf').top,
        shelfBottom: box('#academyBookShelf').bottom,
        details: box('.result-details').top, retake: box('#retake-quiz').top };
    });
    assert.ok(position.winner < position.shelf && position.shelfBottom < position.details && position.details < position.retake);
    assert.equal(await page.locator('.score-comparison-fill').count(), 0);
    assert.equal(await page.locator('#retake-quiz').count(), 1);
    assert.equal(await page.locator('.result-score-details').count(), 0);
    const lastMain = page.locator('.result-details > .res_ack').first().locator('.res_ack-desc').last();
    assert.equal(await lastMain.isVisible(), true);
    assert.equal(await lastMain.innerText(), await page.evaluate(() => getResultContent('zh-TW').blue.main.at(-1)));
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: path.join(progressOutput, 'mobile-result-summary.png'), animations: 'disabled' });
    await page.locator('.result-explore > summary').click();
    await page.evaluate(() => applyLang('en'));
    assert.equal(await page.locator('.result-explore').getAttribute('open'), '');
    assert.equal(await page.locator('#result-works-title').innerText(), 'The Story Behind the Academies');
    assert.equal(await lastMain.isVisible(), true);
    assert.equal(await lastMain.innerText(), await page.evaluate(() => getResultContent('en').blue.main.at(-1)));
    await page.evaluate(() => applyLang('zh-TW'));
    assert.equal(await page.locator('.result-explore').getAttribute('open'), '');
    await page.setViewportSize({ width: 320, height: 720 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.evaluate(() => applyLang('en'));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#academyBookShelf').screenshot({ path: path.join(progressOutput, 'mobile-bookshelf-en-320.png'), animations: 'disabled' });
    await page.locator('.result-connections').screenshot({ path: path.join(progressOutput, 'mobile-result-links-en-320.png'), animations: 'disabled' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => applyLang('zh-TW'));
    assert.equal(posts.length - beforeUnique, 1);
    await page.reload();
    assert.equal(posts.length - beforeUnique, 1);
    await page.evaluate(completed => {
      localStorage.setItem('academyQuizDraft', JSON.stringify({ version: completed.version, attemptId: completed.completionId,
        answers: completed.answers, currentIndex: completed.answers.length, startedAt: completed.savedAt, source: 'test', seenStages: [0, 1] }));
    }, completed);
    await page.goto(`${base}/index.html?page=quiz`);
    await page.waitForURL('**/*page=result*');
    assert.equal(await page.evaluate(() => localStorage.getItem('academyQuizDraft')), null);
    assert.equal(posts.length - beforeUnique, 1);
    await page.locator('#retake-quiz').click();
    await page.waitForURL('**/*page=quiz*');
    await page.locator('#question-card').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => qIndex), 0);
    assert.deepEqual(await page.evaluate(() => answerHistory), []);
    assert.equal(await page.locator('#resume-card').isVisible(), false);
    assert.notEqual(await page.evaluate(() => attemptId), completed.completionId);
    await page.reload();
    assert.equal(await page.evaluate(() => qIndex), 0);
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
      saveProgress();
    }, answers);
    await page.locator('#finish-quiz').click();
    assert.equal(posts.length, beforeTie);
    const candidates = await page.locator('#tie-options button').allTextContents();
    assert.equal(candidates.length, model.classify(tiedScores).top.length);
    await page.reload();
    await page.locator('#tie-decision').waitFor({ state: 'visible' });
    await page.evaluate(() => applyLang('en'));
    assert.equal(await page.locator('#tie-auto').innerText(), 'Let the academy decide');
    await page.screenshot({ path: path.join(output, 'mobile-tie-decision.png'), fullPage: true, animations: 'disabled' });
    assert.equal(posts.length, beforeTie);
    const chosen = model.classify(tiedScores).top.at(-1);
    const tieResponse = page.waitForResponse(response => response.url() === `${base}/analytics` && response.request().method() === 'POST' && response.request().postDataJSON().action === 'quiz_completed');
    await page.evaluate(chosen => {
      // An invalid academy and a duplicate completion must not create extra records.
      completeResult('invalid', 'player');
      completeResult(chosen, 'player');
      completeResult(chosen, 'player');
    }, chosen);
    await tieResponse;
    await page.waitForURL('**/*page=result*');
    assert.equal(posts.length - beforeTie, 1);
    assert.equal(await page.locator('.lang-btn').count(), 2);
    await page.locator('.lang-btn[data-lang="zh-TW"]').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'zh-TW');
    await page.locator('.lang-btn[data-lang="en"]').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
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
      sessionStorage.setItem('academyQuizActiveAttempt', JSON.stringify('auto-fixture'));
      sessionStorage.setItem('pendingAcademyTie', JSON.stringify({ attemptId: 'auto-fixture', version: QUIZ_RESULT_MODEL.VERSION, answers, scores: tiedScores, startedAt: Date.now(), source: 'auto' }));
      localStorage.setItem('lang', 'zh-TW');
    }, { answers: [...answers], tiedScores: [...tiedScores] });
    await page.goto(`${base}/index.html?page=quiz`);
    const automatic = await page.evaluate(() => ACADEMIES[breakTie(QUIZ_RESULT_MODEL.classify(scores).top.map(key => QUIZ_RESULT_MODEL.ORDER.indexOf(key)))].key);
    const beforeAuto = posts.length;
    const autoResponse = page.waitForResponse(response => response.url() === `${base}/analytics` && response.request().method() === 'POST' && response.request().postDataJSON().action === 'quiz_completed');
    await page.locator('#tie-auto').click();
    await autoResponse;
    await page.waitForURL('**/*page=result*');
    const autoRecord = await page.evaluate(() => JSON.parse(sessionStorage.getItem('latestAcademyScores')));
    assert.equal(autoRecord.primary, automatic);
    assert.equal(autoRecord.selectionSource, 'automatic');
    assert.equal(posts.length - beforeAuto, 1);

    // Storage restrictions must not crash language selection, answering, or the result screen.
    const restricted = await context.newPage();
    restricted.on('pageerror', err => errors.push(err.message));
    await restricted.addInitScript(() => {
      for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(window, key, { configurable: true, get() { throw new DOMException('Blocked', 'SecurityError'); } });
    });
    await restricted.goto(`${base}/index.html?page=quiz`);
    assert.ok((await restricted.locator('#save-status').innerText()).includes('無法保存'));
    await restricted.locator('.lang-btn[data-lang="en"]').click();
    await restricted.locator('.quiz-option-btn').first().click();
    await restricted.waitForFunction(() => qIndex === 1 && !advancing);
    await restricted.evaluate(answers => {
      answerHistory = answers; qIndex = answers.length;
      scores = QUIZ_RESULT_MODEL.scoreAnswers(answers, QUIZ_QUESTIONS[currentLang]); showResult();
    }, persona);
    await restricted.locator('#finish-quiz').click();
    await restricted.waitForURL('**/*page=result*');
    assert.equal(await restricted.locator('#academyBookShelf .academy-book-score').count(), 5);
    assert.ok((await restricted.locator('.save-status').innerText()).includes('cannot be saved'));
    await restricted.screenshot({ path: path.join(progressOutput, 'mobile-result-without-storage.png'), animations: 'disabled' });
    await restricted.close();

    // A mid-reveal language change must not strand the result in its first act.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload();
    await page.evaluate(() => applyLang('en'));
    assert.equal(await page.locator('.result-reveal-stage').getAttribute('data-reveal-state'), 'act3');

    // GAS reports application errors through HTTP 200; neither page may display these as zero participants.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    statsFixture = { counts: {}, total: 0, error: 'Illegal spreadsheet id or key: YOUR_GOOGLE_SHEET_ID_HERE' };
    await showScores([6, 8, 25, 12, 7], 'blue');
    await page.waitForFunction(() => /失敗/.test(document.querySelector('#academyGlobalBookShelf')?.innerText || ''));
    assert.equal(await page.locator('#academyGlobalStatsTotal').innerText(), '');
    assert.equal(await page.locator('#academyGlobalBookShelf .academy-book-score').count(), 0);
    await page.goto(`${base}/stats.html`);
    await page.locator('.lang-btn[data-lang="en"]').click();
    assert.equal(await page.locator('#stats-title').innerText(),
      await page.evaluate(() => UI_TRANSLATIONS.en.statsPageTitle));
    await page.locator('.lang-btn[data-lang="zh-TW"]').click();
    await page.locator('#stats-error').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#stats-total').innerText(), '');
    assert.equal(await page.locator('#donut-wrap').isVisible(), false);

    statsFixture = { counts: { red: 4, green: 12, blue: 4, black: 11, white: 11 }, total: 42 };
    await page.evaluate(() => loadStats());
    assert.ok((await page.locator('#stats-total').innerText()).includes('42'));
    assert.equal(await page.locator('#stats-error').isVisible(), false);
    assert.equal(await page.locator('#donut-wrap').isVisible(), true);
    statsFixture = { counts: {}, total: 0, error: 'Sheet unavailable' };
    await page.evaluate(() => loadStats());
    assert.equal(await page.locator('#stats-total').innerText(), '');
    assert.equal(await page.locator('#donut-wrap').isVisible(), false);

    statsFixture = { counts: { red: 0, green: 0, blue: 0, black: 0, white: 0 }, total: 0 };
    await showScores([6, 8, 25, 12, 7], 'blue');
    await page.waitForFunction(() => document.querySelectorAll('#academyGlobalBookShelf .academy-book-score').length === 5);
    assert.deepEqual(await page.locator('#academyGlobalBookShelf .academy-book-score').allTextContents(), ['0%', '0%', '0%', '0%', '0%']);
    assert.ok((await page.locator('#academyGlobalStatsTotal').innerText()).includes('0'));
    await page.goto(`${base}/stats.html`);
    await page.waitForFunction(() => document.querySelector('#stats-total')?.innerText.includes('0'));
    assert.equal(await page.locator('#stats-error').isVisible(), false);

    // About uses the same localized work/author links, with a single quiz entry.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${base}/about.html`);
    assert.equal(await page.locator('#about-works-title').innerText(), '作品介紹與連結');
    assert.deepEqual(await page.locator('.result-works a, .result-author a').evaluateAll(links =>
      links.map(link => ({ href: link.href, label: link.getAttribute('aria-label') || link.textContent.trim(), rel: link.rel }))), workAuthorLinks);
    await checkConnectionTracking('about');
    assert.equal(await page.locator('#about-quiz-link').getAttribute('href'), 'index.html');
    assert.equal(await page.locator('.res_btn').count(), 1);
    assert.equal(await page.locator('[data-i18n-key="aboutOriginP1"]').innerText(),
      await page.evaluate(() => UI_TRANSLATIONS['zh-TW'].aboutOriginP1));
    await page.waitForFunction(() => document.querySelector('.result-work-cover')?.naturalWidth > 0);
    await page.locator('#about-connections').screenshot({ path: path.join(progressOutput, 'desktop-about-links.png'), animations: 'disabled' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#about-connections').screenshot({ path: path.join(progressOutput, 'mobile-about-links.png'), animations: 'disabled' });
    await page.setViewportSize({ width: 320, height: 720 });
    await page.locator('.lang-btn[data-lang="en"]').click();
    assert.equal(await page.locator('#about-works-title').innerText(), 'The Story Behind the Academies');
    assert.equal(await page.locator('.result-work-cover').getAttribute('alt'), 'Word Fate Awakening, volume one cover');
    await checkConnectionTracking('about');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.locator('#about-connections').screenshot({ path: path.join(progressOutput, 'mobile-about-links-en-320.png'), animations: 'disabled' });
    await page.locator('.lang-btn[data-lang="zh-TW"]').click();
    assert.equal(await page.locator('#about-works-title').innerText(), '作品介紹與連結');
    assert.equal(await page.locator('#about-quiz-link').innerText(), '回到測驗');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.goto(`${base}/index.html?page=result&academy=blue`);
    await page.locator('.result-quiz-nav a.result-utility-link').click();
    await page.waitForURL(`${base}/about.html`);
    await page.locator('#about-quiz-link').click();
    await page.waitForURL(`${base}/index.html`);
    await page.locator('.index_button').click();
    await page.locator('#question-text').waitFor({ state: 'visible' });
    await page.locator('.quiz-option-btn').first().click();
    await page.waitForFunction(() => qIndex === 1 && !advancing);
    await page.reload();
    await page.locator('#resume-card').waitFor({ state: 'visible' });
    const restarted = page.waitForRequest(request => request.url() === `${base}/analytics` && request.method() === 'POST' && request.postDataJSON().action === 'quiz_restarted');
    await page.locator('#restart-quiz').click();
    await page.locator('#question-text').waitFor({ state: 'visible' });
    await restarted;
    for (const action of ['quiz_started', 'quiz_resumed', 'quiz_restarted', 'quiz_retaken', 'quiz_returned', 'quiz_entry_clicked', 'language_changed', 'about_opened']) {
      assert.ok(events.some(event => event.action === action), `Missing analytics event: ${action}`);
    }
    assert.equal(posts.at(-1).eventId, `quiz_completed:${posts.at(-1).attemptId}`);
    assert.deepEqual(errors, []);
    observations.push({ completed, tieScores: [...tiedScores], chosen, automatic, completedPosts: posts.length, errors });
    await context.close();
  } finally {
    fs.writeFileSync(path.join(output, 'checks.json'), JSON.stringify({ observations, errors, posts, events }, null, 2));
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});
