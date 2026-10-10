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
  const reportRows = [], triggers = [];
  let reportExists = false;
  const reportSheet = {
    getLastRow: () => reportRows.length, getMaxColumns: () => 26, getMaxRows: () => 1000,
    clearContents() { reportRows.length = 0; },
    setFrozenRows() {}, setColumnWidth() {}, setColumnWidths() {},
    getRange(row, column, height = 1, width = 1) {
      const range = {
        getValues: () => Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => reportRows[row - 1 + i]?.[column - 1 + j] ?? '')),
        setValues(values) {
          assert.equal(values.length, height);
          values.forEach((values, i) => {
            assert.equal(values.length, width);
            reportRows[row - 1 + i] ||= [];
            values.forEach((value, j) => { reportRows[row - 1 + i][column - 1 + j] = value; });
          });
          return range;
        },
        setFontWeight() { return range; },
        setNumberFormat() { return range; },
        breakApart() { return range; }, mergeAcross() { return range; }, setWrap() { return range; },
      };
      return range;
    },
  };
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
    getSheetByName: name => {
      if (name === '推廣成效') return reportExists ? reportSheet : null;
      assert.equal(name, '測驗結果'); return sheet;
    },
    insertSheet: name => { assert.equal(name, '推廣成效'); reportExists = true; return reportSheet; } };
  const context = vm.createContext({ Date, Logger: { log() {} },
    ScriptApp: {
      getProjectTriggers: () => triggers.map(handler => ({ getHandlerFunction: () => handler })),
      newTrigger(handler) {
        const builder = { timeBased: () => builder, everyHours(hours) { assert.equal(hours, 1); return builder; },
          create: () => triggers.push(handler) };
        return builder;
      },
    },
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
  return { context, rows, backups, formats, cache, reportRows, triggers, getReads: () => reads, getTimeZone: () => timeZone,
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

function marketingRows(events) {
  const headers = ['timestamp', 'clientId', 'keyword', 'action', 'source', 'referrer', 'device', 'country', 'city', 'timeSpent',
    'eventId', 'page', 'platform', 'target', 'language', 'attemptId'];
  return [headers, ...events.map(event => headers.map(key => event[key] ?? ''))];
}

test('marketing report counts unique completion cohorts separately from repeated and unrelated clicks', { skip: !available }, () => {
  const state = setup();
  const result = JSON.parse(JSON.stringify(state.context.buildMarketingReport_(marketingRows([
    { timestamp: '2026-10-10T02:00:00Z', clientId: 'a', source: 'threads', action: 'work_link_clicked', platform: 'penana', attemptId: 'one', eventId: 'click-1' },
    { timestamp: '2026-10-10T02:00:00Z', clientId: 'a', source: 'threads', action: 'work_link_clicked', platform: 'penana', attemptId: 'one', eventId: 'click-1' },
    { timestamp: '2026-10-10T00:00:00Z', clientId: 'a', source: 'threads', action: 'quiz_started', attemptId: 'one' },
    { timestamp: '2026-10-10T01:00:00Z', clientId: 'a', source: 'threads', action: 'quiz_completed', keyword: 'blue', attemptId: 'one' },
    { timestamp: '2026-10-10T03:00:00Z', clientId: 'a', source: 'threads', action: 'work_link_clicked', platform: 'penana', attemptId: 'one' },
    { timestamp: '2026-10-10T04:00:00Z', clientId: 'visitor', source: 'threads', action: 'social_link_clicked', platform: 'instagram' },
    { timestamp: '2026-10-10T05:00:00Z', clientId: 'a', source: 'threads', action: 'social_link_clicked', platform: 'threads', attemptId: 'two' },
    { timestamp: '2026-10-10T06:00:00Z', clientId: 'b', source: 'threads', action: 'quiz_completed', keyword: 'green' },
    { timestamp: '2026-10-10T07:00:00Z', source: 'threads', action: 'work_link_clicked', platform: 'penana' },
    { timestamp: '2026-10-10T08:00:00Z', clientId: 'a', source: 'threads', action: 'personal_website_clicked' },
  ]))));
  assert.deepEqual(result.sources, [['threads', 1, 2, 1, 3, 0, 2, 0.5, 0]]);
  assert.deepEqual(result.platforms.find(row => row[2] === 'penana'), ['threads', '作品', 'penana', 3, 1]);
  assert.deepEqual(result.platforms.find(row => row[1] === '個人網站'), ['threads', '個人網站', '個人網站', 1, 1]);
  assert.equal(result.unidentified, 1);
});

test('marketing report handles legacy Taipei dates, incomplete rows and source-specific attribution', { skip: !available }, () => {
  const state = setup();
  const result = JSON.parse(JSON.stringify(state.context.buildMarketingReport_(marketingRows([
    { timestamp: '2026-10-11 08:00:00', clientId: 'a', action: 'quiz_completed', keyword: 'black' },
    { timestamp: new Date('2026-10-11T01:00:00Z'), clientId: 'a', action: 'social_link_clicked', platform: 'threads' },
    { timestamp: '2026-10-11T02:00:00Z', clientId: 'a', source: 'threads', action: 'work_link_clicked', platform: 'cxc' },
    { timestamp: 'unknown', clientId: 'b', action: 'quiz_completed', keyword: 'white' },
    { timestamp: '2026-10-11T03:00:00Z', clientId: 'b', action: 'work_link_clicked', platform: 'cxc' },
    { action: '測驗與學院的設計', clientId: 'a' },
    { action: 'quiz_completed', keyword: 'invalid' },
    { action: 'constructor' },
  ]))));
  assert.deepEqual(result.sources.find(row => row[0] === 'direct'), ['direct', 0, 2, 0, 1, 1, 1, 0, 0.5]);
  assert.deepEqual(result.sources.find(row => row[0] === 'threads'), ['threads', 0, 0, 0, 1, 0, 0, '', '']);
  assert.equal(result.unrecognized, 3);
});

test('marketing report setup preserves raw columns, escapes formulas and installs only one scheduled refresh', { skip: !available }, () => {
  const state = setup();
  state.post({ action: 'quiz_completed', keyword: 'blue', eventId: 'complete-1', clientId: 'a', source: '=1+1' });
  state.post({ action: 'work_link_clicked', eventId: 'click-1', clientId: 'a', source: '=1+1', platform: '=2+2' });
  const raw = state.rows.map(row => row.slice());
  state.context.setupMarketingReport();
  state.context.setupMarketingReport();
  assert.deepEqual(state.rows, raw);
  assert.deepEqual(state.triggers, ['refreshMarketingReport']);
  assert.equal(state.reportRows[0][0], '推廣成效（自動產生）');
  assert.ok(state.reportRows[0][2] instanceof Date);
  assert.equal(state.reportRows[7][7], '看書轉出率');
  assert.equal(state.reportRows[8][0], "'=1+1");
  assert.equal(state.reportRows[11][2], "'=2+2");
  state.rows.length = 1;
  state.context.refreshMarketingReport();
  assert.equal(state.reportRows.length, 10, 'old report rows are removed on refresh');
});

test('marketing refresh refuses to overwrite an existing sheet with unrelated contents', { skip: !available }, () => {
  const state = setup();
  state.context.refreshMarketingReport();
  state.reportRows[0][0] = '手動建立的報表';
  assert.throws(() => state.context.refreshMarketingReport(), /已有其他內容/);
  assert.equal(state.reportRows[0][0], '手動建立的報表');
  state.reportRows[0][0] = '推廣成效（自動產生）';
  assert.doesNotThrow(() => state.context.refreshMarketingReport(), 'write lock is released after failure');
});
