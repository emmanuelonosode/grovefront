import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, MapPin, Wrench, BadgeDollarSign } from "lucide-react";
import { HeroSearch } from "@/components/public/HeroSearch";
import { HeroCarousel } from "@/components/public/HeroCarousel";
import { HeroHeadline } from "@/components/public/HeroHeadline";
import { WorkersScene, PetScene } from "@/components/public/HomepageIllustrations";
import { StateDirectory } from "@/components/public/StateDirectory";
import { fetchProperties } from "@/lib/properties";
import { fetchAllCities, toDirectoryCities } from "@/lib/cities";
import { BUSINESS, postalAddressSchema } from "@/lib/business";

// Hero background rotates every 2 hours (recomputed on each ISR regeneration, revalidate=300)
// so the homepage feels fresh. All curated, verified, and bandwidth-optimized (webp).
// All bright daylight exteriors — no dusk/night shots (visually audited).
const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1600&q=75&fm=webp&auto=format",
  "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&q=75&fm=webp&auto=format",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1600&q=75&fm=webp&auto=format",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=75&fm=webp&auto=format",
  "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=1600&q=75&fm=webp&auto=format",
  "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1600&q=75&fm=webp&auto=format",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=75&fm=webp&auto=format",
];

export const metadata = {
  // Spaced brand in the homepage <title>: it is one of the signals Google weighs when
  // choosing the site name printed under the result link, and the closed-up form read
  // as the domain rather than a brand.
  title: "Prime Family Housing | Affordable Houses for Rent",
  description:
    "Prime Family Housing — find affordable single-family houses for rent across Atlanta, Charlotte, Houston, Dallas, Tampa and Phoenix. Decisions in 24 hrs.",
  keywords: [
    "houses for rent",
    "homes for rent near me",
    "houses for rent Atlanta",
    "affordable rentals Charlotte",
    "rental homes Houston",
    "rental homes Dallas",
    "affordable houses for rent Tampa",
    "single family homes for rent",
    "move-in ready rental",
    "24 hour rental approval",
    "pet friendly rentals",
    "2 bedroom houses for rent",
    "3 bedroom houses for rent",
    "affordable housing for families",
    "Prime Family Housing",
    "primefamilyhousing.com",
  ],
  openGraph: {
    // siteName must be repeated here. Next merges metadata shallowly, so a page that
    // defines `openGraph` REPLACES the layout's block wholesale rather than merging into
    // it — the layout's siteName was being dropped on the homepage, the one page where
    // the site-name signal matters most.
    siteName: BUSINESS.displayName,
    title: "Prime Family Housing | Affordable Houses for Rent",
    description: "Prime Family Housing — quality homes, well-maintained and move-in ready. Fast approvals. 12+ cities.",
    type: "website",
    url: "https://primefamilyhousing.com",
    images: [{ url: "https://primefamilyhousing.com/opengraph-image", width: 1200, height: 630, alt: "Prime Family Housing — Affordable Homes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PrimeFamilyHousing | Affordable Houses for Rent",
    description: "PrimeFamilyHousing — quality homes, well-maintained and move-in ready. Fast approvals. 12+ cities.",
    images: ["https://primefamilyhousing.com/opengraph-image"],
    creator: "@primefamilyhousing",
  },
  alternates: { canonical: "https://primefamilyhousing.com" },
};

export const revalidate = 300;

const BASE_URL = "https://primefamilyhousing.com";

const LOCAL_BUSINESS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "@id": `${BASE_URL}/#local-business`,
  name: "Prime Family Housing",
  legalName: "Prime Family Housing",
  alternateName: ["Prime Family Housing", "PrimeFamilyHousing.com"],
  parentOrganization: { "@id": `${BASE_URL}/#organization` },
  url: BASE_URL,
  logo: BUSINESS.logo.url,
  image: `${BASE_URL}/opengraph-image`,
  description: "Prime Family Housing — affordable single-family houses for rent. Quality homes, move-in ready, fast decisions. 2,000+ families housed across 12+ US cities since 2012.",
  email: BUSINESS.email,
  telephone: BUSINESS.telephone,
  priceRange: "$$",
  foundingDate: "2012",
  address: postalAddressSchema(),
  // Geo coordinates strengthen local-pack / Google Maps eligibility for a
  // location-based real-estate business. Approximate to the HQ ZIP (Clearfield,
  // UT 84015) — confirm the exact pin in Google Business Profile.
  geo: { "@type": "GeoCoordinates", latitude: 41.1041, longitude: -112.0119 },
  hasMap: "https://www.google.com/maps/search/?api=1&query=1425+S+1500+E+Unit+222+Clearfield+UT+84015",
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "09:00", closes: "18:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "10:00", closes: "16:00" },
  ],
  areaServed: [
    "Atlanta, GA", "Charlotte, NC", "Houston, TX", "Dallas, TX", "Nashville, TN", "Phoenix, AZ",
    "Austin, TX", "Miami, FL", "Denver, CO", "Seattle, WA", "Las Vegas, NV", "Tampa, FL",
    "Raleigh, NC", "Orlando, FL", "San Antonio, TX", "Jacksonville, FL", "Philadelphia, PA",
  ],
  // Read from BUSINESS rather than hardcoding: this list had drifted out of sync —
  // it was missing TikTok entirely and pointed at a /primefamilyhousing Facebook
  // vanity URL while every other emitter used the /share/1G6G3YcUd3/ profile.
  // Conflicting sameAs sets for one @id weaken entity resolution.
  sameAs: [...BUSINESS.sameAs],
};

