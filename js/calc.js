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
const CHAPTER_SIZE = 6;
const TOTAL_CHAPTERS = 5;
const PART_1_QUESTION_COUNT = 20;
const CHAPTER_TRANSITION_START_QUESTIONS = [7, 13, 19, 25];
const QUESTION_ADVANCE_DELAY_MS = 280;
const CALIBRATION_DELAY_MS = 900;
const CALIBRATION_DELAY_REDUCED_MS = 120;
const CHAPTER_TRANSITION_DELAY_MS = 640;
const CHAPTER_TRANSITION_DELAY_REDUCED_MS = 90;
const ANSWER_FEEDBACK_DURATION_MS = 180;

// ── 狀態 ──────────────────────────────────────────────────────────────────
let scores = [0, 0, 0, 0, 0]; // [red, green, blue, black, white]
let qIndex = 0;
let answerHistory = []; // 每題記錄玩家選了哪一個 option index
let calibrationTimer = null;
let chapterTransitionTimer = null;
let feedbackTimer = null;
window.quizStartTime = 0; // 記錄測驗開始時間（用於計算 timeSpent）

// ── DOM refs ──────────────────────────────────────────────────────────────
const progressArea = document.getElementById("progress-area");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const progressHint = document.getElementById("progress-hint");
const calibrationCard = document.getElementById("calibration-card");
const calibrationSkip = document.getElementById("calibration-skip");
const chapterTransition = document.getElementById("chapter-transition");
const sectionCard = document.getElementById("section-card");
const sectionBadge = document.getElementById("section-badge");
const sectionLabel = document.getElementById("section-label");
const sectionDesc = document.getElementById("section-desc");
const questionCard = document.getElementById("question-card");
const questionText = document.getElementById("question-text");
const answerFeedback = document.getElementById("answer-feedback");
const optionsContainer = document.getElementById("options-container");
const HAS_QUIZ_UI = !!questionText;
const REDUCED_MOTION = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// ── 入口 ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (!HAS_QUIZ_UI) return;
  calibrationSkip?.addEventListener("click", finishCalibration);
  startQuiz();

  document.addEventListener("langChanged", onLangChanged);
});

function onLangChanged() {
  if (!HAS_QUIZ_UI) return;
  updateProgressText();
  updateChapterTransitionText();
  updateAnswerFeedbackText();
  renderQuestion();
}

// ── 區塊顯示（第一大題 / 第二大題）──────────────────────────────────────
function updateSectionHeader() {
  const t = UI_TRANSLATIONS[currentLang];
  const isPart1 = qIndex < PART_1_QUESTION_COUNT;
  sectionBadge.textContent = isPart1 ? t.part1Badge : t.part2Badge;
  sectionLabel.textContent = isPart1 ? t.part1Label : t.part2Label;
  sectionDesc.textContent = isPart1 ? t.part1Desc : t.part2Transition;
}

function startQuiz() {
  qIndex = 0;
  scores = [0, 0, 0, 0, 0];
  answerHistory = [];
  window.quizStartTime = Date.now();
  // GAS 暖機：趁玩家答題期間預先喚醒 GAS 實例，消除結果頁的冷啟動延遲
  if (GAS_URL && !GAS_URL.startsWith("__")) {
    fetch(GAS_URL, { keepalive: true }).catch(() => {});
  }
  show(progressArea, sectionCard);
  hide(questionCard, chapterTransition);
  beginCalibration();
}

function beginCalibration() {
  if (!calibrationCard) {
    finishCalibration();
    return;
  }
  show(calibrationCard);
  // Calibration is the only transition before chapter 1.
  const wait = REDUCED_MOTION
    ? CALIBRATION_DELAY_REDUCED_MS
    : CALIBRATION_DELAY_MS;
  clearTimeout(calibrationTimer);
  calibrationTimer = setTimeout(finishCalibration, wait);
}

function finishCalibration() {
  clearTimeout(calibrationTimer);
  hide(calibrationCard);
  show(questionCard);
  renderQuestionWithTransition();
}

function renderQuestionWithTransition() {
  const questions = QUIZ_QUESTIONS[currentLang];
  const total = questions.length;
  if (qIndex >= total) return;

  // Spec: chapter transitions are shown only before Q7/Q13/Q19/Q25.
  const nextQuestion = qIndex + 1;
  if (shouldShowChapterTransition(nextQuestion) && chapterTransition) {
    updateChapterTransitionText(nextQuestion);
    show(chapterTransition);
    const wait = REDUCED_MOTION
      ? CHAPTER_TRANSITION_DELAY_REDUCED_MS
      : CHAPTER_TRANSITION_DELAY_MS;
    clearTimeout(chapterTransitionTimer);
    chapterTransitionTimer = setTimeout(() => {
      hide(chapterTransition);
      renderQuestion();
    }, wait);
    return;
  }
  renderQuestion();
}

