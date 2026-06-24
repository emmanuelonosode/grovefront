import { BASE_URL, propertyChunkCount, sitemapIndexXml } from "@/lib/sitemap-data";

// Regenerate every 12 hours.
export const revalidate = 43200;

/**
 * Sitemap INDEX served at /sitemap.xml — this is the URL you submit to Google
 * Search Console. It points to the grouped sub-sitemaps (served by
 * app/sitemaps/[group]/route.ts). Built as a route handler because Next's
 * generateSitemaps does not emit a /sitemap.xml index file.
 */
export async function GET() {
  const chunks = await propertyChunkCount();
  const locs = [
    `${BASE_URL}/sitemaps/core.xml`,
    `${BASE_URL}/sitemaps/states.xml`,
    `${BASE_URL}/sitemaps/cities.xml`,
  ];
  for (let i = 0; i < chunks; i++) {
    locs.push(`${BASE_URL}/sitemaps/properties-${i}.xml`);
  }

  return new Response(sitemapIndexXml(locs), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=43200, stale-while-revalidate=86400",
    },
  });
}
