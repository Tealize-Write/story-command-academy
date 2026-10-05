const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ctx = { window: {} };
vm.createContext(ctx);
for (const file of ['js/i18n.js', 'js/quiz-result-model.js']) vm.runInContext(fs.readFileSync(file, 'utf8'), ctx);
const model = ctx.window.QUIZ_RESULT_MODEL;
const questions = ctx.window.QUIZ_QUESTIONS['zh-TW'];
const plain = value => JSON.parse(JSON.stringify(value));

test('logic option belongs to blue, and both languages have identical scoring', () => {
  assert.deepEqual(plain(questions[29].options[2].scores), [0, 0, 3, 0, 0]);
  assert.deepEqual(plain(questions.map(q => q.options.map(o => o.scores))),
    plain(ctx.window.QUIZ_QUESTIONS.en.map(q => q.options.map(o => o.scores))));
  const answers = Array(30).fill(3);
  answers.forEach((a, i) => { if (!questions[i].options[a]) answers[i] = 0; });
  assert.deepEqual(plain(model.scoreAnswers(answers, questions)), plain(model.scoreAnswers(answers, ctx.window.QUIZ_QUESTIONS.en)));
});

test('reports the real next score level, including all ties', () => {
  assert.deepEqual(plain(model.classify([6, 8, 25, 12, 7], 'blue')), { top: ['blue'], tied: [], secondary: ['black'] });
  assert.deepEqual(plain(model.classify([6, 12, 25, 12, 7], 'blue')).secondary, ['green', 'black']);
  assert.deepEqual(plain(model.classify([12, 8, 12, 6, 7], 'blue')), { top: ['red', 'blue'], tied: ['red'], secondary: ['green'] });
  assert.deepEqual(plain(model.classify([0, 0, 0, 0, 0], 'green')).secondary, []);
  assert.equal(model.classify([0, 0, 0, 0, 0], 'green').tied.length, 4);
  assert.deepEqual(plain(model.classify([-3, -1, -2, -3, -1], 'white')).tied, ['green']);
});

test('validates raw scores without dropping negative or zero totals', () => {
  assert.deepEqual(plain(model.getBounds(questions)).map(b => b.max), [31, 31, 31, 31, 31]);
  for (const scores of [[17, 10, -3, 9, 10], [0, 0, 0, 0, 0], [-1, -2, -3, -1, -1]]) assert.equal(model.validScores(scores, questions), true);
  for (const scores of [[99, 0, 0, 0, 0], [1, 2], [NaN, 1, 2, 3, 4], [Infinity, 1, 2, 3, 4], ['1', 2, 3, 4, 5], [0.5, 2, 3, 4, 5]]) assert.equal(model.validScores(scores, questions), false);
});

test('does not mix another academy or an old scoring version with this result', () => {
  const record = { version: model.VERSION, primary: 'blue', scores: [6, 8, 25, 12, 7] };
  assert.equal(model.validResult(record, 'blue', questions), true);
  assert.equal(model.validResult(record, 'red', questions), false);
  assert.equal(model.validResult({ ...record, primary: 'red' }, 'red', questions), false);
  assert.equal(model.validResult({ ...record, version: 'old' }, 'blue', questions), false);
  assert.equal(model.validResult(null, 'blue', questions), false);
  assert.equal(model.scoreAnswers(Array(30).fill(99), questions), null);
  assert.equal(model.scoreAnswers(Array(29).fill(0), questions), null);
});

test('unavailable or malformed storage does not throw', () => {
  assert.equal(model.read(null, 'result'), null);
  assert.equal(model.write(null, 'result', {}), false);
  assert.doesNotThrow(() => model.remove(null, 'result'));
  assert.equal(model.read({ getItem: () => '{bad json' }, 'result'), null);
});
