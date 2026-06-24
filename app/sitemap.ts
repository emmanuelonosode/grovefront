import type { MetadataRoute } from "next";
import { fetchPropertiesForSitemap, fetchProperties } from "@/lib/properties";
import { fetchPostsForSitemap } from "@/lib/blog";
import { fetchAgents } from "@/lib/agents";
import { fetchAllCities, CITIES } from "@/lib/cities";
import { stateSlugForCode } from "@/lib/states";

const BASE_URL = "https://haskerrealtygroup.com";

// Regenerate every 12 hours.
export const revalidate = 43200;

// Properties per sub-sitemap (well under the 50k URL / 50MB limits).
const PROP_CHUNK = 10000;
// Only high-demand bedroom long-tails, only for cities with enough inventory.
const BEDROOM_FILTERS = ["1-bedroom", "2-bedroom", "3-bedroom", "4-bedroom"];
const FILTER_MIN_LISTINGS = 12;

/**
 * Split the sitemap into a sitemap index so Google crawls each group
 * systematically (standard for large sites). IDs:
 *   0 = core (static + content), 1 = states, 2 = cities, 3+ = property chunks.
 * Next serves the index at /sitemap.xml and each group at /sitemap/<id>.xml.
 */
export async function generateSitemaps() {
  let count = 0;
  try {
    count = (await fetchProperties({ page_size: "1" })).count;
  } catch {
    /* API offline — still emit core/states/cities */
  }
  const propChunks = Math.max(1, Math.ceil(count / PROP_CHUNK));
  const ids = [{ id: 0 }, { id: 1 }, { id: 2 }];
  for (let i = 0; i < propChunks; i++) ids.push({ id: 3 + i });
  return ids;
}

// ── Group builders ────────────────────────────────────────────────────────────

async function coreSitemap(): Promise<MetadataRoute.Sitemap> {
  const [postsResult, agentsResult] = await Promise.allSettled([
    fetchPostsForSitemap(),
    fetchAgents(),
  ]);
  const posts = postsResult.status === "fulfilled" ? postsResult.value : [];
  const agents = agentsResult.status === "fulfilled" ? agentsResult.value : [];

  const pages: MetadataRoute.Sitemap = [
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

  // Apartments page only once real apartment inventory exists (it noindexes while empty).
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

async function statesSitemap(): Promise<MetadataRoute.Sitemap> {
  const dbCities = await fetchAllCities().catch(() => []);
  const stateCodes = new Set<string>([
    ...Object.values(CITIES).map((c) => c.stateCode),
    ...dbCities.map((c) => (c.state || "").toUpperCase()),
  ]);
  return [...stateCodes]
    .map((code) => stateSlugForCode(code))
    .filter(Boolean)
    .map((slug) => ({
      url: `${BASE_URL}/rentals/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.85,
    }));
}

async function citiesSitemap(): Promise<MetadataRoute.Sitemap> {
  const dbCities = await fetchAllCities().catch(() => []);
  const allCitySlugs = [...new Set([...Object.keys(CITIES), ...dbCities.map((c) => c.slug)])];

  const cityPages: MetadataRoute.Sitemap = allCitySlugs.map((slug) => ({
    url: `${BASE_URL}/rentals/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  // City bedroom-filter pages — substantial cities only.
  const filterCitySlugs = new Set<string>([
    ...Object.keys(CITIES),
    ...dbCities.filter((c) => (c.count ?? 0) >= FILTER_MIN_LISTINGS).map((c) => c.slug),
  ]);
  const cityFilterPages: MetadataRoute.Sitemap = [...filterCitySlugs].flatMap((slug) =>
    BEDROOM_FILTERS.map((filter) => ({
      url: `${BASE_URL}/rentals/${slug}/${filter}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  const propertyManagementPages: MetadataRoute.Sitemap = allCitySlugs.map((slug) => ({
    url: `${BASE_URL}/property-management/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...cityPages, ...cityFilterPages, ...propertyManagementPages];
}

async function propertiesSitemap(chunk: number): Promise<MetadataRoute.Sitemap> {
  const all = await fetchPropertiesForSitemap().catch(() => []);
  const start = chunk * PROP_CHUNK;
  // Property listings are the priority — highest non-homepage priority so Google
  // crawls and indexes every individual home.
  return all.slice(start, start + PROP_CHUNK).map(({ slug, lastModified }) => ({
    url: `${BASE_URL}/houses-for-rent/${slug}`,
    lastModified: new Date(lastModified),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  if (id === 0) return coreSitemap();
  if (id === 1) return statesSitemap();
  if (id === 2) return citiesSitemap();
  return propertiesSitemap(id - 3);
}
