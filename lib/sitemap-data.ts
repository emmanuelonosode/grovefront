import { fetchPropertiesForSitemap } from "@/lib/properties";
import { fetchPostsForSitemap } from "@/lib/blog";
import { fetchAgents } from "@/lib/agents";
import { fetchAllCities, CITIES } from "@/lib/cities";
import { stateSlugForCode } from "@/lib/states";

export const BASE_URL = "https://primefamilyhousing.com";

const BEDROOM_FILTERS = ["1-bedroom", "2-bedroom", "3-bedroom", "4-bedroom"];
// A URL in the sitemap is an indexing recommendation, not a catalogue entry.
// Small inventory pages are overwhelmingly near-duplicates of the main search
// page and were consuming the crawl budget needed for individual listings.
const CITY_MIN_LISTINGS = 12;
const FILTER_MIN_LISTINGS = 12;

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

// ── Group builders ────────────────────────────────────────────────────────────
export async function buildCore(): Promise<SitemapEntry[]> {
  const [postsResult, agentsResult] = await Promise.allSettled([fetchPostsForSitemap(), fetchAgents()]);
  const posts = postsResult.status === "fulfilled" ? postsResult.value : [];
  const agents = agentsResult.status === "fulfilled" ? agentsResult.value : [];

  const pages: SitemapEntry[] = [
    { url: BASE_URL,                      lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/houses-for-rent`, lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/apply`,           lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/agents`,          lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE_URL}/blog`,            lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE_URL}/careers`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/privacy`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/terms`,           lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/accessibility`,   lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  // Note: no /apartments-for-rent in the sitemap — PrimeFamilyHousing rents
  // single-family houses only. That page self-noindexes and is intentionally
  // excluded from the sitemap.

  for (const { slug, lastModified } of posts) {
    pages.push({ url: `${BASE_URL}/blog/${slug}`, lastModified: new Date(lastModified), changeFrequency: "monthly", priority: 0.65 });
  }
  for (const agent of agents) {
    pages.push({ url: `${BASE_URL}/agents/${agent.id}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 });
  }
  return pages;
}

// Honest <lastmod>: use the newest listing update per city (from the API);
// omit the tag entirely when unknown. Emitting `new Date()` on every
// regeneration told Google every page changed constantly — it learns to
// distrust lastmod sitewide.
function cityLastMod(c: { last_updated?: string | null }): Date | undefined {
  if (!c.last_updated) return undefined;
  const d = new Date(c.last_updated);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function buildStates(): Promise<SitemapEntry[]> {
  const dbCities = await fetchAllCities().catch(() => []);
  const stateCodes = new Set<string>([
    ...Object.values(CITIES).map((c) => c.stateCode),
    ...dbCities.map((c) => (c.state || "").toUpperCase()),
  ]);
  const stateLastMod = new Map<string, Date>();
  for (const c of dbCities) {
    const code = (c.state || "").toUpperCase();
    const lm = cityLastMod(c);
    if (!code || !lm) continue;
    const prev = stateLastMod.get(code);
    if (!prev || lm > prev) stateLastMod.set(code, lm);
  }
  return [...stateCodes]
    .map((code) => ({ slug: stateSlugForCode(code), lastModified: stateLastMod.get(code) }))
    .filter((s) => s.slug)
    .map(({ slug, lastModified }) => ({
      url: `${BASE_URL}/rentals/${slug}`, lastModified, changeFrequency: "daily" as const, priority: 0.85,
    }));
}

export async function buildCities(): Promise<SitemapEntry[]> {
  const dbCities = await fetchAllCities().catch(() => []);
  const lastModBySlug = new Map(dbCities.map((c) => [c.slug, cityLastMod(c)]));
  const allCitySlugs = [...new Set([...Object.keys(CITIES), ...dbCities.map((c) => c.slug)])];

  // Curated cities have substantial, editorial market guides. Database-only
  // pages need enough live inventory to be useful as a standalone landing page.
  const indexableCitySlugs = allCitySlugs.filter((slug) =>
    Boolean(CITIES[slug]) || (dbCities.find((c) => c.slug === slug)?.count ?? 0) >= CITY_MIN_LISTINGS
  );

  const cityPages: SitemapEntry[] = indexableCitySlugs.map((slug) => ({
    url: `${BASE_URL}/rentals/${slug}`, lastModified: lastModBySlug.get(slug), changeFrequency: "daily" as const, priority: 0.85,
  }));

  const filterCitySlugs = new Set(
    dbCities.filter((c) => (c.count ?? 0) >= FILTER_MIN_LISTINGS).map((c) => c.slug)
  );

  // Per-city bedroom inventory. A bedroom filter page 404s (notFound) when that
  // city has no listings with that bed count, so emitting one purely because the
  // city cleared FILTER_MIN_LISTINGS submits URLs that don't exist — Google logs
  // those as "Submitted URL not found (404)" and burns crawl budget on them.
  // Only emit a filter URL when the city actually has that bedroom count.
  const bedroomsBySlug = new Map(dbCities.map((c) => [c.slug, c.bedrooms ?? undefined]));

  const cityFilterPages: SitemapEntry[] = [...filterCitySlugs].flatMap((slug) => {
    const beds = bedroomsBySlug.get(slug);
    return BEDROOM_FILTERS.filter((filter) => {
      // No breakdown available (curated-only city, or an older backend that
      // omits `bedrooms`) — keep prior behaviour rather than dropping the page.
      if (!beds) return true;
      const n = Number(filter.split("-")[0]);
      return (beds[String(n)] ?? 0) >= FILTER_MIN_LISTINGS;
    }).map((filter) => ({
      url: `${BASE_URL}/rentals/${slug}/${filter}`, lastModified: lastModBySlug.get(slug), changeFrequency: "weekly" as const, priority: 0.6,
    }));
  });

  // These service pages have the same body copy apart from city substitutions.
  // Submit only the curated markets, where the editorial city guide establishes
  // a meaningful local landing page. Dynamic service pages remain available to
  // visitors but are intentionally not indexing targets.
  const propertyManagementPages: SitemapEntry[] = Object.keys(CITIES).map((slug) => ({
    url: `${BASE_URL}/property-management/${slug}`, changeFrequency: "monthly" as const, priority: 0.5,
  }));

  return [...cityPages, ...cityFilterPages, ...propertyManagementPages];
}

export async function buildProperties(): Promise<SitemapEntry[]> {
  // No .catch here — a failed fetch must propagate so the sitemap route can
  // return 503 instead of serving a sitemap missing every property URL.
  const all = await fetchPropertiesForSitemap();
  // Property listings are the priority — highest non-homepage priority. Image sitemap
  // extensions were removed: a clean <urlset> of plain <loc> URLs is the most reliably
  // crawlable form, and Google discovers listing photos from each page's own markup
  // (og:image + the RealEstateListing/SingleFamilyResidence JSON-LD) rather than needing
  // <image:image> here.
  return all.map((p) => ({
    url: `${BASE_URL}/houses-for-rent/${p.slug}`,
    lastModified: new Date(p.lastModified),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));
}

// ── XML serializers ───────────────────────────────────────────────────────────
function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function urlsetXml(entries: SitemapEntry[]): string {
  const items = entries.map((e) => {
    const lm = e.lastModified ? `<lastmod>${new Date(e.lastModified).toISOString()}</lastmod>` : "";
    const cf = e.changeFrequency ? `<changefreq>${e.changeFrequency}</changefreq>` : "";
    const pr = e.priority != null ? `<priority>${e.priority}</priority>` : "";
    return `  <url><loc>${escapeXml(e.url)}</loc>${lm}${cf}${pr}</url>`;
  }).join("\n");
  // Plain sitemaps namespace only — the image extension namespace is gone with the
  // <image:image> tags it declared.
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>`;
}
