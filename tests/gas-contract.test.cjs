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
  const readRanges = [];
  const reportRows = [], triggers = [];
  const triggerMinutes = new Map();
  const hiddenColumns = new Set();
  const properties = new Map(), indexRows = [];
  const faults = { checkpoint: false, committedCheckpoint: false, indexWrite: false, flush: false, lock: false };
  let indexExists = false, uuid = 0, opens = 0;
  let indexColumns = 26;
  const indexSheet = {
    getLastRow: () => indexRows.length, getMaxRows: () => 1000,
    getMaxColumns: () => indexColumns,
    deleteColumns(start, count) { assert.equal(start, 3); indexColumns -= count; },
    insertRowsAfter() {}, clearContents() { indexRows.length = 0; },
    getRange(row, column, height = 1, width = 1) {
      const range = {
        getValues: () => Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => indexRows[row - 1 + i]?.[column - 1 + j] ?? '')),
        setValues(values) {
          values.forEach((values, i) => {
            indexRows[row - 1 + i] ||= [];
            values.forEach((value, j) => { indexRows[row - 1 + i][column - 1 + j] = value; });
            if (faults.indexWrite && row > 1) { faults.indexWrite = false; throw new Error('partial index write'); }
          });
          return range;
        },
        createTextFinder: value => textFinder(range, value, row),
      };
      return range;
    },
  };
  function textFinder(range, value, row) {
    let caseSensitive = false;
    const finder = { matchCase(flag) { caseSensitive = flag; return finder; },
      matchEntireCell: () => finder, useRegularExpression: () => finder,
      findNext() {
        const offset = range.getValues().findIndex(data => caseSensitive ? data[0] === value : String(data[0]).toLowerCase() === value.toLowerCase());
        return offset < 0 ? null : { getRow: () => row + offset };
      } };
    return finder;
  }
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
    setFrozenRows(count) { assert.equal(count, 1); },
    hideColumns(start, count = 1) {
      assert.ok(start >= 1 && start + count - 1 <= 26);
      for (let column = start; column < start + count; column++) hiddenColumns.add(column);
    },
    insertRowBefore: () => rows.unshift([]),
    getParent: () => spreadsheet,
    appendRow: row => rows.push(row),
    getDataRange: () => ({ getValues: () => { reads++; return rows.map(row => row.slice()); } }),
    getRange(row, column, height = 1, width = 1) {
      const range = {
        getValues: () => {
          readRanges.push({ row, column, height, width, locked: held });
          if (column === 2 && width === 10) reads++;
          return Array.from({ length: height }, (_, i) => Array.from({ length: width }, (_, j) => rows[row - 1 + i]?.[column - 1 + j] ?? ''));
        },
        setValues(values) {
          values.forEach((data, i) => {
            rows[row - 1 + i] ||= [];
            data.forEach((value, j) => { rows[row - 1 + i][column - 1 + j] = value; });
          });
          return range;
        },
        setFontWeight() { return range; },
        setNumberFormat(format) { formats.push({ row, column, height, format }); return range; },
        createTextFinder: value => textFinder(range, value, row),
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
      if (name === '_學院統計索引') return indexExists ? indexSheet : null;
      assert.equal(name, '測驗結果'); return sheet;
    },
    insertSheet: name => {
      if (name === '_學院統計索引') { indexExists = true; return indexSheet; }
      assert.equal(name, '推廣成效'); reportExists = true; return reportSheet;
    } };
  const context = vm.createContext({ Date, Logger: { log() {} },
    Utilities: { getUuid: () => `generation-${++uuid}` },
    PropertiesService: { getScriptProperties: () => ({ getProperty: key => properties.get(key) || null,
      setProperty(key, value) {
        if (faults.checkpoint && JSON.parse(value).cursor > 1) { faults.checkpoint = false; throw new Error('checkpoint failed'); }
        properties.set(key, value);
        if (faults.committedCheckpoint && JSON.parse(value).cursor > 1) { faults.committedCheckpoint = false; throw new Error('committed but response lost'); }
      } }) },
    ScriptApp: {
      getProjectTriggers: () => triggers.map(handler => ({ getHandlerFunction: () => handler })),
      deleteTrigger(trigger) {
        const handler = trigger.getHandlerFunction();
        const index = triggers.indexOf(handler);
        assert.notEqual(index, -1);
        triggers.splice(index, 1);
        if (!triggers.includes(handler)) triggerMinutes.delete(handler);
      },
      newTrigger(handler) {
        let interval;
        const builder = { timeBased: () => builder, everyHours(hours) { assert.equal(hours, 1); interval = 60; return builder; },
          everyMinutes(minutes) { assert.ok([1, 15].includes(minutes)); interval = minutes; return builder; },
          create() { triggers.push(handler); triggerMinutes.set(handler, interval); } };
        return builder;
      },
    },
    CacheService: { getScriptCache: () => ({ get: key => cache.get(key) || null, put: (key, value) => cache.set(key, value), remove: key => cache.delete(key) }) },
    SpreadsheetApp: { openById: id => {
      opens++;
      assert.equal(id, '1UaAnWH8hUeoQR792OcP-BaGwW_64xmBJnsGf-mEATQ4'); return spreadsheet;
    }, flush() { if (faults.flush) { faults.flush = false; throw new Error('flush failed'); } } },
    LockService: { getScriptLock: () => ({ waitLock() {
      if (faults.lock) { faults.lock = false; throw new Error('lock timeout'); }
      assert.equal(held, false); held = true;
    },
      hasLock: () => held, releaseLock() { held = false; } }) },
    ContentService: { MimeType: { JSON: 'application/json' },
      createTextOutput: body => ({ body, setMimeType() { return this; } }) },
  });
  vm.runInContext(fs.readFileSync('GAS/Code.gs', 'utf8'), context);
  return { context, rows, backups, formats, cache, properties, indexRows, faults, reportRows, triggers, triggerMinutes, hiddenColumns, readRanges,
    getIndexColumns: () => indexColumns, getOpens: () => opens, getReads: () => reads, getTimeZone: () => timeZone,
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
  state.context.setupAcademyStatistics();
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
  state.context.setupAcademyStatistics();
  assert.equal(state.stats().total, 0);
  assert.equal(state.stats().total, 0);
  assert.equal(state.getReads(), 0);
  state.post({ action: 'language_changed', eventId: 'language-1' });
  assert.equal(state.stats().total, 0);
  assert.equal(state.getReads(), 1, 'the writer processes only its new row');
  state.post({ action: 'quiz_completed', keyword: 'blue', eventId: 'complete-1' });
  assert.equal(state.stats().total, 1);
  assert.equal(state.getReads(), 2);
  assert.equal(state.stats().total, 1);
  assert.equal(state.getReads(), 2, 'GET reuses counters without raw reads');
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
  const setupResult = state.context.setupMarketingReport();
  assert.deepEqual(state.rows, raw);
  const visibleHeaders = state.rows[0].filter((_, i) => !state.hiddenColumns.has(i + 1));
  assert.deepEqual(visibleHeaders, ['timestamp', 'keyword', 'action', 'source', 'referrer', 'device', 'country', 'city', 'timeSpent', 'page', 'platform', 'target']);
  assert.deepEqual([...setupResult.columnView.visibleColumns], visibleHeaders);
  assert.equal(state.post({ action: 'quiz_completed', keyword: 'blue', eventId: 'complete-1', clientId: 'a' }).duplicate, true);
  assert.equal(state.stats().total, 1, 'hidden columns still participate in deduplication and statistics');
  assert.deepEqual(state.triggers, ['repairAcademyStatistics', 'refreshMarketingReport']);
  assert.equal(state.reportRows[0][0], '推廣成效（自動產生）');
  assert.ok(state.reportRows[0][2] instanceof Date);
  assert.equal(state.reportRows[7][7], '看書轉出率');
  assert.equal(state.reportRows[8][0], "'=1+1");
  assert.equal(state.reportRows[11][2], "'=2+2");
  state.rows.length = 1;
  state.context.refreshMarketingReport();
  assert.equal(state.reportRows.length, 10, 'old report rows are removed on refresh');
});

