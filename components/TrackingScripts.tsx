"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureUTMs, captureReferralCode, captureLocation } from "@/lib/tracking";
import { initTelemetryEngine, trackPageView } from "@/lib/telemetry";

/**
 * First-party analytics only. No Google (GA4/GTM) and no Meta Pixel — the site
 * ships zero third-party tracking scripts, which keeps the page fast (no extra
 * DNS lookups, no render-blocking/afterInteractive vendor JS, no ad cookies).
 * Everything below is our own telemetry beaconing to /api/v1/analytics/visitors/.
 * (Google Search Console is unaffected — that's a static verification <meta>,
 * not a script.)
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams?.toString();
    trackPageView(pathname + (qs ? `?${qs}` : ""));
  }, [pathname, searchParams]);

  return null;
}

export function TrackingScripts() {
  useEffect(() => {
    // Attribution capture (UTMs, referral code) + coarse location, then start
    // the native telemetry engine. All first-party, all sent to our own API.
    captureUTMs();
    captureReferralCode();
    captureLocation().then(() => initTelemetryEngine());
  }, []);

  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
