const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://admin.haskerrealtygroup.com";

// ─── API Response Types ────────────────────────────────────────────────────

export interface PropertyImageAPI {
  id: number;
  image_url: string | null;
  caption: string | null;
  is_primary: boolean;
  order: number;
}

export interface PropertyAmenityAPI {
  id: number;
  name: string;
}

export interface AmenityCategoryAPI {
  id: number | null;
  name: string;
  icon: string;
  amenities: PropertyAmenityAPI[];
}

export interface PropertyAgentAPI {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  email: string;
  avatar_url: string | null;
  agent_profile?: {
    license_number?: string;
    bio?: string;
    specialties?: string[];
  };
}

/** Shape returned by GET /api/v1/properties/ (list) */
export interface PropertyListItemAPI {
  id: number;
  slug: string;
  title: string;
  type: string;
  listing_type: string;
  status: string;
  price: number;
  price_label: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  address: string;
  city: string;
  state: string;
  neighborhood: string | null;
  is_featured: boolean;
  primary_image_url: string | null;
  image_urls?: string[];
  agent_name: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
}

/** Shape returned by GET /api/v1/properties/<slug>/ (detail) */
export interface PropertyDetailAPI extends PropertyListItemAPI {
  description: string;
  zip_code: string;
  lot_size: number | null;
  year_built: number | null;
  garage: number | null;
  stories: number | null;
  latitude: number | null;
  longitude: number | null;
  virtual_tour_url: string | null;
  tour_360_url: string | null;
  condition: string | null;
  cross_street: string | null;
  images: PropertyImageAPI[];
  amenities: PropertyAmenityAPI[];
  amenity_categories: AmenityCategoryAPI[];
  agent: PropertyAgentAPI;
  updated_at: string;
  recent_view_count?: number;
}

export interface PaginatedProperties {
  count: number;
  next: string | null;
  previous: string | null;
  results: PropertyListItemAPI[];
}

// ─── Fetch Functions ───────────────────────────────────────────────────────

export interface FetchPropertiesParams {
  listing_type?: string;
  q?: string;
  beds?: string;
  baths?: string;
  min_price?: string;
  max_price?: string;
  min_sqft?: string;
  max_sqft?: string;
  pets?: string;
  is_featured?: string;
  agent?: string;
  state?: string;
  city?: string;
  sort?: string;
  type?: string;
  page_size?: string;
  page?: string;
  lat_min?: string;
  lat_max?: string;
  lng_min?: string;
  lng_max?: string;
}

export async function fetchProperties(
  params?: FetchPropertiesParams
): Promise<PaginatedProperties> {
  const url = new URL(`${API_BASE}/api/v1/properties/`);
  if (params?.listing_type) url.searchParams.set("listing_type", params.listing_type);
  url.searchParams.set("is_published", "true");
  if (params?.q)           url.searchParams.set("q", params.q);
  if (params?.beds)        url.searchParams.set("beds", params.beds);
  if (params?.baths)       url.searchParams.set("baths", params.baths);
  if (params?.min_price)   url.searchParams.set("min_price", params.min_price);
  if (params?.max_price)   url.searchParams.set("max_price", params.max_price);
  if (params?.min_sqft)    url.searchParams.set("min_sqft", params.min_sqft);
  if (params?.max_sqft)    url.searchParams.set("max_sqft", params.max_sqft);
  if (params?.pets)        url.searchParams.set("pets", params.pets);
  if (params?.is_featured) url.searchParams.set("is_featured", params.is_featured);
  if (params?.agent)       url.searchParams.set("agent", params.agent);
  if (params?.state)       url.searchParams.set("state", params.state);
  if (params?.city)        url.searchParams.set("city__iexact", params.city);
  if (params?.sort)        url.searchParams.set("sort", params.sort);
  if (params?.type)        url.searchParams.set("type", params.type);
  if (params?.page_size)   url.searchParams.set("page_size", params.page_size);
  if (params?.page)        url.searchParams.set("page", params.page);
  if (params?.lat_min)     url.searchParams.set("lat_min", params.lat_min);
  if (params?.lat_max)     url.searchParams.set("lat_max", params.lat_max);
  if (params?.lng_min)     url.searchParams.set("lng_min", params.lng_min);
  if (params?.lng_max)     url.searchParams.set("lng_max", params.lng_max);

  // ISR-compatible: pages that call this export `revalidate = 300`, and a
  // `cache: "no-store"` fetch inside a static/ISR page is a hard error in
  // production (DYNAMIC_SERVER_USAGE → 500). In the browser the option is
  // ignored, so client-side search behaves the same.
  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`fetchProperties: ${res.status}`);
  const data = await res.json();
  if (data?.results) {
    data.results = data.results.map(cleanPropertyListItem);
  }
  return data;
}

