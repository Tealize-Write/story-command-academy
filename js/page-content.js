// Shared page content renderer for index, quiz, and result shells.
(function renderPageContent() {
  const root = document.getElementById("page-root");
  if (!root) return;

  const mode = new URLSearchParams(window.location.search).get("page");
  const page = mode || document.body.getAttribute("data-page") || "index";
  const templates = {
    index: `
      <div class="fade-in index-page">
        <h1 data-i18n-key="pageTitle"></h1>

        <figure class="fig">
          <img src="img/index.jpg" alt="Creative trait quiz visual" data-i18n-key="indexHeroAlt" data-i18n-attr="alt"
               width="3105" height="1545">
        </figure>

        <div class="index_desc">
          <div class="index-welcome">
            <p class="index-greeting" data-i18n-key="indexGreeting"></p>
            <p class="index-intro" data-i18n-key="indexIntro"></p>
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
        </section>
        <p id="save-status" class="save-status" role="status"></p>
      </div>
    `,

    result: '<div id="result-wrap"></div>',
  };

  if (templates[page]) root.innerHTML = templates[page];
})();
