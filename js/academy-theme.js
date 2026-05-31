// js/academy-theme.js — shared academy color tokens and helpers
(function academyThemeBootstrap() {
  const ORDER = ["red", "green", "blue", "black", "white"];

  const COLOR_TOKENS = {
    red: "--college-flaremarch",
    green: "--college-verdance",
    blue: "--college-cerulink",
    black: "--college-inkarbor",
    white: "--college-silvalean",
  };

  const COLOR_FALLBACK = {
    red: "#d85f5f",
    green: "#91b66f",
    blue: "#4f78a8",
    black: "#1f1f1f",
    white: "#c9c3b7",
  };

  function getAcademyColors() {
    const style = getComputedStyle(document.documentElement);
    const result = {};
    ORDER.forEach((key) => {
      const token = COLOR_TOKENS[key];
      const fromCss = style.getPropertyValue(token).trim();
      result[key] = fromCss || COLOR_FALLBACK[key];
    });
    return result;
  }

  function getAcademyColor(key) {
    const map = getAcademyColors();
    return map[key] || COLOR_FALLBACK[key] || "#888";
  }

  window.ACADEMY_THEME = {
    ORDER,
    COLOR_TOKENS,
    COLOR_FALLBACK,
    getAcademyColors,
    getAcademyColor,
  };
})();
