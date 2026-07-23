import { getVisitorFingerprint } from "./fingerprint";
import { getStructuredDevice, getStoredUTMs, getStoredLocation, getStoredReferralCode } from "./tracking";

const SESSION_KEY = "pfh_session_id";
const FP_KEY = "pfh_fingerprint_id";
const API_ENDPOINT = "/api/v1/analytics/visitors/";

// Batching: events are buffered and sent together to cut request volume and
// keep the beacon fire-and-forget. Flushed on tab-hide/leave, on a size cap,
// and on a safety interval.
const MAX_BATCH = 10;
const FLUSH_INTERVAL = 20000;

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ── module state ──────────────────────────────────────────────────────────────
let fingerprint = "";
let sessionId = "";
let queue: Record<string, unknown>[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

let maxScroll = 0;
let totalIdleTime = 0;
let lastActiveTime = Date.now();
let sessionStartTime = Date.now();
let currentPath = "";
let initialized = false;
let lastPageView = { path: "", t: 0 };

function currentLocation(): string {
  return window.location.pathname + window.location.search;
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => flush(false), FLUSH_INTERVAL);
}

function enqueue(event: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  queue.push({ path: (event.path as string) ?? currentLocation(), ...event });
  if (queue.length >= MAX_BATCH) flush(false);
  else scheduleFlush();
}

function flush(useBeacon: boolean) {
  if (typeof window === "undefined") return;
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (!queue.length) return;

  // Fingerprint is cached in localStorage after the first visit, so returning
  // visitors always resolve it synchronously here even before init finishes.
  const fp = fingerprint || localStorage.getItem(FP_KEY) || "";
  const sid = sessionId || getSessionId();
  const events = queue.map((e) => ({ fingerprint_id: fp, session_id: sid, ...e }));
  queue = [];

  const body = JSON.stringify({ events });

  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(API_ENDPOINT, new Blob([body], { type: "application/json" }));
    return;
  }

  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  fetch(API_ENDPOINT, { method: "POST", headers, body, keepalive: true }).catch(() => {
    // fail silently — analytics must never disrupt the user
  });
}

function engagementEvent(path: string) {
  return {
    event_type: "engagement",
    path,
    max_scroll_depth: maxScroll,
    idle_time: totalIdleTime + (Date.now() - lastActiveTime) / 1000,
  };
}

export async function initTelemetryEngine() {
  if (typeof window === "undefined" || initialized) return;
  initialized = true;

  sessionStartTime = Date.now();
  sessionId = getSessionId();
  currentPath = currentLocation();
  try { fingerprint = await getVisitorFingerprint(); } catch { /* localStorage fallback at flush */ }

  const device = getStructuredDevice();
  const utms = getStoredUTMs();
  const location = getStoredLocation();

  enqueue({
    event_type: "init",
    city: location.city ?? "",
    region: location.region ?? "",
    country_code: location.country_code ?? "",
    browser: device.browser,
    os: device.os,
    device_type: device.device_type,
    screen: device.screen,
    viewport: device.viewport,
    pixel_ratio: device.pixel_ratio,
    connection_type: device.connection_type,
    hardware_concurrency: device.hardware_concurrency,
    device_memory: device.device_memory,
    max_touch_points: device.max_touch_points,
    orientation: device.orientation,
    language: device.language,
    timezone: device.timezone,
    referrer: device.referrer,
    landing_page: device.landing_page,
    utm_source: utms.utm_source ?? "",
    utm_medium: utms.utm_medium ?? "",
    utm_campaign: utms.utm_campaign ?? "",
    referral_code: getStoredReferralCode(),
  });

  // Scroll depth (passive — never blocks the main thread).
  window.addEventListener("scroll", () => {
    const depth = ((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100;
    if (depth > maxScroll) maxScroll = depth;
  }, { passive: true });

  // Idle accounting.
  const resetIdle = () => {
    const now = Date.now();
    const diff = now - lastActiveTime;
    if (diff > 30000) totalIdleTime += diff / 1000;
    lastActiveTime = now;
  };
  ["mousemove", "keypress", "scroll", "click", "touchstart"].forEach((evt) =>
    window.addEventListener(evt, resetIdle, { passive: true })
  );

  // Flush when the tab is hidden — far more reliable than `beforeunload`,
  // especially on mobile where pages are frozen rather than unloaded.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      enqueue(engagementEvent(currentPath));
      flush(true);
    }
  });
  window.addEventListener("pagehide", () => {
    enqueue(engagementEvent(currentPath));
    enqueue({
      event_type: "session_end",
      dwell_time: (Date.now() - sessionStartTime) / 1000,
      total_idle_time: totalIdleTime,
    });
    flush(true);
  });
}

export function trackPageView(path?: string) {
  if (typeof window === "undefined") return;
  const newPath = path ?? currentLocation();

  // Dedup rapid duplicate fires (e.g. React effect double-invocation).
  if (newPath === lastPageView.path && Date.now() - lastPageView.t < 1500) return;
  lastPageView = { path: newPath, t: Date.now() };

  // Capture engagement for the page being left so its scroll/idle is recorded.
  if (currentPath && newPath !== currentPath) {
    enqueue(engagementEvent(currentPath));
  }
  currentPath = newPath;
  maxScroll = 0;
  enqueue({ event_type: "page_view", path: newPath });
}

export function trackClick(elementName: string, additionalData: Record<string, unknown> = {}) {
  enqueue({ event_type: "click", event_data: { element: elementName, ...additionalData } });
}

export function trackLogin() {
  enqueue({ event_type: "login" });
}

/**
 * First-party conversion / interaction event → our own analytics spool.
 * This replaces the old GA/GTM dataLayer + Meta Pixel paths: every
 * trackEvent(...) call across the app now feeds native telemetry instead of
 * shipping data to Google/Meta. No external scripts, no third-party cookies.
 */
export function trackEvent(name: string, data: Record<string, unknown> = {}) {
  enqueue({ event_type: "conversion", event_name: name, event_data: data });
}

/** Associate the current session with a known user (login/register). */
export function identify(email: string, userId?: string | number) {
  enqueue({
    event_type: "identify",
    event_data: { email, user_id: userId != null ? String(userId) : undefined },
  });
}
