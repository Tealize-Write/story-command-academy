const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
// GAS is kept locally by project preference; this contract check runs where it exists.
const available = fs.existsSync('GAS/Code.gs');
const oldHeaders = ['timestamp', 'clientId', 'keyword', 'action', 'source', 'referrer', 'device', 'country', 'city', 'timeSpent'];

function setup(rows = [oldHeaders.slice()]) {
  let timeZone = 'Etc/UTC';
  let held = false;
  const backups = [];
  const formats = [];
  const cache = new Map(); let reads = 0;
  const sheet = {
    getLastRow: () => rows.length, getMaxColumns: () => 26,
    insertRowBefore: () => rows.unshift([]),
    getParent: () => spreadsheet,
    appendRow: row => rows.push(row),
    getDataRange: () => ({ getValues: () => { reads++; return rows.map(row => row.slice()); } }),
    getRange(row, column, height = 1, width = 1) {
      const range = {
        getValues: () => Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => rows[row - 1 + i]?.[column - 1 + j] ?? '')),
        setValues(values) {
          values.forEach((data, i) => {
            rows[row - 1 + i] ||= [];
            data.forEach((value, j) => { rows[row - 1 + i][column - 1 + j] = value; });
          });
          return range;
        },
        setFontWeight() { return range; },
        setNumberFormat(format) { formats.push({ row, column, height, format }); return range; },
        createTextFinder(value) {
          const finder = { matchEntireCell: () => finder, useRegularExpression: () => finder,
            findNext: () => range.getValues().some(data => data[0] === value) ? {} : null };
          return finder;
        },
      };
      return range;
    },
    copyTo() {
      const copy = { rows: rows.map(row => row.slice()), setName(name) { this.name = name; return this; } };
      backups.push(copy);
      return copy;
    },
  };
  const spreadsheet = { getSpreadsheetTimeZone: () => timeZone, setSpreadsheetTimeZone: zone => { timeZone = zone; },
    getSheetByName: name => { assert.equal(name, '測驗結果'); return sheet; } };
  const context = vm.createContext({ Date, Logger: { log() {} },
    CacheService: { getScriptCache: () => ({ get: key => cache.get(key) || null, put: (key, value) => cache.set(key, value), remove: key => cache.delete(key) }) },
    SpreadsheetApp: { openById: id => {
      assert.equal(id, '1UaAnWH8hUeoQR792OcP-BaGwW_64xmBJnsGf-mEATQ4'); return spreadsheet;
    } },
    LockService: { getScriptLock: () => ({ waitLock() { assert.equal(held, false); held = true; },
      hasLock: () => held, releaseLock() { held = false; } }) },
    ContentService: { MimeType: { JSON: 'application/json' },
      createTextOutput: body => ({ body, setMimeType() { return this; } }) },
  });
  vm.runInContext(fs.readFileSync('GAS/Code.gs', 'utf8'), context);
  return { context, rows, backups, formats, cache, getReads: () => reads, getTimeZone: () => timeZone,
    post: payload => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(payload) } }).body),
    stats: () => JSON.parse(context.doGet().body) };
}