const WEBSITE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  // Must match the WebSite node in layout.tsx — conflicting names across two WebSite
  // nodes is exactly the ambiguity that makes Google fall back to showing the domain.
  name: BUSINESS.displayName,
  alternateName: [...BUSINESS.alternateNames],
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${BASE_URL}/houses-for-rent?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${BASE_URL}/#organization`,
  name: "Prime Family Housing",
  legalName: "Prime Family Housing",
  alternateName: ["Prime Family Housing", "PrimeFamilyHousing.com"],
  url: BASE_URL,
  logo: BUSINESS.logo.url,
  email: BUSINESS.email,
  telephone: BUSINESS.telephone,
  address: postalAddressSchema(),
  contactPoint: { "@type": "ContactPoint", email: BUSINESS.email, telephone: BUSINESS.telephone, contactType: "customer service", availableLanguage: "English" },
  sameAs: [...BUSINESS.sameAs],
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "What is Prime Family Housing?", acceptedAnswer: { "@type": "Answer", text: "Prime Family Housing — officially named PrimeFamilyHousing — is a licensed US real estate company founded in 2012 and headquartered in Clearfield, UT. The company specializes in affordable single-family houses for rent across 12+ US cities." } },
    { "@type": "Question", name: "How long does it take to get approved for a rental?", acceptedAnswer: { "@type": "Answer", text: "PrimeFamilyHousing reviews every rental application within 24 hours. You can apply online in under 10 minutes at primefamilyhousing.com/apply." } },
    { "@type": "Question", name: "Does PrimeFamilyHousing charge hidden fees?", acceptedAnswer: { "@type": "Answer", text: "No. The listed price is what you pay. No administrative processing fees or convenience surcharges beyond the standard security deposit." } },
    { "@type": "Question", name: "Can I rent with bad credit through PrimeFamilyHousing?", acceptedAnswer: { "@type": "Answer", text: "PrimeFamilyHousing reviews applications individually and works with renters who have imperfect credit or limited rental history." } },
    { "@type": "Question", name: "Does PrimeFamilyHousing have pet-friendly rentals?", acceptedAnswer: { "@type": "Answer", text: "Yes. Many of our rental listings across Atlanta, Charlotte, Houston, Dallas and other cities are pet-friendly. Pet policies are disclosed upfront on every listing." } },
  ],
};

const BREADCRUMB_HOME = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: BASE_URL }],
};

const HOW_IT_WORKS_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to Rent a Home with PrimeFamilyHousing",
  description: "Apply for an affordable rental home in 3 simple steps. Decisions within 24 hours.",
  totalTime: "PT10M",
  estimatedCost: { "@type": "MonetaryAmount", currency: "USD", value: "2" },
  step: [
    { "@type": "HowToStep", position: 1, name: "Browse available homes", text: "Filter by city, beds, and budget. Every listing has photos, full pricing, and pet policy.", url: `${BASE_URL}/houses-for-rent` },
    { "@type": "HowToStep", position: 2, name: "Apply in 10 minutes", text: "One online form. No paperwork run-around. Reviewed within 24 hours.", url: `${BASE_URL}/apply` },
    { "@type": "HowToStep", position: 3, name: "Move in", text: "Sign your lease, pay your deposit, get your keys. We handle the rest.", url: `${BASE_URL}/apply` },
  ],
};