// ─── Smart (AI) Search ──────────────────────────────────────────────────────

/** URL-param map produced from an AI-parsed natural-language query. */
export interface SmartFilters {
  q?: string;
  beds?: string;
  baths?: string;
  type?: string;
  pets?: string;
  minPrice?: string;
  maxPrice?: string;
  listing_type?: string;
  sort?: string;
}

/**
 * Heuristic: is this query worth sending to the AI parser?
 * Single city names ("Atlanta", "Charlotte NC") skip AI — the regex/relevance
 * path already nails them. Multi-word, numeric, or descriptive queries do.
 */
export function looksNaturalLanguage(q: string): boolean {
  const t = q.trim();
  if (!t) return false;
  if (t.split(/\s+/).length > 2) return true;
  if (/\d/.test(t)) return true;
  return /\b(under|over|below|pet|pets|dog|cat|bed|beds|bedroom|bath|baths|garage|parking|cheap|affordable|budget|with|near|family|yard|spacious)\b/i.test(t);
}

/**
 * POSTs a natural-language query to the backend AI parser. Returns a flat
 * URL-param map on success, or null to fall back to sending the raw `q`.
 */
export async function parseSmartQuery(q: string): Promise<SmartFilters | null> {
  try {
    const res = await fetch("/api/v1/properties/parse-query/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.ok || !data.filters) return null;

    const f = data.filters as Record<string, unknown>;
    const out: SmartFilters = {};
    if (f.city && f.state)  out.q = `${f.city}, ${f.state}`;
    else if (f.city)        out.q = String(f.city);
    else if (f.keywords)    out.q = String(f.keywords);
    if (f.beds != null)     out.beds = String(f.beds);
    if (f.baths != null)    out.baths = String(f.baths);
    if (f.type)             out.type = String(f.type);
    if (f.pets)             out.pets = "true";
    if (f.minPrice != null) out.minPrice = String(f.minPrice);
    if (f.maxPrice != null) out.maxPrice = String(f.maxPrice);
    if (f.listing_type)     out.listing_type = String(f.listing_type);
    if (f.sort)             out.sort = String(f.sort);
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

export async function fetchFeaturedProperties(): Promise<PropertyListItemAPI[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/properties/featured/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data: PropertyListItemAPI[] | PaginatedProperties = await res.json();
    const list = Array.isArray(data) ? data : (data as PaginatedProperties).results ?? [];
    return list.map(cleanPropertyListItem);
  } catch (err) {
    console.error("fetchFeaturedProperties failed:", err);
    return [];
  }
}

/**
 * Fetches properties hand-picked by the admin for the homepage "Available Now" section.
 * Uses homepage_featured=True; falls back to is_featured if none are set.
 */
export async function fetchHomepageProperties(): Promise<PropertyListItemAPI[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/properties/homepage/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data: PropertyListItemAPI[] | PaginatedProperties = await res.json();
    const list = Array.isArray(data) ? data : (data as PaginatedProperties).results ?? [];
    return list.map(cleanPropertyListItem);
  } catch (err) {
    console.error("fetchHomepageProperties failed:", err);
    return [];
  }
}

export async function fetchPropertyBySlug(slug: string): Promise<PropertyDetailAPI> {
  // ISR-compatible (see fetchProperties): no-store inside the ISR detail page
  // 500s in production. 300s matches the page's `revalidate`.
  const res = await fetch(`${API_BASE}/api/v1/properties/${slug}/`, {
    next: { revalidate: 300 },
  });
  if (res.status === 404) {
    const err = new Error("Property not found") as Error & { status: number };
    err.status = 404;
    throw err;
  }
  if (!res.ok) throw new Error(`fetchPropertyBySlug: ${res.status}`);
  const data = await res.json();
  return cleanPropertyListItem(data);
}

export async function fetchAllPropertySlugs(): Promise<string[]> {
  try {
    // Reuse the dedicated sitemap endpoint which returns ALL slugs without the 200-row page cap
    const res = await fetch(`${API_BASE}/api/v1/properties/sitemap/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data: { slug: string; updated_at: string }[] = await res.json();
    return data.map((p) => p.slug);
  } catch (err) {
    console.error("fetchAllPropertySlugs failed:", err);
    return [];
  }
}

/** For sitemap.ts: returns slug + lastModified for all active properties. Throws on failure so sitemap.ts returns a 500 (Googlebot retries) instead of an empty list (Googlebot deindexes). */
export interface SitemapProperty {
  slug: string;
  lastModified: string;
  image?: string;
  title?: string;
  city?: string;
  state?: string;
}

export async function fetchPropertiesForSitemap(): Promise<SitemapProperty[]> {
  const res = await fetch(`${API_BASE}/api/v1/properties/sitemap/`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Properties sitemap fetch failed: ${res.status}`);
  const data: { slug: string; updated_at: string; image?: string; title?: string; city?: string; state?: string }[] = await res.json();
  return data.map((p) => ({
    slug: p.slug,
    lastModified: p.updated_at,
    image: p.image || undefined,
    title: p.title,
    city: p.city,
    state: p.state,
  }));
}

export function cleanImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("image/upload/http")) {
    return url.replace("image/upload/", "");
  }
  return url;
}

