import {
  buildCore, buildStates, buildCities, buildProperties, urlsetXml, type SitemapEntry,
} from "@/lib/sitemap-data";

// Regenerate every 12 hours.
export const revalidate = 43200;

/**
 * Grouped sub-sitemaps served at /sitemaps/<group>.xml — referenced by the
 * sitemap index at /sitemap.xml. Groups: core, states, cities, properties-<n>.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ group: string }> }) {
  const { group } = await params;
  const name = group.replace(/\.xml$/i, "");

  let entries: SitemapEntry[];
  if (name === "core") {
    entries = await buildCore();
  } else if (name === "states") {
    entries = await buildStates();
  } else if (name === "cities") {
    entries = await buildCities();
  } else if (name.startsWith("properties-")) {
    const chunk = parseInt(name.slice("properties-".length), 10);
    entries = await buildProperties(Number.isFinite(chunk) ? chunk : 0);
  } else {
    return new Response("Not found", { status: 404 });
  }

  if (entries.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(urlsetXml(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=43200, stale-while-revalidate=86400",
    },
  });
}
