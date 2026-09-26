import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Check, Search, FileCheck2, KeyRound, Plus, Minus } from "lucide-react";
import { HeroSearch } from "@/components/public/HeroSearch";
import { HeroCarousel } from "@/components/public/HeroCarousel";
import { WorkersScene, PetScene } from "@/components/public/HomepageIllustrations";
import { StateDirectory } from "@/components/public/StateDirectory";
import { FeaturedPropertiesSection } from "@/components/public/FeaturedPropertiesSection";
import { fetchProperties, fetchHomepageProperties, toPropertyCardShape } from "@/lib/properties";
import { CITIES, fetchAllCities, toDirectoryCities } from "@/lib/cities";
import { STATE_NAMES } from "@/lib/states";
import { BUSINESS, postalAddressSchema } from "@/lib/business";
import { jsonLdString } from "@/lib/json-ld";

// Hero background carousel rotates through the 3 curated residential community photos
const HERO_IMAGES = [
  "/images/hero/hero-townhomes.jpg",
  "/images/hero/hero-contemporary-homes.jpg",
  "/images/hero/hero-suburban-neighborhood.jpg",
];

export const metadata = {
  // Spaced brand in the homepage <title>: it is one of the signals Google weighs when
  // choosing the site name printed under the result link, and the closed-up form read
  // as the domain rather than a brand.
  title: "Prime Family Housing | Affordable Houses for Rent",
  description:
    "Prime Family Housing - find affordable single-family houses for rent across Atlanta, Charlotte, Houston, Dallas, Tampa and Phoenix. Decisions in 24 hrs.",
  openGraph: {
    // siteName must be repeated here. Next merges metadata shallowly, so a page that
    // defines `openGraph` REPLACES the layout's block wholesale rather than merging into
    // it - the layout's siteName was being dropped on the homepage, the one page where
    // the site-name signal matters most.
    siteName: BUSINESS.displayName,
    title: "Prime Family Housing | Affordable Houses for Rent",
    description: "Prime Family Housing - quality homes, well-maintained and move-in ready. Fast approvals. 12+ cities.",
    type: "website",
    url: "https://primefamilyhousing.com",
    images: [{ url: "https://primefamilyhousing.com/opengraph-image", width: 1200, height: 630, alt: "Prime Family Housing - Affordable Homes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime Family Housing | Affordable Houses for Rent",
    description: "Prime Family Housing - quality homes, well-maintained and move-in ready. Fast approvals. 12+ cities.",
    images: ["https://primefamilyhousing.com/opengraph-image"],
  },
  alternates: { canonical: "https://primefamilyhousing.com" },
};

export const revalidate = 300;

const BASE_URL = "https://primefamilyhousing.com";

// Organization and WebSite nodes live once, in the root layout's @graph. Emitting
// second copies here (with different alternateName lists and no shared @id on the
// WebSite) gave Google two conflicting descriptions of the same entities.
function localBusinessSchema(areaServed: { name: string; state: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${BASE_URL}/#local-business`,
    name: BUSINESS.displayName,
    legalName: BUSINESS.displayName,
    alternateName: [...BUSINESS.alternateNames],
    parentOrganization: { "@id": `${BASE_URL}/#organization` },
    url: BASE_URL,
    logo: BUSINESS.logo.url,
    image: `${BASE_URL}/opengraph-image`,
    description: "Prime Family Housing - affordable single-family houses for rent. Quality homes, move-in ready, fast decisions. 2,000+ families housed across 12+ US cities since 2012.",
    email: BUSINESS.email,
    telephone: BUSINESS.telephone,
    priceRange: "$$",
    foundingDate: "2012",
    address: postalAddressSchema(),
    // Geo coordinates strengthen local-pack / Google Maps eligibility for a
    // location-based real-estate business. Approximate to the HQ ZIP (Clearfield,
    // UT 84015) - confirm the exact pin in Google Business Profile.
    geo: { "@type": "GeoCoordinates", latitude: 41.1041, longitude: -112.0119 },
    hasMap: "https://www.google.com/maps/search/?api=1&query=1425+S+1500+E+Unit+222+Clearfield+UT+84015",
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], opens: "09:00", closes: "18:00" },
    ],
    // Built from live inventory rather than a hand-kept list, which had drifted to
    // include markets (Seattle, Las Vegas, Miami) with no homes behind them.
    areaServed: areaServed.map((c) => ({
      "@type": "City",
      name: c.name,
      containedInPlace: { "@type": "State", name: c.state },
    })),
    sameAs: [...BUSINESS.sameAs],
  };
}