export function cleanPropertyListItem<T>(p: T): T {
  if (!p) return p;
  const anyP = p as any;
  if (anyP.primary_image_url) {
    anyP.primary_image_url = cleanImageUrl(anyP.primary_image_url);
  }
  if (anyP.image_urls) {
    anyP.image_urls = anyP.image_urls.map(cleanImageUrl);
  }
  if (anyP.images) {
    anyP.images = anyP.images.map((img: any) => ({
      ...img,
      image_url: cleanImageUrl(img.image_url ?? img.url ?? img.image)
    }));
  }
  return p;
}

// ─── Mapper: API list item → Property type (for PropertyCard) ─────────────

import type { Property } from "@/types";

export function toPropertyCardShape(p: PropertyListItemAPI): Property {
  // Ensure the list item is fully cleaned before mapping
  const cleaned = cleanPropertyListItem(p);
  return {
    id:          String(cleaned.id),
    slug:        cleaned.slug,
    title:       cleaned.title,
    description: "",
    type:        cleaned.type as Property["type"],
    listingType: cleaned.listing_type as Property["listingType"],
    status:      cleaned.status as Property["status"],
    price:       cleaned.price,
    priceLabel:  cleaned.price_label || undefined,
    bedrooms:    cleaned.bedrooms,
    bathrooms:   cleaned.bathrooms,
    sqft:        cleaned.sqft,
    address:     cleaned.address,
    city:        cleaned.city,
    state:       cleaned.state,
    zip:         "",
    neighborhood: cleaned.neighborhood ?? undefined,
    images:      (cleaned.image_urls && cleaned.image_urls.length)
      ? cleaned.image_urls.map((url, i) => ({ id: `img-${i}`, url: cleanImageUrl(url), caption: cleaned.title, isPrimary: i === 0 }))
      : cleaned.primary_image_url
      ? [{ id: "primary", url: cleanImageUrl(cleaned.primary_image_url), caption: cleaned.title, isPrimary: true }]
      : [],
    amenities:   [],
    isFeatured:  cleaned.is_featured,
    isPublished: true,
    agentId:     "",
    createdAt:   cleaned.created_at,
    updatedAt:   cleaned.created_at,
  };
}
