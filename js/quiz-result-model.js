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

  function scoreAnswers(answers, questions, partial = false) {
    if (!Array.isArray(answers) || answers.length > questions.length || (!partial && answers.length !== questions.length)) return null;
    const scores = ORDER.map(() => 0);
    for (let i = 0; i < answers.length; i++) {
      if (!Number.isInteger(answers[i]) || !questions[i].options[answers[i]]) return null;
      questions[i].options[answers[i]].scores.forEach((score, k) => { scores[k] += score; });
    }
    return scores;
  }

  function validResult(record, primary, questions) {
    return record?.version === VERSION && record.primary === primary &&
      validScores(record.scores, questions) && classify(record.scores, primary).top.includes(primary);
  }

  function validDraft(record, questions) {
    return record?.version === VERSION && typeof record.attemptId === "string" && record.attemptId.length > 0 &&
      Number.isFinite(record.startedAt) && record.startedAt > 0 && typeof record.source === "string" &&
      Number.isInteger(record.currentIndex) && record.currentIndex >= 0 && record.currentIndex <= questions.length &&
      !!scoreAnswers(record.answers, questions, true) && record.currentIndex <= record.answers.length &&
      (record.seenStages === undefined || (Array.isArray(record.seenStages) && record.seenStages.every(stage => stage === 0 || stage === 1)));
  }

  function evidence(record, questions) {
    const scores = scoreAnswers(record?.answers, questions);
    if (!scores || !validResult(record, record.primary, questions) || scores.some((score, i) => score !== record.scores[i])) return [];
    const primary = ORDER.indexOf(record.primary);
    return record.answers.map((answer, index) => {
      const option = questions[index].options[answer];
      const contribution = option.scores[primary];
      const margin = contribution - Math.max(...option.scores.filter((_, i) => i !== primary));
      return { index, question: questions[index].text, answer: option.label, contribution, margin };
    }).filter(item => item.contribution > 0 && item.margin > 0)
      .sort((a, b) => b.margin - a.margin || b.contribution - a.contribution || a.index - b.index).slice(0, 2);
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
  function storage(kind = "sessionStorage") {
    try { return window[kind]; } catch { return null; }
  }

  window.QUIZ_RESULT_MODEL = { ORDER, VERSION, getBounds, validScores, classify, scoreAnswers, validResult, validDraft, evidence, read, write, remove, storage };
})();
