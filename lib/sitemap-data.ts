import { fetchPropertiesForSitemap, fetchProperties, cleanImageUrl } from "@/lib/properties";
import { fetchPostsForSitemap } from "@/lib/blog";
import { fetchAgents } from "@/lib/agents";
import { fetchAllCities, CITIES } from "@/lib/cities";
import { stateSlugForCode } from "@/lib/states";

export const BASE_URL = "https://haskerrealtygroup.com";

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

  // Property-management pages use the same inventory gate as bedroom filters —
  // emitting one for all ~550 cities created hundreds of near-identical thin
  // pages ("Crawled - currently not indexed" in GSC).
  const propertyManagementPages: SitemapEntry[] = [...filterCitySlugs].map((slug) => ({
    url: `${BASE_URL}/property-management/${slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5,
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
    // Some stored image values carry a stray Cloudinary "image/upload/" prefix
    // in front of an absolute URL; <image:loc> must be a fully-qualified URL,
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
