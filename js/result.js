// js/result.js — 學院結果頁渲染（由 result.html 載入）

const ACADEMY_ORDER = window.ACADEMY_THEME?.ORDER || [
  "red",
  "green",
  "blue",
  "black",
  "white",
];

let globalCountsCache = null;
let globalTotalCache = 0;
let revealTimers = [];

// Three-act reveal is presentation-only. Scoring/result data is computed before this.
const REVEAL_ACT2_DELAY_MS = 520;
const REVEAL_ACT3_DELAY_MS = 1200;
const MIN_BOOK_HEIGHT_PERCENT = 62;
const MAX_BOOK_HEIGHT_PERCENT = 96;
const DEFAULT_LANG = "zh-TW";

function getCurrentLang() {
  const lang =
    window.currentLang || localStorage.getItem("lang") || DEFAULT_LANG;
  return window.UI_TRANSLATIONS?.[lang] ? lang : DEFAULT_LANG;
}

function getUiTranslation(lang = getCurrentLang()) {
  return (
    window.UI_TRANSLATIONS?.[lang] ||
    window.UI_TRANSLATIONS?.[DEFAULT_LANG] ||
    {}
  );
}

// 所有學院的段落內容（純中文，hybrid key 為對象學院 id）
const RESULT_CONTENT = {
  "zh-TW": {
    red: {
      main: [
        "紅馳也是很多人的學院，且常會跨組其他學院，最常見是和銀倚雙修。",
        "你重視作品的市場、IP 與流量，對流行敏銳、產量穩定，擅長掌控情節抓住讀者注意力。",
        "若你不是單純跟風型紅馳，通常具備高觀察力與高控制力，容易成為出版社偏好的作者類型。",
      ],
      pureView: [
        "紅馳視角重視作品是否能被看見、被討論，並持續累積影響力。",
        "你通常會把創作、讀者經營、平台策略視為同一個長期工程。",
      ],
      hybrids: {
        green: ["兼具創意爆發與市場敏感度，適合做出新鮮且可傳播的企劃。"],
        blue: ["同時有商業判斷與結構控制，作品常兼顧可讀性與完整度。"],
        black: ["能在文學質地與受眾接受度之間取得平衡。"],
        white: ["角色魅力與受眾需求對接得好時，作品黏性通常很高。"],
      },
    },
    green: {
      main: [
        "綠躍創作者最注重創意與有趣，作品常天馬行空、歡樂跳躍，也喜歡挑戰邊界與獵奇實驗。",
        "你通常願意嘗試各種新玩法與敘事實驗，因此作品容易帶有鮮明的新奇感。",
        "純綠躍作品其實不多，常混有其他學院特質，因為綠躍作者也最容易玩著玩著就棄坑。",
      ],
      pureView: [
        "綠躍視角最在意新意與趣味，對過度套路化的內容耐受度較低。",
        "你會優先追求好玩，再回頭處理收束與完稿節奏。",
      ],
      hybrids: {
        red: ["能把新奇概念轉成可落地的市場方案。"],
        blue: ["創意加上系統化能力，能讓高概念故事更可理解。"],
        black: ["語言表現力會放大你的創意辨識度。"],
        white: ["角色塑造若同步加深，作品感染力會顯著提升。"],
      },
    },
    blue: {
      main: [
        "藍行創作者非常注重邏輯與考據，會很認真地塑造完整世界觀與規則系統。",
        "你很容易出現設定寫了 100%，正文只寫了 1% 的情況，也是常見坑王類型之一。",
        "藍行作品通常較硬派、相對冷門，但若搭配銀倚或紅馳特質，仍很有機會長成強 IP。",
      ],
      pureView: [
        "藍行視角偏好有脈絡、有推理、有細節支撐的文本。",
        "你通常會先檢查合理性與結構完整，再決定情感與創意是否成立。",
      ],
      hybrids: {
        red: ["結構嚴謹加上市場意識，適合長線 IP 企劃。"],
        green: ["能把天馬行空的想法轉成有規則可運作的世界。"],
        black: ["邏輯與文學並行時，作品會兼具深度與說服力。"],
        white: ["角色行為與心理動機通常更完整可信。"],
      },
    },
    black: {
      main: [
        "墨佇作者注重議題與思想傳遞，作品常有深度，閱讀後容易引發省思。",
        "你常透過不同面向與角度帶出體悟，讓讀者在故事之外也能獲得思考。",
        "這類創作往往像是在用作品與世界對話，也在寫作過程裡探尋自己的答案。",
      ],
      pureView: [
        "墨佇視角重視作品想說什麼，以及如何說得準確、清晰又有思想重量。",
        "你通常在意觀點的完整性與文本的餘韻。",
      ],
      hybrids: {
        red: ["文學性與市場性並行時，作品兼具深度與擴散力。"],
        green: ["創意與文筆疊加，容易形成強烈風格標記。"],
        blue: ["詩意表達若有結構支撐，整體可信度更高。"],
        white: ["細膩筆觸與角色心理結合時，情感滲透力很強。"],
      },
    },
    white: {
      main: [
        "銀倚是最多人的學院，大部分偏情感向的作者都會落在這一類。",
        "你最注重人物與角色塑造，習慣用人物選擇與心理變化來推動劇情。",
        "你的作品往往有很高的讀者黏著度，但也要留意過度偏愛角色，避免落入瑪麗蘇傾向。",
      ],
      pureView: [
        "銀倚視角強調角色完整度，重視情緒變化背後的因果與細節。",
        "你通常對多數題材都開放，只要人物可信、情感成立。",
      ],
      hybrids: {
        red: ["角色魅力與市場判斷結合時，作品容易形成高黏性讀者群。"],
        green: ["不按牌理的人物設定會成為你的記憶點。"],
        blue: ["心理描寫加上邏輯支撐，角色成長弧線更扎實。"],
        black: ["文學表現力會放大角色內心層次與情感密度。"],
      },
    },
  },
  en: {
    red: {
      main: [
        "You write with a sharp market instinct. You consider not only artistic impact but also long-term audience fit and IP potential.",
        "You are good at tracking reader behavior and shaping stories around clear demand signals without losing narrative momentum.",
        "Your strongest advantage is execution under real-world conditions: visibility, continuity, and strategic positioning.",
      ],
      pureView: [
        "Flaremarch creators are often disciplined and operationally strong. You treat writing, publishing, and audience communication as one system.",
        "You usually respect craft from other academies, but you pay close attention to whether a work can sustain attention in a crowded environment.",
        "Your risk is burnout. Productivity and public-facing effort can become heavy if recovery is not designed into your workflow.",
      ],
      hybrids: {
        green: [
          "This mix combines market awareness with inventive thinking, letting you build fresh concepts that still have broad appeal.",
          "You are well-suited for cross-media ideas and experimental formats that remain audience-readable.",
        ],
        blue: [
          "You pair commercial clarity with structural rigor, producing stories that are both sellable and internally coherent.",
          "Your planning process helps reduce weak links in pacing and logic before release.",
        ],
        black: [
          "You can retain literary texture while still designing for reach, giving your work both depth and accessibility.",
          "This profile is strong for stories that need emotional weight without sacrificing readability.",
        ],
        white: [
          "You understand how character psychology drives retention, then translate that into audience-friendly arcs.",
          "When this trait is high, your stories often become highly sticky and discussion-worthy.",
        ],
      },
    },
    green: {
      main: [
        "You prioritize novelty, surprise, and conceptual freshness. Originality is not decoration for you; it is the engine of the story.",
        "You naturally challenge default patterns and search for unexplored combinations in setting, tone, and narrative mechanics.",
        "Your strongest power is idea generation, and your core challenge is maintaining completion discipline.",
      ],
      pureView: [
        "Verdance creators are attracted to playful and unconventional works, and you are usually open to diverse styles if they feel alive.",
        "You often value possibility over convention. That gives your writing energy, but can also stretch coherence if unchecked.",
        "Build a reliable finishing rhythm and your originality becomes a long-term signature rather than fragmented sparks.",
      ],
      hybrids: {
        red: [
          "You can turn innovative concepts into viable projects with real audience pathways.",
          "This blend supports bold work that is still launch-ready.",
        ],
        blue: [
          "You are good at systematizing unusual ideas so readers can follow even complex imaginative leaps.",
          "Logic scaffolding helps your originality land with stronger impact.",
        ],
        black: [
          "You combine inventive structures with expressive prose, producing work that feels both strange and evocative.",
          "This profile is ideal for stylized narratives with thematic texture.",
        ],
        white: [
          "You like constructing unusual yet vivid characters and testing difficult emotional combinations.",
          "Readers often remember your cast as much as your premise.",
        ],
      },
    },
    blue: {
      main: [
        "You care deeply about logical consistency, research depth, and structural integrity.",
        "You tend to build worlds and systems that can withstand scrutiny, even in fantasy or speculative settings.",
        "Your core strength is credibility; your common risk is over-explaining and slowing narrative momentum.",
      ],
      pureView: [
        "Cerulink creators invest heavily in preparation and reference work, and this often produces durable story architecture.",
        "You usually respect market-aware and character-driven writing, but still judge whether internal logic holds.",
        "When balance is achieved, your stories feel both intellectually satisfying and emotionally believable.",
      ],
      hybrids: {
        red: [
          "You can align precise structure with commercial viability, creating work that is robust and accessible.",
          "This blend supports strong long-form projects and adaptable IP pipelines.",
        ],
        green: [
          "You transform ambitious concepts into coherent systems readers can trust.",
          "Your framework thinking keeps high-concept stories from collapsing under their own complexity.",
        ],
        black: [
          "You pair literary precision with disciplined logic, yielding prose-rich work with strong architecture.",
          "This profile excels at reflective narratives that still maintain clear structural control.",
        ],
        white: [
          "You ground character psychology in clear causal chains and believable behavior.",
          "Readers often experience your cast as consistent, layered, and earned.",
        ],
      },
    },
    black: {
      main: [
        "You are text-first and craft-driven. Language for you is not only a container for plot, but a medium of meaning.",
        "You focus on nuance, rhythm, and symbolic depth, often shaping emotional impact through phrasing and structure.",
        "Your key strength is literary resonance; your key challenge is staying connected to broader readability when needed.",
      ],
      pureView: [
        "Inkarbor creators usually pursue thematic depth and care about what a story says, not only what happens.",
        "You tend to appreciate rigor and originality in other academies, while still expecting conceptual and stylistic weight.",
        "Your writing often leaves a lasting aftertaste when craft and intention are tightly aligned.",
      ],
      hybrids: {
        red: [
          "You can preserve literary quality while still designing for audience reach and adaptation potential.",
          "This mix is strong for works that need both prestige and traction.",
        ],
        green: [
          "You fuse poetic language with unconventional ideas, giving your work a distinct tonal fingerprint.",
          "This profile favors expressive experimentation with conceptual ambition.",
        ],
        blue: [
          "You support aesthetic prose with rigorous structure, avoiding the trade-off between beauty and coherence.",
          "Your narratives can feel elegant while remaining intellectually grounded.",
        ],
        white: [
          "You render character interiority with high emotional and linguistic resolution.",
          "This combination often produces psychologically rich storytelling with strong thematic gravity.",
        ],
      },
    },
    white: {
      main: [
        "You are character-centric and emotionally perceptive. You treat people, motives, and relationships as the story core.",
        "Your plots often grow out of decisions, tensions, and vulnerabilities rather than external mechanics alone.",
        "Your greatest strength is human immediacy; your main risk is under-investing in wider structural scaffolding.",
      ],
      pureView: [
        "Silvalean creators naturally track emotional causality and relational movement, which makes character arcs feel lived-in.",
        "You can resonate with many styles when character integrity is preserved.",
        "When paired with clear pacing control, your stories become highly immersive and memorable.",
      ],
      hybrids: {
        red: [
          "You turn emotional intelligence into strong audience attachment and long-term engagement.",
          "This profile is excellent for stories that need both heart and broad traction.",
        ],
        green: [
          "You enjoy building unusual personalities and emotionally complex casts.",
          "Your stories often feel both inventive and deeply personal.",
        ],
        blue: [
          "You combine psychological depth with clear structural logic, strengthening believability at every step.",
          "This blend supports layered relationship drama inside robust world systems.",
        ],
        black: [
          "You deliver emotion with literary finesse, giving inner life and language equal weight.",
          "This often results in subtle, textured narratives that stay with readers.",
        ],
      },
    },
  },
};

