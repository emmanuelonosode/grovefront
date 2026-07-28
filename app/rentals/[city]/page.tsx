import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  Clock, ShieldCheck, PawPrint, Home, ArrowRight,
  Bed, Star, TrendingUp, Users, Building,
} from "lucide-react";
import {
  CITIES, getCityBySlug,
  fetchAllCities, buildGenericCityData, buildCityFaqs,
  type CityData,
} from "@/lib/cities";
import { realEstateAgentSchema } from "@/lib/business";
import { fetchProperties, toPropertyCardShape } from "@/lib/properties";
import { PropertyCard } from "@/components/public/PropertyCard";
import { Button } from "@/components/ui/Button";
import { CityLeadCapture } from "@/components/public/CityLeadCapture";
import { StateHub } from "@/components/public/StateHub";
import { getStateBySlug, stateSlugForCode, STATE_NAMES } from "@/lib/states";

export const revalidate = 300;

/* ── Static Params ──────────────────────────────────────────────────── */

export async function generateStaticParams() {
  // Bypassing build-time generation to avoid backend timeouts.
  // Pages will be generated on-demand (ISR) instead.
  return [];
}

/* ── Dynamic SEO Metadata ───────────────────────────────────────────── */

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> }
): Promise<Metadata> {
  const { city: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).toLowerCase().replace(/\s+/g, "-");

  // State hub (e.g. /rentals/georgia) — distinct from city pages.
  // Only states with actual inventory get a page; the other ~40 state slugs
  // must 404 (they were rendering empty hubs — soft-404s in Search Console).
  const stateInfo = getStateBySlug(slug);
  if (stateInfo) {
    const dbCities = await fetchAllCities().catch(() => []);
    const hasInventory =
      dbCities.some((c) => (c.state || "").toUpperCase() === stateInfo.code) ||
      Object.values(CITIES).some((c) => c.stateCode === stateInfo.code);
    if (!hasInventory) return { title: "Not Found" };

    const title = `Houses for Rent in ${stateInfo.name} | PrimeFamilyHousing`;
    const description = `Browse affordable houses for rent across ${stateInfo.name} — move-in ready homes in cities and communities statewide. Pet-friendly options, transparent pricing, 24-hour application decisions.`;
    const url = `https://primefamilyhousing.com/rentals/${stateInfo.slug}`;
    return {
      title,
      description,
      keywords: [
        `houses for rent in ${stateInfo.name}`,
        `homes for rent in ${stateInfo.name}`,
        `single family homes for rent in ${stateInfo.name}`,
        `affordable houses for rent in ${stateInfo.name}`,
        `${stateInfo.code} rentals`,
        `pet friendly rentals ${stateInfo.name}`,
        `cheap houses for rent ${stateInfo.name}`,
      ],
      alternates: { canonical: url },
      openGraph: { title, description, type: "website", url },
      twitter: { card: "summary_large_image", title, description },
    };
  }

  let city = getCityBySlug(slug);
  if (!city) {
    const dbCities = await fetchAllCities();
    const stats = dbCities.find((c) => c.slug === slug);
    if (!stats) return { title: "City Not Found" };
    city = buildGenericCityData(stats);
  }

  const title = `Houses for Rent in ${city.name}, ${city.stateCode} | PrimeFamilyHousing`;
  const description = `Browse houses for rent in ${city.name}, ${city.stateCode} — 1 to 4 bedrooms from ${city.avgRent}/mo. Inspected, move-in ready, pet-friendly options. Decisions in 24 hours.`;
  const url = `https://primefamilyhousing.com/rentals/${slug}`;

  return {
    title,
    description,
    keywords: [
      `houses for rent in ${city.name}`,
      `houses for rent in ${city.name}, ${city.stateCode}`,
      `homes for rent ${city.name} ${city.stateCode}`,
      `2 bedroom houses for rent ${city.name}`,
      `3 bedroom houses for rent ${city.name}`,
      `pet friendly rentals ${city.name}`,
      `${city.name} rentals near me`,
      `move-in ready homes for rent ${city.name}`,
      `family homes for rent ${city.name}`,
      `${city.name} ${city.stateCode} rental homes`,
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "website",
      url,
      images: [{ url: city.heroImage, width: 1600, height: 900, alt: `Affordable homes for rent in ${city.name}, ${city.stateCode}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [city.heroImage],
    },
  };
}

/* ── Trust badges ───────────────────────────────────────────────────── */

const TRUST_BADGES = [
  { icon: Clock,       label: "24-Hour Decisions" },
  { icon: ShieldCheck, label: "Move-In Ready" },
  { icon: PawPrint,    label: "Pet-Friendly Options" },
  { icon: Star,        label: "Transparent Pricing" },
  { icon: Users,       label: "2,000+ Families Housed" },
  { icon: Home,        label: "Verified Listings Only" },
];

/* ── Market stats ───────────────────────────────────────────────────── */

function MarketStats({ city }: { city: CityData }) {
  // Generic (DB-derived) cities have no population figure — show a real
  // inventory stat instead of the old "Metro Pop. N/A".
  const beds = city.stats?.bedrooms
    ? Object.keys(city.stats.bedrooms).map(Number).sort((a, b) => a - b)
    : [];
  const middle = city.population
    ? { icon: Users, label: "Metro Pop.", value: city.population }
    : beds.length > 0
      ? { icon: Bed, label: "Bedroom Sizes", value: beds.length === 1 ? `${beds[0]} BR` : `${beds[0]}–${beds[beds.length - 1]} BR` }
      : { icon: Clock, label: "Decision Time", value: "24 hours" };
  const stats = [
    { icon: TrendingUp, label: "Avg. Rent",   value: city.avgRent + "/mo" },
    middle,
    { icon: Building,   label: "Market",       value: city.marketHighlight },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-white border border-neutral-100 rounded-sm p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-sm bg-brand-light flex items-center justify-center shrink-0">
            <s.icon size={18} className="text-brand" />
          </div>
          <div>
            <p className="text-xs text-neutral-500 tracking-wide uppercase">{s.label}</p>
            <p className="text-base font-semibold text-brand-dark mt-0.5">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Page Component ─────────────────────────────────────────────────── */

export default async function CityRentalsPage(
  { params }: { params: Promise<{ city: string }> }
) {
  const { city: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).toLowerCase().replace(/\s+/g, "-");

  // ── State hub page (e.g. /rentals/georgia) ──────────────────────────────
  const stateInfo = getStateBySlug(slug);
  if (stateInfo) {
    const dbCities = await fetchAllCities().catch(() => []);
    const inState = dbCities.filter((c) => (c.state || "").toUpperCase() === stateInfo.code);

    const cityMap = new Map<string, CityData>();
    for (const c of inState) cityMap.set(c.slug, CITIES[c.slug] ?? buildGenericCityData(c));
    for (const cd of Object.values(CITIES)) {
      if (cd.stateCode === stateInfo.code && !cityMap.has(cd.slug)) cityMap.set(cd.slug, cd);
    }

    // No cities and no listings in this state → hard 404, not an empty hub.
    // Previously every one of the 50 state slugs rendered a page (soft 404s).
    if (cityMap.size === 0) notFound();

    const counts: Record<string, number> = Object.fromEntries(inState.map((c) => [c.slug, c.count]));
    const totalListings = inState.reduce((s, c) => s + (c.count || 0), 0);

    const stateTotals = new Map<string, number>();
    for (const c of dbCities) {
      const code = (c.state || "").toUpperCase();
      if (!code || code === stateInfo.code) continue;
      stateTotals.set(code, (stateTotals.get(code) ?? 0) + (c.count || 0));
    }
    const otherStates = [...stateTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([code]) => ({ name: STATE_NAMES[code] ?? code, slug: stateSlugForCode(code) }))
      .filter((s) => s.slug);

    return (
      <StateHub
        state={stateInfo}
        cities={[...cityMap.values()]}
        counts={counts}
        totalListings={totalListings}
        otherStates={otherStates}
      />
    );
  }

  // Always fetch live city stats (cached 1h) — generic cities are built from
  // them, curated cities carry them for FAQ/stat blocks, and the sibling-city
  // links below need the full list either way.
  const dbCities = await fetchAllCities();
  const stats = dbCities.find((c) => c.slug === slug);
  const isCurated = Boolean(getCityBySlug(slug));
  let city = getCityBySlug(slug);
  if (city) {
    if (stats) city = { ...city, stats };
  } else {
    if (!stats) notFound();
    city = buildGenericCityData(stats);
  }

  // Fetch real rental listings for this city from the API.
  // Do NOT swallow failures: rendering an empty grid on API outage serves
  // Google a soft 404. Throwing gives a 5xx, which Google retries.
  const data = await fetchProperties({ city: city.name, state: city.stateCode, listing_type: "for-rent", page_size: "24" });
  const properties = data.results.map(toPropertyCardShape);
  const totalCount = data.count;

  // Generic DB-derived city pages are pure listing pages — with zero listings
  // they're thin soft-404s. Curated CITIES pages keep rendering (rich content).
  if (totalCount === 0 && !isCurated) notFound();

  // JSON-LD: CollectionPage + BreadcrumbList
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Affordable Homes for Rent in ${city.name}, ${city.stateCode}`,
    description: `Browse budget-friendly rental homes in ${city.name}, ${city.state}. Move-in ready homes, 24-hour application decisions.`,
    url: `https://primefamilyhousing.com/rentals/${slug}`,
    isPartOf: { "@type": "WebSite", name: "PrimeFamilyHousing", url: "https://primefamilyhousing.com" },
    about: {
      "@type": "City",
      name: city.name,
      containedInPlace: { "@type": "State", name: city.state, containedInPlace: { "@type": "Country", name: "United States" } },
    },
    provider: realEstateAgentSchema(),
  };

  const stateSlug = stateSlugForCode(city.stateCode);

  // Same-state sibling cities, biggest inventory first.
  const siblingCities = dbCities
    .filter((c) => (c.state || "").toUpperCase() === city.stateCode && c.slug !== slug)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://primefamilyhousing.com" },
      { "@type": "ListItem", position: 2, name: "Properties", item: "https://primefamilyhousing.com/houses-for-rent" },
      { "@type": "ListItem", position: 3, name: city.state, item: `https://primefamilyhousing.com/rentals/${stateSlug}` },
      { "@type": "ListItem", position: 4, name: `${city.name}, ${city.stateCode}`, item: `https://primefamilyhousing.com/rentals/${slug}` },
    ],
  };

  // Single FAQ source for both the JSON-LD and the visible section — Google
  // requires FAQPage markup to match on-page content.
  const faqs = buildCityFaqs(city);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── HERO — full-bleed photo, forest gradient ─────────────── */}
      <section className="relative min-h-[520px] lg:min-h-[600px] flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={city.heroImage}
            alt={`Affordable rental homes in ${city.name}, ${city.stateCode}`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-forest-deep/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-12 pb-12 pt-32">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5 hero-animate">
            <ol className="flex items-center gap-2 text-xs text-white/60">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li className="text-white/30">/</li>
              <li><Link href="/communities" className="hover:text-white transition-colors">Communities</Link></li>
              <li className="text-white/30">/</li>
              <li><Link href={`/rentals/${stateSlug}`} className="hover:text-white transition-colors">{city.state}</Link></li>
              <li className="text-white/30">/</li>
              <li className="text-white font-medium">{city.name}, {city.stateCode}</li>
            </ol>
          </nav>

          <p className="text-secondary-container text-[14px] leading-5 font-semibold tracking-widest uppercase mb-3 hero-animate" style={{ animationDelay: "0ms" }}>
            Community Profile
          </p>
          <h1 className="font-serif font-bold text-white drop-shadow-md hero-animate text-[2.2rem] leading-[1.15] sm:text-[3rem] lg:text-[3.5rem] lg:leading-[1.16]" style={{ letterSpacing: "-0.02em", animationDelay: "80ms" }}>
            Homes for Rent in {city.name}, {city.stateCode}
          </h1>

          <div className="flex flex-wrap gap-2 mt-5 hero-animate" style={{ animationDelay: "130ms" }}>
            {totalCount > 0 && (
              <span className="bg-earth-beige text-on-secondary-container text-[12px] leading-4 px-3 py-1 rounded-full font-semibold tabular-nums">
                {totalCount} Home{totalCount === 1 ? "" : "s"} Available
              </span>
            )}
            <span className="bg-surface/90 text-primary text-[12px] leading-4 px-3 py-1 rounded-full backdrop-blur-sm">
              from {city.avgRent}/mo
            </span>
            <span className="bg-surface/90 text-primary text-[12px] leading-4 px-3 py-1 rounded-full backdrop-blur-sm">
              Updated daily
            </span>
          </div>

          <p className="text-earth-beige text-[17px] sm:text-[18px] leading-[1.55] max-w-2xl mt-4 drop-shadow-md hero-animate" style={{ animationDelay: "160ms" }}>
            {city.tagline} Browse affordable, move-in ready houses — decisions in 24 hours.
          </p>

          <div className="flex flex-wrap gap-3 mt-8 hero-animate" style={{ animationDelay: "240ms" }}>
            <Link
              href={`/houses-for-rent?q=${encodeURIComponent(city.name)}`}
              className="inline-flex items-center gap-2 bg-primary text-on-primary text-[14px] tracking-[0.05em] font-semibold px-8 py-3.5 rounded-full hover:bg-primary-container transition-colors active:scale-95 shadow-md"
            >
              Browse {city.name} Inventory
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-surface/90 backdrop-blur-sm text-primary text-[14px] tracking-[0.05em] font-semibold px-8 py-3.5 rounded-full hover:bg-surface transition-colors active:scale-95"
            >
              Apply Now — 10 Minutes
            </Link>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────── */}
      <section className="bg-brand-dark border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-6 overflow-x-auto scrollbar-hide">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="flex items-center gap-2.5 shrink-0">
                <b.icon size={16} className="text-brand" />
                <span className="text-white/80 text-xs font-medium tracking-wide whitespace-nowrap">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARKET STATS ─────────────────────────────────────────── */}
      <section className="bg-brand-light border-b border-brand-muted">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
          <MarketStats city={city} />
        </div>
      </section>

      {/* ── QUICK FILTERS ────────────────────────────────────────── */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 mb-3">
            Find your fit in {city.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "1 Bed",       href: `/rentals/${slug}/1-bedroom`,  Icon: Bed },
              { label: "2 Beds",      href: `/rentals/${slug}/2-bedroom`,  Icon: Bed },
              { label: "3 Beds",      href: `/rentals/${slug}/3-bedroom`,  Icon: Bed },
              { label: "4 Beds",      href: `/rentals/${slug}/4-bedroom`,  Icon: Bed },
              // No Condos/Townhouses links: PrimeFamilyHousing rents single-family
              // houses only, so those filter URLs 404 in every city (the route calls
              // notFound() on zero matches). Linking them from all ~760 city pages
              // pointed ~1,500 internal links at dead ends, burning crawl budget and
              // leaking internal PageRank out of the pages we actually want ranked.
              { label: "Pet-friendly", href: `/houses-for-rent?q=${encodeURIComponent(city.name)}&pets=true`, Icon: PawPrint },
            ].map(({ label, href, Icon }) => (
              <Link
                key={label}
                href={href}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 text-sm font-medium text-brand-dark hover:border-brand hover:text-brand hover:bg-brand-light transition-colors"
              >
                <Icon size={14} className="text-brand" /> {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROPERTY GRID ────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-brand text-xs font-semibold tracking-[0.2em] uppercase mb-2">Available Now</p>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark">
                Homes in {city.name}
              </h2>
            </div>
            <Link
              href={`/houses-for-rent?q=${encodeURIComponent(city.name)}`}
              className="hidden sm:flex items-center gap-2 text-sm text-brand font-medium hover:underline"
            >
              {totalCount > properties.length ? `View all ${totalCount} listings` : `View all ${city.name} listings`}
              <ArrowRight size={14} />
            </Link>
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-neutral-100 rounded-sm overflow-hidden">
              <div className="relative aspect-[4/3] lg:aspect-auto min-h-[260px] bg-neutral-100">
                <Image
                  src="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=900&q=80"
                  alt={`Affordable home in ${city.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-black/35" />
              </div>
              <div className="bg-white p-10 lg:p-12 flex flex-col justify-center">
                <Home size={32} className="text-brand mb-5" />
                <h3 className="font-serif text-2xl font-bold text-brand-dark mb-3">
                  New {city.name} listings coming soon
                </h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                  We&apos;re actively expanding our inventory in {city.name}. Check back soon, or browse all
                  our currently available properties across 12+ cities.
                </p>
                <Button variant="accent" asChild className="self-start">
                  <Link href="/houses-for-rent">Browse All Properties <ArrowRight size={14} /></Link>
                </Button>
              </div>
            </div>
          )}

          {/* Mobile CTA */}
          <div className="mt-8 sm:hidden">
            <Button variant="outline-blue" className="w-full" asChild>
              <Link href={`/houses-for-rent?q=${encodeURIComponent(city.name)}`}>
                View All {city.name} Listings
                <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── LEAD CAPTURE ─────────────────────────────────────────── */}
      <section className="bg-[#081C15] py-16 lg:py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-brand text-xs font-semibold tracking-[0.2em] uppercase mb-3">Be First</p>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-4">
            New {city.name} listings drop weekly
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            Leave your details and we&apos;ll notify you the moment a home matching your needs becomes available — before it goes public.
          </p>
          <CityLeadCapture cityName={city.name} />
          <div className="flex flex-wrap justify-center items-center gap-4 mt-6">
            <span className="text-blue-300/60 text-xs flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              No spam
            </span>
            <span className="text-blue-300/60 text-xs flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              Unsubscribe anytime
            </span>
            <span className="text-blue-300/60 text-xs flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              2,400+ families already subscribed
            </span>
          </div>
        </div>
      </section>

      {/* ── SEO CONTENT BLOCK — split layout ─────────────────────── */}
      <section className="bg-white border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start">
            {/* Text */}
            <div>
              <p className="text-brand text-xs font-semibold tracking-[0.3em] uppercase mb-4">Market Guide</p>
              <h2 className="font-serif text-4xl lg:text-5xl font-bold text-brand-dark leading-tight mb-8">
                Renting in {city.name}
              </h2>
              {/* Inline stat row */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: "Avg. Rent", value: city.avgRent },
                  { label: "Homes Available", value: totalCount > 0 ? `${totalCount}` : "New Soon" },
                  { label: "Decision Time", value: "24 hrs" },
                ].map((stat) => (
                  <div key={stat.label} className="border-l-2 border-brand pl-3">
                    <p className="text-base font-bold text-brand-dark">{stat.value}</p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-5">
                {city.seoContent.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-neutral-600 text-sm leading-relaxed">{paragraph}</p>
                ))}
              </div>

              {/* CTA inline */}
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Button variant="accent" asChild>
                  <Link href="/apply">Apply in 10 Minutes</Link>
                </Button>
                <Button variant="outline-blue" asChild>
                  <Link href={`/houses-for-rent?q=${encodeURIComponent(city.name)}`}>
                    Browse {city.name} Listings
                  </Link>
                </Button>
              </div>
            </div>

            {/* Image + trust card */}
            <div className="space-y-5">
              <div className="relative aspect-[4/3] rounded-sm overflow-hidden bg-neutral-100">
                <Image
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80"
                  alt={`Affordable home interior — ${city.name}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              {/* Trust card */}
              <div className="border border-neutral-100 rounded-sm bg-neutral-50 p-6 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="font-serif text-xl font-bold text-brand-dark">{city.avgRent}</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-0.5">Avg. Monthly Rent</p>
                </div>
                <div>
                  <p className="font-serif text-xl font-bold text-brand-dark">24 hr</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-0.5">Application Decision</p>
                </div>
                <div>
                  <p className="font-serif text-xl font-bold text-brand-dark">$0</p>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wide mt-0.5">Hidden Fees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VISIBLE FAQ ──────────────────────────────────────────── */}
      <section className="bg-brand-dark text-white py-20 lg:py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <p className="text-blue-300 text-xs font-semibold tracking-[0.3em] uppercase mb-4">Common Questions</p>
            <h2 className="font-serif text-4xl font-bold leading-tight">
              Renting in {city.name} — FAQ
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group border border-white/10 rounded-sm overflow-hidden bg-white/5 hover:bg-white/8 transition-colors">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-white/5 transition-colors">
                  <span className="font-medium text-sm text-white leading-snug">{faq.q}</span>
                  <div className="shrink-0 w-7 h-7 rounded-full border border-white/20 flex items-center justify-center group-open:border-brand group-open:bg-brand transition-colors duration-200">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="text-blue-300 group-open:text-white group-open:rotate-180 transition-all duration-200">
                      <path d="M1.5 4L5.5 8L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </summary>
                <div className="px-6 pb-5 pt-2 border-t border-white/10">
                  <p className="text-blue-100 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── MORE CITIES IN THIS STATE ────────────────────────────── */}
      {/* Same-state sibling links build the topical cluster Google needs to
          rank every city in a state — not just the 8 curated ones. */}
      {siblingCities.length > 0 && (
        <section className="bg-white border-t border-neutral-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
            <p className="text-brand text-xs font-semibold tracking-[0.2em] uppercase mb-2">Explore More</p>
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-brand-dark mb-8">
              More Cities in {city.state}
            </h2>
            <div className="flex flex-wrap gap-2">
              {siblingCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/rentals/${c.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-200 text-sm font-medium text-brand-dark hover:border-brand hover:text-brand hover:bg-brand-light transition-colors"
                >
                  {c.city}
                  <span className="text-xs text-neutral-400">{c.count}</span>
                </Link>
              ))}
              <Link
                href={`/rentals/${stateSlug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-hover transition-colors"
              >
                All {city.state} rentals <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── EXPLORE OTHER CITIES ─────────────────────────────────── */}
      <section className="bg-white border-t border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <h2 className="font-serif text-2xl lg:text-3xl font-bold text-brand-dark mb-8">
            Affordable Rentals in Other Cities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(CITIES)
              .filter((c) => c.slug !== slug)
              .slice(0, 4)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/rentals/${c.slug}`}
                  className="group relative aspect-[4/3] rounded-sm overflow-hidden bg-neutral-100"
                >
                  <Image
                    src={c.heroImage}
                    alt={`Affordable rentals in ${c.name}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-white font-serif font-bold text-lg leading-tight">{c.name}</p>
                    <p className="text-blue-200 text-xs mt-0.5">From {c.avgRent}/mo</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
