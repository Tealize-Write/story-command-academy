const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ window: {}, setTimeout, clearTimeout, AbortController });
vm.runInContext(fs.readFileSync('js/academy-stats.js', 'utf8'), context);
const { parse, load } = context.window.ACADEMY_STATS;
const counts = { red: 4, green: 12, blue: 4, black: 11, white: 11 };

test('accepts complete statistics and a genuinely empty sheet', () => {
  assert.deepEqual(JSON.parse(JSON.stringify(parse({ counts, total: 42 }))), { counts, total: 42 });
  assert.equal(parse({ counts: { red: 0, green: 0, blue: 0, black: 0, white: 0 }, total: 0 }).total, 0);
});

test('rejects GAS application errors returned with HTTP 200', () => {
  assert.throws(() => parse({ counts: {}, total: 0, error: 'Illegal spreadsheet id or key: YOUR_GOOGLE_SHEET_ID_HERE' }));
  assert.throws(() => parse({ counts, total: 42, status: 'error' }));
});

test('rejects incomplete counts, invalid values and mismatched totals', () => {
  for (const data of [null, {}, { counts: {}, total: 0 }, { counts: [], total: 0 },
    { counts: { ...counts, red: -1 }, total: 37 }, { counts: { ...counts, red: '4' }, total: 42 },
    { counts: { ...counts, red: 1.5 }, total: 39.5 }, { counts, total: 0 }, { counts }]) {
    assert.throws(() => parse(data));
  }
});

test('rejects HTTP failures before consuming their response body', async () => {
  let readBody = false;
  context.fetch = async () => ({ ok: false, json: async () => { readBody = true; return { counts, total: 42 }; } });
  await assert.rejects(load('https://example.invalid/stats'));
  assert.equal(readBody, false);
});

test('accepts and validates distinct participants while supporting old GAS responses', () => {
  const data = parse({ counts, total: 42, uniqueParticipants: 30, unidentifiedCompletions: 2 });
  assert.equal(data.uniqueParticipants, 30);
  assert.equal(data.unidentifiedCompletions, 2);
  for (const uniqueParticipants of [-1, 43, '30', 1.2]) {
    assert.throws(() => parse({ counts, total: 42, uniqueParticipants }));
  }
  assert.throws(() => parse({ counts, total: 42, uniqueParticipants: 30, unidentifiedCompletions: 13 }));
  const t = { totalParticipants: '完成次數：', uniqueParticipants: '參與者：' };
  assert.equal(context.window.ACADEMY_STATS.describe(data, t), '完成次數：42 · 參與者：30');
  assert.equal(context.window.ACADEMY_STATS.describe(parse({ counts, total: 42 }), t), '完成次數：42');
});

test('statistics time out even if the response body never finishes', async () => {
  const timers = new Map(); let id = 0;
  const ctx = vm.createContext({ window: {}, AbortController,
    setTimeout: (fn, ms) => { timers.set(++id, fn); return id; }, clearTimeout: key => timers.delete(key),
    fetch: async () => ({ ok: true, json: () => new Promise(() => {}) }) });
  vm.runInContext(fs.readFileSync('js/academy-stats.js', 'utf8'), ctx);
  const pending = ctx.window.ACADEMY_STATS.load('https://example.invalid');
  const rejected = assert.rejects(pending, /timed out/);
  [...timers.values()][0](); await rejected;
  assert.equal(timers.size, 0);
});