const RESULT_COPY = {
  "zh-TW": {
    academyTestHeading: "你的學院測試",
    resultHeading: "測試結果",
    primaryTitle: "── {name} ──",
    pureViewTitle: "純種{name}人視角",
    hybridTitle: "同分或次高分是{name}",
    missingAcademyParam: "找不到學院參數，請從測驗頁連結進入。",
    globalStatsMissingSource: "尚未設定 GAS 統計來源。",
    globalStatsLoadFailed: "讀取全體統計失敗，請稍後再試。",
    globalStatsNoData: "暫無全體統計資料。",
    localScoresMissing: "請先完成測驗，即可顯示五學院分數。",
  },
  en: {
    academyTestHeading: "Your Academy Reading",
    resultHeading: "Result",
    primaryTitle: "-- {name} --",
    pureViewTitle: "Pure {name} Perspective",
    hybridTitle: "Tie / Secondary Peak: {name}",
    missingAcademyParam:
      "Academy parameter is missing. Please enter from the quiz page.",
    globalStatsMissingSource: "GAS stats source is not configured yet.",
    globalStatsLoadFailed:
      "Failed to load community stats. Please try again later.",
    globalStatsNoData: "No community statistics available yet.",
    localScoresMissing:
      "Finish the quiz first to display your five-academy scores.",
  },
};

