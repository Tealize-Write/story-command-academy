// calc.js — 一題一題流程 + 分數計算 + GAS 提交
// GAS_URL 定義於 js/config.js

// ── 學院定義（index 對應 scores 陣列位置） ───────────────────────────────
const ACADEMIES = [
  { key: "red" },
  { key: "green" },
  { key: "blue" },
  { key: "black" },
  { key: "white" },
];

// Immersion flow constants (presentation-only, does not affect scoring).
const PART_1_QUESTION_COUNT = 20;
const QUESTION_ADVANCE_DELAY_MS = 280;

// ── 狀態 ──────────────────────────────────────────────────────────────────
let scores = [0, 0, 0, 0, 0]; // [red, green, blue, black, white]
let qIndex = 0;
let answerHistory = []; // 每題記錄玩家選了哪一個 option index
let advanceTimer = null;
let advancing = false;
let resultCompleted = false;
let pendingTie = null;
const RESULT_MODEL = window.QUIZ_RESULT_MODEL;
const PENDING_TIE_KEY = "pendingAcademyTie";
const DRAFT_KEY = "academyQuizDraft";
let attemptId = "";
let quizSource = "direct";
let resumeRecord = null;
let progressSaved = false;
let seenStages = new Set();
let renderedIndex = null;
let reviewing = false;
let activeMilliseconds = 0;
let activeSince = null;
window.quizStartTime = 0; // 記錄測驗開始時間（用於計算 timeSpent）

// ── DOM refs ──────────────────────────────────────────────────────────────
const progressArea = document.getElementById("progress-area");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const progressHint = document.getElementById("progress-hint");
const calibrationCard = document.getElementById("calibration-card");
const chapterTransition = document.getElementById("chapter-transition");
const sectionCard = document.getElementById("section-card");
const sectionBadge = document.getElementById("section-badge");
const sectionLabel = document.getElementById("section-label");
const sectionDesc = document.getElementById("section-desc");
const questionCard = document.getElementById("question-card");
const questionText = document.getElementById("question-text");
const optionsContainer = document.getElementById("options-container");
const HAS_QUIZ_UI = !!questionText;
const tieDecision = document.getElementById("tie-decision");
const resumeCard = document.getElementById("resume-card");
const previousButton = document.getElementById("previous-question");
const continueButton = document.getElementById("continue-answer");
const reviewCard = document.getElementById("review-card");

// ── 入口 ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (!HAS_QUIZ_UI) return;
  previousButton.onclick = previousQuestion;
  continueButton.onclick = continueAnswer;
  document.getElementById("resume-quiz").onclick = resumeQuiz;
  document.getElementById("restart-quiz").onclick = () => startQuiz("quiz_restarted");
  document.getElementById("review-back").onclick = returnToAnswers;
  document.getElementById("tie-back").onclick = returnToAnswers;
  document.getElementById("finish-quiz").onclick = finalizeAnswers;
  document.addEventListener("langChanged", onLangChanged);
  const params = new URLSearchParams(window.location.search);
  if (params.get("restart") === "1") {
    params.delete("restart");
    history.replaceState(null, "", `${location.pathname}?${params}`);
    startQuiz();
    return;
  }
  if (restoreTieDecision()) return;
  resumeRecord = readQuizRecord(DRAFT_KEY);
  if (RESULT_MODEL.validDraft(resumeRecord, QUIZ_QUESTIONS[currentLang]) && resumeRecord.answers.length) {
    attemptId = resumeRecord.attemptId;
    const completed = readQuizRecord("latestAcademyScores");
    if (completed?.completionId === resumeRecord.attemptId && RESULT_MODEL.validResult(completed, completed.primary, QUIZ_QUESTIONS[currentLang])) {
      removeQuizRecord(DRAFT_KEY);
      showCompletedResult(completed);
    } else renderResumeCard();
  } else startQuiz();
});

