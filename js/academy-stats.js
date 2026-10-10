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
    const result = { counts, total };
    if (data.uniqueParticipants !== undefined) {
      if (!Number.isSafeInteger(data.uniqueParticipants) || data.uniqueParticipants < 0 || data.uniqueParticipants > total) {
        throw new Error("Invalid unique participant total.");
      }
      result.uniqueParticipants = data.uniqueParticipants;
    }
    if (data.unidentifiedCompletions !== undefined) {
      if (!Number.isSafeInteger(data.unidentifiedCompletions) || data.unidentifiedCompletions < 0 ||
          data.unidentifiedCompletions > total - (result.uniqueParticipants || 0)) {
        throw new Error("Invalid unidentified completion total.");
      }
      result.unidentifiedCompletions = data.unidentifiedCompletions;
    }
    return result;
  }

  async function load(url) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    let timer;
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => { controller?.abort(); reject(new Error("Statistics request timed out.")); }, 20000);
    });
    try {
      return await Promise.race([deadline, (async () => {
        const response = await fetch(url, { signal: controller?.signal });
        if (!response.ok) throw new Error("GAS statistics request failed.");
        return parse(await response.json());
      })()]);
    } finally { clearTimeout(timer); }
  }

  function describe(data, t) {
    return t.totalParticipants + data.total + (data.uniqueParticipants === undefined ? "" : " · " + t.uniqueParticipants + data.uniqueParticipants);
  }

  window.ACADEMY_STATS = { parse, load, describe };
})();
