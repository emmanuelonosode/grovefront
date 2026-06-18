import { getVisitorFingerprint } from "./fingerprint";
import { getStructuredDevice, getStoredUTMs, getStoredLocation, getStoredReferralCode } from "./tracking";

export interface TelemetryPayload {
  session_id: string;
  fingerprint_id: string;
  event_type: "init" | "page_view" | "engagement" | "session_end" | "click" | "form_submit";
  path: string;
  timestamp: string;
  [key: string]: any;
}

const SESSION_KEY = "hasker_session_id";
const API_ENDPOINT = "/api/v1/analytics/visitors/";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function sendTelemetry(payload: Partial<TelemetryPayload>, useBeacon = false) {
  const fingerprint_id = await getVisitorFingerprint();
  const session_id = getSessionId();
  
  const fullPayload = {
    fingerprint_id,
    session_id,
    path: window.location.pathname + window.location.search,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const blob = new Blob([JSON.stringify(fullPayload)], { type: "application/json" });

  const token = localStorage.getItem("access_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(API_ENDPOINT, blob);
  } else {
    try {
      await fetch(API_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify(fullPayload),
        keepalive: true
      });
    } catch {
      // fail silently
    }
  }
}

// Global state for engagement
let maxScroll = 0;
let idleTimer: ReturnType<typeof setTimeout>;
let totalIdleTime = 0;
let lastActiveTime = Date.now();
let sessionStartTime = Date.now();

export function initTelemetryEngine() {
  if (typeof window === "undefined") return;
  
  sessionStartTime = Date.now();
  
  const device = getStructuredDevice();
  const utms = getStoredUTMs();
  const location = getStoredLocation();
  
  // 1. Initial Session Context
  sendTelemetry({
    event_type: "init",
    city: location.city ?? "",
    region: location.region ?? "",
    country_code: location.country_code ?? "",
    browser: device.browser,
    os: device.os,
    device_type: device.device_type,
    screen: device.screen,
    language: device.language,
    timezone: device.timezone,
    referrer: device.referrer,
    landing_page: device.landing_page,
    utm_source: utms.utm_source ?? "",
    utm_medium: utms.utm_medium ?? "",
    utm_campaign: utms.utm_campaign ?? "",
    referral_code: getStoredReferralCode()
  });

  // 2. Lifecycle: beforeunload
  window.addEventListener("beforeunload", () => {
    const dwell_time = (Date.now() - sessionStartTime) / 1000;
    sendTelemetry({
      event_type: "session_end",
      dwell_time,
      total_idle_time: totalIdleTime,
    }, true); // useBeacon
  });
  
  // 3. Scroll tracking
  const handleScroll = () => {
    const scrollDepth = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
    if (scrollDepth > maxScroll) {
      maxScroll = scrollDepth;
    }
  };
  
  window.addEventListener("scroll", handleScroll, { passive: true });
  
  // 4. Idle time tracking
  const resetIdle = () => {
    const now = Date.now();
    const diff = now - lastActiveTime;
    if (diff > 30000) { // If was idle for > 30s
      totalIdleTime += diff / 1000;
    }
    lastActiveTime = now;
    
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      // Send engagement heartbeat every 60s idle
      sendTelemetry({
        event_type: "engagement",
        max_scroll_depth: maxScroll,
        idle_time: totalIdleTime + ((Date.now() - lastActiveTime) / 1000),
      });
    }, 60000);
  };

  ["mousemove", "keypress", "scroll", "click", "touchstart"].forEach(evt => {
    window.addEventListener(evt, resetIdle, { passive: true });
  });
  resetIdle();
}

export function trackPageView(path?: string) {
  maxScroll = 0; // reset scroll for new page
  sendTelemetry({
    event_type: "page_view",
    ...(path ? { path } : {})
  });
}

export function trackClick(elementName: string, additionalData: Record<string, any> = {}) {
  sendTelemetry({
    event_type: "click",
    event_data: { element: elementName, ...additionalData }
  });
}

export function trackLogin() {
  sendTelemetry({
    event_type: "login"
  });
}
