"use client";

import { useEffect } from "react";

/**
 * Opens the tour modal when a listing card links here with `?tour=1`.
 *
 * Reads `window.location.search` rather than the `searchParams` prop on
 * purpose: consuming searchParams in the page would opt the whole route out of
 * static rendering and lose its ISR cache, for a query param that only matters
 * to the browser.
 */
export function PdpTourAutoOpen() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("tour") !== "1") return;

    // Let the modal's own listener mount before the event fires.
    const t = window.setTimeout(() => {
      window.dispatchEvent(new Event("pfh:open-tour"));
      // Drop the param so a refresh or a shared link doesn't reopen the modal.
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      window.history.replaceState({}, "", url.toString());
    }, 60);

    return () => window.clearTimeout(t);
  }, []);

  return null;
}
