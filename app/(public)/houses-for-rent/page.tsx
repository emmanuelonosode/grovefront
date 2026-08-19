import { Suspense } from "react";
import { fetchProperties, type PropertyListItemAPI } from "@/lib/properties";
import { PropertiesClient } from "@/components/public/PropertiesClient";
import { CityDirectory } from "@/components/public/CityDirectory";
import { fetchAllCities, toDirectoryCities } from "@/lib/cities";

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const BASE = "https://primefamilyhousing.com/houses-for-rent";
// The facet params. When any is set the URL is a filtered view — those must NOT each
// get their own canonical (infinite combinations = index bloat), so they consolidate to
// the clean hub. Only pure ?page=N pagination is allowed a self-referential canonical.
const FILTER_KEYS = ["q", "beds", "baths", "minPrice", "maxPrice", "minSqft", "maxSqft", "type", "pets", "listing_type", "sort"];

export async function generateMetadata({ searchParams }: PageProps) {
  const params = await searchParams;
  const pageNum = Math.max(1, parseInt((params.page as string) ?? "1", 10));
  const hasFilters = FILTER_KEYS.some((k) => params[k]);

  const canonicalQuery = new URLSearchParams();
  if (params.q) canonicalQuery.set("q", params.q as string);
  if (pageNum > 1) canonicalQuery.set("page", String(pageNum));
  const qs = canonicalQuery.toString();
  
  // Clean hub canonical, but preserve 'q' (city searches from /rentals/[city] pages) and 'page' 
  // so deep properties aren't orphan-canonicalized out of existence.
  const canonical = qs ? `${BASE}?${qs}` : BASE;
  // Distinct title per page so paginated pages aren't seen as duplicate titles.
  const pageSuffix = pageNum > 1 ? ` — Page ${pageNum}` : "";

  return {
    title: `Homes for Rent & Affordable Houses Nationwide${pageSuffix} | Prime Family Housing`,
    description:
      "Browse affordable homes, houses, and apartments for rent across the U.S. — move-in ready, pet-friendly options, transparent pricing, and 24-hour application decisions. Find your next rental by city.",
    alternates: { canonical },
    openGraph: {
      title: `Homes for Rent & Affordable Houses Nationwide${pageSuffix} | Prime Family Housing`,
      description: "Browse affordable houses for rent — inspected, move-in ready, 24-hour decisions.",
      type: "website",
      url: canonical,
    },
  };
}

const PAGE_SIZE = 24;

export default async function PropertiesPage({ searchParams }: PageProps) {
  const params      = await searchParams;
  const q           = params.q            as string | undefined;
  const beds        = params.beds         as string | undefined;
  const baths       = params.baths        as string | undefined;
  const minPrice    = params.minPrice     as string | undefined;
  const maxPrice    = params.maxPrice     as string | undefined;
  const minSqft     = params.minSqft      as string | undefined;
  const maxSqft     = params.maxSqft      as string | undefined;
  const propType    = params.type         as string | undefined;
  const pets        = params.pets         as string | undefined;
  const listingType = params.listing_type as string | undefined;
  const sort        = params.sort         as string | undefined;
  const page        = params.page         as string | undefined;
  const currentPage = Math.max(1, parseInt(page ?? "1", 10));

  let results: PropertyListItemAPI[] = [];
  let total = 0;

  // When no sort is specified by the user, use "diverse" so properties from
  // the same street/estate don't cluster together on the default browse page.
  // Search results + city directory are independent — fetch in parallel.
  const effectiveSort = sort ?? "diverse";
  const [propertiesResult, citiesResult] = await Promise.allSettled([
    fetchProperties({
      listing_type: listingType,
      q,
      beds,
      baths,
      min_price: minPrice,
      max_price: maxPrice,
      min_sqft: minSqft,
      max_sqft: maxSqft,
      type: propType,
      pets,
      sort: effectiveSort,
      page_size: String(PAGE_SIZE),
      page: String(currentPage),
    }),
    fetchAllCities(),
  ]);
  if (propertiesResult.status === "fulfilled") {
    results = propertiesResult.value.results;
    total   = propertiesResult.value.count;
  } /* else: API offline — render empty state */

  // Cities for the crawlable directory (server-rendered internal links to every
  // city page). Slim projection only — never ship full seoContent to the client.
  let mergedCities = toDirectoryCities([]);
  let cityCounts: Record<string, number> = {};
  if (citiesResult.status === "fulfilled") {
    const dbCities = citiesResult.value;
    mergedCities = toDirectoryCities(dbCities);
    cityCounts = Object.fromEntries(dbCities.map((c) => [c.slug, c.count]));
  } /* else: keep CITIES fallback */

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",       item: "https://primefamilyhousing.com" },
      { "@type": "ListItem", position: 2, name: "Homes for Rent", item: "https://primefamilyhousing.com/houses-for-rent" },
    ],
  };

  // ItemList of the current results — gives crawlers structured data for the listings on this page.
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Houses for rent",
    numberOfItems: results.length,
    itemListElement: results.slice(0, 24).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://primefamilyhousing.com/houses-for-rent/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <div>
      <h1 className="sr-only">Houses for Rent — Affordable Houses Nationwide | Prime Family Housing</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <Suspense>
        <PropertiesClient
          initialResults={results}
          initialTotal={total}
          initialPage={currentPage}
          initialQ={q}
          initialBeds={beds}
          initialBaths={baths}
          initialMinPrice={minPrice}
          initialMaxPrice={maxPrice}
          initialMinSqft={minSqft}
          initialMaxSqft={maxSqft}
          initialType={propType}
          initialPets={pets}
          initialListingType={listingType}
          initialSort={sort ?? "diverse"}
        />
      </Suspense>

      {/* Crawlable internal-link hub to every city landing page (national SEO). */}
      <CityDirectory cities={mergedCities} counts={cityCounts} />
    </div>
  );
}