function getResultCopy(lang = getCurrentLang()) {
  return RESULT_COPY[lang] || RESULT_COPY[DEFAULT_LANG];
}

function getResultContent(lang = getCurrentLang()) {
  return RESULT_CONTENT[lang] || RESULT_CONTENT[DEFAULT_LANG];
}

function formatText(template, name) {
  return String(template || "").replace("{name}", name);
}

// ── 入口 ────────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const wrap = document.getElementById("result-wrap");
  if (!wrap) return;

  const key = getAcademyParam();
  if (!key) {
    wrap.innerHTML = "";
    wrap.appendChild(
      el(
        "p",
        { style: "text-align:center;padding:3rem;opacity:.6;" },
        getResultCopy().missingAcademyParam,
      ),
    );
    return;
  }

  document.body.classList.add("theme-" + key);
  renderContent(key);
  document.addEventListener("langChanged", () => {
    const stage =
      document.querySelector(".result-reveal-stage")?.dataset.revealState ||
      "act1";
    renderContent(key, { instant: true, revealState: stage });
  });
  loadGlobalAcademyStats(key);
});

function getAcademyParam() {
  const p = new URLSearchParams(window.location.search).get("academy");
  return RESULT_CONTENT[DEFAULT_LANG][p] ? p : null;
}

