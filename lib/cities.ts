/** City market data for SEO landing pages */

import { STATE_NAMES } from "@/lib/states";
import { toCardImageUrl } from "@/lib/utils";

export interface CityData {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
  tagline: string;
  heroImage: string;
  avgRent: string;
  population: string;
  marketHighlight: string;
  seoContent: string;
  /** Live inventory stats — present for DB-derived cities, absent for curated-only. */
  stats?: CityStats;
}

export const CITIES: Record<string, CityData> = {
  "atlanta-ga": {
    slug: "atlanta-ga",
    name: "Atlanta",
    state: "Georgia",
    stateCode: "GA",
    tagline: "Southern charm, city energy, affordable living.",
    heroImage: "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1600&q=80",
    avgRent: "$1,150",
    population: "6.1M metro",
    marketHighlight: "One of the most affordable large metros in the Southeast",
    seoContent: `Atlanta is one of the most affordable major cities in the US for renters. With a thriving job market anchored by Fortune 500 headquarters, world-class dining, and neighborhoods ranging from the historic charm of Grant Park to the modern energy of Midtown, Atlanta offers something for every budget.\n\nHasker & Co. Realty Group maintains a curated inventory of affordable rental homes and apartments across Atlanta's most desirable neighborhoods — including Buckhead, East Atlanta Village, Decatur, Sandy Springs, and Marietta. Our listings start from around $950/month for one-bedroom apartments, with family-sized homes available from $1,400/month.\n\nAtlanta's cost of living is approximately 5% below the national average, making it an ideal destination for families, young professionals, and anyone relocating to the Southeast. With MARTA public transit, Hartsfield-Jackson International Airport, and a rapidly expanding BeltLine trail system, Atlanta combines big-city amenities with Southern affordability.`,
  },
  "charlotte-nc": {
    slug: "charlotte-nc",
    name: "Charlotte",
    state: "North Carolina",
    stateCode: "NC",
    tagline: "The Queen City — fast-growing and family-friendly.",
    heroImage: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=80",
    avgRent: "$1,100",
    population: "2.7M metro",
    marketHighlight: "Fast-growing metro with competitive rental prices",
    seoContent: `Charlotte is one of the fastest-growing cities in the United States, yet it remains one of the most affordable major metros on the East Coast. As the second-largest banking center in the US, Charlotte offers strong employment opportunities alongside a lower cost of living than comparable cities.\n\nHasker & Co. Realty Group serves the greater Charlotte area with affordable rentals in neighborhoods like South End, NoDa, Plaza Midwood, University City, and Ballantyne. Studio apartments start from around $850/month, and family homes are available from $1,300/month.\n\nCharlotte's combination of mild climate, excellent schools, professional sports teams, and proximity to both the Blue Ridge Mountains and Atlantic beaches makes it a top relocation destination. The LYNX light rail connects key neighborhoods, and the cost of living sits about 4% below the national average.`,
  },
  "houston-tx": {
    slug: "houston-tx",
    name: "Houston",
    state: "Texas",
    stateCode: "TX",
    tagline: "Space City — big opportunities, affordable homes.",
    heroImage: "https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=1600&q=80",
    avgRent: "$1,050",
    population: "7.1M metro",
    marketHighlight: "Largest affordable housing supply in Texas",
    seoContent: `Houston offers one of the largest supplies of affordable rental housing among major US cities. With no state income tax, a diverse economy spanning energy, healthcare, aerospace, and technology, and a cost of living well below coastal metros, Houston is a top choice for budget-conscious renters.\n\nHasker & Co. Realty Group maintains extensive listings across Houston's sprawling metro — from the cultural richness of Montrose and the Heights to family-friendly suburbs like Katy, Sugar Land, and Pearland. One-bedroom apartments start from around $900/month, with spacious family homes from $1,350/month.\n\nHouston's lack of zoning laws creates a unique rental market with diverse housing options at every price point. The Texas Medical Center, NASA's Johnson Space Center, and the Port of Houston drive steady employment, while the city's world-renowned food scene and 640+ parks provide quality of life that rivals cities twice the cost.`,
  },
  "dallas-tx": {
    slug: "dallas-tx",
    name: "Dallas",
    state: "Texas",
    stateCode: "TX",
    tagline: "Where ambition meets affordability.",
    heroImage: "https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=1600&q=80",
    avgRent: "$1,100",
    population: "7.6M metro",
    marketHighlight: "Strong job market with competitive apartment pricing",
    seoContent: `The Dallas-Fort Worth metroplex is the fourth-largest metro area in the United States and one of the most affordable. With no state income tax, a booming technology sector, and corporate headquarters for AT&T, Southwest Airlines, and dozens of Fortune 500 companies, Dallas offers exceptional economic opportunity at a fraction of coastal city prices.\n\nHasker & Co. Realty Group serves the greater Dallas area including Uptown, Deep Ellum, Oak Lawn, Plano, Frisco, and Arlington. Apartments start from around $950/month, and family homes are available from $1,400/month across the metroplex.\n\nDallas combines a thriving arts and dining scene with family-friendly suburbs, excellent highway connectivity, and DART public transit. The cost of living is approximately 2% below the national average, and the rental market offers a wide range of options from modern downtown lofts to suburban single-family homes.`,
  },
  "nashville-tn": {
    slug: "nashville-tn",
    name: "Nashville",
    state: "Tennessee",
    stateCode: "TN",
    tagline: "Music City — where culture meets community.",
    heroImage: "https://images.unsplash.com/photo-1587162146766-e06b1189b907?w=1600&q=80",
    avgRent: "$1,200",
    population: "2.0M metro",
    marketHighlight: "Growing market with affordable options outside downtown",
    seoContent: `Nashville has experienced tremendous growth over the past decade, yet affordable rental options remain available throughout the metro — particularly in neighborhoods just outside the downtown core. With no state income tax on wages, a booming healthcare and music industry, and a vibrant cultural scene, Nashville attracts renters from across the country.\n\nHasker & Co. Realty Group offers affordable rentals across Nashville including East Nashville, Germantown, Berry Hill, Antioch, and Murfreesboro. One-bedroom apartments are available from around $1,000/month, and family homes start from $1,450/month.\n\nNashville's economy is anchored by healthcare giants like HCA and Vanderbilt, a thriving music and entertainment industry, and a rapidly growing tech sector. The city's walkable neighborhoods, excellent food scene, and strong sense of community make it an increasingly popular choice for families and young professionals seeking affordable Southern living.`,
  },
  "phoenix-az": {
    slug: "phoenix-az",
    name: "Phoenix",
    state: "Arizona",
    stateCode: "AZ",
    tagline: "Valley of the Sun — sunshine and savings.",
    heroImage: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600&q=80",
    avgRent: "$1,100",
    population: "4.9M metro",
    marketHighlight: "Strong affordable housing stock in a warm desert climate",
    seoContent: `Phoenix is the fifth-largest city in the United States and one of the most affordable major metros in the Sun Belt. With over 300 days of sunshine per year, a growing technology and healthcare sector, and rental prices significantly below California and Pacific Northwest competitors, Phoenix is ideal for budget-conscious renters seeking warm-weather living.\n\nHasker & Co. Realty Group serves the greater Phoenix metro including Scottsdale, Tempe, Mesa, Chandler, Gilbert, and Glendale. Apartments start from around $950/month, with family homes available from $1,400/month across the Valley.\n\nPhoenix's cost of living is approximately 3% below the national average, with particular savings in housing. The metro's extensive freeway system, growing light rail network, and proximity to outdoor recreation — from Camelback Mountain to Sedona day trips — provide a quality of life that makes Phoenix one of the fastest-growing cities in America.`,
  },
  "austin-tx": {
    slug: "austin-tx",
    name: "Austin",
    state: "Texas",
    stateCode: "TX",
    tagline: "Keep it affordable — tech hub with Texas prices.",
    heroImage: "https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1600&q=80",
    avgRent: "$1,250",
    population: "2.3M metro",
    marketHighlight: "Tech hub affordability outside the central zone",
    seoContent: `Austin is a top-tier technology hub with a cost of living that remains well below Silicon Valley, Seattle, or New York. While central Austin has seen price increases, affordable rental options are abundant in surrounding areas — and Hasker & Co. Realty Group specializes in finding them.\n\nOur Austin-area listings span neighborhoods like East Austin, Mueller, Pflugerville, Round Rock, Cedar Park, and Kyle. One-bedroom apartments start from around $1,050/month, and family homes are available from $1,500/month.\n\nAustin's economy is powered by major employers including Tesla, Apple, Google, Dell, and the University of Texas. Combined with no state income tax, a world-famous live music scene, excellent outdoor recreation along Lady Bird Lake and the Barton Creek Greenbelt, and consistently mild winters, Austin offers an exceptional quality-to-cost ratio for renters willing to explore beyond the downtown core.`,
  },
  "miami-fl": {
    slug: "miami-fl",
    name: "Miami",
    state: "Florida",
    stateCode: "FL",
    tagline: "Gateway to the Americas — tropical living within reach.",
    heroImage: "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=1600&q=80",
    avgRent: "$1,350",
    population: "6.1M metro",
    marketHighlight: "Targeted affordable options in the metro area",
    seoContent: `Miami is known for its beaches, international culture, and vibrant nightlife — but it also has pockets of genuinely affordable housing throughout the greater metro area. With no state income tax, a growing tech and finance sector, and year-round tropical weather, Miami attracts renters from across the globe.\n\nHasker & Co. Realty Group focuses on affordable Miami-area rentals in neighborhoods like Little Havana, Hialeah, Kendall, Homestead, North Miami, and Doral. One-bedroom apartments start from around $1,100/month, and family homes are available from $1,600/month.\n\nWhile South Beach and Brickell command premium prices, the greater Miami metro offers a wide range of budget-friendly options with easy access to the beach, diverse cuisine, and a thriving cultural scene. Miami's Metrorail and Metrobus systems connect affordable neighborhoods to employment centers, making it possible to enjoy Miami living without Miami Beach prices.`,
  },
};