const steps = [
  { Icon: Search,     title: "Browse available homes", desc: "Filter by city, beds, and budget. Every listing shows real photos, full pricing, and the pet policy up front.", href: "/houses-for-rent", cta: "Search homes" },
  { Icon: FileCheck2, title: "Apply in 10 minutes",    desc: "One online form, no paperwork run-around. Every application is reviewed within 24 hours.",                  href: "/apply",           cta: "Start an application" },
  { Icon: KeyRound,   title: "Get your keys",          desc: "Sign your lease, pay your deposit, and move in. Our team stays on call for everything after.",              href: "/apply",           cta: "See requirements" },
];

const promises = [
  { h: "30-point pre-listing inspection", d: "Every home is checked before a single photo goes online. If it can't pass, it isn't listed." },
  { h: "Same-day maintenance response",   d: "Submit a request in the tenant portal and a real person responds within the business day." },
  { h: "In-house team, not a call center", d: "Our own technicians service every home. They know the property, you, and its history." },
  { h: "The listed price is the price",   d: "No inflated rents, no admin or convenience fees, and pet policies disclosed on every listing." },
];

// Single source for the visible FAQ and the FAQPage JSON-LD - Google requires the
// markup to match what's on the page, and the two had drifted apart.
const faqs = [
  { q: "What is Prime Family Housing?",                        a: "Prime Family Housing is a licensed U.S. real estate company, founded in 2012 and headquartered in Clearfield, UT, that rents well-maintained single-family houses across 12+ U.S. cities." },
  { q: "How long does it take to get approved?",               a: "Every application gets reviewed within 24 hours. Most renters hear back the same business day." },
  { q: "Do you charge hidden fees or admin charges?",          a: "No. The listed price is what you pay. Standard security deposit and that's it - no admin fees, no convenience surcharges." },
  { q: "Can I apply with limited credit or rental history?",   a: "Yes. We review every application individually and look at your full financial picture - not just a credit score." },
  { q: "Are pets allowed?",                                    a: "Most of our homes are pet-friendly. Each listing shows the policy up front. Pet deposits and rent vary by home." },
  { q: "How do I tour a property?",                            a: "Pick a time on any listing - in-person, video, or phone. A specialist confirms within 24 hours." },
  { q: "Do you handle maintenance after I move in?",           a: "Yes. Submit a request in the tenant portal and our team responds same day. We don't leave you waiting." },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const petTags = ["Dogs welcome", "Cats welcome", "$300 pet deposit", "$25/mo pet rent", "No breed restrictions"];

const heroPoints = ["Decisions in 24 hours", "No hidden fees", "Pet-friendly homes"];

function SectionHeading({
  eyebrow,
  title,
  children,
  align = "left",
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className={`text-[12px] font-semibold uppercase tracking-[0.22em] ${tone === "dark" ? "text-sage-soft" : "text-accent"}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-3 font-serif text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-balance md:text-[38px] ${tone === "dark" ? "text-white" : "text-brand-dark"}`}>
        {title}
      </h2>
      {children && (
        <p className={`mt-4 text-[16px] leading-relaxed md:text-[17px] ${tone === "dark" ? "text-white/70" : "text-on-surface-variant"}`}>
          {children}
        </p>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [totalCountRaw, homepageRaw, allCitiesRaw] = await Promise.allSettled([
    fetchProperties(),
    // Purpose-built endpoint for the homepage grid: admin-curated homes, with a
    // server-side fallback to is_featured when none are hand-picked. Showing real
    // houses here is the clearest signal - to visitors and to Google - that this is a
    // rentals site, not just a lead form.
    fetchHomepageProperties(),
    fetchAllCities(),
  ]);

  const totalProperties = totalCountRaw.status === "fulfilled" ? totalCountRaw.value.count : null;

  // Adapt the list-item API shape to the Property shape PropertyCard consumes - the
  // same conversion the city pages use.
  const homepageItems = homepageRaw.status === "fulfilled" ? homepageRaw.value : [];
  const featuredProperties = homepageItems.map(toPropertyCardShape);

  const dbCities = allCitiesRaw.status === "fulfilled" ? allCitiesRaw.value : [];
  // Slim projection - the directory + city grid only need name/photo/count, so
  // we must NOT ship every city's full seoContent to the client (that alone was
  // ~1MB of the homepage).
  const mergedCities = toDirectoryCities(dbCities);
  // Live listing counts per city slug - shown in the crawlable city directory.
  const cityCounts: Record<string, number> = Object.fromEntries(
    dbCities.map((c) => [c.slug, c.count])
  );

  // Five curated cities with the most homes. Curated only: their editorial photos
  // are reliable, whereas DB-derived city images point at listing photos on the
  // admin media host, many of which 404 - the biggest cards on the page can't risk that.
  const spotlightCities = mergedCities
    .filter((c) => CITIES[c.slug] && c.heroImage)
    .map((c, i) => ({ c, i, n: cityCounts[c.slug] ?? 0 }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .slice(0, 5)
    .map(({ c }) => c);

  const areaServed = [...dbCities]
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map((c) => ({ name: c.city, state: STATE_NAMES[(c.state || "").toUpperCase()] ?? c.state }));

  const stats = [
    { v: totalProperties != null ? totalProperties.toLocaleString() : "-", l: "Homes available", s: "right now" },
    { v: "2,000+", l: "Families housed", s: "since 2012" },
    { v: "12+", l: "U.S. cities", s: "and growing" },
    { v: "24h", l: "Application decisions", s: "typical review" },
  ];

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(localBusinessSchema(areaServed)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(FAQ_SCHEMA) }} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[640px] items-center overflow-hidden bg-forest-deep md:min-h-[720px]">
        <div className="absolute inset-0 z-0">
          <HeroCarousel images={HERO_IMAGES} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-forest-deep/75 via-forest-deep/40 to-forest-deep/90" />
        </div>

        {/* pointer-events-none on the full-width wrapper so the carousel arrows
            underneath stay clickable; the content itself opts back in. */}
        <div className="pointer-events-none relative z-10 mx-auto w-full max-w-7xl px-4 pb-20 pt-32 text-center md:px-12">
          <div className="pointer-events-auto">
            <h1
              className="hero-animate mx-auto max-w-4xl font-serif text-[2.4rem] font-bold leading-[1.08] tracking-[-0.025em] text-white text-balance drop-shadow-sm sm:text-[3.25rem] lg:text-[4rem]"
            >
              Well-kept houses for rent, ready when you are.
            </h1>

            <p
              className="hero-animate mx-auto mb-10 mt-5 max-w-2xl text-[17px] leading-[1.55] text-earth-beige sm:text-[19px]"
              style={{ animationDelay: "140ms" }}
            >
              Single-family homes across 12+ U.S. cities, with honest pricing, pet-friendly options, and a
              decision on your application within 24 hours.
            </p>

            <div className="hero-animate w-full" style={{ animationDelay: "200ms" }}>
              <HeroSearch />
            </div>

            <ul
              className="hero-animate mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] font-semibold text-white/85"
              style={{ animationDelay: "260ms" }}
            >
              {heroPoints.map((p) => (
                <li key={p} className="inline-flex items-center gap-1.5">
                  <Check size={15} className="text-earth-beige" aria-hidden="true" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="bg-forest-deep text-white" aria-label="Prime Family Housing at a glance">
        <div className="mx-auto max-w-7xl px-4 md:px-12">
          <div className="grid grid-cols-2 border-t border-white/10 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.l}
                className={`px-4 py-8 md:px-6 md:py-10 ${i % 2 === 1 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
              >
                <p className="font-serif text-[36px] font-bold leading-none tracking-[-0.02em] tabular-nums md:text-[44px]">{stat.v}</p>
                <p className="mt-2.5 text-[14px] font-semibold text-white/85">
                  {stat.l}
                  <span className="mt-0.5 block text-[12px] font-normal tracking-[0.04em] text-white/55">{stat.s}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVAILABLE HOMES ──────────────────────────────────────────────────
          Real move-in-ready homes, directly below the hero. This is the first
          thing a visitor (or crawler) sees after the search - concrete proof the
          site lists actual houses for rent. Rendered only when we have listings so
          a fetch failure degrades to the rest of the page rather than an empty grid. */}
      {featuredProperties.length > 0 && (
        <FeaturedPropertiesSection properties={featuredProperties} totalCount={totalProperties} />
      )}

      {/* ── COMMUNITIES ──────────────────────────────────────────────────── */}
      {spotlightCities.length > 0 && (
        <section className="bg-brand-light px-4 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading eyebrow="Where we rent" title="Explore our most popular cities.">
                Neighborhoods with space to grow, good schools nearby, and homes our own team maintains.
              </SectionHeading>
              <Link
                href="#all-cities"
                className="group inline-flex shrink-0 items-center gap-1.5 text-[15px] font-semibold text-brand-dark hover:text-accent"
              >
                See every city
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:h-[560px] md:grid-cols-4 md:grid-rows-2">
              {spotlightCities.map((city, i) => {
                const isLarge = i === 0;
                const homeCount = cityCounts[city.slug];
                return (
                  <Link
                    key={city.slug}
                    href={`/rentals/${city.slug}`}
                    className={`group relative block overflow-hidden rounded-2xl bg-surface-container ${
                      isLarge ? "h-[320px] sm:col-span-2 md:col-span-2 md:row-span-2 md:h-auto" : "h-[220px] md:h-auto"
                    }`}
                  >
                    <Image
                      src={city.heroImage}
                      alt={`Houses for rent in ${city.name}, ${city.stateCode}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes={isLarge ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/90 via-forest-deep/25 to-transparent" />
                    <div className={`absolute bottom-0 left-0 w-full ${isLarge ? "p-7 md:p-8" : "p-5"}`}>
                      {homeCount != null && homeCount > 0 && (
                        <span className="mb-3 inline-block rounded-full bg-earth-beige px-3 py-1 text-[12px] font-semibold text-forest-deep tabular-nums">
                          {homeCount} home{homeCount === 1 ? "" : "s"} available
                        </span>
                      )}
                      <h3 className={`font-serif font-bold text-white ${isLarge ? "text-[28px] leading-9 md:text-[34px]" : "text-[21px] leading-7"}`}>
                        {city.name}
                      </h3>
                      <p className={`mt-1 flex items-center gap-1 text-white/80 ${isLarge ? "text-[15px]" : "text-[13px]"}`}>
                        <MapPin size={isLarge ? 16 : 13} className="shrink-0" aria-hidden="true" />
                        {city.state}
                        {city.avgRent && <span className="text-white/60"> · from {city.avgRent}/mo</span>}
                      </p>
                      {isLarge && city.tagline && (
                        <p className="mt-3 line-clamp-2 max-w-lg text-[16px] leading-6 text-white/85">{city.tagline}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="bg-white px-4 py-20 md:px-12 md:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionHeading eyebrow="Simple process" title="From search to keys in three steps." align="center" />
          <ol className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="relative flex flex-col rounded-2xl border border-surface-variant bg-surface p-8">
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-brand">
                    <step.Icon size={22} aria-hidden="true" />
                  </span>
                  <span className="font-serif text-[40px] font-bold leading-none text-surface-dim" aria-hidden="true">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-6 font-serif text-[21px] font-bold leading-tight text-brand-dark">{step.title}</h3>
                <p className="mt-2.5 flex-1 text-[15.5px] leading-relaxed text-on-surface-variant">{step.desc}</p>
                <Link href={step.href} className="group mt-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-dark hover:text-accent">
                  {step.cta}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── WHY US ───────────────────────────────────────────────────────── */}
      <section className="border-t border-surface-variant bg-background px-4 py-20 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-2xl border border-surface-variant bg-white">
            <WorkersScene />
          </div>
          <div>
            <SectionHeading eyebrow="Quality you can see" title="The best-maintained rentals on the market.">
              We don&apos;t list homes we wouldn&apos;t live in. Every property is inspected, cleaned, and turned by
              our in-house team before move-in - then supported the same way after.
            </SectionHeading>
            <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {promises.map((p) => (
                <li key={p.h} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[15.5px] font-semibold text-brand-dark">{p.h}</p>
                    <p className="mt-1 text-[14.5px] leading-relaxed text-on-surface-variant">{p.d}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/houses-for-rent"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-7 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Browse houses for rent <ArrowRight size={16} />
              </Link>
              <Link
                href="/apply"
                className="inline-flex h-12 items-center justify-center rounded-full border border-brand-dark/25 px-7 text-[15px] font-semibold text-brand-dark transition-colors hover:border-brand-dark hover:bg-brand-dark hover:text-white"
              >
                Apply now - 24h decision
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PETS ─────────────────────────────────────────────────────────── */}
      <section className="bg-white px-4 py-20 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="lg:order-2 overflow-hidden rounded-2xl border border-surface-variant bg-white">
            <PetScene />
          </div>
          <div>
            <SectionHeading eyebrow="Paws welcome" title="Bring your whole family.">
              Most of our homes welcome pets - no breed restrictions on the majority of listings, transparent
              deposits, and a team that&apos;s genuinely happy you brought the dog.
            </SectionHeading>
            <ul className="mt-7 flex flex-wrap gap-2">
              {petTags.map((tag) => (
                <li key={tag} className="rounded-full border border-surface-variant bg-brand-light px-3.5 py-1.5 text-[13.5px] font-semibold text-brand-dark">
                  {tag}
                </li>
              ))}
            </ul>
            <Link
              href="/houses-for-rent?pets=true"
              className="group mt-8 inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand-dark hover:text-accent"
            >
              Browse pet-friendly rentals
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATE DIRECTORY (cards with search; links to state hubs + top cities) ── */}
      <StateDirectory cities={mergedCities} counts={cityCounts} />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="border-t border-surface-variant bg-brand-light px-4 py-20 md:px-12 md:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div>
            <SectionHeading eyebrow="Common questions" title="Renter FAQs.">
              Still wondering about something? Our team answers every message within one business day.
            </SectionHeading>
            <Link
              href="/contact"
              className="group mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-brand-dark hover:text-accent"
            >
              Ask us a question
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="divide-y divide-surface-variant rounded-2xl border border-surface-variant bg-white">
            {faqs.map((faq, i) => (
              <details key={faq.q} className="group px-6 py-5" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-semibold leading-snug text-brand-dark [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand group-open:bg-brand group-open:text-white" aria-hidden="true">
                    <Plus size={16} className="group-open:hidden" />
                    <Minus size={16} className="hidden group-open:block" />
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl pr-10 text-[15.5px] leading-relaxed text-on-surface-variant">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="bg-forest-deep px-4 py-20 text-center text-white md:px-12 md:py-24">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="Ready when you are" title="Find your next home." align="center" tone="dark">
            Browse {totalProperties != null ? totalProperties.toLocaleString() : "hundreds of"} move-in ready
            rentals across 12+ cities. Decisions in 24 hours. No hidden fees.
          </SectionHeading>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/houses-for-rent"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-earth-beige px-7 text-[15px] font-semibold text-forest-deep transition-colors hover:bg-white"
            >
              Browse homes <ArrowRight size={16} />
            </Link>
            <Link
              href="/apply"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 px-7 text-[15px] font-semibold text-white transition-colors hover:border-white hover:bg-white/10"
            >
              Start an application
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