test('regular GAS events and report refreshes do not force technical columns to hide again', { skip: !available }, () => {
  const state = setup();
  state.context.setupMarketingReport();
  state.hiddenColumns.clear(); // The owner reveals columns for troubleshooting.
  assert.equal(state.post({ action: 'quiz_started', eventId: 'start-1' }).status, 'ok');
  state.stats();
  state.context.refreshMarketingReport();
  assert.equal(state.hiddenColumns.size, 0);
  assert.deepEqual(state.triggers, ['repairAcademyStatistics', 'refreshMarketingReport']);
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

test('100,000 historical completions initialize in bounded batches and GET never rescans history', { skip: !available }, () => {
  const academies = ['red', 'green', 'blue', 'black', 'white'];
  const rows = [oldHeaders.slice()];
  for (let i = 0; i < 100000; i++) {
    const row = Array(24).fill('');
    row[1] = `client-${i}`; row[2] = academies[i % 5]; row[3] = 'quiz_completed'; row[10] = `event-${i}`;
    row[13] = 'https://example.com/a-long-work-url-that-statistics-do-not-need';
    rows.push(row);
  }
  rows.push(rows[1].slice()); // A legacy retry already exists in the sheet.
  const state = setup(rows);
  const first = state.context.setupAcademyStatistics();
  assert.equal(first.ready, false);
  assert.equal(first.processedRows, 5000);
  assert.ok(state.stats().error, 'partial bootstrap must not look like final statistics');
  let progress = first;
  while (!progress.ready) progress = state.context.refreshAcademyStatistics();
  assert.deepEqual(state.stats(), { counts: { red: 20000, green: 20000, blue: 20000, black: 20000, white: 20000 },
    total: 100000, uniqueParticipants: 100000, unidentifiedCompletions: 0 });
  assert.equal(state.getReads(), 21);
  assert.deepEqual(state.readRanges.find(range => range.column === 2),
    { row: 2, column: 2, height: 5000, width: 10, locked: true });
  assert.ok(state.readRanges.filter(range => range.column === 2).every(range => range.height <= 5000));
  const opens = state.getOpens();
  state.cache.clear(); // Verify a cache miss also never opens the spreadsheet.
  state.stats();
  assert.equal(state.getReads(), 21, 'cache misses do not rescan historical rows');
  assert.equal(state.getOpens(), opens);
  assert.equal(state.properties.size, 1, 'only a fixed summary is stored in Properties');
  assert.ok([...state.properties.values()][0].length < 1000);
  assert.equal(state.getIndexColumns(), 2, 'empty index columns must not consume the cell budget');
});

test('marketing sorting releases the ingestion lock and freezes the report boundary', { skip: !available }, () => {
  const state = setup();
  state.post({ action: 'quiz_completed', keyword: 'blue', clientId: 'a', eventId: 'complete-a' });
  const build = state.context.buildMarketingReport_;
  state.context.buildMarketingReport_ = values => {
    assert.equal(state.post({ action: 'quiz_completed', keyword: 'red', clientId: 'b', eventId: 'complete-b' }).status, 'ok',
      'a player event can acquire the write lock while the report computes');
    return build(values);
  };
  state.context.refreshMarketingReport();
  assert.equal(state.reportRows[0][6], 1, 'the snapshot excludes the concurrent append');
  assert.equal(state.reportRows[8][2], 1);
  assert.ok(state.readRanges.some(range => range.column === 1 && range.width === 16 && !range.locked));
  state.context.buildMarketingReport_ = build;
  state.context.refreshMarketingReport();
  assert.equal(state.reportRows[0][6], 2);
  assert.equal(state.reportRows[8][2], 2, 'the next snapshot includes the appended completion');
});

test('an older report snapshot cannot overwrite a newer completed refresh', { skip: !available }, () => {
  const state = setup();
  state.context.refreshMarketingReport();
  state.reportRows[0][8] = new Date(Date.now() + 60000);
  const previous = state.reportRows.map(row => row.slice());
  assert.equal(state.context.refreshMarketingReport().skipped, 'newer_report_already_written');
  assert.deepEqual(state.reportRows, previous);
  assert.equal(state.post({ action: 'quiz_started', eventId: 'after-skipped-refresh' }).status, 'ok');
});

test('a public GET never bootstraps data or dispatches editor commands', { skip: !available }, () => {
  const state = setup();
  const response = JSON.parse(state.context.doGet({ parameter: { action: 'rebuildAcademyStatistics' } }).body);
  assert.ok(response.error);
  assert.equal(state.getOpens(), 0);
  assert.equal(state.properties.size, 0);
  assert.equal(state.indexRows.length, 0);
  assert.equal(state.triggers.length, 0);
  assert.equal(state.post({ action: 'rebuildAcademyStatistics' }).status, 'error');
  assert.equal(state.post({ action: 'setupMarketingReport', eventId: 'admin' }).status, 'error');
  assert.equal(state.getOpens(), 0);
});

test('retry and background repair recover partial index, flush and checkpoint failures exactly once', { skip: !available }, () => {
  for (const fault of ['indexWrite', 'flush', 'checkpoint', 'committedCheckpoint']) {
    const state = setup();
    state.context.setupAcademyStatistics();
    const event = { action: 'quiz_completed', keyword: 'black', clientId: 'a', eventId: `complete-${fault}` };
    state.faults[fault] = true;
    const failed = state.post(event);
    assert.equal(failed.status, 'error', fault);
    assert.equal(state.rows.length, 2, 'the durable raw append is retained');
    assert.ok(!failed.message.includes(fault), 'internal exception details stay private');
    assert.equal(state.post(event).duplicate, true);
    assert.deepEqual(state.stats(), { counts: { red: 0, green: 0, blue: 0, black: 1, white: 0 },
      total: 1, uniqueParticipants: 1, unidentifiedCompletions: 0 }, fault);
    assert.equal(state.rows.length, 2);
    assert.equal(state.indexRows.length, 3, 'repair does not duplicate persistent keys');
    const next = { ...event, eventId: `${event.eventId}-next`, keyword: 'blue' };
    state.faults.checkpoint = true;
    assert.equal(state.post(next).status, 'error');
    state.context.refreshAcademyStatistics(); // No browser retry required.
    assert.equal(state.stats().total, 2);
    assert.equal(state.stats().uniqueParticipants, 1);
  }
});

test('historical replay deduplicates across batches and counts client identities case-sensitively', { skip: !available }, () => {
  const rows = [oldHeaders.slice(), ['date', 'A', 'red', 'quiz_completed', '', '', '', '', '', 0, 'Event-A']];
  for (let i = 0; i < 4999; i++) rows.push(['date', 'ignored', '', 'language_changed']);
  rows.push(rows[1].slice());
  rows.push(['date', 'a', 'blue', 'quiz_completed', '', '', '', '', '', 0, 'event-a']);
  rows.push(['date', 'A', 'green', 'quiz_completed', '', '', '', '', '', 0, 'event-b']);
  rows.push(['date', '', 'white', 'quiz_completed']);
  const state = setup(rows);
  assert.equal(state.context.setupAcademyStatistics().ready, false);
  state.context.refreshAcademyStatistics();
  assert.deepEqual(state.stats(), { counts: { red: 1, green: 1, blue: 1, black: 0, white: 1 },
    total: 4, uniqueParticipants: 2, unidentifiedCompletions: 1 });
  assert.equal(state.post({ action: 'quiz_completed', keyword: 'black', clientId: 'a', eventId: 'EVENT-A' }).status, 'ok');
  assert.equal(state.stats().total, 5, 'case-distinct event IDs must not collide in TextFinder');
  assert.equal(state.stats().uniqueParticipants, 2);
});

test('explicit rebuild corrects edited history without deleting logs or creating extra triggers', { skip: !available }, () => {
  const state = setup();
  state.context.setupAcademyStatistics();
  state.post({ action: 'quiz_completed', keyword: 'red', clientId: 'a', eventId: 'one' });
  state.post({ action: 'quiz_completed', keyword: 'blue', clientId: 'b', eventId: 'two' });
  assert.equal(state.stats().total, 2);
  state.rows.splice(1, 1); // Owner deletes historical data; append-only invariant is broken.
  assert.throws(() => state.context.refreshAcademyStatistics(), /truncated/);
  state.rows[1][2] = 'green';
  const log = state.rows.map(row => row.slice());
  state.context.rebuildAcademyStatistics();
  assert.deepEqual(state.rows, log);
  assert.deepEqual(state.stats(), { counts: { red: 0, green: 1, blue: 0, black: 0, white: 0 },
    total: 1, uniqueParticipants: 1, unidentifiedCompletions: 0 });
  assert.deepEqual(state.triggers, ['repairAcademyStatistics']);
  assert.equal(state.indexRows.length, 3);
  state.indexRows[0][0] = 'owner notes';
  assert.throws(() => state.context.rebuildAcademyStatistics(), /unrelated/);
  assert.equal(state.indexRows[0][0], 'owner notes', 'unrelated contents are not cleared');
});

test('missing or damaged checkpoints fail closed and never pretend the sheet has zero players', { skip: !available }, () => {
  const state = setup();
  state.context.setupAcademyStatistics();
  state.post({ action: 'quiz_completed', keyword: 'blue', eventId: 'a' });
  const key = [...state.properties.keys()][0];
  const summary = state.properties.get(key);
  state.properties.set(key, '{bad json'); state.cache.clear();
  assert.deepEqual(state.stats(), { error: 'Statistics temporarily unavailable.' });
  assert.equal(state.post({ action: 'quiz_completed', keyword: 'green', eventId: 'b' }).status, 'error');
  assert.equal(state.properties.get(key), '{bad json', 'no silent reset');
  state.properties.set(key, summary);
  state.indexRows.length = 0;
  assert.throws(() => state.context.refreshAcademyStatistics(), /cleared/);
  state.context.rebuildAcademyStatistics();
  assert.equal(state.stats().total, 2, 'accepted raw rows survive checkpoint/index repair');
});

test('ingestion validates size and commands, keeps formulas literal and exposes only aggregate statistics', { skip: !available }, () => {
  const state = setup();
  const invalid = [
    { action: 'quiz_started', source: 's'.repeat(257) },
    { action: 'quiz_started', referrer: 'https://example.com/' + 's'.repeat(2048) },
    { action: 'quiz_started', clientId: 'id\nline' },
    { action: 'quiz_started', timeSpent: {} },
    { action: 'unknown' },
    { action: 'quiz_started', ignored: 's'.repeat(17000) },
  ];
  invalid.forEach(event => assert.equal(state.post(event).status, 'error'));
  assert.equal(state.getOpens(), 0, 'malformed requests are rejected before Sheets access');
  state.post({ action: 'quiz_completed', keyword: 'black', clientId: '=1+1', eventId: 'complete', source: '=1+1' });
  assert.equal(state.rows[1][1], "'=1+1");
  const result = state.stats();
  assert.deepEqual(Object.keys(result).sort(), ['counts', 'total', 'unidentifiedCompletions', 'uniqueParticipants'].sort());
  const serialized = JSON.stringify(result);
  for (const secret of ['clientId', 'eventId', 'attemptId', 'generation', 'cursor', '1UaAn', 'referrer', '=1+1']) assert.ok(!serialized.includes(secret));
  state.properties.set('ACADEMY_INGESTION_PAUSED', 'true');
  assert.equal(state.post({ action: 'quiz_started', eventId: 'paused' }).status, 'error');
  assert.equal(state.rows.length, 2);
  assert.equal(state.stats().total, 1, 'owner pause does not disable public statistics');
});

test('best-effort rate limits and lock failures reject writes while allowing later retries', { skip: !available }, () => {
  const state = setup();
  state.faults.lock = true;
  assert.equal(state.post({ action: 'quiz_started', eventId: 'locked' }).status, 'error');
  assert.equal(state.rows.length, 1);
  assert.equal(state.post({ action: 'quiz_started', eventId: 'locked' }).status, 'ok');
  const clientKey = [...state.cache.keys()].find(key => key.startsWith('academy-rate:client:'));
  state.cache.set(clientKey, '60');
  assert.equal(state.post({ action: 'quiz_started', eventId: 'limited' }).status, 'error');
  assert.equal(state.rows.length, 2);
  state.cache.delete(clientKey);
  const globalKey = [...state.cache.keys()].find(key => key.startsWith('academy-rate:global:'));
  state.cache.set(globalKey, '600');
  assert.equal(state.post({ action: 'quiz_started', eventId: 'limited', clientId: 'new-client' }).status, 'error');
  state.cache.delete(globalKey);
  assert.equal(state.post({ action: 'quiz_started', eventId: 'limited' }).status, 'ok');
  assert.equal(state.rows.length, 3);
});

test('a failed historical batch resumes with its existing index and preserves exact counters', { skip: !available }, () => {
  const rows = [oldHeaders.slice()];
  for (let i = 0; i < 5001; i++) rows.push(['date', `client-${i % 100}`, 'green', 'quiz_completed', '', '', '', '', '', 0, `event-${i}`]);
  rows.push(rows[1].slice());
  const state = setup(rows);
  state.faults.checkpoint = true;
  assert.throws(() => state.context.setupAcademyStatistics(), /checkpoint failed/);
  assert.ok(state.stats().error);
  const indexedRows = state.indexRows.length;
  const resumed = state.context.refreshAcademyStatistics();
  assert.equal(resumed.processedRows, 5000);
  assert.equal(state.indexRows.length, indexedRows, 'replaying an uncommitted batch does not duplicate the index');
  state.context.refreshAcademyStatistics();
  assert.deepEqual(state.stats(), { counts: { red: 0, green: 5001, blue: 0, black: 0, white: 0 },
    total: 5001, uniqueParticipants: 100, unidentifiedCompletions: 0 });
});

test('Cache eviction or outage never removes persistent counters or permanent retry deduplication', { skip: !available }, () => {
  const state = setup();
  const event = { action: 'quiz_completed', keyword: 'white', clientId: 'a', eventId: 'one' };
  state.post(event);
  state.stats();
  state.cache.clear();
  state.context.CacheService = { getScriptCache() { throw new Error('cache unavailable'); } };
  assert.equal(state.stats().total, 1);
  assert.equal(state.post(event).duplicate, true);
  assert.equal(state.post({ ...event, eventId: 'two' }).status, 'ok');
  assert.deepEqual(state.stats(), { counts: { red: 0, green: 0, blue: 0, black: 0, white: 2 },
    total: 2, uniqueParticipants: 1, unidentifiedCompletions: 0 });
  assert.equal(state.rows.length, 3);
});

test('completion POST returns only ready public statistics, including idempotent retries', { skip: !available }, () => {
  const state = setup();
  const event = { action: 'quiz_completed', keyword: 'black', eventId: 'one', clientId: 'a' };
  const acknowledgement = state.post(event);
  assert.deepEqual(acknowledgement.statistics, state.stats());
  assert.deepEqual(Object.keys(acknowledgement.statistics).sort(), ['counts', 'total', 'uniqueParticipants', 'unidentifiedCompletions'].sort());
  const retry = state.post(event);
  assert.equal(retry.duplicate, true);
  assert.deepEqual(retry.statistics, acknowledgement.statistics);
  assert.equal(state.post({ action: 'work_link_clicked', eventId: 'click', clientId: 'a' }).statistics, undefined);
  const historical = setup([oldHeaders.slice(), ...Array.from({ length: 21 }, () => ['date', 'a', 'red', 'quiz_completed'])]);
  const pending = historical.post(event);
  assert.equal(pending.status, 'ok');
  assert.equal(pending.statisticsPending, true);
  assert.equal(pending.statistics, undefined);
});

test('new identifiers reject surrounding whitespace without changing historical identities', { skip: !available }, () => {
  const state = setup();
  const event = { action: 'quiz_completed', keyword: 'red', clientId: 'a', attemptId: 'attempt', eventId: 'complete' };
  assert.equal(state.post(event).status, 'ok');
  for (const field of ['eventId', 'clientId', 'attemptId']) {
    for (const value of [' spaced ', '   ', "'quoted"]) {
      const rejected = state.post({ ...event, eventId: 'next', [field]: value });
      assert.equal(rejected.status, 'error');
      assert.equal(rejected.code, 'invalid_event');
      assert.equal(rejected.retryable, false);
      assert.equal(rejected.eventId, field === 'eventId' ? value : 'next');
    }
  }
  assert.equal(state.rows.length, 2);
  assert.equal(state.stats().total, 1);
  const legacy = setup([oldHeaders.slice(), ['date', ' a ', ' RED ', ' QUIZ_COMPLETED ', '', '', '', '', '', 0, ' old ']]);
  legacy.context.setupAcademyStatistics();
  assert.equal(legacy.stats().total, 1);
  assert.equal(legacy.stats().uniqueParticipants, 1);
  assert.equal(legacy.rows[1][1], ' a ', 'historical records are not rewritten');
});

test('duplicate IDs acknowledge matching events and permanently reject semantic conflicts', { skip: !available }, () => {
  const state = setup();
  const event = { action: 'quiz_completed', keyword: 'black', clientId: 'a', attemptId: 'attempt', eventId: 'complete' };
  state.post(event);
  for (const changes of [{ action: 'work_link_clicked' }, { clientId: 'b' }, { attemptId: 'other' }, { keyword: 'blue' }]) {
    const rejected = state.post({ ...event, ...changes });
    assert.deepEqual(rejected, { status: 'error', code: 'event_id_conflict', retryable: false,
      eventId: 'complete', message: 'Event was rejected.' });
  }
  assert.equal(state.rows.length, 2);
  assert.equal(state.stats().total, 1);
  assert.equal(state.post(event).duplicate, true);
  const click = setup();
  click.post({ action: 'work_link_clicked', clientId: 'a', eventId: 'same-id' });
  assert.equal(click.post({ action: 'quiz_completed', keyword: 'red', clientId: 'a', eventId: 'same-id' }).code, 'event_id_conflict');
  assert.equal(click.stats().total, 0);
  const literal = setup();
  const formulaClient = { ...event, clientId: '=1+1', attemptId: '=attempt' };
  assert.equal(literal.post(formulaClient).status, 'ok');
  assert.equal(literal.post(formulaClient).duplicate, true, 'literal formula escaping does not break valid retries');
});

test('historical action and academy normalization matches between public and marketing statistics', { skip: !available }, () => {
  const rows = marketingRows([
    { timestamp: '2026-10-10T00:00:00Z', clientId: 'a', source: 'threads', action: ' QUIZ_STARTED ', attemptId: 'one' },
    { timestamp: '2026-10-10T01:00:00Z', clientId: 'a', source: 'threads', action: ' QUIZ_COMPLETED ', keyword: ' RED ', attemptId: 'one', eventId: 'complete' },
    { timestamp: '2026-10-10T02:00:00Z', clientId: 'a', source: 'threads', action: ' WORK_LINK_CLICKED ', platform: 'penana', attemptId: 'one' },
    { timestamp: '2026-10-10T03:00:00Z', clientId: 'a', source: 'threads', action: ' SOCIAL_LINK_CLICKED ', platform: 'threads', attemptId: 'one' },
  ]);
  const state = setup(rows);
  state.context.setupAcademyStatistics();
  const report = JSON.parse(JSON.stringify(state.context.buildMarketingReport_(rows)));
  assert.equal(state.stats().total, 1);
  assert.deepEqual(report.sources, [['threads', 1, 1, 1, 1, 1, 1, 1, 1]]);
  assert.equal(report.unrecognized, 0);
  assert.equal(state.post({ action: 'quiz_completed', keyword: 'red', clientId: 'a', attemptId: 'one', eventId: 'complete' }).duplicate, true);
  assert.equal(state.post({ action: 'QUIZ_COMPLETED', keyword: 'red', eventId: 'new' }).code, 'invalid_event', 'new actions remain strict');
});

test('trigger migration uses minute bootstrap only while pending and fifteen-minute repair after completion', { skip: !available }, () => {
  const state = setup([oldHeaders.slice(), ...Array.from({ length: 5001 }, () => ['date', 'a', 'red', 'quiz_completed'])]);
  state.triggers.push('refreshAcademyStatistics', 'refreshMarketingReport', 'ownerOtherTask');
  state.triggerMinutes.set('refreshAcademyStatistics', 1);
  assert.equal(state.context.setupAcademyStatistics().ready, false);
  assert.ok(!state.triggers.includes('refreshAcademyStatistics'), 'the legacy minute repair trigger is removed');
  assert.equal(state.triggerMinutes.get('repairAcademyStatistics'), 15);
  assert.equal(state.triggerMinutes.get('continueAcademyStatisticsInitialization'), 1);
  assert.equal(state.context.continueAcademyStatisticsInitialization().ready, true);
  assert.ok(!state.triggers.includes('continueAcademyStatisticsInitialization'));
  const triggers = state.triggers.slice();
  state.context.setupAcademyStatistics();
  assert.deepEqual(state.triggers, triggers, 'repeated setup does not add duplicate triggers');
  assert.ok(state.triggers.includes('refreshMarketingReport'));
  assert.ok(state.triggers.includes('ownerOtherTask'));
  state.faults.checkpoint = true;
  assert.equal(state.post({ action: 'quiz_completed', keyword: 'blue', eventId: 'repair-me', clientId: 'b' }).status, 'error');
  assert.equal(state.context.repairAcademyStatistics().total, 5002);
  assert.equal(state.stats().uniqueParticipants, 2);
  state.context.rebuildAcademyStatistics();
  assert.equal(state.triggerMinutes.get('continueAcademyStatisticsInitialization'), 1, 'rebuild reinstalls temporary bootstrap');
  state.context.continueAcademyStatisticsInitialization();
  assert.ok(!state.triggers.includes('continueAcademyStatisticsInitialization'));
});
