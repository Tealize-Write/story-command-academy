// js/i18n.js — UI 字串 + 全部 30 題（舊版算法，保留原始配分）

window.UI_TRANSLATIONS = {
  "zh-TW": {
    pageTitle: "字命學院【創作特質測驗】",
    navHome: "首頁",
    navQuiz: "測驗",
    navAbout: "關於",
    navStats: "統計",
    indexMetaDescription: "字命學院：測驗你是哪種作者？找出你的創作特質分類！",
    indexHeroAlt: "特質測驗圖片",
    indexGreeting: "親愛的新生你好，我是你的學校──瑪臨。",
    indexIntro: "為了更了解你的創作風格，系統已為你準備了一份特質測驗。",
    indexProcedureTitle: "測驗程序：",
    indexStage1:
      "▸ 第一階段（程度題）：20 道題目，測試你對創作元素的共鳴強度。",
    indexStage2: "▸ 第二階段（選擇題）：10 道情境選擇，模擬創作中的具體抉擇。",
    indexAfterAnalysis: "分析完成後，系統將呈現你最適合的學院及各項分數光譜。",
    indexGoodLuck: "文運昌隆",
    startQuizBtn: "開始測驗",
    part1Label: "壹、程度題",
    part1Desc: "請選擇符合程度（3：完全符合 → 0：沒有）",
    part2Label: "貳、選擇題",
    part2Transition: "快寫完囉！",
    progressText: "第 {cur} 題 / 共 {total} 題",
    quizStructureHint: "本測驗共 30 題：程度題 20 題＋選擇題 10 題。",
    chapterProgress:
      "第 {chapter} 章 / 共 {chapterTotal} 章 ・ 本章第 {chapterCur} 題 / {chapterSize} 題",
    progressMilestones: [
      "字命場正在校準你的創作頻率。",
      "文脈波形已浮現，正在比對學院索引。",
      "角色、敘事、世界觀通道同步中。",
      "核心傾向逐漸成形，請完成最後校對。",
      "判讀即將完成，準備接收字命報告。",
    ],
    quizDurationHint: "約 4-6 分鐘，完成後可取得你的字命判定報告。",
    calibrationTitle: "字命場校準中",
    calibrationDesc: "正在讀取你的敘述頻率與創作脈絡，請稍候。",
    calibrationSkip: "略過校準",
    chapterTransitions: [
      "第一章啟動：開始讀取你的基礎文脈。",
      "第二章切換：敘事偏好已進入比對區。",
      "第三章切換：角色與世界觀通道正在重疊。",
      "第四章切換：核心傾向逐漸浮現。",
      "第五章切換：最終校讀即將完成。",
    ],
    continueReading: "繼續讀取",
    answerFeedbacks: [
      "敘述偏移已記錄。",
      "文脈反應已同步。",
      "字讀痕跡已封存。",
      "敘事回聲已收束。",
    ],
    revealSkip: "略過揭曉",
    opt3: "3（完全符合）",
    opt2: "2（大致符合）",
    opt1: "1（有點符合）",
    opt0: "0（沒有）",
    resultTitle: "創作特質測驗結果",
    resultTopLabel: "系統判定，你的創作特質歸屬：",
    resultBgTitle: "延伸閱讀與連結",
    scoreChartTitle: "五大學院得分",
    resultNoteTitle: "各學院核心屬性",
    resultNoteItems: [
      "🔴 紅馳學院 ── IP、市場",
      "🟢 綠躍學院 ── 創意、有趣、獵奇",
      "🔵 藍行學院 ── 合理性、邏輯、考究",
      "⚫ 墨佇學院 ── 文學、文筆、技巧",
      "⚪ 銀倚學院 ── 角色、情感、心理",
    ],
    resultTieNote: "若出現同分，請優先選擇最有共鳴的學院。",
    academyGlobalStatsTitle: "全體學院統計",
    academyNavTitle: "前往學院解析",
    aboutLinkText: "測驗與學院的設計",
    homeLinkText: "回首頁",
    retakeText: "重新測驗",
    statsLinkText: "查看全部人統計",
    academyNames: {
      red: "紅馳",
      green: "綠躍",
      blue: "藍行",
      black: "墨佇",
      white: "銀倚",
    },
    sectionBtnPart1: "開始測驗",
    sectionBtnPart2: "開始選擇題",
    midwayContinueBtn: "繼續",
    creatorBase: "學校創辦人的基地",
    statsPageTitle: "全員學院分布統計",
    aboutPageTitle: "字命學院【創作特質測驗】測驗與學院的設計",
    donutChartTitle: "學院人數比例",
    barChartTitle: "各學院人數",
    totalParticipants: "總參與人數：",
    statsLoadingText: "載入資料中...",
    statsGoQuiz: "去測驗",
    statsGasMissing: "⚠️ GAS 尚未部署。請先在設定檔填入 GAS Web App URL。",
    statsLoadFailed: "資料載入失敗，請確認 GAS 已正確部署並允許外部存取。",
    statsPeopleSuffix: "人",
    aboutCoverAlt: "喵嗚軟糖隊",
    aboutOriginTitle: "測驗由來",
    aboutOriginP1: "謝謝點進來的旅人，我是兌現藍。是個綠躍人。",
    aboutOriginP2:
      "這個測驗從個人的小說《字命覺醒》而來，此作品以「寫作產生魔法」為核心。",
    aboutOriginP3:
      "將個人在網路打滾十多年來看過的各種作者、創作梗、迷因、信仰、傳說作為題材，企圖寫一個關於「認知」對於人類影響的故事，目前寫完第一集在修稿中。",
    aboutDesignTitle: "測驗設計",
    aboutDesignP1:
      "測驗也同樣來自個人對各種作者的觀察，分類成五種大分類的偏好。",
    aboutDesignP2:
      "每題的加減分權重不同，特別是排名喜歡作品的權重最大，最小的是筆跡題。筆跡題目參考自筆跡心理學，推薦書籍：《日本刑警教你從筆跡看穿真實個性》。",
    aboutDesignP3:
      "筆跡學很有趣，但需要觀察受測者大量筆跡變化才會更準。若以大眾測驗來說，對部分特例可能不夠準，因此僅以低權重加入，偏向趣味性。",
    aboutDesignP4:
      "測驗結果是偏好而不是能力。這份測驗反映的是創作者對哪些特質特別注重，可能是擅長或正在加強。",
    aboutDesignP5:
      "這分類比較像光譜，整體會趨向某種狀況，但每個人的呈現都不同。",
    aboutDesignP6:
      "個人觀察到，一些很穩定的創作者數值通常更平均，也有特別注重某些特質的人，風格就更鮮明。",
    aboutDesignP7: "總之條條大路通羅馬，無論哪種類型都很棒。",
    aboutAcademyTitle: "五個學院",
    aboutAcademyP1:
      "測驗中的五個學院，正是故事中《瑪臨高中》的學院。雖然稱作高中，實際更像大學與課後補習班集合體。",
    aboutAcademyP2:
      "學院命名結合五個顏色與五種行動方式，顏色與行動都來自個人直覺。",
    aboutAcademyP3:
      "例如綠躍講究創意、思考跳躍；藍行講究邏輯考究、步調穩定；紅馳重視市場與 IP、節奏明快；墨佇重視文字與文學，如墨色鶴般佇立；銀倚則重視角色與情感，如兩人相倚。",
    aboutAcademyP4: "希望你也會對這樣的世界觀感到興趣，歡迎來看看這個故事。",
    aboutEnrollTitle: "前往《字命覺醒》入學",
    aboutEnrollPenana: "從 Penana 入學",
    aboutEnrollKado: "從 KadoKado 入學",
    aboutEnrollCxc: "從 CXC 入學",
    aboutEnrollFb: "從 FB 找學校創辦人",
    aboutEnrollIg: "從 IG 找學校創辦人",
    aboutEnrollPlurk: "從 Plurk 找學校創辦人",
    part1Badge: "PART I",
    part2Badge: "PART II",
  },
  en: {
    pageTitle: "Word Fate Academy — Creative Trait Test",
    navHome: "Home",
    navQuiz: "Quiz",
    navAbout: "About",
    navStats: "Stats",
    indexMetaDescription:
      "Word Fate Academy: discover your creator type and creative trait profile.",
    indexHeroAlt: "Creative trait quiz visual",
    indexGreeting: "Dear newcomer, this is your school speaking: Marlin.",
    indexIntro:
      "To understand your creative style better, we prepared a trait quiz for you.",
    indexProcedureTitle: "Quiz format:",
    indexStage1:
      "▸ Stage 1 (Degree Questions): 20 prompts to measure your resonance with core creative elements.",
    indexStage2:
      "▸ Stage 2 (Choice Questions): 10 scenarios simulating concrete creative decisions.",
    indexAfterAnalysis:
      "After analysis, the system reveals your best-fit academy and full score spectrum.",
    indexGoodLuck: "// GOOD LUCK //",
    startQuizBtn: "Start Quiz",
    part1Label: "Part I — Degree Questions",
    part1Desc:
      "Rate how well each statement describes you (3 = Perfectly, 0 = Not at all)",
    part2Label: "Part II — Choice Questions",
    part2Transition: "you're almost there!",
    progressText: "Question {cur} / {total}",
    quizStructureHint:
      "30 questions total: 20 degree questions + 10 part-II choices.",
    chapterProgress:
      "Chapter {chapter}/{chapterTotal} - {chapterCur}/{chapterSize} in this chapter",
    progressMilestones: [
      "Wordfield calibration in progress.",
      "Narrative traces detected and indexed.",
      "Character, structure, and tone channels are syncing.",
      "Core tendency is forming. Final alignment underway.",
      "Reading is almost complete. Report is being sealed.",
    ],
    quizDurationHint:
      "About 4-6 minutes. Finish to unlock your personal Word Fate report.",
    calibrationTitle: "Wordfield Calibration",
    calibrationDesc:
      "Reading your narrative frequency and creative pulse. Please hold.",
    calibrationSkip: "Skip calibration",
    chapterTransitions: [
      "Chapter One: baseline narrative traces are being read.",
      "Chapter Two: preference patterns are entering comparison.",
      "Chapter Three: character and world channels are converging.",
      "Chapter Four: core tendency is emerging.",
      "Chapter Five: final calibration is in progress.",
    ],
    continueReading: "Continue reading",
    answerFeedbacks: [
      "Narrative drift recorded.",
      "Context pulse synced.",
      "Reading trace archived.",
      "Story echo stabilized.",
    ],
    revealSkip: "Skip reveal",
    opt3: "3 (Perfectly)",
    opt2: "2 (Mostly)",
    opt1: "1 (Slightly)",
    opt0: "0 (Not at all)",
    resultTitle: "Creative Trait Test Result",
    resultTopLabel: "Your creative trait belongs to:",
    resultBgTitle: "Further Reading & Links",
    scoreChartTitle: "Five Academy Scores",
    resultNoteTitle: "Core Traits per Academy",
    resultNoteItems: [
      "🔴 Flaremarch — IP, Market",
      "🟢 Verdance — Creativity, Novelty, Quirk",
      "🔵 Cerulink — Logic, Rigor, Research",
      "⚫ Inkarbor — Literature, Prose, Craft",
      "⚪ Silvalean — Characters, Emotion, Psychology",
    ],
    resultTieNote:
      "In case of a tie, choose the academy that resonates most with you.",
    academyGlobalStatsTitle: "Community Academy Statistics",
    academyNavTitle: "Go to Academy Details",
    aboutLinkText: "Quiz & Academy Design",
    homeLinkText: "Back to Home",
    retakeText: "Retake Quiz",
    statsLinkText: "View Community Stats",
    academyNames: {
      red: "Flaremarch",
      green: "Verdance",
      blue: "Cerulink",
      black: "Inkarbor",
      white: "Silvalean",
    },
    sectionBtnPart1: "Begin Quiz",
    sectionBtnPart2: "Start Part II",
    midwayContinueBtn: "Continue",
    creatorBase: "Creator's Homepage",
    statsPageTitle: "Community Academy Distribution",
    aboutPageTitle: "Word Fate Academy — Quiz & Academy Design",
    donutChartTitle: "Academy Distribution",
    barChartTitle: "Count by Academy",
    totalParticipants: "Total participants: ",
    statsLoadingText: "Loading data...",
    statsGoQuiz: "Go to Quiz",
    statsGasMissing:
      "⚠️ GAS is not deployed yet. Please set the GAS Web App URL in your config.",
    statsLoadFailed:
      "Failed to load stats. Please verify GAS deployment and public access.",
    statsPeopleSuffix: "people",
    aboutCoverAlt: "Meow Gummy Team",
    aboutOriginTitle: "Why This Quiz Exists",
    aboutOriginP1:
      "Thanks for dropping by. I'm Tealize Write, and my own trait leans Verdance.",
    aboutOriginP2:
      "This quiz comes from my novel Word Fate Awakening, a story built on the idea that writing can produce magic.",
    aboutOriginP3:
      "It draws from years of online creator culture, memes, beliefs, and legends to tell a story about how cognition shapes people.",
    aboutDesignTitle: "How The Quiz Was Designed",
    aboutDesignP1:
      "The structure comes from long-term observation of creators, grouped into five major preference clusters.",
    aboutDesignP2:
      "Questions use different weights. Preference ranking carries the heaviest weight, while handwriting-related signals are lightweight references.",
    aboutDesignP3:
      "Handwriting psychology is interesting, but accurate interpretation needs broader samples, so this part is intentionally low-weight and playful.",
    aboutDesignP4:
      "The result measures preference, not ability. It shows which traits you emphasize most in your creative process.",
    aboutDesignP5:
      "Think of this as a spectrum: people may share a tendency, but the way it manifests is always personal.",
    aboutDesignP6:
      "Some stable creators show balanced profiles, while others focus hard on a few traits and develop strong signatures.",
    aboutDesignP7:
      "Different paths can all lead to great work. Every type has value.",
    aboutAcademyTitle: "The Five Academies",
    aboutAcademyP1:
      "The five academies in the quiz are the same houses from Marlin High in the story world.",
    aboutAcademyP2:
      "Each house name combines one color and one motion style, based on intuitive worldbuilding choices.",
    aboutAcademyP3:
      "Verdance jumps for novelty, Cerulink advances with logic, Flaremarch accelerates toward market/IP, Inkarbor stands for craft and literary depth, and Silvalean leans into character and emotion.",
    aboutAcademyP4: "If this world resonates with you, welcome aboard.",
    aboutEnrollTitle: "Enroll in Word Fate Awakening",
    aboutEnrollPenana: "Enroll via Penana",
    aboutEnrollKado: "Enroll via KadoKado",
    aboutEnrollCxc: "Enroll via CXC",
    aboutEnrollFb: "Find the creator on Facebook",
    aboutEnrollIg: "Find the creator on Instagram",
    aboutEnrollPlurk: "Find the creator on Plurk",
    part1Badge: "PART I",
    part2Badge: "PART II",
  },
};

