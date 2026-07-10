import { buildCore, buildStates, buildCities, buildProperties, urlsetXml } from "@/lib/sitemap-data";

// Regenerate every 12 hours.
export const revalidate = 43200;

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
      "Cache-Control": "public, max-age=0, s-maxage=43200, stale-while-revalidate=86400",
    },
  });
}
