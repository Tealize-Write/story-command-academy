const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

test('legacy redirects preserve visit attribution, safe routing and outbound event identity', { timeout: 60000 }, async () => {
  const root = process.cwd();
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const filename = path.resolve(root, '.' + pathname);
    if (!filename.startsWith(root + path.sep)) { res.writeHead(403); return res.end(); }
    fs.readFile(filename, (error, data) => {
      if (error) { res.writeHead(404); return res.end(); }
      res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg' })[path.extname(filename)] || 'text/html; charset=utf-8');
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const external = 'https://www.threads.com/?private_referrer=keep-out-of-url';
  const cases = [
    { entry: '/author-quiz.html?source=threads&utm_medium=social&utm_campaign=launch&page=result&academy=white&attemptId=old&target=https://example.invalid/', source: 'threads', referrer: '', mode: 'quiz', campaign: true },
    { entry: '/result.html?academy=blue&utm_source=threads&utm_content=post&page=quiz&attemptId=old', source: 'threads', referrer: '', mode: 'result' },
    { entry: '/author-quiz.html?source=threads_post&utm_source=instagram', source: 'threads_post', referrer: 'https://www.facebook.com/', mode: 'quiz' },
    { entry: '/author-quiz.html', source: 'threads', referrer: external, mode: 'quiz' },
    { entry: '/result.html?academy=blue', source: 'threads', referrer: external, mode: 'result' },
    { entry: '/author-quiz.html', source: 'threads', referrer: external, mode: 'quiz', blocked: true },
    { entry: '/result.html?academy=blue&utm_source=threads', source: 'threads', referrer: external, mode: 'result', blocked: true },
    { entry: '/author-quiz.html', source: 'instagram', referrer: 'https://www.instagram.com/', mode: 'quiz', internal: true },
    { entry: '/result.html?academy=blue', source: 'instagram', referrer: 'https://www.instagram.com/', mode: 'result', internal: true },
    { entry: '/author-quiz.html', source: 'direct', referrer: '', mode: 'quiz' },
  ];
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : process.platform === 'win32' ? { channel: 'msedge' } : {}) });
    for (const item of cases) {
      const context = await browser.newContext({ reducedMotion: 'reduce' });
      const events = [], errors = [];
      try {
        if (item.blocked) await context.addInitScript(() => {
          for (const name of ['sessionStorage', 'localStorage']) Object.defineProperty(window, name, { configurable: true, get() { throw new DOMException('Blocked', 'SecurityError'); } });
        });
        if (item.internal) await context.addInitScript(({ source, referrer }) => {
          if (!/\/(author-quiz|result)\.html$/.test(location.pathname)) return;
          sessionStorage.setItem('academyAnalyticsVisit', JSON.stringify({ source, referrer }));
          sessionStorage.setItem('academyAnalyticsAttemptContext', JSON.stringify({ source: 'plurk', referrer: 'https://www.plurk.com/', attemptId: 'unrelated-old-attempt' }));
        }, { source: item.source, referrer: item.referrer });
        await context.route('**/*', async route => {
          const url = new URL(route.request().url());
          if (url.origin !== base) return route.abort();
          if (url.pathname === '/js/config.js') return route.fulfill({ contentType: 'text/javascript', body:
            `const GAS_URL='${base}/analytics'; function getClientId(){return 'legacy-entry-test';} function getDeviceType(){return 'desktop';} function getLocationPayload(){return {};}` });
          if (url.pathname === '/analytics') {
            if (route.request().method() === 'POST') {
              const payload = route.request().postDataJSON(); events.push(payload);
              return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ status: 'ok', eventId: payload.eventId }) });
            }
            return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ counts: { red: 0, green: 0, blue: 1, black: 0, white: 0 }, total: 1 }) });
          }
          return route.continue();
        });
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        const responseFor = action => page.waitForResponse(response => response.url() === base + '/analytics' && response.request().method() === 'POST' && response.request().postDataJSON().action === action);
        const started = item.mode === 'quiz' ? responseFor('quiz_started') : null;
        await page.goto(base + item.entry, item.internal ? { referer: base + '/index.html' } : item.referrer ? { referer: item.referrer } : {});
        await page.waitForURL(url => url.pathname === '/index.html');
        await page.waitForFunction(() => !!window.ANALYTICS && document.readyState === 'complete');
        const destination = new URL(page.url());
        assert.equal(destination.origin, base);
        assert.equal(destination.searchParams.get('page'), item.mode);
        assert.equal(destination.searchParams.get('source'), item.source);
        assert.equal(destination.searchParams.get('academy'), item.mode === 'result' ? 'blue' : null);
        for (const key of ['attemptId', 'target', 'referrer']) assert.equal(destination.searchParams.has(key), false);
        assert.equal(destination.href.includes('private_referrer'), false);
        if (item.campaign) {
          assert.equal(destination.searchParams.get('utm_medium'), 'social');
          assert.equal(destination.searchParams.get('utm_campaign'), 'launch');
        }
        const expectedReferrer = item.blocked ? '' : item.referrer;
        assert.deepEqual(await page.evaluate(() => window.ANALYTICS.getEntryAttribution()), { source: item.source, referrer: expectedReferrer });
        let event;
        if (started) {
          await started;
          event = events.find(event => event.action === 'quiz_started');
          assert.equal(events.filter(event => event.action === 'quiz_started').length, 1);
          assert.ok(event.attemptId);
          assert.equal(event.page, 'quiz');
        } else {
          await Promise.all([responseFor('work_link_clicked'), page.locator('.result-reading-link').first().evaluate(link => link.click())]);
          event = events.find(event => event.action === 'work_link_clicked');
          assert.equal(event.attemptId, '');
          assert.equal(event.page, 'result');
          assert.equal(event.platform, 'penana');
          assert.equal(events.some(event => event.action === 'quiz_started'), false);
        }
        assert.equal(event.source, item.source);
        assert.equal(event.referrer, expectedReferrer);
        assert.ok(event.eventId);
        assert.equal(events.some(event => !['quiz', 'result'].includes(event.page)), false);
        assert.deepEqual(errors, [], item.entry);
      } finally { await context.close(); }
    }
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
});
