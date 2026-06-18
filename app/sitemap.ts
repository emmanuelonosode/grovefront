import type { MetadataRoute } from "next";
import { fetchPropertiesForSitemap, fetchProperties } from "@/lib/properties";
import { fetchPostsForSitemap } from "@/lib/blog";
import { fetchAgents } from "@/lib/agents";
import { fetchAllCities, CITIES } from "@/lib/cities";
import { stateSlugForCode } from "@/lib/states";

const BASE_URL = "https://haskerrealtygroup.com";

// Regenerate every 12 hours — keeps sitemap fresh for twice-daily crawling
export const revalidate = 43200;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [propertiesResult, postsResult, agentsResult, dbCitiesResult] = await Promise.allSettled([
    fetchPropertiesForSitemap(),
    fetchPostsForSitemap(),
    fetchAgents(),
    fetchAllCities(),
  ]);

  const properties = propertiesResult.status === "fulfilled" ? propertiesResult.value : [];
  const posts      = postsResult.status      === "fulfilled" ? postsResult.value      : [];
  const agents     = agentsResult.status     === "fulfilled" ? agentsResult.value     : [];
  const dbCities   = dbCitiesResult.status   === "fulfilled" ? dbCitiesResult.value   : [];

  const allCitySlugs = [
    ...new Set([...Object.keys(CITIES), ...dbCities.map((c) => c.slug)]),
  ];

  if (propertiesResult.status === "rejected") console.warn("sitemap: properties fetch failed —", propertiesResult.reason);
  if (postsResult.status      === "rejected") console.warn("sitemap: blog fetch failed —",       postsResult.reason);
  if (agentsResult.status     === "rejected") console.warn("sitemap: agents fetch failed —",     agentsResult.reason);

  // ── Static pages ───────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                    lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/houses-for-rent`, lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/apply`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/agents`,        lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE_URL}/blog`,          lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE_URL}/careers`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/privacy`,       lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/terms`,         lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/accessibility`, lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];

  // Only list the apartments page once real apartment inventory exists — it
  // noindexes itself while empty, so we keep it out of the sitemap until then.
  try {
    const apt = await fetchProperties({ listing_type: "for-rent", type: "apartment", page_size: "1" });
    if (apt.count > 0) {
      staticPages.push({ url: `${BASE_URL}/apartments-for-rent`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 });
    }
  } catch {
    /* API offline — skip apartments URL */
  }

  const FILTER_SLUGS = [
    "condos", "townhouses", "residential-homes", "commercial-spaces", "land-lots",
    "1-bedroom", "2-bedroom", "3-bedroom", "4-bedroom", "5-bedroom",
  ];

  // ── State hub pages (/rentals/[state]) ─────────────────────────────────────
  const stateCodes = new Set<string>([
    ...Object.values(CITIES).map((c) => c.stateCode),
    ...dbCities.map((c) => (c.state || "").toUpperCase()),
  ]);
  const stateHubPages: MetadataRoute.Sitemap = [...stateCodes]
    .map((code) => stateSlugForCode(code))
    .filter(Boolean)
    .map((slug) => ({
      url: `${BASE_URL}/rentals/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.85,
    }));

  // ── City rental landing pages ──────────────────────────────────────────────
  const cityPages: MetadataRoute.Sitemap = allCitySlugs.map((slug) => ({
    url: `${BASE_URL}/rentals/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // ── City filter sub-pages (/rentals/[city]/[filter]) ──────────────────────
  const cityFilterPages: MetadataRoute.Sitemap = allCitySlugs.flatMap((slug) =>
    FILTER_SLUGS.map((filter) => ({
      url: `${BASE_URL}/rentals/${slug}/${filter}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }))
  );

  // ── Property management pages ─────────────────────────────────────────────
  const propertyManagementPages: MetadataRoute.Sitemap = allCitySlugs.map((slug) => ({
    url: `${BASE_URL}/property-management/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // ── Agent profile pages ────────────────────────────────────────────────────
  const agentPages: MetadataRoute.Sitemap = agents.map((agent) => ({
    url: `${BASE_URL}/agents/${agent.id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // ── All property listing pages (uses /api/v1/properties/sitemap/ — no row cap) ──
  const propertyPages: MetadataRoute.Sitemap = properties.map(({ slug, lastModified }) => ({
    url: `${BASE_URL}/houses-for-rent/${slug}`,
    lastModified: new Date(lastModified),
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  // ── All blog post pages (uses /api/v1/blog/sitemap/ — no row cap) ──────────
  const blogPages: MetadataRoute.Sitemap = posts.map(({ slug, lastModified }) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(lastModified),
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  // Highest-priority pages first so Googlebot sees them soonest
  return [
    ...staticPages,
    ...stateHubPages,
    ...cityPages,
    ...propertyManagementPages,
    ...cityFilterPages,
    ...propertyPages,
    ...blogPages,
    ...agentPages,
  ];
}