function onLangChanged() {
  if (!HAS_QUIZ_UI || resultCompleted) return;
  if (resumeRecord) { renderResumeCard(); return; }
  if (pendingTie) { renderTieDecision(); return; }
  if (reviewing) { renderReview(); return; }
  updateProgressText();
  updateSaveStatus();
  if (!advancing) renderQuestion();
}

function readQuizRecord(key) {
  const temporary = RESULT_MODEL.storage(), persistent = RESULT_MODEL.storage("localStorage");
  const valid = record => key === DRAFT_KEY ? RESULT_MODEL.validDraft(record, QUIZ_QUESTIONS[currentLang]) :
    key === PENDING_TIE_KEY ? validPendingTie(record) : RESULT_MODEL.validResult(record, record?.primary, QUIZ_QUESTIONS[currentLang]);
  const session = RESULT_MODEL.read(temporary, key);
  const active = attemptId || RESULT_MODEL.read(temporary, "academyQuizActiveAttempt") || session?.attemptId || session?.completionId;
  const scoped = active ? RESULT_MODEL.read(persistent, `${key}:${active}`) : null;
  const global = RESULT_MODEL.read(persistent, key);
  const candidates = [scoped, session, global].filter(record => valid(record) &&
    (!active || (record.attemptId || record.completionId) === active));
  return candidates.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0] || null;
}

function writeQuizRecord(key, record) {
  const persistent = RESULT_MODEL.write(RESULT_MODEL.storage("localStorage"), key, record);
  const id = record.attemptId || record.completionId;
  const scoped = id && RESULT_MODEL.write(RESULT_MODEL.storage("localStorage"), `${key}:${id}`, record);
  const temporary = RESULT_MODEL.write(RESULT_MODEL.storage(), key, record);
  if (id) RESULT_MODEL.write(RESULT_MODEL.storage(), "academyQuizActiveAttempt", id);
  return { persistent: !!scoped, saved: persistent || scoped || temporary };
}

function removeQuizRecord(key) {
  const persistent = RESULT_MODEL.storage("localStorage");
  const shared = RESULT_MODEL.read(persistent, key);
  if ((shared?.attemptId || shared?.completionId) === attemptId) RESULT_MODEL.remove(persistent, key);
  if (attemptId) RESULT_MODEL.remove(persistent, `${key}:${attemptId}`);
  RESULT_MODEL.remove(RESULT_MODEL.storage(), key);
}

