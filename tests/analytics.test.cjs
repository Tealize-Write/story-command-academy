const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const code = fs.readFileSync('js/analytics.js', 'utf8');
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup(options = {}) {
  const values = options.values || new Map();
  const session = options.session || new Map();
  const handlers = {};
  const requests = [];
  const timers = new Map(); let nextTimer = 0;
  let nextId = 0;
  const storage = map => ({ getItem: key => map.get(key) || null, setItem: (key, value) => map.set(key, value) });
  const context = vm.createContext({
    window: { currentLang: 'en', crypto: { randomUUID: () => `event-${++nextId}` },
      addEventListener: (name, fn) => { handlers[name] = fn; } },
    document: { body: { dataset: { page: 'index' } }, documentElement: { lang: 'en' }, referrer: options.referrer || '',
      addEventListener: (name, fn) => { handlers[name] = fn; } },
    location: { origin: 'https://tealize-write.github.io', pathname: options.pathname || '/story-command-academy/about.html', search: options.search ?? '?source=instagram' },
    localStorage: storage(values), sessionStorage: storage(session),
    navigator: { sendBeacon: options.beacon || (() => false) }, Blob, URL, URLSearchParams,
    GAS_URL: options.url ?? 'https://example.invalid/gas',
    getClientId: () => 'client-1', getDeviceType: () => 'mobile',
    getLocationPayload: () => ({ country: 'Taiwan', city: 'Taipei' }),
    AbortController,
    setTimeout: (fn, ms) => { const id = ++nextTimer; timers.set(id, { fn, ms }); return id; },
    clearTimeout: id => timers.delete(id),
    fetch: async (url, init) => {
      requests.push({ url, ...init, payload: JSON.parse(init.body) });
      return options.fetch ? options.fetch(url, init) :
        { ok: true, json: async () => ({ status: 'ok', eventId: JSON.parse(init.body).eventId }) };
    },
  });
  if (options.blocked) Object.defineProperty(context, 'localStorage', { get() { throw new Error('Blocked'); } });
  if (options.blockedSession) Object.defineProperty(context, 'sessionStorage', { get() { throw new Error('Blocked'); } });
  vm.runInContext(code, context);
  return { context, api: context.window.ANALYTICS, requests, handlers, values, timers, session };
}

test('untagged visits identify external sources and do not treat internal pages as acquisition', async () => {
  for (const [referrer, expected] of [
    ['https://www.threads.com/@tealize_write/post/123', 'threads'],
    ['https://l.threads.net/', 'threads'],
    ['https://l.instagram.com/', 'instagram'],
    ['https://www.facebook.com/', 'facebook'],
    ['https://www.plurk.com/', 'plurk'],
    ['https://www.google.com.tw/search?q=quiz', 'google'],
    ['https://reader.example/story', 'reader.example'],
    ['https://tealize-write.github.io/', 'tealize-write.github.io'],
    ['https://tealize-write.github.io/story-command-academy/index.html', 'direct'],
    ['https://instagram.com.example.org/', 'instagram.com.example.org'],
    ['', 'direct'],
    ['invalid referrer', 'direct'],
  ]) {
    const state = setup({ search: '', referrer });
    state.api.track('quiz_started'); await tick();
    assert.equal(state.requests[0].payload.source, expected, referrer);
    if (expected !== 'direct') assert.equal(state.requests[0].payload.referrer, referrer);
    else assert.equal(state.requests[0].payload.referrer, '');
  }
});

test('explicit source tags take priority and identify Threads when the app provides no referrer', async () => {
  for (const search of ['?source=threads', '?utm_source=threads']) {
    const state = setup({ search });
    state.api.track('quiz_started'); await tick();
    assert.equal(state.requests[0].payload.source, 'threads');
    assert.equal(state.requests[0].payload.referrer, '');
  }
  const tagged = setup({ search: '?source=threads_post&utm_source=instagram', referrer: 'https://www.facebook.com/' });
  assert.equal(tagged.api.getSource(), 'threads_post');
});

test('entry source and original referrer survive quiz to about navigation and a fresh external visit updates them', async () => {
  const first = setup({ search: '', referrer: 'https://www.threads.com/', pathname: '/story-command-academy/index.html' });
  first.api.track('quiz_completed', { keyword: 'blue' }); await tick();
  const about = setup({ search: '', referrer: 'https://tealize-write.github.io/story-command-academy/index.html?page=result&academy=blue', session: first.session });
  about.api.track('work_link_clicked', { platform: 'penana' }); await tick();
  assert.equal(about.requests[0].payload.source, 'threads');
  assert.equal(about.requests[0].payload.referrer, 'https://www.threads.com/');
  const next = setup({ search: '', referrer: 'https://www.plurk.com/', session: first.session });
  next.api.track('social_link_clicked', { platform: 'instagram' }); await tick();
  assert.equal(next.requests[0].payload.source, 'plurk');
  assert.equal(next.requests[0].payload.referrer, 'https://www.plurk.com/');
  const taggedApp = setup({ search: '?source=threads', session: first.session });
  taggedApp.api.track('quiz_started'); await tick();
  assert.equal(taggedApp.requests[0].payload.source, 'threads');
  assert.equal(taggedApp.requests[0].payload.referrer, '');
});

