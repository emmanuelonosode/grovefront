import { buildCore, buildStates, buildCities, buildProperties, urlsetXml } from "@/lib/sitemap-data";

// Regenerate every 5 minutes so newly-added homes appear — and deleted ones
// disappear — almost immediately. The sitemap is only rebuilt when it's actually
// requested after this window, and Google fetches it infrequently, so the
// backend cost of a short window is negligible.
export const revalidate = 300;

/**
 * THE single central sitemap, served at /sitemap.xml — the only sitemap URL
 * submitted to Google Search Console. One flat <urlset> with every indexable
 * page (~11k URLs, well under the 50k/50MB per-file limit).
 *
 * Failure policy: property listings are the core of this sitemap. If they
 * can't be fetched (backend down), respond 503 so Google keeps its last-known
 * good copy and retries — never serve a sitemap missing thousands of URLs.
 */
export async function GET() {
  let properties;
  try {
    properties = await buildProperties();
    if (properties.length === 0) throw new Error("property sitemap feed returned 0 rows");
  } catch {
    return new Response("Sitemap temporarily unavailable", {
      status: 503,
      headers: { "Retry-After": "3600", "Cache-Control": "no-store" },
    });
  }

  // Core/states/cities degrade gracefully (static CITIES fallback inside).
  const [core, states, cities] = await Promise.all([buildCore(), buildStates(), buildCities()]);

  return new Response(urlsetXml([...core, ...states, ...cities, ...properties]), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Short shared-cache window so a CDN (or Google's fetch cache) can't pin a
      // stale sitemap for hours after inventory changes.
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
