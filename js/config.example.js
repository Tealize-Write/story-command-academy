/* ── CONFIG ── */
const GAS_URL = "__GAS_URL__";
const TOKEN = "__TOKEN__";

function getClientId() {
  const key = "abyss_client_id";
  let cid = window._quizClientId;
  try { cid = localStorage.getItem(key) || cid; } catch {}
  if (!cid) {
    cid = `sc_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
    try { localStorage.setItem(key, cid); } catch {}
  }
  window._quizClientId = cid;
  return cid;
}

function getDeviceType() {
  const ua = navigator.userAgent || "";
  return /android|iphone|ipad|ipod|mobile/i.test(ua) ? "mobile" : "desktop";
}

function getTrafficSource() {
  const params = new URLSearchParams(window.location.search);
  return params.get("source") || params.get("utm_source") || "direct";
}

window.userLocationData = { country: "unknown", city: "unknown" };

window._locationReady = (async () => {
  const CACHE_KEY = "abyss_location";
  const TTL = 24 * 60 * 60 * 1000;

  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (cached && Date.now() - cached.ts < TTL) {
      window.userLocationData.country = cached.country;
      window.userLocationData.city = cached.city;
      return;
    }
  } catch (_) {}

  try {
    const res = await Promise.race([
      fetch("https://ipwho.is/"),
      new Promise((r) => setTimeout(r, 2000, null)),
    ]);
    if (!res || !res.ok) return;
    const data = await res.json();
    if (data && data.success) {
      window.userLocationData.country = data.country || "unknown";
      window.userLocationData.city = data.city || "unknown";
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        country: window.userLocationData.country,
        city: window.userLocationData.city,
        ts: Date.now(),
      }));
    }
  } catch (_) {}
})();

function getLocationPayload() {
  return {
    country: window.userLocationData.country,
    city: window.userLocationData.city,
  };
}