// ── 渲染全頁內容 ────────────────────────────────────────────────────────────
function renderContent(key, options = {}) {
  const lang = getCurrentLang();
  const t = getUiTranslation(lang);
  const copy = getResultCopy(lang);
  const data =
    getResultContent(lang)[key] || getResultContent(DEFAULT_LANG)[key];
  const academyNames =
    t.academyNames || getUiTranslation(DEFAULT_LANG).academyNames || {};
  const academyName = academyNames[key] || key;
  const wrap = document.getElementById("result-wrap");
  if (!wrap || !data) return;

  clearRevealTimers();
  wrap.innerHTML = "";

  const frag = document.createDocumentFragment();

  const heading = el("h2", { style: "opacity:0.8;" }, copy.academyTestHeading);
  heading.setAttribute("data-reveal", "act1");
  frag.appendChild(heading);

  const content = el("div", { className: "res_content result-reveal-stage" });

  const resultTitle = el(
    "h2",
    { className: "res_title", style: "font-size:2.5rem;margin-bottom:30px;" },
    copy.resultHeading,
  );
  resultTitle.setAttribute("data-reveal", "act1");
  content.appendChild(resultTitle);

  const skipRevealBtn = el("button", {
    className: "res_btn result-reveal-skip",
    type: "button",
  });
  skipRevealBtn.textContent = t.revealSkip || "Skip";
  content.appendChild(skipRevealBtn);

  const winnerBox = el("div", { className: "result-winner-box" });
  winnerBox.setAttribute("data-reveal", "act1");
  const winnerLabel = el("p", {
    className: "result-winner-label",
    id: "result-winner-label",
  });
  winnerLabel.textContent = t.resultTopLabel || "Your result:";
  const winnerName = el("span", {
    className: "result-winner-name",
    id: "result-winner-name",
  });
  winnerBox.appendChild(winnerLabel);
  winnerBox.appendChild(winnerName);
  content.appendChild(winnerBox);

  const scoreWrap = el("div", { className: "score-chart-container" });
  scoreWrap.setAttribute("data-reveal", "act2");
  const scoreTitle = el("h3", {}, t.scoreChartTitle || "Scores");
  const shelf = el("div", {
    id: "academyBookShelf",
    className: "academy-bookshelf-container",
  });
  scoreWrap.appendChild(scoreTitle);
  scoreWrap.appendChild(shelf);
  content.appendChild(scoreWrap);

  const reportWrap = el("div", { className: "result-report-wrap" });
  reportWrap.setAttribute("data-reveal", "act3");

  reportWrap.appendChild(
    makeBlock(formatText(copy.primaryTitle, academyName), data.main),
  );
  reportWrap.appendChild(
    makeBlock(formatText(copy.pureViewTitle, academyName), data.pureView),
  );

  ACADEMY_ORDER.forEach((other) => {
    if (other === key) return;
    const hybridName = academyNames[other] || other;
    reportWrap.appendChild(
      makeBlock(
        formatText(copy.hybridTitle, hybridName),
        data.hybrids[other] || [],
      ),
    );
  });

  const bgTitle = el(
    "h2",
    { style: "margin-top:50px;" },
    t.resultBgTitle || "Further Reading",
  );
  reportWrap.appendChild(bgTitle);

  const btnNav = el("nav", { className: "result-actions-grid" });

  const row1 = el("div", { className: "result-actions-row" });
  const row2 = el("div", { className: "result-actions-row" });
  const row3 = el("div", {
    className: "result-actions-row result-actions-row-two",
  });
  const row4 = el("div", {
    className: "result-actions-row result-actions-row-single",
  });

  const retakeBtn = el("button", { className: "res_btn" });
  retakeBtn.classList.add("action-card");
  retakeBtn.textContent = t.retakeText || "Retake";
  retakeBtn.onclick = () => {
    window.location.href = "index.html";
  };

  const LINK_DEFS = [
    {
      href: "https://www.penana.com/story/16766/",
      i18nKey: "aboutEnrollPenana",
      text: "Penana",
      row: row1,
    },
    {
      href: "https://www.kadokado.com.tw/book/1425",
      i18nKey: "aboutEnrollKado",
      text: "KadoKado",
      row: row1,
    },
    {
      href: "https://cxc.today/zh/store/ApatiteBlue/work/20217",
      i18nKey: "aboutEnrollCxc",
      text: "CXC",
      row: row1,
    },
    {
      href: "https://www.facebook.com/TealizeWrite/",
      i18nKey: "aboutEnrollFb",
      text: "Facebook",
      row: row2,
    },
    {
      href: "https://www.instagram.com/tealize_write/",
      i18nKey: "aboutEnrollIg",
      text: "Instagram",
      row: row2,
    },
    {
      href: "https://www.plurk.com/Tealize",
      i18nKey: "aboutEnrollPlurk",
      text: "Plurk",
      row: row2,
    },
    {
      href: "about.html",
      i18nKey: "aboutLinkText",
      text: "測驗與學院設計",
      row: row3,
    },
    {
      href: "https://tealize-write.github.io/",
      i18nKey: "creatorBase",
      text: "學校創辦人的基地",
      row: row3,
    },
  ];

  LINK_DEFS.forEach(({ href, text, i18nKey, row }) => {
    const link = el("a", {
      href,
      className: "res_btn action-card",
      target: "_blank",
    });
    link.textContent = i18nKey ? t[i18nKey] || text : text;
    bindTrackedLink(link, link.textContent || text, key);
    row.appendChild(link);
  });

  row4.appendChild(retakeBtn);

  btnNav.appendChild(row1);
  btnNav.appendChild(row2);
  btnNav.appendChild(row3);
  btnNav.appendChild(row4);

  reportWrap.appendChild(btnNav);

  const globalStatsWrap = el("div", { className: "score-chart-container" });
  const globalStatsTitle = el(
    "h3",
    {},
    t.academyGlobalStatsTitle || "Community Academy Statistics",
  );
  const globalStatsTotal = el("p", {
    id: "academyGlobalStatsTotal",
    className: "academy-global-total",
  });
  const globalShelf = el("div", {
    id: "academyGlobalBookShelf",
    className: "academy-bookshelf-container",
  });
  globalStatsWrap.appendChild(globalStatsTitle);
  globalStatsWrap.appendChild(globalStatsTotal);
  globalStatsWrap.appendChild(globalShelf);
  reportWrap.appendChild(globalStatsWrap);

  content.appendChild(reportWrap);
  frag.appendChild(content);
  wrap.appendChild(frag);

  updateWinnerName(key);
  if (globalCountsCache) {
    renderGlobalAcademyStats(globalCountsCache, key, globalTotalCache);
  }

  if (options.instant) {
    const revealState = options.revealState || "act3";
    content.dataset.revealState = revealState;
    if (revealState !== "act1") {
      renderAcademyBookshelf(readLatestScores(), key);
    }
    if (revealState === "act3") {
      skipRevealBtn.classList.add("is-hidden");
    }
    return;
  }

  startRevealSequence(key, content, skipRevealBtn);
}

