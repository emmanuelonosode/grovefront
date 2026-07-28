import { fetchPropertiesForSitemap, fetchProperties, cleanImageUrl } from "@/lib/properties";
import { fetchPostsForSitemap } from "@/lib/blog";
import { fetchAgents } from "@/lib/agents";
import { fetchAllCities, CITIES } from "@/lib/cities";
import { stateSlugForCode } from "@/lib/states";

export const BASE_URL = "https://primefamilyhousing.com";

const BEDROOM_FILTERS = ["1-bedroom", "2-bedroom", "3-bedroom", "4-bedroom"];
const FILTER_MIN_LISTINGS = 12;

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
  images?: { loc: string; title?: string }[];
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

  const cityPages: SitemapEntry[] = allCitySlugs.map((slug) => ({
    url: `${BASE_URL}/rentals/${slug}`, lastModified: lastModBySlug.get(slug), changeFrequency: "daily" as const, priority: 0.85,
  }));

  const filterCitySlugs = new Set<string>([
    ...Object.keys(CITIES),
    ...dbCities.filter((c) => (c.count ?? 0) >= FILTER_MIN_LISTINGS).map((c) => c.slug),
  ]);

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
      return (beds[String(n)] ?? 0) > 0;
    }).map((filter) => ({
      url: `${BASE_URL}/rentals/${slug}/${filter}`, lastModified: lastModBySlug.get(slug), changeFrequency: "weekly" as const, priority: 0.6,
    }));
  });

  // Property-management pages use the same inventory gate as bedroom filters —
  // emitting one for all ~550 cities created hundreds of near-identical thin
  // pages ("Crawled - currently not indexed" in GSC). Their content doesn't
  // track listing churn, so they carry no lastmod.
  const propertyManagementPages: SitemapEntry[] = [...filterCitySlugs].map((slug) => ({
    url: `${BASE_URL}/property-management/${slug}`, changeFrequency: "monthly" as const, priority: 0.5,
  }));

  return [...cityPages, ...cityFilterPages, ...propertyManagementPages];
}

export async function buildProperties(): Promise<SitemapEntry[]> {
  // No .catch here — a failed fetch must propagate so the sitemap route can
  // return 503 instead of serving a sitemap missing every property URL.
  const all = await fetchPropertiesForSitemap();
  // Property listings are the priority — highest non-homepage priority — and each
  // carries its primary photo as an <image:image> so Google indexes listing
  // images (Google Images + result thumbnails).
  return all.map((p) => {
    // <image:loc> must be a fully-qualified URL,
    // so clean it and drop anything still not absolute (GSC rejects it otherwise).
    const image = cleanImageUrl(p.image);
    return {
      url: `${BASE_URL}/houses-for-rent/${p.slug}`,
      lastModified: new Date(p.lastModified),
      changeFrequency: "daily" as const,
      priority: 0.9,
      images: image.startsWith("http") ? [{ loc: image, title: p.title }] : undefined,
    };
  });
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
    const imgs = (e.images ?? [])
      .map((im) =>
        `<image:image><image:loc>${escapeXml(im.loc)}</image:loc>` +
        (im.title ? `<image:title>${escapeXml(im.title)}</image:title>` : "") +
        `</image:image>`
      )
      .join("");
    return `  <url><loc>${escapeXml(e.url)}</loc>${lm}${cf}${pr}${imgs}</url>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${items}\n</urlset>`;
}