// 全部 30 題資料。scores: [red, green, blue, black, white]（保留舊版原始配分）
window.QUIZ_QUESTIONS = {
  "zh-TW": [
    // ── 壹、程度題 (1–20) ──────────────────────────────────────────────────
    {
      text: "認為故事最有趣的部分來自創意，因此喜歡以奇特有趣的設定為主。若故事沒有新意就覺得乏善可陳。",
      type: "degree",
      options: [
        { label: "3（完全符合）", scores: [2, 3, 0, 0, 0] },
        { label: "2（大致符合）", scores: [1, 2, 0, 0, 0] },
        { label: "1（有點符合）", scores: [1, 1, 0, 0, 0] },
        { label: "0（沒有）", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "會花費大量的時間和精力來塑造每個角色的背景和性格，讓人物推動劇情。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 0, 3] },
        { label: "2", scores: [0, 0, 0, 0, 2] },
        { label: "1", scores: [0, 0, 0, 0, 1] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "故事並非現實，沒必要糾結不重要的細節邏輯。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, -3, 0, 0] },
        { label: "2", scores: [0, 0, -2, 0, 0] },
        { label: "1", scores: [0, 0, -1, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "即使奇幻創作也該有一定的邏輯系統在運作，創意不該只是天馬行空，而是將幻想合理化，說服得了讀者，讀者才有辦法融入幻想的世界。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 2, 3, 0, 0] },
        { label: "2", scores: [0, 1, 2, 0, 0] },
        { label: "1", scores: [0, 1, 1, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "我很清楚自己的（或最喜歡的）作品在市場上的優勢和劣勢。",
      type: "degree",
      options: [
        { label: "3", scores: [3, 0, 0, 0, 0] },
        { label: "2", scores: [2, 0, 0, 0, 0] },
        { label: "1", scores: [1, 0, 0, 0, 0] },
        { label: "0", scores: [-2, 0, 0, 0, 0] },
      ],
    },
    {
      text: "就算作品寫得好也要配合行銷宣傳，認為只要好看就能吸引很多人上門是天真的想法。",
      type: "degree",
      options: [
        { label: "3", scores: [3, 0, 0, 0, 0] },
        { label: "2", scores: [2, 0, 0, 0, 0] },
        { label: "1", scores: [1, 0, 0, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "自己的（或最喜歡的）作品多數是非現實背景，而且堅持創作出與眾不同、獨一無二的世界觀，無法接受使用他人已創作過的設定。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 3, 0, 0, 0] },
        { label: "2", scores: [0, 2, 0, 0, 0] },
        { label: "1", scores: [0, 1, 0, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "通常喜歡把更多的時間和精力花在設定上，往往會設定寫得比正文還要多。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 3, 2, 0] },
        { label: "2", scores: [0, 0, 2, 1, 0] },
        { label: "1", scores: [0, 0, 1, 1, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "覺得只要故事夠好，文筆看得懂即可，不需要太雕琢文字。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, -3, 0] },
        { label: "2", scores: [0, 0, 0, -2, 0] },
        { label: "1", scores: [0, 0, 0, -1, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "創作時會謹慎思考避免作品出現矛盾，並蒐集自己專用的工具書方便查閱。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 3, 0, 0] },
        { label: "2", scores: [0, 0, 2, 0, 0] },
        { label: "1", scores: [0, 0, 1, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "沒有特定喜歡的類別，只要角色夠有魅力都喜歡，特別喜歡人物互動及心理描寫。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 0, 3] },
        { label: "2", scores: [0, 0, 0, 0, 2] },
        { label: "1", scores: [0, 0, 0, 0, 1] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "能閱讀較硬的文字，閱讀的讀物中包含詩詞古文歷史傳記、或是經典文學名著。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 3, 0] },
        { label: "2", scores: [0, 0, 0, 2, 0] },
        { label: "1", scores: [0, 0, 0, 1, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "有些輕視花很多時間經營自己、四處交際的作家。",
      type: "degree",
      options: [
        { label: "3", scores: [-3, 0, 0, 0, 0] },
        { label: "2", scores: [-2, 0, 0, 0, 0] },
        { label: "1", scores: [-1, 0, 0, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "人物僅為劇情服務，過多的心理細節描寫反而會造成劇情節奏拖沓。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 0, -3] },
        { label: "2", scores: [0, 0, 0, 0, -2] },
        { label: "1", scores: [0, 0, 0, 0, -1] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "喜歡突破禁忌或挑戰傳統的題材，可能也喜歡獵奇或恐怖靈異的傳說。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 3, 0, 0, 0] },
        { label: "2", scores: [0, 2, 0, 0, 0] },
        { label: "1", scores: [0, 1, 0, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "講究作品深度，會在作品中探討各種議題。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 3, 0] },
        { label: "2", scores: [0, 0, 0, 2, 0] },
        { label: "1", scores: [0, 0, 0, 1, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "對於架空的故事較難產生共鳴，認為寫實的作品比較親切。",
      type: "degree",
      options: [
        { label: "3", scores: [0, -3, 0, 0, 0] },
        { label: "2", scores: [0, -2, 0, 0, 0] },
        { label: "1", scores: [0, -1, 0, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "經常會考慮要使用什麼樣的手法來營造情境，並運用各種文學技巧來豐富作品的表達。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 3, 0] },
        { label: "2", scores: [0, 0, 0, 2, 0] },
        { label: "1", scores: [0, 0, 0, 1, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "喜歡到處觀察人群，推測人的心理活動及生活背景，甚至將覺得有意思的互動或對話紀錄下來。",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 2, 0, 3] },
        { label: "2", scores: [0, 0, 1, 0, 2] },
        { label: "1", scores: [0, 0, 1, 0, 1] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "注意到角色小說的市場，會留意角色應該增加的萌點或是粉紅泡泡的互動，以此提高作品的吸引度。",
      type: "degree",
      options: [
        { label: "3", scores: [3, 0, 0, 0, 2] },
        { label: "2", scores: [2, 0, 0, 0, 1] },
        { label: "1", scores: [1, 0, 0, 0, 1] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    // ── 貳、選擇題 (21–30) ────────────────────────────────────────────────
    {
      text: "情境假設，主角在一間空屋的書桌上發現了10年前自己和青梅竹馬的合照，你喜歡哪個接下來的劇情？",
      type: "choice",
      options: [
        {
          label:
            "(A) 這一幕是主角內心的精神思辨，空屋象徵童年心理，照片的青梅竹馬應是潛意識關鍵。",
          scores: [0, 0, 0, 3, 0],
        },
        {
          label:
            "(B) 主角誤闖鬼屋發現合照，照片中的青梅竹馬臉部發黑，詭異氣氛逐漸升高。",
          scores: [3, 0, 0, 0, 0],
        },
        {
          label:
            "(C) 合照觸發了主角與青梅竹馬的溫馨回憶，兩人曾毫無保留地分享彼此的心情。",
          scores: [0, 0, 0, 0, 3],
        },
        {
          label:
            "(D) 主角接著開始調查為何空屋裡會有合照，懷疑有人以此示警，展開推理。",
          scores: [0, 0, 3, 0, 0],
        },
        {
          label:
            "(E) 主角其實是一隻山羊，誤闖空屋，發現小羊照片，情不自禁地把照片紙吃了，結果拉肚子。",
          scores: [0, 3, 0, 0, 0],
        },
      ],
    },
    {
      text: "描述失戀感傷時，喜歡以下哪種作為象徵？",
      type: "choice",
      options: [
        { label: "(A) 雨天", scores: [2, 0, 0, 0, 0] },
        { label: "(B) 揉掉的電影票", scores: [0, 0, 0, 0, 2] },
        { label: "(C) 沒電的時鐘", scores: [0, 0, 2, 0, 0] },
        { label: "(D) 充滿鼻涕的魚骨", scores: [0, 2, 0, 0, 0] },
        { label: "(E) 爬滿寒霧的小窗", scores: [0, 0, 0, 2, 0] },
      ],
    },
    {
      text: "以下哪個敘述最符合你目前筆下最喜歡的作品（如果沒有，就選看過的書中最喜歡的作品）？",
      type: "choice",
      options: [
        { label: "(A) 是熱門題材。", scores: [5, 0, 0, 0, 0] },
        { label: "(B) 主打獨創設定。", scores: [0, 5, 0, 0, 0] },
        { label: "(C) 設定集的篇幅不亞於正文。", scores: [0, 0, 5, 0, 0] },
        {
          label: "(D) 文學性高，富有想傳達的中心思想。",
          scores: [0, 0, 0, 5, 0],
        },
        {
          label: "(E) 角色很有魅力，有魅力到就算只是出場刷牙洗臉也有人愛看。",
          scores: [0, 0, 0, 0, 5],
        },
      ],
    },
    {
      text: "以下哪個敘述最符合你目前筆下第二喜歡的作品（如果沒有，就選看過的書中第二喜歡的作品）？",
      type: "choice",
      options: [
        { label: "(A) 人物情感十分細膩。", scores: [0, 0, 0, 0, 3] },
        { label: "(B) 背景設定考究細緻。", scores: [0, 0, 3, 0, 0] },
        {
          label: "(C) 斟字酌句，描寫情境彷彿歷歷在目。",
          scores: [0, 0, 0, 3, 0],
        },
        { label: "(D) 題材通俗易懂，劇情高潮迭起。", scores: [3, 0, 0, 0, 0] },
        { label: "(E) 給人感覺耳目一新。", scores: [0, 3, 0, 0, 0] },
      ],
    },
    {
      text: "寫字大小：",
      type: "choice",
      options: [
        { label: "(A) 較大", scores: [1, 0, 0, 0, 0] },
        { label: "(B) 有大有小", scores: [0, 1, 0, 0, 0] },
        { label: "(C) 較小", scores: [0, 0, 0, 0, 1] },
        { label: "(D) 剛好，甚至間距差不多", scores: [0, 0, 0, 1, 0] },
      ],
    },
    {
      text: "手寫「東」字，選最明顯的特色：",
      type: "choice",
      options: [
        {
          label: "(A) 第一筆的「一」寫很長，比「果」凸出不少",
          scores: [1, 0, 0, 0, 0],
        },
        {
          label:
            "(B) 右撇子的你撇出去的左撇「/」較長；左撇子的你撇出去的右撇「\\」較長",
          scores: [0, 0, 1, 0, 0],
        },
        {
          label:
            "(C) 右撇子的你撇出去的右撇「\\」較長；左撇子的你撇出去的左撇「/」較長",
          scores: [0, 0, 0, 0, 1],
        },
        { label: "(D) 字型偏圓", scores: [0, 1, 0, 0, 0] },
        { label: "(E) 以上皆非", scores: [0, 0, 0, 1, 0] },
      ],
    },
    {
      text: "不靠格線，橫式書寫一行字：",
      type: "choice",
      options: [
        { label: "(A) 越寫越往上偏", scores: [0, 1, 0, 0, 0] },
        { label: "(B) 往右下偏", scores: [0, 0, 0, 1, 0] },
        { label: "(C) 不偏不倚（小幅度偏移可接受）", scores: [0, 0, 1, 0, 0] },
      ],
    },
    {
      text: "不靠隔線，直式書寫一行字：",
      type: "choice",
      options: [
        {
          label: "(A) 右撇子的你越寫越偏左；左撇子的你越寫越偏右",
          scores: [0, 0, 0, 0, 1],
        },
        {
          label: "(B) 右撇子的你越寫越偏右；左撇子的你越寫越偏左",
          scores: [0, 0, 1, 0, 0],
        },
        { label: "(C) 不偏不倚（小幅度偏移可接受）", scores: [1, 0, 0, 0, 0] },
      ],
    },
    {
      text: "字跡特色，選最明顯的特色：",
      type: "choice",
      options: [
        { label: "(A) 一筆一畫、方正", scores: [0, 0, 1, 0, 0] },
        { label: "(B) 筆畫連綿、圓滑", scores: [0, 0, 0, 0, 1] },
        { label: "(C) 筆壓重", scores: [1, 0, 0, 0, 0] },
        {
          label: "(D) 右撇子的你字型右傾；左撇子的你字型左傾",
          scores: [0, 1, 0, 0, 0],
        },
        {
          label: "(E) 右撇子的你字型左傾；左撇子的你字型右傾",
          scores: [0, 0, 0, 1, 0],
        },
      ],
    },
    {
      text: "最難以忍受故事有什麼問題，讓你難以看下去？",
      type: "choice",
      options: [
        { label: "(A) 老套沒有新意。", scores: [0, 3, 0, 0, 0] },
        {
          label: "(B) 視角亂換，就算能勉強看懂也毫無文筆可言。",
          scores: [0, 0, 0, 3, 0],
        },
        { label: "(C) 邏輯令人瘋狂吐槽，智商狂降。", scores: [0, 0, 0, 3, 0] },
        {
          label: "(D) 心理描寫牽強，人物關係進展太過迅速。",
          scores: [0, 0, 0, 0, 3],
        },
        {
          label: "(E) 前5000字沒有吸引到你，就不看了。",
          scores: [3, 0, 0, 0, 0],
        },
      ],
    },
  ],

  en: [
    // ── Part I — Degree Questions (1–20) ───────────────────────────────────
    {
      text: "You believe the most interesting part of a story is creativity, so you prefer stories with uniquely quirky settings. A story without originality feels dull and uninspiring.",
      type: "degree",
      options: [
        { label: "3 (Perfectly)", scores: [2, 3, 0, 0, 0] },
        { label: "2 (Mostly)", scores: [1, 2, 0, 0, 0] },
        { label: "1 (Slightly)", scores: [1, 1, 0, 0, 0] },
        { label: "0 (Not at all)", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "You spend large amounts of time and effort developing each character's background and personality, letting characters drive the plot.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 0, 3] },
        { label: "2", scores: [0, 0, 0, 0, 2] },
        { label: "1", scores: [0, 0, 0, 0, 1] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "Stories are not reality, so there's no need to nitpick minor logical details.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, -3, 0, 0] },
        { label: "2", scores: [0, 0, -2, 0, 0] },
        { label: "1", scores: [0, 0, -1, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "Even fantasy should have a logical system. Creativity shouldn't just be wild imagination—fantasy must be rationalized and convincing enough for readers to be fully immersed.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 2, 3, 0, 0] },
        { label: "2", scores: [0, 1, 2, 0, 0] },
        { label: "1", scores: [0, 1, 1, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "You clearly understand the market strengths and weaknesses of your (or your favorite) works.",
      type: "degree",
      options: [
        { label: "3", scores: [3, 0, 0, 0, 0] },
        { label: "2", scores: [2, 0, 0, 0, 0] },
        { label: "1", scores: [1, 0, 0, 0, 0] },
        { label: "0", scores: [-2, 0, 0, 0, 0] },
      ],
    },
    {
      text: "Even well-written works need marketing support. Thinking that quality alone will attract a large audience is naive.",
      type: "degree",
      options: [
        { label: "3", scores: [3, 0, 0, 0, 0] },
        { label: "2", scores: [2, 0, 0, 0, 0] },
        { label: "1", scores: [1, 0, 0, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "Most of your (or your favorite) works have non-realistic settings, and you insist on creating a unique, one-of-a-kind world. You cannot accept borrowing settings already created by others.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 3, 0, 0, 0] },
        { label: "2", scores: [0, 2, 0, 0, 0] },
        { label: "1", scores: [0, 1, 0, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "You usually prefer to invest more time and effort in world-building, often writing more setting documents than the actual story.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 3, 2, 0] },
        { label: "2", scores: [0, 0, 2, 1, 0] },
        { label: "1", scores: [0, 0, 1, 1, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "As long as the story is good, the writing just needs to be comprehensible—there's no need to over-polish the prose.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, -3, 0] },
        { label: "2", scores: [0, 0, 0, -2, 0] },
        { label: "1", scores: [0, 0, 0, -1, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "When writing, you carefully consider how to avoid contradictions, and you maintain your own reference materials for quick lookup.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 3, 0, 0] },
        { label: "2", scores: [0, 0, 2, 0, 0] },
        { label: "1", scores: [0, 0, 1, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "You don't have a specific preferred genre—as long as the characters are charming you enjoy it. You especially love character interactions and psychological depth.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 0, 3] },
        { label: "2", scores: [0, 0, 0, 0, 2] },
        { label: "1", scores: [0, 0, 0, 0, 1] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "You can read more demanding texts, and your reading includes classical poetry, ancient prose, historical biographies, or literary classics.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 3, 0] },
        { label: "2", scores: [0, 0, 0, 2, 0] },
        { label: "1", scores: [0, 0, 0, 1, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "You somewhat look down on writers who spend a lot of time building a personal brand and networking around.",
      type: "degree",
      options: [
        { label: "3", scores: [-3, 0, 0, 0, 0] },
        { label: "2", scores: [-2, 0, 0, 0, 0] },
        { label: "1", scores: [-1, 0, 0, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "Characters exist only to serve the plot; excessive psychological detail actually slows down pacing.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 0, -3] },
        { label: "2", scores: [0, 0, 0, 0, -2] },
        { label: "1", scores: [0, 0, 0, 0, -1] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "You enjoy taboo-breaking or tradition-challenging themes, and may also love bizarre, horror, or supernatural legends.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 3, 0, 0, 0] },
        { label: "2", scores: [0, 2, 0, 0, 0] },
        { label: "1", scores: [0, 1, 0, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "You value depth in your works and actively explore various social or philosophical themes through them.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 3, 0] },
        { label: "2", scores: [0, 0, 0, 2, 0] },
        { label: "1", scores: [0, 0, 0, 1, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "You find it harder to connect with fantastical stories and feel that realistic works are more relatable and heartfelt.",
      type: "degree",
      options: [
        { label: "3", scores: [0, -3, 0, 0, 0] },
        { label: "2", scores: [0, -2, 0, 0, 0] },
        { label: "1", scores: [0, -1, 0, 0, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "You often think about what techniques to use to create atmosphere, and employ various literary devices to enrich your work's expression.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 0, 3, 0] },
        { label: "2", scores: [0, 0, 0, 2, 0] },
        { label: "1", scores: [0, 0, 0, 1, 0] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: "You enjoy observing people, speculating about their psychology and backgrounds, and even jot down interesting interactions or overheard dialogues.",
      type: "degree",
      options: [
        { label: "3", scores: [0, 0, 2, 0, 3] },
        { label: "2", scores: [0, 0, 1, 0, 2] },
        { label: "1", scores: [0, 0, 1, 0, 1] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    {
      text: 'You pay attention to the character-driven fiction market and note which "moe" points or romantic moments would boost a character\'s appeal.',
      type: "degree",
      options: [
        { label: "3", scores: [3, 0, 0, 0, 2] },
        { label: "2", scores: [2, 0, 0, 0, 1] },
        { label: "1", scores: [1, 0, 0, 0, 1] },
        { label: "0", scores: [0, 0, 0, 0, 0] },
      ],
    },
    // ── Part II — Choice Questions (21–30) ─────────────────────────────────
    {
      text: "The protagonist finds a 10-year-old photo with their childhood sweetheart on a desk in an empty house. Which plot appeals to you most?",
      type: "choice",
      options: [
        {
          label:
            "(A) The scene is a spiritual introspection—the empty house symbolizes the protagonist's childhood psyche; the childhood friend in the photo is the key to their subconscious.",
          scores: [0, 0, 0, 3, 0],
        },
        {
          label:
            "(B) The protagonist accidentally stumbles into a haunted house; the face of the childhood friend in the photo turns black as the eerie atmosphere intensifies.",
          scores: [3, 0, 0, 0, 0],
        },
        {
          label:
            "(C) The photo triggers warm memories—the two once shared everything without reservation, bound by endless trust.",
          scores: [0, 0, 0, 0, 3],
        },
        {
          label:
            "(D) The protagonist begins investigating why the photo is there, suspecting it's a warning from someone connected to the childhood friend, and launches a deduction.",
          scores: [0, 0, 3, 0, 0],
        },
        {
          label:
            "(E) Actually the protagonist is a goat who wandered into an empty house, found a photo of lambs, ate it on impulse, and got diarrhea.",
          scores: [0, 3, 0, 0, 0],
        },
      ],
    },
    {
      text: "When depicting heartbreak, which symbol would you most prefer to use?",
      type: "choice",
      options: [
        { label: "(A) A rainy day", scores: [2, 0, 0, 0, 0] },
        { label: "(B) A crumpled movie ticket", scores: [0, 0, 0, 0, 2] },
        {
          label: "(C) A clock that has run out of power",
          scores: [0, 0, 2, 0, 0],
        },
        {
          label: "(D) A fish skeleton with snot on it",
          scores: [0, 2, 0, 0, 0],
        },
        {
          label: "(E) A small window clouded with cold mist",
          scores: [0, 0, 0, 2, 0],
        },
      ],
    },
    {
      text: "Which best describes your current favorite work you've written (or, if none, the book you've loved most)?",
      type: "choice",
      options: [
        {
          label: "(A) It follows a popular, trending genre.",
          scores: [5, 0, 0, 0, 0],
        },
        {
          label: "(B) It features a completely original setting.",
          scores: [0, 5, 0, 0, 0],
        },
        {
          label:
            "(C) The setting documents are as long as—or longer than—the actual story.",
          scores: [0, 0, 5, 0, 0],
        },
        {
          label:
            "(D) It has high literary quality and a strong central message to convey.",
          scores: [0, 0, 0, 5, 0],
        },
        {
          label:
            "(E) The characters are so charming that readers would happily watch them do anything—even brush their teeth.",
          scores: [0, 0, 0, 0, 5],
        },
      ],
    },
    {
      text: "Which best describes your second-favorite work you've written (or, if none, your second-favorite book)?",
      type: "choice",
      options: [
        {
          label: "(A) The characters' emotions are deeply nuanced.",
          scores: [0, 0, 0, 0, 3],
        },
        {
          label: "(B) The setting and background research are meticulous.",
          scores: [0, 0, 3, 0, 0],
        },
        {
          label:
            "(C) Every word is carefully chosen—the atmosphere feels vivid and real.",
          scores: [0, 0, 0, 3, 0],
        },
        {
          label:
            "(D) The theme is accessible and the plot is full of thrilling twists.",
          scores: [3, 0, 0, 0, 0],
        },
        {
          label: "(E) It feels fresh and unlike anything you've read before.",
          scores: [0, 3, 0, 0, 0],
        },
      ],
    },
    {
      text: "Handwriting size:",
      type: "choice",
      options: [
        { label: "(A) Larger than average", scores: [1, 0, 0, 0, 0] },
        { label: "(B) Varies a lot (big and small)", scores: [0, 1, 0, 0, 0] },
        { label: "(C) Smaller than average", scores: [0, 0, 0, 0, 1] },
        { label: "(D) Just right—even spacing too", scores: [0, 0, 0, 1, 0] },
      ],
    },
    {
      text: 'Write the character "東" (East) by hand. Pick the most noticeable trait:',
      type: "choice",
      options: [
        {
          label:
            '(A) The first stroke "一" is very long, extending well past "果".',
          scores: [1, 0, 0, 0, 0],
        },
        {
          label:
            '(B) Right-handers: the left-leaning diagonal "/" is longer. Left-handers: the right-leaning "\\" is longer.',
          scores: [0, 0, 1, 0, 0],
        },
        {
          label:
            '(C) Right-handers: the right-leaning diagonal "\\" is longer. Left-handers: the left-leaning "/" is longer.',
          scores: [0, 0, 0, 0, 1],
        },
        {
          label: "(D) The characters tend to be round.",
          scores: [0, 1, 0, 0, 0],
        },
        { label: "(E) None of the above.", scores: [0, 0, 0, 1, 0] },
      ],
    },
    {
      text: "Write a line of text horizontally without any guidelines. What happens?",
      type: "choice",
      options: [
        {
          label: "(A) It drifts upward as you write.",
          scores: [0, 1, 0, 0, 0],
        },
        { label: "(B) It drifts down-right.", scores: [0, 0, 0, 1, 0] },
        {
          label: "(C) It stays relatively straight (minor drift is fine).",
          scores: [0, 0, 1, 0, 0],
        },
      ],
    },
    {
      text: "Write a line of text vertically without any guidelines. What happens?",
      type: "choice",
      options: [
        {
          label: "(A) Right-handers drift left; left-handers drift right.",
          scores: [0, 0, 0, 0, 1],
        },
        {
          label: "(B) Right-handers drift right; left-handers drift left.",
          scores: [0, 0, 1, 0, 0],
        },
        {
          label: "(C) Stays relatively straight (minor drift is fine).",
          scores: [1, 0, 0, 0, 0],
        },
      ],
    },
    {
      text: "Handwriting style—pick the most noticeable trait:",
      type: "choice",
      options: [
        {
          label: "(A) Stroke-by-stroke, neat and square.",
          scores: [0, 0, 1, 0, 0],
        },
        {
          label: "(B) Strokes flow together, rounded and smooth.",
          scores: [0, 0, 0, 0, 1],
        },
        { label: "(C) Heavy pen pressure.", scores: [1, 0, 0, 0, 0] },
        {
          label: "(D) Right-handers lean right; left-handers lean left.",
          scores: [0, 1, 0, 0, 0],
        },
        {
          label: "(E) Right-handers lean left; left-handers lean right.",
          scores: [0, 0, 0, 1, 0],
        },
      ],
    },
    {
      text: "What kind of story flaw is most unbearable and makes you stop reading?",
      type: "choice",
      options: [
        {
          label: "(A) Stale, clichéd, utterly unoriginal.",
          scores: [0, 3, 0, 0, 0],
        },
        {
          label:
            "(B) Inconsistent POV; even when barely comprehensible there's no prose craft.",
          scores: [0, 0, 0, 3, 0],
        },
        {
          label: "(C) Logic so frustrating it makes your brain hurt.",
          scores: [0, 0, 0, 3, 0],
        },
        {
          label:
            "(D) Forced emotional writing; character relationships progress way too fast.",
          scores: [0, 0, 0, 0, 3],
        },
        {
          label: "(E) If the first 5,000 words don't hook you, you quit.",
          scores: [3, 0, 0, 0, 0],
        },
      ],
    },
  ],
};