function updateWinnerName(key) {
  const winnerNameEl = document.getElementById("result-winner-name");
  if (!winnerNameEl) return;
  const names = getUiTranslation().academyNames;
  winnerNameEl.textContent = names?.[key] || key;
}

function startRevealSequence(key, content, skipBtn) {
  // Reveal order: act1 winner -> act2 score bars -> act3 full report.
  clearRevealTimers();

  const showAct = (act) => {
    content.dataset.revealState = act;
  };

  const revealAll = () => {
    clearRevealTimers();
    showAct("act3");
    renderAcademyBookshelf(readLatestScores(), key);
    skipBtn?.classList.add("is-hidden");
  };

  skipBtn?.addEventListener("click", revealAll, { once: true });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealAll();
    return;
  }

  showAct("act1");
  revealTimers.push(
    setTimeout(() => {
      showAct("act2");
      renderAcademyBookshelf(readLatestScores(), key);
    }, REVEAL_ACT2_DELAY_MS),
  );
  revealTimers.push(
    setTimeout(() => {
      showAct("act3");
      skipBtn?.classList.add("is-hidden");
    }, REVEAL_ACT3_DELAY_MS),
  );
}

function clearRevealTimers() {
  revealTimers.forEach((id) => clearTimeout(id));
  revealTimers = [];
}

