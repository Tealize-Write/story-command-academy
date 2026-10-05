// Shared scoring metadata and result classification; independent of the page DOM.
(function initQuizResultModel() {
  const ORDER = ["red", "green", "blue", "black", "white"];
  const VERSION = "creative-traits-2";

  function getBounds(questions) {
    return ORDER.map((_, i) => ({
      min: questions.reduce((sum, q) => sum + Math.min(...q.options.map(o => o.scores[i])), 0),
      max: questions.reduce((sum, q) => sum + Math.max(...q.options.map(o => o.scores[i])), 0),
    }));
  }

  function validScores(scores, questions) {
    if (!Array.isArray(scores) || scores.length !== ORDER.length) return false;
    const bounds = getBounds(questions);
    return scores.every((score, i) => Number.isInteger(score) && score >= bounds[i].min && score <= bounds[i].max);
  }

  function classify(scores, primary) {
    const peak = Math.max(...scores);
    const top = ORDER.filter((_, i) => scores[i] === peak);
    const lower = scores.filter(score => score < peak);
    const next = lower.length ? Math.max(...lower) : null;
    return {
      top,
      tied: top.filter(key => key !== primary),
      secondary: next === null ? [] : ORDER.filter((_, i) => scores[i] === next),
    };
  }

  function scoreAnswers(answers, questions) {
    if (!Array.isArray(answers) || answers.length !== questions.length) return null;
    const scores = ORDER.map(() => 0);
    for (let i = 0; i < questions.length; i++) {
      if (!Number.isInteger(answers[i]) || !questions[i].options[answers[i]]) return null;
      questions[i].options[answers[i]].scores.forEach((score, k) => { scores[k] += score; });
    }
    return scores;
  }

  function validResult(record, primary, questions) {
    return record?.version === VERSION && record.primary === primary &&
      validScores(record.scores, questions) && classify(record.scores, primary).top.includes(primary);
  }

  function read(storage, key) {
    try { return JSON.parse(storage.getItem(key) || "null"); } catch { return null; }
  }

  function write(storage, key, value) {
    try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
  }

  function remove(storage, key) {
    try { storage.removeItem(key); } catch { /* Quiz remains usable without storage. */ }
  }

  // Accessing window.sessionStorage itself may throw in restricted browsers.
  function storage() {
    try { return window.sessionStorage; } catch { return null; }
  }

  window.QUIZ_RESULT_MODEL = { ORDER, VERSION, getBounds, validScores, classify, scoreAnswers, validResult, read, write, remove, storage };
})();