const howItWorks = [
  { n: "01", title: "Browse available homes",  desc: "Filter by city, beds, and budget. Every listing has photos, full pricing, and pet policy." },
  { n: "02", title: "Apply in 10 minutes",     desc: "One online form. No paperwork run-around. Reviewed within 24 hours." },
  { n: "03", title: "Move in",                 desc: "Sign your lease, pay your deposit, get your keys. We handle the rest." },
];

const maintenancePromises = [
  { h: "30-point pre-listing inspection",  d: "Every home is checked before a single photo goes online. If it can't pass, it isn't listed." },
  { h: "Same-day maintenance response",    d: "Submit a request in the portal — a real person responds within the business day. No 7-day ticket queues." },
  { h: "In-house team, not third-party",   d: "Our own technicians service every home. They know the property, you, and the history." },
];

const faqs = [
  { q: "How long does it take to get approved?",               a: "Every application gets reviewed within 24 hours. Most renters hear back the same business day." },
  { q: "Do you charge hidden fees or admin charges?",          a: "No. The listed price is what you pay. Standard security deposit and that's it — no admin fees, no convenience surcharges." },
  { q: "Can I apply with limited credit or rental history?",   a: "Yes. We review every application individually and look at your full financial picture — not just a credit score." },
  { q: "Are pets allowed?",                                    a: "Most of our homes are pet-friendly. Each listing shows the policy up front. Pet deposits and rent vary by home." },
  { q: "How do I tour a property?",                            a: "Pick a time on any listing — in-person, video, or phone. A specialist confirms within 24 hours." },
  { q: "Do you handle maintenance after I move in?",           a: "Yes. Submit a request in the tenant portal and our team responds same day. We don't leave you waiting." },
];

const petTags = ["Dogs welcome", "Cats welcome", "$300 pet deposit", "$25/mo pet rent", "No breed restrictions"];