export function getCityBySlug(slug: string): CityData | undefined {
  return CITIES[slug];
}

export function getAllCitySlugs(): string[] {
  return Object.keys(CITIES);
}

// ── DB-derived city stats ─────────────────────────────────────────────────────

export interface CityStats {
  city: string;
  state: string;
  slug: string;
  count: number;
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  listing_types: string[];
  // Enriched fields (optional — older backend deploys omit them).
  bedrooms?: Record<string, number>;
  types?: Record<string, number>;
  sqft?: { min: number; max: number; avg: number } | null;
  zips?: string[];
  neighborhoods?: string[];
  newest_listed?: string | null;
  last_updated?: string | null;
  image?: string;
}

/**
 * Mirrors Django's slugify(f"{city}-{state}") byte-for-byte — the backend
 * generates city slugs this way, and every internal link to /rentals/[city]
 * must agree with it. Never hand-build city slugs anywhere else.
 */
export function cityToSlug(city: string, state: string): string {
  return `${city}-${state}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[-\s]+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://admin.haskerrealtygroup.com";

/**
 * Fetches distinct cities with published rental listings from the API.
 * Safe to call at build time — never throws, returns [] on any error.
 */
export async function fetchAllCities(): Promise<CityStats[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/properties/cities/`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ── Generic city content engine ───────────────────────────────────────────────
// Every non-curated city page used to share one 2-paragraph template and one
// stock hero photo — 550+ near-duplicate thin pages that Google left unindexed.
// Content is now composed from the city's real inventory facts, with phrasing
// picked by a hash of the slug: deterministic (stable across ISR regenerations)
// but different city to city.

function slugHash(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

const pickVariant = <T,>(variants: T[], seed: number, salt: number): T =>
  variants[(seed + salt) % variants.length];

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const num = (n: number) => n.toLocaleString("en-US");

const BEDROOM_WORDS: Record<string, string> = {
  "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
  "6": "six", "7": "seven", "8": "eight",
};

const TYPE_LABELS: Record<string, [string, string]> = {
  residential: ["single-family home", "single-family homes"],
  apartment: ["apartment", "apartments"],
  townhouse: ["townhouse", "townhouses"],
  condo: ["condo", "condos"],
};

function listJoin(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function bedroomPhrase(bedrooms: Record<string, number>): string {
  const parts = Object.entries(bedrooms)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([bed, n]) => {
      const word = BEDROOM_WORDS[bed] ?? bed;
      return `${num(n)} ${word}-bedroom ${n === 1 ? "home" : "homes"}`;
    });
  return listJoin(parts);
}

function typePhrase(types: Record<string, number>): string {
  const parts = Object.entries(types)
    .sort(([, a], [, b]) => b - a)
    .map(([t, n]) => {
      const label = TYPE_LABELS[t] ?? [t, `${t}s`];
      return `${num(n)} ${n === 1 ? label[0] : label[1]}`;
    });
  return listJoin(parts);
}

function buildSeoContent(stats: CityStats, seed: number): string {
  const { city } = stats;
  const stateName = STATE_NAMES[stats.state] ?? stats.state;
  const listingWord = stats.count === 1 ? "rental listing" : "rental listings";
  const hasRange =
    stats.min_price != null && stats.max_price != null && stats.max_price > stats.min_price;

  const paragraphs: string[] = [];

  // Intro — inventory + price range
  const priceClause = hasRange
    ? ` priced from ${usd(stats.min_price!)} to ${usd(stats.max_price!)} per month`
    : stats.avg_price
      ? ` averaging ${usd(stats.avg_price)} per month`
      : "";
  paragraphs.push(pickVariant([
    `Looking for a house or apartment to rent in ${city}, ${stateName}? Hasker & Co. Realty Group has ${num(stats.count)} verified ${listingWord}${priceClause} available right now. Every home is inspected and move-in ready, with transparent pricing and no hidden administrative fees.`,
    `Hasker & Co. Realty Group currently lists ${num(stats.count)} verified ${listingWord} in ${city}, ${stateName}${priceClause}. Each one is inspected, move-in ready, and priced transparently — the rent you see is the rent you pay.`,
    `${city}, ${stateName} renters can choose from ${num(stats.count)} verified ${listingWord} with Hasker & Co. Realty Group${priceClause}. All of our ${city} homes are inspected and move-in ready, with no hidden administrative fees at any step.`,
  ], seed, 0));

  // Inventory make-up — bedrooms, property types, square footage
  const mixSentences: string[] = [];
  if (stats.bedrooms && Object.keys(stats.bedrooms).length > 0) {
    mixSentences.push(pickVariant([
      `Current availability includes ${bedroomPhrase(stats.bedrooms)}.`,
      `Right now that inventory breaks down into ${bedroomPhrase(stats.bedrooms)}.`,
    ], seed, 1));
  }
  if (stats.types && Object.keys(stats.types).length > 1) {
    mixSentences.push(`By property type, you'll find ${typePhrase(stats.types)}.`);
  }
  if (stats.sqft) {
    mixSentences.push(pickVariant([
      `Homes range from ${num(stats.sqft.min)} to ${num(stats.sqft.max)} square feet, averaging about ${num(stats.sqft.avg)} sq ft.`,
      `Living space runs between ${num(stats.sqft.min)} and ${num(stats.sqft.max)} square feet — around ${num(stats.sqft.avg)} sq ft on average.`,
    ], seed, 2));
  }
  if (mixSentences.length > 0) paragraphs.push(mixSentences.join(" "));

  // Coverage — ZIP codes and neighborhoods
  const areaSentences: string[] = [];
  const zips = stats.zips ?? [];
  if (zips.length > 1) {
    areaSentences.push(pickVariant([
      `Our ${city} listings span ZIP ${zips.length === 2 ? "codes" : "codes including"} ${listJoin(zips.slice(0, 6))}.`,
      `You'll find our ${city} homes across ZIP codes ${listJoin(zips.slice(0, 6))}.`,
    ], seed, 3));
  }
  const hoods = (stats.neighborhoods ?? []).filter(
    (n) => n.toLowerCase() !== city.toLowerCase()
  );
  if (hoods.length > 0) {
    areaSentences.push(`Popular areas include ${listJoin(hoods.slice(0, 5))}.`);
  }
  if (areaSentences.length > 0) paragraphs.push(areaSentences.join(" "));

  // Closer — recency + application CTA
  const newest = stats.newest_listed ? new Date(stats.newest_listed) : null;
  const newestClause =
    newest && !isNaN(newest.getTime())
      ? ` Our newest ${city} listing was added in ${newest.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}, and inventory updates daily.`
      : "";
  paragraphs.push(pickVariant([
    `Apply online in under 10 minutes and get a decision within 24 hours.${newestClause} Once approved, you can sign and move in on your schedule.`,
    `Every listing accepts online applications — under 10 minutes to complete, with decisions within 24 hours.${newestClause}`,
    `When you find a fit, apply online in about 10 minutes; we review every application within 24 hours.${newestClause} Move-in dates are flexible once you're approved.`,
  ], seed, 4));

  return paragraphs.join("\n\n");
}

/**
 * Builds a CityData object from DB stats for cities not in the CITIES constant.
 */
export function buildGenericCityData(stats: CityStats): CityData {
  const seed = slugHash(stats.slug);
  const stateName = STATE_NAMES[stats.state] ?? stats.state;
  const avgRent = stats.avg_price ? usd(stats.avg_price) : "Contact us";
  const listingWord = stats.count !== 1 ? "listings" : "listing";
  const highlight =
    stats.min_price && stats.count > 1
      ? `${num(stats.count)} homes from ${usd(stats.min_price)}/mo`
      : `${num(stats.count)} active rental ${listingWord}`;
  return {
    slug: stats.slug,
    name: stats.city,
    state: stateName,
    stateCode: stats.state,
    tagline: pickVariant([
      `Houses and apartments for rent in ${stats.city}, ${stateName}.`,
      `Move-in ready rental homes across ${stats.city}, ${stateName}.`,
      `Verified, affordable rentals in ${stats.city}, ${stateName}.`,
    ], seed, 5),
    heroImage:
      stats.image ||
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1600&q=80",
    avgRent,
    population: "",
    marketHighlight: highlight,
    seoContent: buildSeoContent(stats, seed),
    stats,
  };
}

/**
 * City FAQ content — single source for BOTH the FAQPage JSON-LD and the visible
 * FAQ section (Google requires the markup to match what's on the page). Answers
 * use the city's real inventory numbers when stats are available.
 */
export function buildCityFaqs(city: CityData): { q: string; a: string }[] {
  const s = city.stats;
  const faqs: { q: string; a: string }[] = [];

  faqs.push({
    q: `How much does it cost to rent a home in ${city.name}?`,
    a:
      s?.min_price && s?.max_price && s.max_price > s.min_price
        ? `Rentals in ${city.name} currently range from ${usd(s.min_price)} to ${usd(s.max_price)} per month, with an average around ${city.avgRent}/month. Hasker & Co. Realty Group shows transparent pricing on every listing — no hidden fees.`
        : `The average rent in ${city.name} starts around ${city.avgRent}/month. Hasker & Co. Realty Group offers affordable, move-in ready rentals across ${city.name} with transparent pricing on every listing.`,
  });

  if (s?.bedrooms && Object.keys(s.bedrooms).length > 0) {
    const beds = Object.keys(s.bedrooms).sort((a, b) => Number(a) - Number(b));
    const bedList = beds.length === 1 ? `${beds[0]}-bedroom` : `${beds.slice(0, -1).join(", ")} and ${beds[beds.length - 1]}-bedroom`;
    faqs.push({
      q: `What size homes are available for rent in ${city.name}?`,
      a: `Hasker & Co. Realty Group currently lists ${bedList} homes in ${city.name}, ${city.stateCode} — ${bedroomPhrase(s.bedrooms)} in total${s.sqft ? `, ranging from ${num(s.sqft.min)} to ${num(s.sqft.max)} square feet` : ""}.`,
    });
  } else {
    faqs.push({
      q: `Are there 2-bedroom and 3-bedroom homes for rent in ${city.name}?`,
      a: `Yes. Hasker & Co. Realty Group lists 1, 2, 3, and 4-bedroom homes for rent in ${city.name}, ${city.stateCode}. Family-sized homes typically start around ${city.avgRent}/month.`,
    });
  }

  const zips = (s?.zips ?? []).filter(Boolean);
  if (zips.length > 1) {
    faqs.push({
      q: `Which areas of ${city.name} have homes for rent?`,
      a: `Our ${city.name} inventory spans ZIP codes ${listJoin(zips)}. Every listing shows its exact address and neighborhood before you apply.`,
    });
  }

  faqs.push({
    q: `How do I apply for a rental in ${city.name}?`,
    a: `Apply online at haskerrealtygroup.com/apply in under 10 minutes. We review every application within 24 hours. No paper forms, no runaround.`,
  });
  faqs.push({
    q: `Does Hasker & Co. have pet-friendly rentals in ${city.name}?`,
    a: `Yes. Several of our ${city.name} listings are pet-friendly. Pet policies are disclosed upfront on every listing so you never waste time on a home that won't accept your pet.`,
  });
  faqs.push({
    q: `Are there any hidden fees when renting through Hasker & Co. in ${city.name}?`,
    a: `No. The price listed is the price you pay. Standard upfront costs are a security deposit (typically 1–2 months rent) and the first month's rent. All fees are shown before you apply.`,
  });

  return faqs;
}

// ── Directory projection ───────────────────────────────────────────────────────
// The homepage/listing directory components (StateDirectory, CityDirectory) only
// render a name, count, and photo — but were being handed full CityData for all
// ~565 cities, which serialized every city's multi-paragraph seoContent + stats
// into the page (≈1MB of the homepage). Pass this slim shape instead.

export interface DirectoryCity {
  slug: string;
  name: string;
  state: string;
  stateCode: string;
  heroImage: string;
  avgRent: string;
}

/** Curated cities first (with their editorial photos), then every DB city — slim. */
export function toDirectoryCities(dbCities: CityStats[]): DirectoryCity[] {
  const out: DirectoryCity[] = [];
  const seen = new Set<string>();
  for (const c of Object.values(CITIES)) {
    out.push({
      slug: c.slug, name: c.name, state: c.state, stateCode: c.stateCode,
      heroImage: toCardImageUrl(c.heroImage), avgRent: c.avgRent,
    });
    seen.add(c.slug);
  }
  for (const c of dbCities) {
    if (seen.has(c.slug)) continue;
    out.push({
      slug: c.slug,
      name: c.city,
      state: STATE_NAMES[c.state] ?? c.state,
      stateCode: c.state,
      heroImage: c.image ? toCardImageUrl(c.image) : "",
      avgRent: c.avg_price ? usd(c.avg_price) : "",
    });
  }
  return out;
}

/**
 * Resolves a city slug to CityData — checks hardcoded CITIES first, then DB.
 * Returns null if the slug doesn't exist in either source.
 */
export async function resolveCityData(slug: string): Promise<CityData | null> {
  const dbCities = await fetchAllCities();
  const stats = dbCities.find((c) => c.slug === slug);
  const hardcoded = getCityBySlug(slug);
  // Curated cities keep their hand-written prose but still carry live stats
  // (used for FAQ answers and market stat blocks).
  if (hardcoded) return stats ? { ...hardcoded, stats } : hardcoded;
  return stats ? buildGenericCityData(stats) : null;
}
