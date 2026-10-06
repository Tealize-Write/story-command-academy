// Shared validation for community statistics returned by GAS.
(function academyStatsBootstrap() {
  const ORDER = ["red", "green", "blue", "black", "white"];

  function parse(data) {
    if (!data || data.error || data.status === "error" || !data.counts || Array.isArray(data.counts)) {
      throw new Error("GAS statistics are unavailable.");
    }
    const counts = {};
    for (const key of ORDER) {
      const count = data.counts[key];
      if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error("Invalid academy count.");
      }
      counts[key] = count;
    }
    const total = ORDER.reduce((sum, key) => sum + counts[key], 0);
    if (!Number.isSafeInteger(total) || data.total !== total) {
      throw new Error("Invalid participant total.");
    }
    return { counts, total };
  }

  async function load(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error("GAS statistics request failed.");
    return parse(await response.json());
  }

  window.ACADEMY_STATS = { parse, load };
})();
