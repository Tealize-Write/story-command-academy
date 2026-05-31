// js/translation.js — 語言切換邏輯

window.currentLang = localStorage.getItem("lang") || "zh-TW";

let _langBtns;

function resolvePageTitle(lang, t) {
  const params = new URLSearchParams(window.location.search);
  const queryPage = params.get("page");
  const bodyPage = document.body.getAttribute("data-page");
  const pathname = window.location.pathname.toLowerCase();

  if (queryPage === "result") {
    const academy = params.get("academy");
    const name = t.academyNames?.[academy];
    if (name) {
      return lang === "en"
        ? `Word Fate Academy - Result: ${name}`
        : `【字命學院】測試結果──${name}`;
    }
  }

  if (pathname.endsWith("/stats.html") || pathname.endsWith("stats.html")) {
    return t.statsPageTitle || t.pageTitle || document.title;
  }

  // Standalone pages (e.g. about.html) keep their own title unless they use query/body page routing.
  if (!queryPage && !bodyPage) {
    return document.title;
  }

  return t.pageTitle || document.title;
}

function applyLang(lang) {
  window.currentLang = lang;
  localStorage.setItem("lang", lang);
  document.documentElement.lang = lang;

  const t = window.UI_TRANSLATIONS[lang];
  if (!t) return;

  document.title = resolvePageTitle(lang, t);

  document.querySelectorAll("[data-i18n-key]").forEach((el) => {
    const key = el.getAttribute("data-i18n-key");
    if (t[key] !== undefined) el.textContent = t[key];
  });

  _langBtns?.forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.lang === lang),
  );

  document.dispatchEvent(new CustomEvent("langChanged", { detail: { lang } }));
}

document.addEventListener("DOMContentLoaded", () => {
  _langBtns = document.querySelectorAll(".lang-btn");
  _langBtns.forEach((btn) =>
    btn.addEventListener("click", () => applyLang(btn.dataset.lang)),
  );
  applyLang(window.currentLang);
});
