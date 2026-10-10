// Shared page content renderer for index, quiz, and result shells.
(function renderPageContent() {
  const root = document.getElementById("page-root");
  if (!root) return;

  const mode = new URLSearchParams(window.location.search).get("page");
  const requested = mode || document.body.getAttribute("data-page") || "index";
  const page = ["index", "quiz", "result"].includes(requested) ? requested : "index";
  if (page !== requested) {
    const params = new URLSearchParams(location.search);
    params.delete("page"); params.delete("academy");
    history.replaceState(null, "", location.pathname + (params.size ? "?" + params : ""));
  }
  const templates = {
    index: `
      <div class="fade-in index-page">
        <h1 data-i18n-key="pageTitle"></h1>

        <figure class="fig">
<<<<<<< HEAD
          <img src="img/index-1280.jpg" srcset="img/index-640.jpg 640w, img/index-1280.jpg 1280w, img/index.jpg 3105w"
               sizes="(max-width: 600px) calc(100vw - 48px), 1000px" alt="Creative trait quiz visual" data-i18n-key="indexHeroAlt" data-i18n-attr="alt"
=======
          <img src="img/index.jpg" alt="Creative trait quiz visual" data-i18n-key="indexHeroAlt" data-i18n-attr="alt"
>>>>>>> origin/main
               width="3105" height="1545">
        </figure>

        <div class="index_desc">
          <div class="index-welcome">
            <p class="index-greeting" data-i18n-key="indexGreeting"></p>
            <p class="index-intro" data-i18n-key="indexIntro"></p>
<<<<<<< HEAD
          </div>

          <section class="index-procedure" aria-labelledby="index-procedure-title">
            <div class="index-procedure-header">
              <h2 id="index-procedure-title" data-i18n-key="indexProcedureTitle"></h2>
              <p class="quiz-duration" data-i18n-key="quizDurationHint"></p>
            </div>
            <ol class="index-stages">
              <li>
                <span class="index-stage-number" aria-hidden="true">01</span>
                <div>
                  <h3 data-i18n-key="indexStage1Title"></h3>
                  <p class="index-stage-count" data-i18n-key="indexStage1Count"></p>
                  <p class="index-stage-description" data-i18n-key="indexStage1"></p>
                </div>
              </li>
              <li>
                <span class="index-stage-number" aria-hidden="true">02</span>
                <div>
                  <h3 data-i18n-key="indexStage2Title"></h3>
                  <p class="index-stage-count" data-i18n-key="indexStage2Count"></p>
                  <p class="index-stage-description" data-i18n-key="indexStage2"></p>
                </div>
              </li>
            </ol>
          </section>

          <div class="index-start">
            <p class="index-outcome" data-i18n-key="indexAfterAnalysis"></p>
            <p class="index-good-luck" data-i18n-key="indexGoodLuck"></p>
            <a href="index.html?page=quiz" class="index_button" data-i18n-key="startQuizBtn" data-analytics-event="quiz_entry_clicked">開始測驗</a>
          </div>
=======
          </div>

          <section class="index-procedure" aria-labelledby="index-procedure-title">
            <div class="index-procedure-header">
              <h2 id="index-procedure-title" data-i18n-key="indexProcedureTitle"></h2>
              <p class="quiz-duration" data-i18n-key="quizDurationHint"></p>
            </div>
            <ol class="index-stages">
              <li>
                <span class="index-stage-number" aria-hidden="true">01</span>
                <div>
                  <h3 data-i18n-key="indexStage1Title"></h3>
                  <p class="index-stage-count" data-i18n-key="indexStage1Count"></p>
                  <p class="index-stage-description" data-i18n-key="indexStage1"></p>
                </div>
              </li>
              <li>
                <span class="index-stage-number" aria-hidden="true">02</span>
                <div>
                  <h3 data-i18n-key="indexStage2Title"></h3>
                  <p class="index-stage-count" data-i18n-key="indexStage2Count"></p>
                  <p class="index-stage-description" data-i18n-key="indexStage2"></p>
                </div>
              </li>
            </ol>
          </section>

          <div class="index-start">
            <p class="index-outcome" data-i18n-key="indexAfterAnalysis"></p>
            <p class="index-good-luck" data-i18n-key="indexGoodLuck"></p>
            <a href="index.html?page=quiz" class="index_button" data-i18n-key="startQuizBtn">開始測驗</a>
          </div>
>>>>>>> origin/main
        </div>

      </div>
    `,

    quiz: `
      <div id="quiz-wrap">
        <section id="resume-card" class="resume-card" style="display:none;" aria-labelledby="resume-title">
          <h2 id="resume-title" tabindex="-1" data-i18n-key="resumeTitle"></h2>
          <p id="resume-description"></p>
          <div class="quiz-controls">
            <button id="resume-quiz" type="button" data-i18n-key="resumeQuizBtn"></button>
            <button id="restart-quiz" class="secondary-button" type="button" data-i18n-key="restartQuizBtn"></button>
          </div>
        </section>
        <div id="chapter-transition" class="chapter-transition" style="display:none;" aria-live="polite"></div>

        <div id="progress-area" style="display:none;">
          <div class="progress-bar-track">
            <div class="progress-bar-fill" id="progress-fill"></div>
          </div>
          <p class="progress-text" id="progress-text"></p>
          <p class="progress-hint" id="progress-hint"></p>
        </div>

        <details id="section-card" style="display:none;" class="quiz-section-card compact-section">
          <summary>
            <span class="section-badge" id="section-badge"></span>
            <span id="section-label"></span>
          </summary>
          <p class="section-desc" id="section-desc"></p>
        </details>

        <div id="question-card" style="display:none;" class="fade-in">
          <p id="question-text" class="qa" tabindex="-1"></p>
          <div id="options-container"></div>
          <div class="quiz-controls">
            <button id="previous-question" class="secondary-button" type="button" data-i18n-key="previousQuestionBtn"></button>
            <button id="continue-answer" type="button" data-i18n-key="keepAnswerBtn" disabled></button>
          </div>
        </div>
        <section id="tie-decision" class="tie-decision" style="display:none;" aria-labelledby="tie-title">
          <h2 id="tie-title" tabindex="-1"></h2>
          <p id="tie-description"></p>
          <div id="tie-options"></div>
          <button id="tie-auto" class="res_btn" type="button"></button>
          <button id="tie-back" class="secondary-button" type="button" data-i18n-key="reviewAnswersBtn"></button>
        </section>
        <section id="review-card" class="resume-card" style="display:none;" aria-labelledby="review-title">
          <h2 id="review-title" tabindex="-1" data-i18n-key="reviewTitle"></h2>
          <p data-i18n-key="reviewDescription"></p>
          <div class="quiz-controls">
            <button id="review-back" class="secondary-button" type="button" data-i18n-key="reviewAnswersBtn"></button>
            <button id="finish-quiz" type="button" data-i18n-key="viewResultBtn"></button>
          </div>
        </section>
        <p id="save-status" class="save-status" role="status"></p>
      </div>
    `,

    result: '<div id="result-wrap"></div>',
  };

  if (templates[page]) root.innerHTML = templates[page];
})();
