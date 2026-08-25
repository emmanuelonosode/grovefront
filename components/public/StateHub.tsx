import Link from "next/link";
import Image from "next/image";
import {
  Clock, ShieldCheck, PawPrint, Home, ArrowRight, MapPin, TrendingUp,
  Search, TreePine, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CityLeadCapture } from "@/components/public/CityLeadCapture";
import { TrustSignals } from "@/components/public/TrustSignals";
import { CITIES, type CityData } from "@/lib/cities";
import { getStateMedia, type StateInfo } from "@/lib/states";
import { realEstateAgentSchema } from "@/lib/business";

interface Props {
  state: StateInfo;
  cities: CityData[];
  counts: Record<string, number>;
  totalListings: number;
  otherStates: { name: string; slug: string }[];
}

const TRUST_BADGES = [
  { icon: Clock, label: "24-Hour Decisions" },
  { icon: ShieldCheck, label: "Move-In Ready" },
  { icon: PawPrint, label: "Pet-Friendly Options" },
  { icon: Home, label: "Verified Listings Only" },
];

/**
 * State hub page (/rentals/[state]) — e.g. "Houses for Rent in Georgia".
 * Funnels authority city → state → home and ranks for "houses for rent in [state]".
 * Lists EVERY city / community in the state with live counts (crawlable links).
 */