test('a resumed attempt source persists for later pages, and blocked session storage retains in-page attribution', async () => {
  const resumed = setup({ search: '' });
  resumed.api.setContext({ source: 'instagram' });
  resumed.api.track('quiz_completed', { keyword: 'green' }); await tick();
  const about = setup({ search: '', session: resumed.session });
  assert.equal(about.api.getSource(), 'instagram');
  const blocked = setup({ search: '?source=threads', blockedSession: true });
  blocked.context.location.search = '';
  blocked.api.track('work_link_clicked', { platform: 'cxc' }); await tick();
  assert.equal(blocked.requests[0].payload.source, 'threads');
});

test('sends fixed event names and separates page, platform, language and target', async () => {
  const state = setup();
  state.api.track('social_link_clicked', { platform: 'threads', target: 'https://www.threads.com/@tealize_write' });
  await tick();
  const event = state.requests[0].payload;
  assert.equal(event.action, 'social_link_clicked');
  assert.equal(event.page, 'about');
  assert.equal(event.language, 'en');
  assert.equal(event.platform, 'threads');
  assert.equal(event.source, 'instagram');
  assert.match(event.timestamp, /Z$/);
  assert.equal(state.requests[0].keepalive, true);
  assert.deepEqual(JSON.parse(state.values.get('academyAnalyticsQueue')), []);
  state.api.track('social_link_clicked', { eventId: event.eventId });
  await tick();
  assert.equal(state.requests.length, 1);
  assert.deepEqual(JSON.parse(state.values.get('academyAnalyticsQueue')), []);
  state.context.location.search = '';
  assert.equal(state.api.getSource(), 'instagram');
});

test('retains network failures and retries with the same event ID until acknowledged', async () => {
  let failing = true;
  const state = setup({ fetch: async () => {
    if (failing) throw new Error('Offline');
    return { ok: true, json: async () => ({ status: 'ok' }) };
  } });
  state.api.track('quiz_completed', { eventId: 'quiz_completed:attempt-1', keyword: 'black' });
  await tick();
  const queued = JSON.parse(state.values.get('academyAnalyticsQueue'));
  assert.equal(queued.length, 1);
  assert.equal(queued[0].attempts, 1);
  assert.ok(queued[0].nextTry > Date.now());
  failing = false;
  await state.api.flush(true);
  assert.deepEqual(state.requests.map(request => request.payload.eventId), ['quiz_completed:attempt-1', 'quiz_completed:attempt-1']);
  assert.deepEqual(JSON.parse(state.values.get('academyAnalyticsQueue')), []);
});

test('HTTP 200 with GAS error is retained rather than treated as a successful write', async () => {
  const state = setup({ fetch: async () => ({ ok: true, json: async () => ({ status: 'error', message: 'Sheet unavailable' }) }) });
  state.api.track('quiz_started');
  await tick();
  assert.equal(JSON.parse(state.values.get('academyAnalyticsQueue')).length, 1);
});

test('failed beacon uses keepalive fetch and successful beacon waits for server acknowledgement', async () => {
  for (const accepted of [false, true]) {
    let recovered = false;
    let beacons = 0;
    const state = setup({ beacon: () => { beacons++; return accepted; }, fetch: async () => {
      if (!recovered) throw new Error('Offline');
      return { ok: true, json: async () => ({ status: 'ok' }) };
    } });
    state.api.track('quiz_retaken');
    await tick();
    recovered = true;
    state.handlers.pagehide();
    await tick();
    assert.equal(beacons, 1);
    assert.equal(state.requests.length, accepted ? 1 : 2);
    assert.equal(JSON.parse(state.values.get('academyAnalyticsQueue')).length, accepted ? 1 : 0);
  }
});

test('queued events survive a new page and retries retain their identity', async () => {
  const first = setup({ fetch: async () => { throw new Error('Offline'); } });
  first.api.track('work_link_clicked', { platform: 'penana' });
  await tick();
  const second = setup({ values: first.values });
  await second.api.flush(true);
  await tick();
  assert.equal(second.requests[0].payload.eventId, first.requests[0].payload.eventId);
  assert.deepEqual(JSON.parse(first.values.get('academyAnalyticsQueue')), []);
});

test('blocked storage still sends and placeholder endpoints do not send', async () => {
  const blocked = setup({ blocked: true });
  assert.equal(blocked.api.track('quiz_started'), true);
  await tick();
  assert.equal(blocked.requests.length, 1);
  const missing = setup({ url: '__GAS_URL__' });
  assert.equal(missing.api.track('quiz_started'), false);
  await tick();
  assert.equal(missing.requests.length, 0);
});

test('a stalled request times out and later completion events still send with stable IDs', async () => {
  let stalled = true;
  const state = setup({ fetch: async (url, init) => stalled ? new Promise(() => {}) :
    { ok: true, json: async () => ({ status: 'ok', eventId: JSON.parse(init.body).eventId }) } });
  state.api.track('quiz_started', { eventId: 'start' });
  state.api.track('quiz_completed', { eventId: 'finish', keyword: 'blue' });
  const deadline = [...state.timers.values()].find(timer => timer.ms === 30000);
  assert.ok(deadline);
  deadline.fn(); await tick();
  assert.equal(state.requests[0].signal.aborted, true);
  assert.equal(JSON.parse(state.values.get('academyAnalyticsQueue')).find(item => item.payload.eventId === 'start').attempts, 1);
  stalled = false;
  await state.api.flush(true); await tick();
  assert.ok(state.requests.some(request => request.payload.eventId === 'finish'));
  assert.deepEqual(JSON.parse(state.values.get('academyAnalyticsQueue')), []);
});