function makeBlock(title, paragraphs) {
  const div = el("div", { className: "res_ack" });
  div.appendChild(el("span", { className: "res_ack-title" }, title));
  paragraphs.forEach((text) => {
    div.appendChild(el("p", { className: "res_ack-desc" }, text));
  });
  return div;
}

function readLatestScores() {
  try {
    const raw = sessionStorage.getItem("latestAcademyScores");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      !Array.isArray(parsed.scores) ||
      parsed.scores.length !== 5
    ) {
      return null;
    }
    return parsed.scores.map((n) => Number(n) || 0);
  } catch {
    return null;
  }
}

function postActionLog(action, keyword, timeSpent = 0) {
  if (!GAS_URL || GAS_URL.startsWith("__")) return;
  const location = getLocationPayload();
  const payload = {
    timestamp: new Date().toISOString(),
    clientId: getClientId(),
    keyword: keyword || "",
    action,
    source: getTrafficSource(),
    referrer: document.referrer || "",
    device: getDeviceType(),
    country: location.country,
    city: location.city,
    timeSpent: Number(timeSpent) || 0,
  };
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "text/plain;charset=UTF-8" });
    navigator.sendBeacon(GAS_URL, blob);
    return;
  }
  fetch(GAS_URL, {
    method: "POST",
    keepalive: true,
    headers: { "Content-Type": "text/plain" },
    body,
  }).catch(() => {});
}

function bindTrackedLink(link, actionText, keyword) {
  link.addEventListener("click", (e) => {
    postActionLog(actionText, keyword, 0);

    const href = link.getAttribute("href");
    const target = link.getAttribute("target");

    e.preventDefault();
    if (target === "_blank") {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      setTimeout(() => {
        window.location.href = href;
      }, 120);
    }
  });
}

async function loadGlobalAcademyStats(activeKey) {
  const shelf = document.getElementById("academyGlobalBookShelf");
  if (!shelf) return;

  const copy = getResultCopy();

  if (!GAS_URL || GAS_URL.startsWith("__")) {
    shelf.innerHTML = "";
    shelf.appendChild(
      el(
        "p",
        { className: "academy-bookshelf-empty" },
        copy.globalStatsMissingSource,
      ),
    );
    return;
  }

  try {
    const res = await fetch(GAS_URL);
    const json = await res.json();
    globalCountsCache = json.counts || {};
    globalTotalCache = Number(json.total) || 0;
    renderGlobalAcademyStats(globalCountsCache, activeKey, globalTotalCache);
  } catch {
    shelf.innerHTML = "";
    shelf.appendChild(
      el(
        "p",
        { className: "academy-bookshelf-empty" },
        copy.globalStatsLoadFailed,
      ),
    );
  }
}