export function StateHub({ state, cities, counts, totalListings, otherStates }: Props) {
  const BASE = "https://primefamilyhousing.com";
  const url = `${BASE}/rentals/${state.slug}`;
  const cityCount = cities.length;

  const sortedCities = [...cities].sort((a, b) => {
    const ca = counts[a.slug] ?? 0;
    const cb = counts[b.slug] ?? 0;
    return cb - ca || a.name.localeCompare(b.name);
  });

  // Hero photo: explicit state media, or the state's best curated city skyline,
  // falling back to any city image (mirrors the StateDirectory card logic).
  const stateMedia = getStateMedia(state.code);
  const curated = sortedCities.find((c) => CITIES[c.slug]?.heroImage);
  const heroImage =
    stateMedia?.hero ??
    (curated ? CITIES[curated.slug].heroImage : sortedCities[0]?.heroImage) ??
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1600&q=80";

  const featureImage = stateMedia?.feature ?? heroImage;
  const topCityNames = sortedCities.slice(0, 5).map((c) => c.name).join(", ");

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Houses for Rent in ${state.name}`,
    description: `Browse affordable houses for rent across ${state.name}. ${totalListings}+ move-in ready rentals in ${cityCount} cities and communities. 24-hour application decisions.`,
    url,
    isPartOf: { "@type": "WebSite", name: "PrimeFamilyHousing", url: BASE },
    about: {
      "@type": "State",
      name: state.name,
      containedInPlace: { "@type": "Country", name: "United States" },
    },
    provider: realEstateAgentSchema(),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Houses for Rent", item: `${BASE}/houses-for-rent` },
      { "@type": "ListItem", position: 3, name: `${state.name}`, item: url },
    ],
  };

  const faqs = [
    {
      q: `How many houses for rent are available in ${state.name}?`,
      a: `PrimeFamilyHousing currently has ${totalListings > 0 ? `${totalListings} ` : ""}move-in ready rentals across ${cityCount} cities and communities in ${state.name}, including ${topCityNames}. New listings are added daily.`,
    },
    {
      q: `Which cities in ${state.name} have rentals?`,
      a: `We list houses for rent in cities and communities across ${state.name} — including ${topCityNames}, and more. You can browse every market on this page.`,
    },
    {
      q: `How fast can I get approved for a rental in ${state.name}?`,
      a: `Apply online in under 10 minutes and get a decision within 24 hours. Most homes in ${state.name} are move-in ready, so you can sign and move in on your preferred date.`,
    },
    {
      q: `Are there affordable and pet-friendly rentals in ${state.name}?`,
      a: `Yes. Many of our ${state.name} listings are budget-friendly and pet-friendly. Pricing and pet policies are shown upfront on every listing — no hidden fees.`,
    },
  ];

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

      {/* ── HERO — full-bleed photo, forest gradient, centered ─── */}
      <section className="relative w-full min-h-[500px] md:min-h-[614px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt={`Homes for rent in ${state.name}`}
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-forest-deep/40 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-4 md:px-12 max-w-7xl mx-auto flex flex-col items-center pt-28 pb-14">
          <span className="text-[14px] leading-5 tracking-widest font-semibold text-secondary-container mb-3 uppercase">
            Regional Guide
          </span>
          <h1 className="font-serif font-bold text-white mb-6 max-w-3xl drop-shadow-md text-[2.2rem] leading-[1.15] sm:text-[3rem] lg:text-[3.5rem] lg:leading-[1.16]" style={{ letterSpacing: "-0.02em" }}>
            Find Your Sanctuary in {state.name}
          </h1>
          <p className="text-[17px] sm:text-[18px] leading-[1.55] text-surface-container-low max-w-2xl mb-10 drop-shadow-md">
            Browse affordable, move-in ready houses across {state.name}
            {totalListings > 0 ? ` — ${totalListings} verified listings in ${cityCount} cities and communities` : ""}.
            Transparent pricing, pet-friendly options, and decisions in 24 hours.
          </p>

          {/* Search bar */}
          <form action="/houses-for-rent" method="GET" className="w-full max-w-2xl bg-surface rounded-full p-2 flex items-center shadow-lg">
            <Search size={18} className="text-outline ml-4 mr-2 shrink-0" />
            <input
              type="text"
              name="q"
              defaultValue={state.name}
              placeholder="Search by city, neighborhood, or zip code..."
              className="flex-grow bg-transparent border-none focus:ring-0 text-on-surface text-[16px] placeholder-on-surface-variant/60 outline-none min-w-0"
            />
            <button
              type="submit"
              className="bg-primary text-on-primary text-[14px] tracking-[0.05em] font-semibold rounded-full py-3 px-8 hover:bg-forest-deep transition-colors duration-200 active:scale-95 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              Search
              <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────── */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between gap-6 overflow-x-auto scrollbar-hide">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="flex items-center gap-2.5 shrink-0">
                <b.icon size={16} className="text-brand" />
                <span className="text-neutral-600 text-xs font-semibold tracking-wide whitespace-nowrap">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROWSE BY TYPE (quick navigation) ────────────────── */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400 mb-3">
            Browse {state.name} rentals by type
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "All Homes", href: `/houses-for-rent?q=${encodeURIComponent(state.name)}` },
              { label: "2-Bedroom", href: `/houses-for-rent?q=${encodeURIComponent(state.name)}&beds=2` },
              { label: "3-Bedroom", href: `/houses-for-rent?q=${encodeURIComponent(state.name)}&beds=3` },
              { label: "4-Bedroom", href: `/houses-for-rent?q=${encodeURIComponent(state.name)}&beds=4` },
              { label: "Pet-Friendly", href: `/houses-for-rent?q=${encodeURIComponent(state.name)}&pets=true` },
              { label: "Most Affordable", href: `/houses-for-rent?q=${encodeURIComponent(state.name)}&sort=price_asc` },
            ].map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 text-sm font-medium text-brand-dark hover:border-brand hover:text-brand hover:bg-brand-light transition-colors"
              >
                <Home size={14} className="text-brand" /> {t.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED COMMUNITIES (top cities as rich cards) ──── */}
      {sortedCities.filter((c) => c.heroImage).length > 0 && (
        <section className="py-12 md:py-16 px-4 md:px-12 max-w-7xl mx-auto w-full">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-serif font-semibold text-primary mb-2 text-[26px] leading-[34px] md:text-[32px] md:leading-[40px]">Featured Communities</h2>
              <p className="text-[16px] leading-6 text-on-surface-variant max-w-xl">
                Explore the most sought-after {state.name} neighborhoods for families, offering exceptional schools, abundant parks, and a strong sense of belonging.
              </p>
            </div>
            <a
              href="#all-cities"
              className="shrink-0 font-semibold text-[14px] tracking-[0.05em] text-terracotta-warm hover:text-secondary flex items-center gap-2 transition-colors"
            >
              View all {state.name} cities <ArrowRight size={18} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCities.filter((c) => c.heroImage).slice(0, 3).map((c, i) => {
              const n = counts[c.slug];
              return (
                <div
                  key={c.slug}
                  className="group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-surface-variant transition-transform hover:-translate-y-1 duration-300"
                >
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={c.heroImage}
                      alt={`Family homes for rent in ${c.name}, ${state.code}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    {i === 0 && (
                      <div className="absolute top-4 left-4 bg-earth-beige text-on-secondary-container text-[14px] leading-5 font-semibold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <TrendingUp size={15} /> High Demand
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-serif font-semibold text-primary text-[24px] leading-8">{c.name}</h3>
                      {n ? (
                        <span className="bg-surface-container text-on-surface-variant text-[12px] leading-4 px-2 py-1 rounded-md tabular-nums">
                          {n} Home{n === 1 ? "" : "s"}
                        </span>
                      ) : null}
                    </div>
                    {c.tagline && (
                      <p className="text-[16px] leading-6 text-on-surface-variant mb-6 line-clamp-2">{c.tagline}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container-low text-on-surface-variant text-[12px] leading-4 rounded-full border border-outline-variant/50">
                        <GraduationCap size={14} className="text-sage-soft" /> Family Schools
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container-low text-on-surface-variant text-[12px] leading-4 rounded-full border border-outline-variant/50">
                        <TreePine size={14} className="text-sage-soft" /> Parks & Trails
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container-low text-on-surface-variant text-[12px] leading-4 rounded-full border border-outline-variant/50">
                        <Home size={14} className="text-sage-soft" /> from {c.avgRent}/mo
                      </span>
                    </div>
                    <Link
                      href={`/rentals/${c.slug}`}
                      className="w-full text-[14px] tracking-[0.05em] font-semibold text-primary border border-outline hover:border-primary py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 group-hover:bg-primary/5"
                    >
                      Explore {c.name}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── ALL CITIES & COMMUNITIES ─────────────────────────── */}
      <section id="all-cities" className="bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <div className="mb-10">
            <p className="text-brand text-xs font-semibold tracking-[0.2em] uppercase mb-2">Browse by location</p>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark leading-tight">
              Cities &amp; communities for rent in {state.name}
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-neutral-500">
              Find houses for rent in every {state.name} city and community we serve. Tap any
              location to see available move-in ready homes.
            </p>
          </div>

          {sortedCities.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {sortedCities.map((c) => {
                const n = counts[c.slug];
                return (
                  <Link
                    key={c.slug}
                    href={`/rentals/${c.slug}`}
                    className="group flex items-center justify-between gap-2 rounded-sm border border-neutral-200 px-4 py-3.5 hover:border-brand hover:bg-brand-light transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-dark group-hover:text-brand truncate">
                        <MapPin size={13} className="text-brand shrink-0" />
                        {c.name}
                      </span>
                      <span className="block text-[11px] text-neutral-400 mt-0.5">
                        from {c.avgRent}/mo
                      </span>
                    </span>
                    {n ? (
                      <span className="shrink-0 text-[11px] font-bold tabular-nums text-brand bg-brand-light rounded-full px-2 py-0.5">
                        {n}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border border-neutral-100 rounded-sm bg-neutral-50 p-10 text-center">
              <Home size={28} className="text-brand mx-auto mb-4" />
              <h3 className="font-serif text-xl font-bold text-brand-dark mb-2">New {state.name} listings coming soon</h3>
              <p className="text-neutral-500 text-sm max-w-md mx-auto mb-6">
                We&apos;re expanding across {state.name}. Browse all currently available homes, or leave your details below to be notified first.
              </p>
              <Button variant="accent" asChild><Link href="/houses-for-rent">Browse All Homes <ArrowRight size={14} /></Link></Button>
            </div>
          )}
        </div>
      </section>

      {/* ── WHY CHOOSE {STATE} ───────────────────────────────── */}
      <section className="bg-surface-container-low py-12 md:py-16 mt-6">
        <div className="px-4 md:px-12 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="w-full md:w-1/2 relative h-[400px]">
            <Image
              src={featureImage}
              alt={`Living in ${state.name}`}
              fill
              className="rounded-xl shadow-md object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="font-serif font-semibold text-primary mb-3 text-[26px] leading-[34px] md:text-[32px] md:leading-[40px]">
              Why Choose {state.name}?
            </h2>
            <p className="text-[16px] leading-6 text-on-surface-variant mb-6">
              {state.name} offers families a blend of opportunity and community. From
              {topCityNames ? ` ${topCityNames.split(", ").slice(0, 2).join(" and ")}` : " its top cities"} to
              quieter neighborhoods, our {state.name} homes put schools, parks, and everyday
              essentials within easy reach — with transparent pricing and none of the runaround.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary mt-1">
                  <TreePine size={18} />
                </div>
                <div>
                  <h4 className="text-[14px] leading-5 tracking-[0.05em] font-semibold text-on-surface mb-1">Room to Grow</h4>
                  <p className="text-[14px] leading-5 text-on-surface-variant">Spacious family homes with yards, near parks, trails, and green space.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary mt-1">
                  <GraduationCap size={18} />
                </div>
                <div>
                  <h4 className="text-[14px] leading-5 tracking-[0.05em] font-semibold text-on-surface mb-1">Family-First Communities</h4>
                  <p className="text-[14px] leading-5 text-on-surface-variant">Neighborhoods chosen for school access, safety, and a real sense of belonging.</p>
                </div>
              </li>
            </ul>
            <Link
              href="/contact"
              className="inline-flex text-[14px] tracking-[0.05em] font-semibold bg-terracotta-warm text-white py-3 px-6 rounded-full hover:bg-secondary transition-colors duration-200 shadow-sm"
            >
              Speak to a Local Expert
            </Link>
          </div>
        </div>
      </section>

      {/* ── SEO CONTENT ──────────────────────────────────────── */}
      <section className="bg-brand-light border-y border-brand-muted">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <p className="text-brand text-xs font-semibold tracking-[0.3em] uppercase mb-4">Renting in {state.name}</p>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark leading-tight mb-6">
            Find your next home for rent in {state.name}
          </h2>
          <div className="space-y-5 text-neutral-600 text-[15px] leading-relaxed">
            <p>
              Looking for a house for rent in {state.name}? PrimeFamilyHousing lists affordable,
              move-in ready rental homes across {cityCount} {state.name} cities and communities
              {topCityNames ? `, including ${topCityNames}` : ""}. Every listing shows transparent pricing,
              photos, and pet policy upfront — no hidden fees, no surprises.
            </p>
            <p>
              Whether you need a cozy 2-bedroom house, a family-sized 3 or 4-bedroom home, or a pet-friendly
              rental, you can browse {state.name} houses by city, apply online in under 10 minutes, and get a
              decision within 24 hours. Many homes are move-in ready immediately.
            </p>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button variant="accent" asChild><Link href="/apply">Apply in 10 Minutes</Link></Button>
            <Button variant="outline-blue" asChild>
              <Link href={`/houses-for-rent?q=${encodeURIComponent(state.name)}`}>Browse {state.name} Listings</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────── */}
      <TrustSignals
        eyebrow="Why renters choose us"
        heading={`Renting in ${state.name}, without the runaround`}
        tone="light"
      />

      {/* ── LEAD CAPTURE ─────────────────────────────────────── */}
      <section className="bg-[#081C15] py-16 lg:py-20 px-6">
        <div className="max-w-xl mx-auto text-center">
          <p className="text-brand text-xs font-semibold tracking-[0.2em] uppercase mb-3">Be First</p>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-4">
            New {state.name} listings drop weekly
          </h2>
          <p className="text-blue-200 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
            Leave your details and we&apos;ll notify you the moment a {state.name} home matching your needs becomes available.
          </p>
          <CityLeadCapture cityName={state.name} />
        </div>
      </section>

      {/* ── VISIBLE FAQ ──────────────────────────────────────── */}
      <section className="bg-white py-16 lg:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <p className="text-brand text-xs font-semibold tracking-[0.3em] uppercase mb-3">Common Questions</p>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark leading-tight">
              Renting in {state.name} — FAQ
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group border border-neutral-200 rounded-sm overflow-hidden">
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer list-none hover:bg-neutral-50 transition-colors">
                  <span className="font-medium text-sm text-brand-dark leading-snug">{f.q}</span>
                  <span className="shrink-0 w-6 h-6 rounded-full border border-neutral-300 flex items-center justify-center group-open:border-brand group-open:bg-brand transition-colors">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="text-neutral-400 group-open:text-white group-open:rotate-180 transition-all">
                      <path d="M1.5 4L5.5 8L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-5 pt-1 border-t border-neutral-100">
                  <p className="text-neutral-600 text-sm leading-relaxed">{f.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXPLORE OTHER STATES ─────────────────────────────── */}
      {otherStates.length > 0 && (
        <section className="bg-white border-t border-neutral-100">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={16} className="text-brand" />
              <h2 className="font-serif text-xl lg:text-2xl font-bold text-brand-dark">Houses for rent in other states</h2>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {otherStates.map((s) => (
                <Link
                  key={s.slug}
                  href={`/rentals/${s.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-neutral-200 text-sm font-medium text-brand-dark hover:border-brand hover:text-brand hover:bg-brand-light transition-colors"
                >
                  <MapPin size={13} className="text-brand" /> {s.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
