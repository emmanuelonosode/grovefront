import { fetchPropertiesForSitemap, fetchProperties } from "@/lib/properties";
import { fetchPostsForSitemap } from "@/lib/blog";
import { fetchAgents } from "@/lib/agents";
import { fetchAllCities, CITIES } from "@/lib/cities";
import { stateSlugForCode } from "@/lib/states";

export const BASE_URL = "https://haskerrealtygroup.com";
export const PROP_CHUNK = 10000;

const BEDROOM_FILTERS = ["1-bedroom", "2-bedroom", "3-bedroom", "4-bedroom"];
const FILTER_MIN_LISTINGS = 12;

export interface SitemapEntry {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

// ── How many property sub-sitemaps (10k each) ─────────────────────────────────
export async function propertyChunkCount(): Promise<number> {
  let count = 0;
  try {
    count = (await fetchProperties({ page_size: "1" })).count;
  } catch {
    /* API offline */
  }
  return Math.max(1, Math.ceil(count / PROP_CHUNK));
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

  try {
    const apt = await fetchProperties({ listing_type: "for-rent", type: "apartment", page_size: "1" });
    if (apt.count > 0) {
      pages.push({ url: `${BASE_URL}/apartments-for-rent`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 });
    }
  } catch { /* skip */ }

  for (const { slug, lastModified } of posts) {
    pages.push({ url: `${BASE_URL}/blog/${slug}`, lastModified: new Date(lastModified), changeFrequency: "monthly", priority: 0.65 });
  }
  for (const agent of agents) {
    pages.push({ url: `${BASE_URL}/agents/${agent.id}`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 });
  }
  return pages;
}

export async function buildStates(): Promise<SitemapEntry[]> {
  const dbCities = await fetchAllCities().catch(() => []);
  const stateCodes = new Set<string>([
    ...Object.values(CITIES).map((c) => c.stateCode),
    ...dbCities.map((c) => (c.state || "").toUpperCase()),
  ]);
  return [...stateCodes]
    .map((code) => stateSlugForCode(code))
    .filter(Boolean)
    .map((slug) => ({ url: `${BASE_URL}/rentals/${slug}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.85 }));
}

export async function buildCities(): Promise<SitemapEntry[]> {
  const dbCities = await fetchAllCities().catch(() => []);
  const allCitySlugs = [...new Set([...Object.keys(CITIES), ...dbCities.map((c) => c.slug)])];

  const cityPages: SitemapEntry[] = allCitySlugs.map((slug) => ({
    url: `${BASE_URL}/rentals/${slug}`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.85,
  }));

  const filterCitySlugs = new Set<string>([
    ...Object.keys(CITIES),
    ...dbCities.filter((c) => (c.count ?? 0) >= FILTER_MIN_LISTINGS).map((c) => c.slug),
  ]);
  const cityFilterPages: SitemapEntry[] = [...filterCitySlugs].flatMap((slug) =>
    BEDROOM_FILTERS.map((filter) => ({
      url: `${BASE_URL}/rentals/${slug}/${filter}`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6,
    }))
  );

  const propertyManagementPages: SitemapEntry[] = allCitySlugs.map((slug) => ({
    url: `${BASE_URL}/property-management/${slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5,
  }));

  return [...cityPages, ...cityFilterPages, ...propertyManagementPages];
}

export async function buildProperties(chunk: number): Promise<SitemapEntry[]> {
  const all = await fetchPropertiesForSitemap().catch(() => []);
  const start = chunk * PROP_CHUNK;
  // Property listings are the priority — highest non-homepage priority.
  return all.slice(start, start + PROP_CHUNK).map(({ slug, lastModified }) => ({
    url: `${BASE_URL}/houses-for-rent/${slug}`, lastModified: new Date(lastModified), changeFrequency: "daily" as const, priority: 0.9,
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
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>`;
}

export function sitemapIndexXml(locs: string[]): string {
  const now = new Date().toISOString();
  const items = locs.map((loc) => `  <sitemap><loc>${escapeXml(loc)}</loc><lastmod>${now}</lastmod></sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>`;
}
