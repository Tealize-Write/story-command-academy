// Shared analytics delivery. Event IDs make queued retries safe on the GAS side.
(function analyticsBootstrap() {
  const QUEUE_KEY = "academyAnalyticsQueue";
  const SOURCE_KEY = "academyAnalyticsSource";
  const MAX_EVENTS = 200;
  const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
  let memoryQueue = [];
  let context = {};
  let sending = false;
  let retryTimer;
  const acknowledgedIds = new Set();

  function endpoint() {
    return typeof GAS_URL === "string" && /^https?:\/\//.test(GAS_URL) ? GAS_URL : "";
  }

  function readQueue() {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch {}
    const entries = new Map();
    for (const item of [...(Array.isArray(stored) ? stored : []), ...memoryQueue]) {
      if (item?.payload?.eventId && !acknowledgedIds.has(item.payload.eventId) && Number.isFinite(item.createdAt) &&
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
    if (acknowledgedIds.has(eventId)) return false;
    acknowledgedIds.add(eventId);
    writeQueue(readQueue().filter(item => item.payload.eventId !== eventId));
    return true;
  }

  function pageName() {
    const name = location.pathname.split("/").pop();
    if (name === "about.html") return "about";
    if (name === "stats.html") return "stats";
    return new URLSearchParams(location.search).get("page") || document.body.dataset.page || "index";
  }

  function trafficSource() {
    const params = new URLSearchParams(location.search);
    const explicit = params.get("source") || params.get("utm_source");
    if (explicit) {
      try { sessionStorage.setItem(SOURCE_KEY, explicit); } catch {}
      return explicit;
    }
    if (context.source) return context.source;
    try { return sessionStorage.getItem(SOURCE_KEY) || "direct"; } catch { return "direct"; }
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
        referrer: document.referrer || "",
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
      if (acknowledgedIds.has(payload.eventId)) return true;
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
      if (acknowledgement.status !== "ok" ||
          (acknowledgement.eventId && acknowledgement.eventId !== item.payload.eventId)) {
        throw new Error("Analytics was not acknowledged.");
      }
      if (removeEvent(item.payload.eventId) && typeof CustomEvent === "function") {
        document.dispatchEvent(new CustomEvent("analyticsAcknowledged", { detail: item.payload }));
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

  window.ANALYTICS = { track, flush, setContext, getSource: trafficSource };
  document.addEventListener("click", trackClick, true);
  document.addEventListener("auxclick", trackClick, true);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sendOnExit();
  });
  window.addEventListener("pagehide", sendOnExit);
  window.addEventListener("online", () => { void flush(true); });
  trafficSource();
  void flush();
})();