function newAttemptId() {
  return window.crypto?.randomUUID?.() || `quiz_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function saveProgress() {
  captureActiveTime();
  const record = { version: RESULT_MODEL.VERSION, attemptId, answers: [...answerHistory], currentIndex: qIndex,
    startedAt: window.quizStartTime, source: quizSource, seenStages: [...seenStages], savedAt: Date.now(), activeMilliseconds };
  progressSaved = writeQuizRecord(DRAFT_KEY, record).persistent;
  updateSaveStatus();
}

function updateSaveStatus() {
  const status = document.getElementById("save-status");
  if (status) status.textContent = UI_TRANSLATIONS[currentLang][progressSaved ? "progressSaved" : "progressSaveFailed"];
}

function renderResumeCard() {
  hide(progressArea, sectionCard, questionCard, tieDecision);
  show(resumeCard);
  const t = UI_TRANSLATIONS[currentLang], total = QUIZ_QUESTIONS[currentLang].length;
  document.getElementById("resume-description").textContent = resumeRecord.currentIndex === total ? t.resumeCompleted :
    t.resumeDescription.replace("{answered}", resumeRecord.answers.length).replace("{total}", total).replace("{cur}", resumeRecord.currentIndex + 1);
  document.getElementById("resume-title").focus({ preventScroll: true });
  document.getElementById("save-status").textContent = "";
}

function resumeQuiz() {
  if (!resumeRecord) return;
  answerHistory = [...resumeRecord.answers];
  qIndex = resumeRecord.currentIndex;
  attemptId = resumeRecord.attemptId;
  quizSource = resumeRecord.source;
  window.quizStartTime = resumeRecord.startedAt;
  activeMilliseconds = Number(resumeRecord.activeMilliseconds) || 0;
  activeSince = document.visibilityState === "hidden" ? null : Date.now();
  seenStages = new Set(resumeRecord.seenStages || []);
  renderedIndex = null;
  scores = RESULT_MODEL.scoreAnswers(answerHistory, QUIZ_QUESTIONS[currentLang], true);
  window.ANALYTICS?.setContext({ attemptId, source: quizSource, keyword: "" });
  window.ANALYTICS?.track("quiz_resumed");
  resumeRecord = null;
  saveProgress();
  hide(resumeCard);
  if (qIndex === QUIZ_QUESTIONS[currentLang].length) showResult();
  else { show(progressArea, sectionCard, questionCard); renderQuestion(true); }
}

// ── 區塊顯示（第一大題 / 第二大題）──────────────────────────────────────
function updateSectionHeader() {
  const t = UI_TRANSLATIONS[currentLang];
  const isPart1 = qIndex < PART_1_QUESTION_COUNT;
  sectionBadge.textContent = isPart1 ? t.part1Badge : t.part2Badge;
  sectionLabel.textContent = isPart1 ? t.part1Label : t.part2Label;
  sectionDesc.textContent = isPart1 ? t.part1Desc : t.part2Transition;
  const stage = isPart1 ? 0 : 1;
  const firstVisit = !seenStages.has(stage);
  if (renderedIndex !== qIndex) sectionCard.open = firstVisit;
  seenStages.add(stage);
  return firstVisit;
}

function startQuiz(action = "quiz_started") {
  clearTimeout(advanceTimer);
  advancing = false;
  resultCompleted = false;
  pendingTie = null;
  reviewing = false;
  resumeRecord = null;
  // Starting a new attempt must not remove progress owned by another tab.
  RESULT_MODEL.remove(RESULT_MODEL.storage(), PENDING_TIE_KEY);
  RESULT_MODEL.remove(RESULT_MODEL.storage(), DRAFT_KEY);
  attemptId = newAttemptId();
  quizSource = window.ANALYTICS?.getSource() || getTrafficSource();
  seenStages = new Set();
  renderedIndex = null;
  qIndex = 0;
  scores = [0, 0, 0, 0, 0];
  answerHistory = [];
  window.quizStartTime = Date.now();
  activeMilliseconds = 0;
  activeSince = document.visibilityState === "hidden" ? null : Date.now();
  window.ANALYTICS?.setContext({ attemptId, source: quizSource, keyword: "" });
  window.ANALYTICS?.track(action);
  // GAS 暖機：趁玩家答題期間預先喚醒 GAS 實例，消除結果頁的冷啟動延遲
  if (GAS_URL && !GAS_URL.startsWith("__")) {
    fetch(GAS_URL, { keepalive: true }).catch(() => {});
  }
  show(progressArea, sectionCard);
  hide(calibrationCard, chapterTransition, tieDecision, resumeCard, reviewCard);
  show(questionCard);
  saveProgress();
  renderQuestion(true);
}

// ── 題目渲染 ──────────────────────────────────────────────────────────────
function renderQuestion(focus = false) {
  const questions = QUIZ_QUESTIONS[currentLang];
  const q = questions[qIndex];
  if (!q) return;

  const total = questions.length;
  const cur = qIndex + 1;
  const pct = (cur / total) * 100;

  progressFill.style.width = pct + "%";
  updateProgressText({ cur, total });

  const firstVisit = updateSectionHeader();
  renderedIndex = qIndex;
  questionText.textContent = q.text;

  optionsContainer.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn" + (qIndex < PART_1_QUESTION_COUNT ? " degree-option" : "");
    btn.type = "button";
    btn.textContent = qIndex < PART_1_QUESTION_COUNT ? UI_TRANSLATIONS[currentLang]["opt" + (3 - i)] : opt.label.replace(/^\([A-Z]\)\s*/, "");
    const selected = answerHistory[qIndex] === i;
    btn.classList.toggle("selected", selected);
    btn.setAttribute("aria-pressed", String(selected));
    btn.onclick = () => selectOption(opt.scores, btn, i);
    optionsContainer.appendChild(btn);
  });

  // 淡入動畫
  questionCard.classList.remove("fade-in");
  requestAnimationFrame(() => questionCard.classList.add("fade-in"));
  previousButton.disabled = qIndex === 0;
  continueButton.disabled = !Number.isInteger(answerHistory[qIndex]);
  if (firstVisit) saveProgress();
  if (focus) {
    questionText.focus({ preventScroll: true });
    questionText.scrollIntoView({ block: "start", behavior: "instant" });
  }
}

function selectOption(optScores, btn, optIdx) {
  if (advancing || pendingTie || resultCompleted) return;
  advancing = true;
  optionsContainer
    .querySelectorAll(".quiz-option-btn")
    .forEach((b) => (b.disabled = true));
  btn.classList.add("selected");
  btn.setAttribute("aria-pressed", "true");
  previousButton.disabled = true;
  continueButton.disabled = true;
  answerHistory[qIndex] = optIdx;
  scores = RESULT_MODEL.scoreAnswers(answerHistory, QUIZ_QUESTIONS[currentLang], true);
  qIndex++;
  saveProgress();

  const questions = QUIZ_QUESTIONS[currentLang];
  advanceTimer = setTimeout(() => {
    advancing = false;
    if (qIndex < questions.length) renderQuestion(true);
    else showResult();
  }, QUESTION_ADVANCE_DELAY_MS);
}

function previousQuestion() {
  if (advancing || pendingTie || resultCompleted || qIndex <= 0) return;
  clearTimeout(advanceTimer);
  qIndex--;
  saveProgress();
  renderQuestion(true);
}

function continueAnswer() {
  const answer = answerHistory[qIndex];
  const option = QUIZ_QUESTIONS[currentLang][qIndex]?.options[answer];
  if (option) selectOption(option.scores, optionsContainer.children[answer], answer);
}

function updateProgressText(metrics) {
  if (!progressText) return;
  const t = UI_TRANSLATIONS[currentLang];
  const total = metrics?.total ?? QUIZ_QUESTIONS[currentLang].length;
  const cur = metrics?.cur ?? Math.min(qIndex + 1, total);
  progressText.textContent = t.progressText
    .replace("{cur}", cur)
    .replace("{total}", total);
  if (progressHint) {
    progressHint.textContent =
      t.quizStructureHint ||
      (currentLang === "en"
        ? "30 questions total: 20 degree questions + 10 part-II choices."
        : "本測驗共 30 題：程度題 20 題＋選擇題 10 題。");
  }
}

// ── 結果 ──────────────────────────────────────────────────────────────────

// 同分時從最後一題往前回溯，依答題歷史決定勝者（參考 TwistedTales breakCategoryTie）
function breakTie(candidates) {
  let current = [...candidates];
  const questions = QUIZ_QUESTIONS[currentLang];
  for (let i = answerHistory.length - 1; i >= 0; i--) {
    const optIdx = answerHistory[i];
    if (optIdx == null) continue;
    const optScores = questions[i]?.options[optIdx]?.scores;
    if (!optScores) continue;
    let best = -1;
    let winners = [];
    for (const idx of current) {
      const s = Number(optScores[idx] || 0);
      if (s > best) {
        best = s;
        winners = [idx];
      } else if (s === best) winners.push(idx);
    }
    if (best > 0) {
      if (winners.length === 1) return winners[0];
      current = winners;
    }
  }
  return current[0]; // 依 ACADEMIES 順序保底
}

function showResult() {
  reviewing = true;
  renderReview();
}

function renderReview() {
  hide(progressArea, sectionCard, questionCard, tieDecision, resumeCard);
  show(reviewCard);
  document.getElementById("review-title").focus({ preventScroll: true });
}

function returnToAnswers() {
  pendingTie = null; reviewing = false;
  removeQuizRecord(PENDING_TIE_KEY);
  qIndex = answerHistory.length - 1;
  hide(reviewCard, tieDecision);
  show(progressArea, sectionCard, questionCard);
  saveProgress(); renderQuestion(true);
}

function finalizeAnswers() {
  if (resultCompleted) return;
  reviewing = false;
  hide(reviewCard);
  const maxScore = Math.max(...scores);
  const topIndices = scores.reduce((acc, s, i) => {
    if (s === maxScore) acc.push(i);
    return acc;
  }, []);
  if (topIndices.length > 1) {
    pendingTie = {
      attemptId,
      version: RESULT_MODEL.VERSION,
      answers: [...answerHistory],
      scores: [...scores],
      startedAt: window.quizStartTime,
      source: quizSource,
      activeMilliseconds,
      savedAt: Date.now(),
    };
    progressSaved = writeQuizRecord(PENDING_TIE_KEY, pendingTie).persistent;
    updateSaveStatus();
    renderTieDecision();
    return;
  }
  completeResult(ACADEMIES[topIndices[0]].key, "automatic");
}

function restoreTieDecision() {
  const record = readQuizRecord(PENDING_TIE_KEY);
  if (!validPendingTie(record)) return false;
  const restoredScores = RESULT_MODEL.scoreAnswers(record.answers, QUIZ_QUESTIONS[currentLang]);
  if (!restoredScores || !RESULT_MODEL.validScores(record.scores, QUIZ_QUESTIONS[currentLang]) ||
      restoredScores.some((score, i) => score !== record.scores[i]) ||
      RESULT_MODEL.classify(restoredScores).top.length < 2 ||
      !Number.isFinite(record.startedAt) || record.startedAt <= 0) return false;
  scores = restoredScores;
  answerHistory = [...record.answers];
  qIndex = answerHistory.length;
  window.quizStartTime = record.startedAt;
  activeMilliseconds = Number(record.activeMilliseconds) || 0;
  activeSince = document.visibilityState === "hidden" ? null : Date.now();
  pendingTie = record;
  attemptId = record.attemptId || newAttemptId();
  quizSource = record.source || "direct";
  window.ANALYTICS?.setContext({ attemptId, source: quizSource, keyword: "" });
  window.ANALYTICS?.track("quiz_resumed");
  progressSaved = writeQuizRecord(PENDING_TIE_KEY, { ...record, attemptId }).persistent;
  updateSaveStatus();
  renderTieDecision();
  return true;
}

function validPendingTie(record) {
  if (record?.version !== RESULT_MODEL.VERSION) return false;
  const computed = RESULT_MODEL.scoreAnswers(record.answers, QUIZ_QUESTIONS[currentLang]);
  return !!computed && Array.isArray(record.scores) && computed.every((score, i) => score === record.scores[i]) &&
    record.scores.length === 5 && RESULT_MODEL.classify(computed).top.length > 1 && Number.isFinite(record.startedAt) && record.startedAt > 0 &&
    (record.activeMilliseconds === undefined || (Number.isFinite(record.activeMilliseconds) && record.activeMilliseconds >= 0));
}

function renderTieDecision() {
  const t = UI_TRANSLATIONS[currentLang];
  hide(progressArea, sectionCard, questionCard, resumeCard, reviewCard);
  show(tieDecision);
  document.getElementById("tie-title").textContent = t.tieDecisionTitle;
  document.getElementById("tie-description").textContent = t.tieDecisionDesc;
  const options = document.getElementById("tie-options");
  options.innerHTML = "";
  RESULT_MODEL.classify(scores).top.forEach(key => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-option-btn";
    button.textContent = `${t.academyNames[key]} — ${t.tiePreferences[key]}`;
    button.onclick = () => completeResult(key, "player");
    options.appendChild(button);
  });
  const auto = document.getElementById("tie-auto");
  auto.textContent = t.tieDecisionAuto;
  auto.onclick = () => {
    const candidates = RESULT_MODEL.classify(scores).top.map(key => RESULT_MODEL.ORDER.indexOf(key));
    completeResult(ACADEMIES[breakTie(candidates)].key, "automatic");
  };
  document.getElementById("tie-title").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}

function completeResult(primaryTop, selectionSource) {
  if (resultCompleted || !RESULT_MODEL.classify(scores).top.includes(primaryTop)) return;
  captureActiveTime();
  activeSince = null;
  resultCompleted = true;
  tieDecision?.querySelectorAll("button").forEach(button => { button.disabled = true; });
  const result = {
    completionId: attemptId,
    submissionStatus: "attempted",
    version: RESULT_MODEL.VERSION,
    scores: [...scores],
    answers: [...answerHistory],
    primary: primaryTop,
    selectionSource,
    source: quizSource,
    savedAt: Date.now(),
    activeMilliseconds,
  };
  const prior = readQuizRecord("latestAcademyScores");
  const alreadySubmitted = prior?.completionId === attemptId && prior?.submissionStatus === "attempted";
  if (alreadySubmitted && RESULT_MODEL.validResult(prior, prior.primary, QUIZ_QUESTIONS[currentLang])) {
    removeQuizRecord(PENDING_TIE_KEY);
    removeQuizRecord(DRAFT_KEY);
    pendingTie = null;
    showCompletedResult(prior);
    return;
  }
  const saved = writeQuizRecord("latestAcademyScores", result);
  result.memoryOnly = !saved.persistent;
  if (result.memoryOnly && saved.saved) RESULT_MODEL.write(RESULT_MODEL.storage(), "latestAcademyScores", result);
  submitToGAS(scores, primaryTop, selectionSource);
  removeQuizRecord(PENDING_TIE_KEY);
  removeQuizRecord(DRAFT_KEY);
  pendingTie = null;
  showCompletedResult(result);
}

function showCompletedResult(result) {
  resultCompleted = true;
  window.currentQuizResult = result;
  history.replaceState(null, "", `index.html?page=result&academy=${result.primary}`);
  document.body.dataset.page = "result";
  document.getElementById("page-root").innerHTML = '<div id="result-wrap"></div>';
  applyLang(currentLang);
  initializeResultPage();
  window.scrollTo({ top: 0, behavior: "instant" });
}

// ── GAS 提交 ──────────────────────────────────────────────────────────────
function submitToGAS(scoreArr, topKey, selectionSource = "automatic") {
  if (!GAS_URL || GAS_URL.startsWith("__")) return;
  const timeSpent = window.quizStartTime
    ? Math.round((Date.now() - window.quizStartTime) / 1000)
    : 0;
  window.ANALYTICS?.track("quiz_completed", {
    eventId: `quiz_completed:${attemptId}`,
    attemptId,
    keyword: topKey,
    source: pendingTie?.source || quizSource,
    selectionSource,
    timeSpent,
    activeTimeSpent: Math.round(activeMilliseconds / 1000),
    scoringVersion: RESULT_MODEL.VERSION,
    top: topKey,
    red: scoreArr[0],
    green: scoreArr[1],
    blue: scoreArr[2],
    black: scoreArr[3],
    white: scoreArr[4],
  });
}

// ── 重置 ──────────────────────────────────────────────────────────────────
function resetQuiz() {
  startQuiz();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function captureActiveTime() {
  if (activeSince !== null) activeMilliseconds += Math.max(0, Date.now() - activeSince);
  activeSince = document.visibilityState === "hidden" || resultCompleted || resumeRecord ? null : Date.now();
}

document.addEventListener("visibilitychange", () => {
  if (!HAS_QUIZ_UI || resultCompleted || resumeRecord || !attemptId) return;
  captureActiveTime(); saveProgress();
  if (pendingTie) {
    pendingTie.activeMilliseconds = activeMilliseconds; pendingTie.savedAt = Date.now();
    writeQuizRecord(PENDING_TIE_KEY, pendingTie);
  }
});
window.addEventListener("pagehide", () => {
  if (HAS_QUIZ_UI && !resultCompleted && !resumeRecord && attemptId) saveProgress();
});

// ── 工具函數 ──────────────────────────────────────────────────────────────
function show(...els) {
  els.forEach((el) => el && (el.style.display = ""));
}

function hide(...els) {
  els.forEach((el) => el && (el.style.display = "none"));
}
