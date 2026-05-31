// Shared page content renderer for index, quiz, and result shells.
(function renderPageContent() {
  const root = document.getElementById("page-root");
  if (!root) return;

  const mode = new URLSearchParams(window.location.search).get("page");
  const page = mode || document.body.getAttribute("data-page") || "index";
  const templates = {
    index: `
      <div class="fade-in">
        <h1 data-i18n-key="pageTitle" style="font-size:1.6rem;"></h1>

        <figure class="fig">
          <img src="img/index.jpg" alt="Creative trait quiz visual" data-i18n-key="indexHeroAlt" data-i18n-attr="alt"
               style="max-height:350px; object-fit:cover; width:100%; border-bottom:3px solid var(--accent-color);">
        </figure>

        <div class="index_desc">
          <p style="font-size:1.2rem; text-align:center; color:var(--accent-color);" data-i18n-key="indexGreeting"></p>
          <p data-i18n-key="indexIntro"></p>

          <div style="background:rgba(0,0,0,0.3); padding:25px; border-radius:12px;
                      border:1px solid rgba(255,255,255,0.05); margin:25px 0;">
            <p style="margin-top:0; font-weight:bold; color:#fff;" data-i18n-key="indexProcedureTitle"></p>
            <ul style="list-style:none; padding:0; margin:0;">
              <li style="margin-bottom:10px;" data-i18n-key="indexStage1"></li>
              <li data-i18n-key="indexStage2"></li>
            </ul>
          </div>

          <p data-i18n-key="indexAfterAnalysis"></p>
          <p class="quiz-duration" data-i18n-key="quizDurationHint"></p>
          <p style="text-align:center; margin-top:30px; letter-spacing:3px; font-weight:bold; opacity:0.8;" data-i18n-key="indexGoodLuck"></p>
        </div>

        <div class="btn-container">
          <a href="index.html?page=quiz" class="index_button" data-i18n-key="startQuizBtn">開始測驗</a>
        </div>
      </div>
    `,

    quiz: `
      <div id="quiz-wrap">
        <div id="chapter-transition" class="chapter-transition" style="display:none;" aria-live="polite"></div>

        <div id="progress-area" style="display:none;">
          <div class="progress-bar-track">
            <div class="progress-bar-fill" id="progress-fill"></div>
          </div>
          <p class="progress-text" id="progress-text"></p>
          <p class="progress-hint" id="progress-hint"></p>
        </div>

        <div id="section-card" style="display:none;" class="quiz-section-card">
          <div class="section-card-body">
            <span class="section-badge" id="section-badge"></span>
            <h2 class="section-label" id="section-label"></h2>
            <p class="section-desc" id="section-desc"></p>
          </div>
        </div>

        <div id="question-card" style="display:none;" class="fade-in">
          <p id="question-text" class="qa"></p>
          <p id="answer-feedback" class="answer-feedback" aria-live="polite"></p>
          <div id="options-container"></div>
        </div>
      </div>
    `,

    result: '<div id="result-wrap"></div>',
  };

  if (templates[page]) root.innerHTML = templates[page];
})();