function renderBarShelf(shelf, values, activeKey) {
  shelf.innerHTML = "";
  const names = getUiTranslation().academyNames || {};
  const academyColors = getAcademyColors();
  const percentages = toDisplayPercentages(values);

  ACADEMY_ORDER.forEach((key, idx) => {
    const academyName = names[key] || key;
    const scorePercent = percentages[idx];
    const bookHeight =
      MIN_BOOK_HEIGHT_PERCENT +
      (scorePercent / 100) *
        (MAX_BOOK_HEIGHT_PERCENT - MIN_BOOK_HEIGHT_PERCENT);
    const row = el("div", {
      className: `academy-book-item${key === activeKey ? " is-top" : ""}`,
    });
    const bar = el("div", { className: "academy-book-bar" });
    const isLatinName = /[A-Za-z]/.test(academyName);
    const fill = el("span", {
      className: "academy-book-fill academy-score-book",
    });
    fill.style.height = "0%";
    fill.style.setProperty("--book-color", academyColors[key]);
    fill.style.setProperty("--book-height", `${Math.round(bookHeight)}%`);
    fill.appendChild(
      el(
        "span",
        {
          className: `academy-book-label academy-book-name${isLatinName ? " is-latin" : ""}`,
        },
        academyName,
      ),
    );
    const edge = el("span", { className: "academy-book-edge" });
    edge.setAttribute("aria-hidden", "true");
    fill.appendChild(edge);
    fill.appendChild(
      el("span", { className: "academy-book-score" }, `${scorePercent}%`),
    );
    bar.appendChild(fill);
    row.appendChild(bar);
    shelf.appendChild(row);
    setTimeout(
      () => {
        fill.style.height = fill.style.getPropertyValue("--book-height");
      },
      idx * 80 + 16,
    );
  });
}

function toDisplayPercentages(values) {
  const total = values.reduce((sum, n) => sum + (Number(n) || 0), 0);
  if (!total) return values.map(() => 0);
  return values.map((n) => Math.round(((Number(n) || 0) / total) * 100));
}

function getAcademyColors() {
  if (window.ACADEMY_THEME?.getAcademyColors) {
    return window.ACADEMY_THEME.getAcademyColors();
  }
  return {
    red: "#d85f5f",
    green: "#91b66f",
    blue: "#4f78a8",
    black: "#1f1f1f",
    white: "#c9c3b7",
  };
}

function renderGlobalAcademyStats(counts, activeKey, total) {
  const shelf = document.getElementById("academyGlobalBookShelf");
  const totalEl = document.getElementById("academyGlobalStatsTotal");
  if (!shelf || !totalEl) return;

  const t = getUiTranslation();
  const copy = getResultCopy();

  if (!counts) {
    totalEl.textContent = "";
    shelf.innerHTML = "";
    shelf.appendChild(
      el("p", { className: "academy-bookshelf-empty" }, copy.globalStatsNoData),
    );
    return;
  }

  const values = ACADEMY_ORDER.map((k) => Number(counts[k]) || 0);
  totalEl.textContent =
    (t.totalParticipants || "") + (total || values.reduce((a, b) => a + b, 0));
  renderBarShelf(shelf, values, activeKey);
}

function renderAcademyBookshelf(scoreList, activeKey) {
  const shelf = document.getElementById("academyBookShelf");
  if (!shelf) return;

  if (!scoreList) {
    shelf.innerHTML = "";
    shelf.appendChild(
      el(
        "p",
        { className: "academy-bookshelf-empty" },
        getResultCopy().localScoresMissing,
      ),
    );
    return;
  }

  renderBarShelf(shelf, scoreList, activeKey);
}

// ── 建立 DOM 元素的小工具 ───────────────────────────────────────────────────
function el(tag, props, text) {
  const node = document.createElement(tag);
  if (props) Object.assign(node, props);
  if (text !== undefined) node.textContent = text;
  return node;
}