test('GAS stores real dates, preserves existing columns and deduplicates retried events', { skip: !available }, () => {
  const state = setup();
  const event = { timestamp: '2026-10-08T17:04:37.821Z', clientId: 'one', keyword: 'black',
    action: 'quiz_completed', eventId: 'quiz_completed:attempt-1', page: 'quiz', language: 'en', attemptId: 'attempt-1' };
  assert.equal(state.post(event).status, 'ok');
  assert.equal(state.getTimeZone(), 'Asia/Taipei');
  assert.equal(state.rows[1][0].toISOString(), event.timestamp);
  assert.equal(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei', dateStyle: 'short', timeStyle: 'medium' }).format(state.rows[1][0]), '2026-10-09 01:04:37');
  assert.deepEqual([...state.rows[0]].slice(0, 10), oldHeaders);
  assert.equal(state.rows[0].length, 24);
  assert.equal(state.rows[1][11], 'quiz');
  assert.equal(state.rows[1][14], 'en');
  assert.equal(state.post(event).duplicate, true);
  assert.equal(state.rows.length, 2);
  assert.equal(state.formats[0].format, 'yyyy-mm-dd hh:mm:ss');
  assert.equal(state.post({ action: 'warmup' }).status, 'warmup');
  assert.equal(state.rows.length, 2);
});

test('GAS distinguishes completions from unique clients with old rows and mixed actions', { skip: !available }, () => {
  const state = setup([
    oldHeaders.slice(),
    ['old UTC text', 'one', 'red', 'quiz_completed'],
    ['old UTC text', 'one', 'blue', 'quiz_completed'],
    ['date', 'two', 'green', 'quiz_completed', '', '', '', '', '', 0, 'completion-2'],
    ['date', 'two', 'green', 'quiz_completed', '', '', '', '', '', 0, 'completion-2'],
    ['date', '', 'white', 'quiz_completed'],
    ['date', 'three', 'black', 'social_link_clicked'],
    ['date', 'four', 'black', '測驗與學院的設計'],
  ]);
  assert.deepEqual(state.stats(), { counts: { red: 1, green: 1, blue: 1, black: 0, white: 1 }, total: 4,
    uniqueParticipants: 2, unidentifiedCompletions: 1 });
});

test('legacy timestamp migration creates a backup first and never shifts dates twice', { skip: !available }, () => {
  const alreadyDate = new Date('2026-10-07T03:49:45.012Z');
  const state = setup([oldHeaders.slice(), ['2026-10-08T17:04:37.821Z', 'one', 'blue', 'quiz_completed'],
    [alreadyDate, 'two', 'green', 'quiz_completed'], ['2026-10-09 09:00:00', 'three', 'red', 'quiz_completed']]);
  const result = state.context.migrateLegacyTimestamps();
  assert.equal(result.converted, 1);
  assert.equal(state.backups.length, 1);
  assert.equal(state.backups[0].rows[1][0], '2026-10-08T17:04:37.821Z');
  assert.equal(state.rows[1][0].toISOString(), '2026-10-08T17:04:37.821Z');
  assert.equal(state.rows[2][0].getTime(), alreadyDate.getTime());
  assert.equal(state.rows[3][0], '2026-10-09 09:00:00');
  assert.equal(state.context.migrateLegacyTimestamps().converted, 0);
  assert.equal(state.backups.length, 1);
});

test('GAS accepts older payloads and uses server time for ambiguous or invalid timestamps', { skip: !available }, () => {
  const state = setup();
  assert.equal(state.post({ action: '測驗與學院的設計', keyword: 'blue' }).status, 'ok');
  assert.ok(Number.isFinite(state.rows[1][0].getTime()));
  assert.equal(state.post({ action: 'quiz_completed', keyword: 'white', timestamp: 'bad-date' }).status, 'ok');
  assert.ok(Number.isFinite(state.rows[2][0].getTime()));
  assert.equal(state.stats().total, 1);
  assert.equal(state.post({}).status, 'error');
  assert.equal(state.rows.length, 3);
});

test('GAS stores literal external text, score versions and foreground duration while rejecting malformed events', { skip: !available }, () => {
  const state = setup();
  assert.equal(state.post({ action: 'quiz_completed', keyword: 'blue', eventId: 'event-1', source: '=1+1',
    timeSpent: 86400, activeTimeSpent: 65, red: 6, green: 8, blue: 28, black: 9, white: 7, scoringVersion: 'creative-traits-2' }).status, 'ok');
  assert.equal(state.rows[1][4], "'=1+1");
  assert.deepEqual([...state.rows[1]].slice(17), [65, 6, 8, 28, 9, 7, 'creative-traits-2']);
  for (const data of [{ action: 'unknown', eventId: 'event-2' }, { action: 'quiz_completed', keyword: 'constructor' },
    { action: 'quiz_started', source: {} }, { action: 'quiz_started', timeSpent: -2 }, { action: 'quiz_started', timeSpent: true },
    { action: 'quiz_completed', keyword: 'blue', red: 999 }, { action: 'quiz_started', eventId: '=1+1' }]) assert.equal(state.post(data).status, 'error');
  assert.equal(state.rows.length, 2);
  assert.equal(state.post({ action: 'quiz_returned', eventId: 'event-3' }).status, 'ok');
});

test('GAS reuses short-lived statistics and invalidates them after an acknowledged completion', { skip: !available }, () => {
  const state = setup();
  assert.equal(state.stats().total, 0);
  assert.equal(state.stats().total, 0);
  assert.equal(state.getReads(), 1);
  state.post({ action: 'language_changed', eventId: 'language-1' });
  assert.equal(state.stats().total, 0);
  assert.equal(state.getReads(), 1);
  state.post({ action: 'quiz_completed', keyword: 'blue', eventId: 'complete-1' });
  assert.equal(state.stats().total, 1);
  assert.equal(state.getReads(), 2);
  assert.equal(state.stats().total, 1);
  assert.equal(state.getReads(), 2);
});
