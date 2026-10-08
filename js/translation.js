// js/translation.js — 語言切換邏輯

try { window.currentLang = localStorage.getItem("lang") || "zh-TW"; }
catch { window.currentLang = "zh-TW"; }
if (!window.UI_TRANSLATIONS[window.currentLang]) window.currentLang = "zh-TW";

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

  if (pathname.endsWith("/about.html") || pathname.endsWith("about.html")) {
    return t.aboutPageTitle || document.title;
  }

  // Standalone pages (e.g. about.html) keep their own title unless they use query/body page routing.
  if (!queryPage && !bodyPage) {
    return document.title;
  }

  return t.pageTitle || document.title;
}

function applyLang(lang) {
  if (!window.UI_TRANSLATIONS[lang]) return;
  window.currentLang = lang;
  try { localStorage.setItem("lang", lang); } catch { /* Language switching still works without storage. */ }
  document.documentElement.lang = lang;

  const t = window.UI_TRANSLATIONS[lang];
  if (!t) return;

  document.title = resolvePageTitle(lang, t);

  document.querySelectorAll("[data-i18n-key]").forEach((el) => {
    const key = el.getAttribute("data-i18n-key");
    if (t[key] !== undefined) el.textContent = t[key];
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (t[key] !== undefined) el.innerHTML = t[key];
  });

  document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    const attr = el.getAttribute("data-i18n-attr");
    const key = el.getAttribute("data-i18n-key");
    if (!attr || !key) return;
    if (t[key] !== undefined) el.setAttribute(attr, t[key]);
  });

  _langBtns?.forEach((btn) => {
    const active = btn.dataset.lang === lang;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", String(active));
  });

  document.dispatchEvent(new CustomEvent("langChanged", { detail: { lang } }));
}

document.addEventListener("DOMContentLoaded", () => {
  _langBtns = document.querySelectorAll(".lang-btn");
  _langBtns.forEach((btn) =>
    btn.addEventListener("click", () => applyLang(btn.dataset.lang)),
  );
  applyLang(window.currentLang);
});
