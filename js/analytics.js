// Shared analytics delivery. Event IDs make queued retries safe on the GAS side.
(function analyticsBootstrap() {
  const QUEUE_KEY = "academyAnalyticsQueue";
  const SOURCE_KEY = "academyAnalyticsSource";
  const REFERRER_KEY = "academyAnalyticsEntryReferrer";
  const MAX_EVENTS = 200;
  const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  let memoryQueue = [];
  let context = {};
  let sending = false;
  let retryTimer;
  const settledIds = new Set();
  let entrySource = "";
  let entryReferrer = "";
  let latestCompletionStatistics = null;

  function getCompletionStatistics() {
    return latestCompletionStatistics && Date.now() - latestCompletionStatistics.receivedAt < 20000 ?
      latestCompletionStatistics.data : null;
  }

  function endpoint() {
    return typeof GAS_URL === "string" && /^https?:\/\//.test(GAS_URL) ? GAS_URL : "";
  }

  function readQueue() {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch {}
    const entries = new Map();
    for (const item of [...(Array.isArray(stored) ? stored : []), ...memoryQueue]) {
      if (item?.payload?.eventId && !settledIds.has(item.payload.eventId) && Number.isFinite(item.createdAt) &&
          Date.now() - item.createdAt < MAX_AGE) entries.set(item.payload.eventId, item);
    }
    return [...entries.values()].slice(-MAX_EVENTS);
  }

  function writeQueue(entries) {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(entries));
      memoryQueue = [];
    } catch { memoryQueue = entries; }
  }

  function removeEvent(eventId) {
    if (settledIds.has(eventId)) return false;
    settledIds.add(eventId);
    writeQueue(readQueue().filter(item => item.payload.eventId !== eventId));
    return true;
  }

  function pageName() {
    const name = location.pathname.split("/").pop();
    if (name === "about.html") return "about";
    if (name === "stats.html") return "stats";
    return new URLSearchParams(location.search).get("page") || document.body.dataset.page || "index";
  }

  function explicitSource() {
    const params = new URLSearchParams(location.search);
    return params.get("source")?.trim() || params.get("utm_source")?.trim() || "";
  }

  function referralDetails() {
    try {
      const url = new URL(document.referrer);
      if (!["http:", "https:"].includes(url.protocol)) return null;
      const basePath = location.pathname.slice(0, location.pathname.lastIndexOf("/") + 1);
      const internal = url.origin === location.origin &&
        (url.pathname.startsWith(basePath) || url.pathname === basePath.slice(0, -1));
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const matches = domain => host === domain || host.endsWith("." + domain);
      let source = host;
      for (const [name, domains] of [
        ["threads", ["threads.com", "threads.net"]],
        ["instagram", ["instagram.com"]],
        ["facebook", ["facebook.com", "fb.com", "fb.me"]],
        ["plurk", ["plurk.com"]],
        ["bing", ["bing.com"]],
        ["duckduckgo", ["duckduckgo.com"]],
      ]) {
        if (domains.some(matches)) { source = name; break; }
      }
      if (/(^|\.)google\.(?:[a-z]{2,3}|co\.[a-z]{2}|com\.[a-z]{2})$/.test(host)) source = "google";
      return { internal, source, referrer: url.href };
    } catch { return null; }
  }

  function rememberSource(source) {
    entrySource = source;
    try { sessionStorage.setItem(SOURCE_KEY, source); } catch {}
    return source;
  }

  function initializeAttribution() {
    const explicit = explicitSource();
    const referral = referralDetails();
    let savedSource = "", savedReferrer = "";
    try {
      savedSource = sessionStorage.getItem(SOURCE_KEY) || "";
      savedReferrer = sessionStorage.getItem(REFERRER_KEY) || "";
    } catch {}
    rememberSource(explicit || (referral && !referral.internal ? referral.source : "") || savedSource || "direct");
    // Internal navigation must not replace the original entry with our own quiz URL.
    entryReferrer = referral && !referral.internal ? referral.referrer :
      (explicit && !referral?.internal ? "" : savedReferrer);
    try { sessionStorage.setItem(REFERRER_KEY, entryReferrer); } catch {}
  }

  function trafficSource() {
    return rememberSource(explicitSource() || context.source || entrySource || "direct");
  }

  function setContext(details) {
    Object.entries(details).forEach(([key, value]) => {
      if (value !== undefined && value !== null) context[key] = value;
    });
  }

  function track(action, details = {}) {
    if (!endpoint()) return false;
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        clientId: getClientId(),
        keyword: context.keyword || "",
        action,
        source: trafficSource(),
        referrer: entryReferrer,
        device: getDeviceType(),
        ...getLocationPayload(),
        timeSpent: 0,
        page: pageName(),
        platform: "",
        target: "",
        language: window.currentLang || document.documentElement.lang || "zh-TW",
        attemptId: context.attemptId || "",
        ...details,
        eventId: details.eventId || window.crypto?.randomUUID?.() || `event_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      };
      if (settledIds.has(payload.eventId)) return true;
      const entries = readQueue();
      if (!entries.some(item => item.payload.eventId === payload.eventId)) {
        entries.push({ payload, createdAt: Date.now(), attempts: 0, nextTry: 0 });
        writeQueue(entries.slice(-MAX_EVENTS));
      }
      void flush();
      return true;
    } catch { return false; }
  }

  async function deliver(item) {
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    let timer;
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => { controller?.abort(); reject(new Error("Analytics request timed out.")); }, 30000);
    });
    try {
      const acknowledgement = await Promise.race([deadline, (async () => {
        const response = await fetch(endpoint(), {
          method: "POST", keepalive: true,
          signal: controller?.signal,
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify(item.payload),
        });
        if (!response.ok) throw new Error("Analytics HTTP failure.");
        return response.json();
      })()]);
      // Only an explicit, recognized rejection for this exact event can stop retries.
      // Service failures, old GAS errors and mismatched replies remain retryable.
      if (acknowledgement?.status === "error" && acknowledgement.retryable === false &&
          acknowledgement.eventId === item.payload.eventId &&
          ["invalid_event", "event_id_conflict"].includes(acknowledgement.code)) {
        if (removeEvent(item.payload.eventId) && typeof CustomEvent === "function") {
          document.dispatchEvent(new CustomEvent("analyticsRejected", { detail: {
            eventId: item.payload.eventId, action: item.payload.action, code: acknowledgement.code,
          } }));
        }
        return;
      }
      if (acknowledgement.status !== "ok" ||
          (acknowledgement.eventId && acknowledgement.eventId !== item.payload.eventId)) {
        throw new Error("Analytics was not acknowledged.");
      }
      if (removeEvent(item.payload.eventId)) {
        let statistics;
        if (item.payload.action === "quiz_completed") {
          latestCompletionStatistics = null;
          // A malformed optional snapshot must not cause a successful write to be retried.
          if (acknowledgement.statistics && acknowledgement.statisticsPending !== true) {
            try {
              statistics = window.ACADEMY_STATS.parse(acknowledgement.statistics);
              latestCompletionStatistics = { data: statistics, receivedAt: Date.now() };
            } catch {}
          }
        }
        if (typeof CustomEvent === "function") {
          document.dispatchEvent(new CustomEvent("analyticsAcknowledged", { detail: { ...item.payload, statistics } }));
        }
      }
    } finally { clearTimeout(timer); }
  }

  function scheduleRetry() {
    clearTimeout(retryTimer);
    const entries = readQueue();
    if (!entries.length || !endpoint()) return;
    const next = Math.min(...entries.map(item => Number(item.nextTry) || 0));
    retryTimer = setTimeout(() => { void flush(); }, Math.max(1000, next - Date.now()));
  }

  async function flush(force = false) {
    if (sending || !endpoint()) return;
    sending = true;
    try {
      const due = readQueue().filter(item => force || !item.nextTry || item.nextTry <= Date.now()).slice(0, 10);
      for (const item of due) {
        try { await deliver(item); }
        catch {
          const entries = readQueue();
          const pending = entries.find(entry => entry.payload.eventId === item.payload.eventId);
          if (pending) {
            pending.attempts = (Number(pending.attempts) || 0) + 1;
            pending.nextTry = Date.now() + Math.min(300000, 5000 * 2 ** Math.min(pending.attempts - 1, 6));
            writeQueue(entries);
          }
        }
      }
    } finally {
      sending = false;
      scheduleRetry();
    }
  }

  function sendOnExit() {
    if (!endpoint()) return;
    for (const item of readQueue().slice(0, 10)) {
      let queued = false;
      try {
        queued = navigator.sendBeacon?.(endpoint(), new Blob([JSON.stringify(item.payload)], { type: "text/plain;charset=UTF-8" })) === true;
      } catch {}
      // A queued beacon has no server acknowledgement: retain it for an idempotent retry.
      if (!queued) void deliver(item).catch(() => {});
    }
  }

  function trackClick(event) {
    if (event.type === "auxclick" && event.button !== 1) return;
    const element = event.target.closest?.("[data-analytics-event]");
    if (!element || element.disabled) return;
    track(element.dataset.analyticsEvent, {
      platform: element.dataset.analyticsPlatform || "",
      target: element.href || "",
    });
  }

  window.ANALYTICS = { track, flush, setContext, getSource: trafficSource, getCompletionStatistics };
  document.addEventListener("click", trackClick, true);
  document.addEventListener("auxclick", trackClick, true);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendOnExit();
  });
  window.addEventListener("pagehide", sendOnExit);
  window.addEventListener("online", () => { void flush(true); });
  initializeAttribution();
  void flush();
})();