// ── 題目渲染 ──────────────────────────────────────────────────────────────
function renderQuestion() {
  const questions = QUIZ_QUESTIONS[currentLang];
  const q = questions[qIndex];
  if (!q) return;

  const total = questions.length;
  const cur = qIndex + 1;
  const pct = (cur / total) * 100;
  const chapter = Math.ceil(cur / CHAPTER_SIZE);
  const chapterCur = ((cur - 1) % CHAPTER_SIZE) + 1;
  const chapterSize = Math.min(
    CHAPTER_SIZE,
    total - (chapter - 1) * CHAPTER_SIZE,
  );
  const t = UI_TRANSLATIONS[currentLang];

  progressFill.style.width = pct + "%";
  updateProgressText({ chapter, chapterCur, chapterSize, cur, total });

  updateSectionHeader();
  questionText.textContent = q.text;

  optionsContainer.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.textContent = opt.label;
    btn.onclick = () => selectOption(opt.scores, btn, i);
    optionsContainer.appendChild(btn);
  });

  // 淡入動畫
  questionCard.classList.remove("fade-in");
  requestAnimationFrame(() => questionCard.classList.add("fade-in"));
}

function selectOption(optScores, btn, optIdx) {
  optionsContainer
    .querySelectorAll(".quiz-option-btn")
    .forEach((b) => (b.disabled = true));
  btn.classList.add("selected");
  showAnswerFeedback();

  answerHistory[qIndex] = optIdx; // 記錄答題歷史（平局解析用）
  optScores.forEach((v, i) => {
    scores[i] += v;
  });
  qIndex++;

  const questions = QUIZ_QUESTIONS[currentLang];
  setTimeout(() => {
    if (qIndex < questions.length) renderQuestionWithTransition();
    else showResult();
  }, QUESTION_ADVANCE_DELAY_MS);
}

function updateProgressText(metrics) {
  if (!progressText) return;
  const t = UI_TRANSLATIONS[currentLang];
  const total = metrics?.total ?? QUIZ_QUESTIONS[currentLang].length;
  const cur = metrics?.cur ?? Math.min(qIndex + 1, total);
  const chapter = metrics?.chapter ?? Math.ceil(cur / CHAPTER_SIZE);
  const chapterCur = metrics?.chapterCur ?? ((cur - 1) % CHAPTER_SIZE) + 1;
  const chapterSize =
    metrics?.chapterSize ??
    Math.min(CHAPTER_SIZE, total - (chapter - 1) * CHAPTER_SIZE);
  progressText.textContent = (t.chapterProgress || t.progressText)
    .replace("{chapter}", chapter)
    .replace("{chapterTotal}", TOTAL_CHAPTERS)
    .replace("{chapterCur}", chapterCur)
    .replace("{chapterSize}", chapterSize)
    .replace("{cur}", cur)
    .replace("{total}", total);
  if (progressHint) {
    const milestones = t.progressMilestones || [];
    progressHint.textContent = milestones[chapter - 1] || "";
  }
}

function updateChapterTransitionText(questionNumber) {
  if (!chapterTransition) return;
  const qNum = questionNumber || qIndex + 1;
  const chapter = Math.ceil(qNum / CHAPTER_SIZE);
  const t = UI_TRANSLATIONS[currentLang];
  const lines = t.chapterTransitions || [];
  chapterTransition.textContent = lines[chapter - 1] || "";
}

function showAnswerFeedback() {
  if (!answerFeedback) return;
  const t = UI_TRANSLATIONS[currentLang];
  const pool = t.answerFeedbacks || [];
  if (!pool.length) return;
  answerFeedback.textContent = pool[Math.floor(Math.random() * pool.length)];
  answerFeedback.classList.add("is-visible");
  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    answerFeedback.classList.remove("is-visible");
  }, ANSWER_FEEDBACK_DURATION_MS);
}

function shouldShowChapterTransition(questionNumber) {
  return CHAPTER_TRANSITION_START_QUESTIONS.includes(questionNumber);
}

function updateAnswerFeedbackText() {
  if (!answerFeedback || !answerFeedback.classList.contains("is-visible"))
    return;
  showAnswerFeedback();
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
  const maxScore = Math.max(...scores);
  const topIndices = scores.reduce((acc, s, i) => {
    if (s === maxScore) acc.push(i);
    return acc;
  }, []);
  const winnerIdx =
    topIndices.length === 1 ? topIndices[0] : breakTie(topIndices);
  const primaryTop = ACADEMIES[winnerIdx].key;
  sessionStorage.setItem(
    "latestAcademyScores",
    JSON.stringify({ scores, savedAt: Date.now() }),
  );
  submitToGAS(scores, primaryTop);
  window.location.href = `index.html?page=result&academy=${primaryTop}`;
}

// ── GAS 提交 ──────────────────────────────────────────────────────────────
function submitToGAS(scoreArr, topKey) {
  if (!GAS_URL || GAS_URL.startsWith("__")) return;
  const timeSpent = window.quizStartTime
    ? Math.round((Date.now() - window.quizStartTime) / 1000)
    : 0;
  const location = getLocationPayload();
  const payload = {
    timestamp: new Date().toISOString(),
    clientId: getClientId(),
    keyword: topKey,
    action: "quiz_completed",
    source: getTrafficSource(),
    referrer: document.referrer || "",
    device: getDeviceType(),
    country: location.country,
    city: location.city,
    timeSpent,
    top: topKey,
    red: scoreArr[0],
    green: scoreArr[1],
    blue: scoreArr[2],
    black: scoreArr[3],
    white: scoreArr[4],
  };
  fetch(GAS_URL, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// ── 重置 ──────────────────────────────────────────────────────────────────
function resetQuiz() {
  startQuiz();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── 工具函數 ──────────────────────────────────────────────────────────────
function show(...els) {
  els.forEach((el) => el && (el.style.display = ""));
}

function hide(...els) {
  els.forEach((el) => el && (el.style.display = "none"));
}