export default async function HomePage() {
  const [totalCountRaw, allCitiesRaw] = await Promise.allSettled([
    fetchProperties(),
    fetchAllCities(),
  ]);

  const totalProperties = totalCountRaw.status === "fulfilled" ? totalCountRaw.value.count : null;

  const dbCities = allCitiesRaw.status === "fulfilled" ? allCitiesRaw.value : [];
  // Slim projection — the directory + city grid only need name/photo/count, so
  // we must NOT ship every city's full seoContent to the client (that alone was
  // ~1MB of the homepage).
  const mergedCities = toDirectoryCities(dbCities);
  // Live listing counts per city slug — shown in the crawlable city directory.
  const cityCounts: Record<string, number> = Object.fromEntries(
    dbCities.map((c) => [c.slug, c.count])
  );

  return (
    <div>
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_HOME) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(HOW_IT_WORKS_SCHEMA) }} />

      {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative w-full min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden bg-surface-container-low">
        {/* Background carousel + forest gradient */}
        <div className="absolute inset-0 z-0">
          <HeroCarousel images={HERO_IMAGES} />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-forest-deep/30 to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 md:px-12 text-center mt-16 pb-12">
          {/* Rotating headline + subtitle */}
          <div className="hero-animate">
            <HeroHeadline />
          </div>

          {/* Smart search bar */}
          <div className="hero-animate w-full" style={{ animationDelay: "160ms" }}>
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* â”€â”€ STATS STRIP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section style={{ background: "#081C15", color: "#fff" }}>
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {[
              { v: totalProperties != null ? String(totalProperties) : "—", l: "Homes available",      s: "right now" },
              { v: "2,400+",                                                  l: "Families housed",      s: "since 2012" },
              { v: "12+",                                                     l: "U.S. cities",          s: "and growing" },
              { v: "24h",                                                     l: "Application decisions", s: "typical review" },
            ].map((stat, i) => (
              <div key={stat.l} className="px-6 py-10" style={{ borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.12)" : "none" }}>
                <div className="font-serif font-bold text-white leading-none" style={{ fontSize: 44, letterSpacing: "-0.02em" }}>{stat.v}</div>
                <div className="font-semibold mt-[10px]" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{stat.l}</div>
                <div className="mt-[3px]" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.04em" }}>{stat.s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ FEATURED RENTALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-16 md:py-24 px-4 md:px-12 max-w-7xl mx-auto w-full">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-serif font-semibold text-primary mb-2 text-[26px] leading-[34px] md:text-[32px] md:leading-[40px]">Featured Communities</h2>
            <p className="text-[16px] leading-6 text-on-surface-variant max-w-2xl">
              Explore our most popular neighborhoods, featuring spacious homes, top-tier amenities, and a welcoming atmosphere.
            </p>
          </div>
          <Link
            href="#all-cities"
            className="shrink-0 font-semibold text-[14px] tracking-[0.05em] text-secondary hover:text-terracotta-warm flex items-center transition-colors group"
          >
            View All Communities
            <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
          {mergedCities.slice(0, 3).map((city, i) => {
            const isLarge = i === 0;
            const homeCount = cityCounts[city.slug];
            return (
              <Link
                key={city.slug}
                href={`/rentals/${city.slug}`}
                className={`${isLarge ? "md:col-span-2 md:row-span-2" : "h-[280px] md:h-auto"} rounded-xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-md transition-shadow block bg-surface-container`}
              >
                {city.heroImage && (
                  <Image
                    src={city.heroImage}
                    alt={`Homes for rent in ${city.name}, ${city.state}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes={isLarge ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                  />
                )}
                <div className={`absolute inset-0 bg-gradient-to-t ${isLarge ? "from-forest-deep/90 via-forest-deep/20" : "from-forest-deep/80 via-transparent"} to-transparent`} />
                <div className={`absolute bottom-0 left-0 w-full ${isLarge ? "p-8" : "p-6"}`}>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {homeCount != null && homeCount > 0 && (
                      <span className="bg-earth-beige text-on-secondary-container text-[12px] leading-4 px-3 py-1 rounded-full font-semibold">
                        {homeCount} Home{homeCount === 1 ? "" : "s"} Available
                      </span>
                    )}
                    {city.avgRent && (
                      <span className="bg-surface/90 text-primary text-[12px] leading-4 px-3 py-1 rounded-full backdrop-blur-sm">
                        from {city.avgRent}/mo
                      </span>
                    )}
                  </div>
                  <h3 className={`font-serif font-semibold text-white mb-1 ${isLarge ? "text-[28px] leading-9 md:text-[32px] md:leading-[40px]" : "text-[22px] leading-8"}`}>
                    {city.name}
                  </h3>
                  <div className={`flex items-center text-earth-beige ${isLarge ? "text-[16px] leading-6 mb-3" : "text-[13px]"}`}>
                    <MapPin size={isLarge ? 17 : 14} className="mr-1 shrink-0" />
                    {city.state}
                  </div>
                  {isLarge && city.tagline && (
                    <p className="text-white/90 text-[16px] leading-6 line-clamp-2 max-w-lg">{city.tagline}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/houses-for-rent"
            className="inline-flex items-center gap-2 bg-primary text-on-primary text-[14px] font-semibold tracking-[0.05em] h-[50px] px-8 rounded-full hover:bg-primary-container transition-colors active:scale-95"
          >
            Browse all available homes
            {totalProperties != null && (
              <span className="text-white/60 font-normal text-[13px]">{totalProperties} total</span>
            )}
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* â”€â”€ HOW IT WORKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section style={{ background: "#f3f4ec" }} className="py-[88px] px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-brand">Simple process</p>
            <h2 className="font-serif font-bold text-brand-dark leading-[1.12] mt-3" style={{ fontSize: 38, letterSpacing: "-0.015em" }}>
              From search to keys, in three steps.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-[#F1F5F9]">
            {howItWorks.map((step, i) => (
              <div key={step.n} className="p-10" style={{ borderRight: i < 2 ? "1px solid #F1F5F9" : "none" }}>
                <div className="font-serif font-bold leading-none mb-5" style={{ fontSize: 64, color: "#c1ecd4" }}>{step.n}</div>
                <h3 className="font-serif font-bold text-brand-dark leading-[1.2] mb-[10px]" style={{ fontSize: 22 }}>{step.title}</h3>
                <p className="leading-[1.6]" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 14, color: "#475569" }}>{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-brand-dark text-white text-[14px] font-medium tracking-[0.05em] h-[50px] px-7 rounded-sm hover:bg-brand transition-colors"
            >
              Start an application <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€ MAINTENANCE PITCH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-[88px] px-8 border-t border-[#F1F5F9]" style={{ background: "#FBF9F4" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Illustration */}
            <div className="border border-[#F1F5F9] bg-white rounded-sm overflow-hidden">
              <WorkersScene />
            </div>
            {/* Copy */}
            <div>
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-brand">Quality you can see</p>
              <h2 className="font-serif font-bold text-brand-dark leading-[1.12] mt-[14px] mb-[14px]" style={{ fontSize: 42, letterSpacing: "-0.015em" }}>
                The best-maintained rentals on the market.
              </h2>
              <p className="leading-[1.65] mb-7" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 15.5, color: "#475569", maxWidth: 460 }}>
                We don&apos;t list homes we wouldn&apos;t live in. Every property is inspected, cleaned, and turned by our in-house maintenance team before move-in — then supported the same way after.
              </p>
              <div className="flex flex-col gap-[18px]">
                {maintenancePromises.map((pr) => (
                  <div key={pr.h} className="grid gap-[14px] items-start" style={{ gridTemplateColumns: "22px 1fr" }}>
                    <div className="mt-1 w-[18px] h-[18px] rounded-full bg-brand flex items-center justify-center shrink-0">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold mb-[3px]" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 14.5, color: "#081C15" }}>{pr.h}</div>
                      <div className="leading-[1.55]" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 13, color: "#475569" }}>{pr.d}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-9 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/houses-for-rent"
                  className="inline-flex items-center justify-center gap-2 bg-brand hover:bg-brand-hover text-white font-bold text-[15px] px-8 py-4 rounded-xl shadow-lg shadow-brand/20 hover:shadow-brand/30 transition-all"
                >
                  Browse Houses for Rent <ArrowRight size={16} />
                </Link>
                <Link
                  href="/apply"
                  className="inline-flex items-center justify-center gap-2 border-2 border-brand-dark/80 text-brand-dark hover:bg-brand-dark hover:text-white font-bold text-[15px] px-8 py-4 rounded-xl transition-all"
                >
                  Apply Now — 24hr Decision
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ CITIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-[88px] px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-brand">Where we operate</p>
              <h2 className="font-serif font-bold text-brand-dark leading-[1.12] mt-3" style={{ fontSize: 38, letterSpacing: "-0.015em" }}>
                Cities we serve.
              </h2>
              <p className="mt-3 max-w-[460px] leading-[1.6]" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 14, color: "#475569" }}>
                Affordable rentals in Atlanta, Charlotte, Houston, Dallas, Nashville, Phoenix, Austin, Miami, Denver, Seattle, Las Vegas, and Tampa.
              </p>
            </div>
            <Link
              href="#all-cities"
              className="shrink-0 inline-flex items-center gap-1.5 text-brand text-[14px] font-medium hover:opacity-80 transition-opacity"
            >
              See all cities <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {mergedCities.slice(0, 6).map((city) => (
              <Link
                key={city.slug}
                href={`/rentals/${city.slug}`}
                className="relative rounded-sm overflow-hidden block hover:opacity-90 transition-opacity"
                style={{ aspectRatio: "3 / 4" }}
              >
                <Image
                  src={city.heroImage}
                  alt={`Homes for rent in ${city.name}`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(1,45,29,0) 40%, rgba(1,45,29,0.85) 100%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="font-serif font-bold leading-[1.1]" style={{ fontSize: 20 }}>{city.name}</div>
                  <div className="mt-0.5" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                    {city.state} Â· from {city.avgRent}/mo
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ STATE DIRECTORY (cards with search; links to state hubs + top cities) â”€â”€ */}
      <StateDirectory cities={mergedCities} counts={cityCounts} />

      {/* â”€â”€ PET PITCH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-[88px] px-8 bg-white border-t border-[#F1F5F9]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-brand">Paws welcome</p>
              <h2 className="font-serif font-bold text-brand-dark leading-[1.12] mt-[14px] mb-[14px]" style={{ fontSize: 42, letterSpacing: "-0.015em" }}>
                Bring your whole family.
              </h2>
              <p className="leading-[1.65] mb-6" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 15.5, color: "#475569", maxWidth: 460 }}>
                Most of our homes welcome pets. No breed restrictions on the majority of listings, transparent deposits, and a tenant team that&apos;s genuinely happy you brought the dog.
              </p>
              <div className="flex flex-wrap gap-2 mb-7">
                {petTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center border border-[#F1F5F9] rounded-sm"
                    style={{ background: "#FBF9F4", color: "#012d1d", fontFamily: "var(--font-source-sans), sans-serif", fontSize: 12.5, fontWeight: 500, padding: "7px 12px" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href="/houses-for-rent?q=pet"
                className="inline-flex items-center gap-1.5 text-brand text-[14px] font-medium hover:opacity-80 transition-opacity"
              >
                Browse pet-friendly rentals <ArrowRight size={14} />
              </Link>
            </div>
            {/* Illustration */}
            <div className="border border-[#F1F5F9] bg-white rounded-sm overflow-hidden">
              <PetScene />
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ WHY PRIMEFAMILYHOUSING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-16 md:py-24 bg-surface-container-low border-t border-outline-variant/40">
        <div className="max-w-7xl mx-auto px-4 md:px-12">
          <div className="text-center mb-16">
            <h2 className="font-serif font-semibold text-primary mb-4 text-[26px] leading-[34px] md:text-[32px] md:leading-[40px]">
              The PrimeFamilyHousing Difference
            </h2>
            <p className="text-[18px] leading-7 text-on-surface-variant max-w-3xl mx-auto">
              We believe leasing a home should be as reliable and rewarding as owning one. Experience professional management with a personal touch.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                icon: <ShieldCheck size={28} />,
                iconBg: "bg-earth-beige text-secondary",
                title: "Trusted Stability",
                desc: "Long-term lease options and predictable renewals mean you can put down roots without the anxiety of sudden changes.",
              },
              {
                icon: <Wrench size={28} />,
                iconBg: "bg-primary-fixed text-primary",
                title: "Proactive Maintenance",
                desc: "Our dedicated service teams ensure your home stays in perfect condition, handling repairs swiftly and professionally — same-day responses, no 7-day ticket queues.",
              },
              {
                icon: <BadgeDollarSign size={28} />,
                iconBg: "bg-secondary-container text-secondary",
                title: "Honest Pricing",
                desc: "The listed price is what you pay. No inflated rents, no surprise move-in fees, and transparent pet policies on every listing.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-surface rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-surface-variant">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 ${f.iconBg}`}>
                  {f.icon}
                </div>
                <h3 className="font-serif font-semibold text-on-surface mb-3 text-[22px] leading-8">{f.title}</h3>
                <p className="text-[16px] leading-relaxed text-on-surface-variant">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ FAQ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-[88px] px-8 border-t border-[#F1F5F9]" style={{ background: "#FBF9F4" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-brand">Common questions</p>
            <h2 className="font-serif font-bold text-brand-dark leading-[1.12] mt-3" style={{ fontSize: 38, letterSpacing: "-0.015em" }}>
              Renter FAQs.
            </h2>
          </div>
          <div className="mx-auto" style={{ maxWidth: 820 }}>
            {faqs.map((faq, i) => (
              <details key={i} className="group py-5 border-t border-[#F1F5F9]" open={i === 0}>
                <summary
                  className="flex items-center justify-between cursor-pointer font-serif font-bold text-brand-dark leading-[1.3] list-none"
                  style={{ fontSize: 19 }}
                >
                  <span>{faq.q}</span>
                  <span className="shrink-0 ml-4 text-brand text-[20px] leading-none select-none group-open:hidden">+</span>
                  <span className="shrink-0 ml-4 text-brand text-[20px] leading-none select-none hidden group-open:inline">âˆ’</span>
                </summary>
                <p className="leading-[1.65] mt-3.5" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 15, color: "#475569", maxWidth: 720 }}>{faq.a}</p>
              </details>
            ))}
            <div className="border-t border-[#F1F5F9]" />
          </div>
        </div>
      </section>

      {/* â”€â”€ FINAL CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-[88px] px-8 text-center" style={{ background: "#081C15", color: "#fff" }}>
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: "#a5d0b9" }}>Ready when you are</p>
          <h2 className="font-serif font-bold text-white leading-[1.05] mt-3.5" style={{ fontSize: 48, letterSpacing: "-0.02em" }}>
            Find your next home.
          </h2>
          <p className="leading-[1.6] mt-[18px] mb-8 mx-auto" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 16, color: "rgba(255,255,255,0.7)", maxWidth: 540 }}>
            Browse {totalProperties ?? "hundreds of"} move-in ready rentals across 12 cities. Decisions in 24 hours. No hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/houses-for-rent"
              className="inline-flex items-center justify-center gap-2 bg-brand text-white h-[50px] px-7 rounded-sm text-[14px] font-medium tracking-[0.05em] hover:bg-brand-hover transition-colors"
            >
              Browse homes <ArrowRight size={14} />
            </Link>
            <Link
              href="/apply"
              className="inline-flex items-center justify-center h-[50px] px-7 rounded-sm text-[14px] font-medium tracking-[0.05em] transition-colors"
              style={{ border: "1px solid rgba(255,255,255,0.4)", color: "#fff" }}
            >
              Start an application
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
