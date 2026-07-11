import Link from "next/link";
import Image from "next/image";
import {
  Clock, ShieldCheck, PawPrint, Home, ArrowRight, MapPin, Building2, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CityLeadCapture } from "@/components/public/CityLeadCapture";
import { TrustSignals } from "@/components/public/TrustSignals";
import { CITIES, type CityData } from "@/lib/cities";
import type { StateInfo } from "@/lib/states";

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
  const BASE = "https://haskerrealtygroup.com";
  const url = `${BASE}/rentals/${state.slug}`;
  const cityCount = cities.length;

  const sortedCities = [...cities].sort((a, b) => {
    const ca = counts[a.slug] ?? 0;
    const cb = counts[b.slug] ?? 0;
    return cb - ca || a.name.localeCompare(b.name);
  });

  // Hero photo: the state's best curated city skyline, falling back to any
  // city image (mirrors the StateDirectory card logic).
  const curated = sortedCities.find((c) => CITIES[c.slug]?.heroImage);
  const heroImage =
    (curated ? CITIES[curated.slug].heroImage : sortedCities[0]?.heroImage) ??
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1600&q=80";

  const topCityNames = sortedCities.slice(0, 5).map((c) => c.name).join(", ");

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Houses for Rent in ${state.name}`,
    description: `Browse affordable houses and apartments for rent across ${state.name}. ${totalListings}+ move-in ready rentals in ${cityCount} cities and communities. 24-hour application decisions.`,
    url,
    isPartOf: { "@type": "WebSite", name: "Hasker & Co. Realty Group", url: BASE },
    about: {
      "@type": "State",
      name: state.name,
      containedInPlace: { "@type": "Country", name: "United States" },
    },
    provider: {
      "@type": "RealEstateAgent",
      name: "Hasker & Co. Realty Group",
      url: BASE,
      telephone: "+14045550182",
    },
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
      a: `Hasker & Co. Realty Group currently has ${totalListings > 0 ? `${totalListings} ` : ""}move-in ready rentals across ${cityCount} cities and communities in ${state.name}, including ${topCityNames}. New listings are added daily.`,
    },
    {
      q: `Which cities in ${state.name} have rentals?`,
      a: `We list houses and apartments for rent in cities and communities across ${state.name} — including ${topCityNames}, and more. You can browse every market on this page.`,
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
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── HERO — clean state photo, text on a solid card ─────── */}
      <section className="relative flex items-end overflow-hidden min-h-[540px] lg:min-h-[600px]">
        <Image
          src={heroImage}
          alt={`Homes for rent in ${state.name}`}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-12 pt-32">
          <div className="max-w-2xl bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="flex items-center gap-2 text-xs text-neutral-500">
                <li><Link href="/" className="hover:text-brand transition-colors">Home</Link></li>
                <li className="text-neutral-300">/</li>
                <li><Link href="/houses-for-rent" className="hover:text-brand transition-colors">Houses for Rent</Link></li>
                <li className="text-neutral-300">/</li>
                <li className="text-neutral-800 font-medium">{state.name}</li>
              </ol>
            </nav>

            <span className="block w-12 h-1.5 rounded-full bg-accent mb-4" />
            <p className="text-[#B87400] text-xs font-bold tracking-[0.2em] uppercase mb-3">
              {state.name} Rentals
            </p>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight">
              Houses for Rent in {state.name}
            </h1>
            <p className="text-neutral-600 text-lg mt-4 leading-relaxed">
              Browse affordable, move-in ready houses and apartments for rent across {state.name}
              {totalListings > 0 ? ` — ${totalListings} verified listings in ${cityCount} cities and communities` : ""}.
              Transparent pricing, pet-friendly options, and decisions in 24 hours.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Button variant="accent" size="lg" asChild>
                <Link href={`/houses-for-rent?q=${encodeURIComponent(state.name)}`}>
                  Browse {state.code} Listings <ArrowRight size={16} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/apply">Apply Now — 10 Minutes</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-10">
              {[
                { icon: Building2, value: `${cityCount}`, label: "Cities & Communities" },
                { icon: Home, value: totalListings > 0 ? `${totalListings}` : "Daily", label: totalListings > 0 ? "Listings" : "New Listings" },
                { icon: Clock, value: "24 hr", label: "Decisions" },
              ].map((s) => (
                <div key={s.label} className="border-l-2 border-accent pl-3">
                  <s.icon size={16} className="text-brand mb-1.5" />
                  <p className="text-xl font-bold text-neutral-900 tabular-nums">{s.value}</p>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wide mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
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

      {/* ── ALL CITIES & COMMUNITIES ─────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <div className="mb-10">
            <p className="text-brand text-xs font-semibold tracking-[0.2em] uppercase mb-2">Browse by location</p>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark leading-tight">
              Cities &amp; communities for rent in {state.name}
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-neutral-500">
              Find houses and apartments for rent in every {state.name} city and community we serve. Tap any
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

      {/* ── SEO CONTENT ──────────────────────────────────────── */}
      <section className="bg-brand-light border-y border-brand-muted">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <p className="text-brand text-xs font-semibold tracking-[0.3em] uppercase mb-4">Renting in {state.name}</p>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark leading-tight mb-6">
            Find your next home for rent in {state.name}
          </h2>
          <div className="space-y-5 text-neutral-600 text-[15px] leading-relaxed">
            <p>
              Looking for a house for rent in {state.name}? Hasker &amp; Co. Realty Group lists affordable,
              move-in ready rental homes and apartments across {cityCount} {state.name} cities and communities
              {topCityNames ? `, including ${topCityNames}` : ""}. Every listing shows transparent pricing,
              photos, and pet policy upfront — no hidden fees, no surprises.
            </p>
            <p>
              Whether you need a 1-bedroom apartment, a family-sized 3 or 4-bedroom house, or a pet-friendly
              rental, you can browse {state.name} homes by city, apply online in under 10 minutes, and get a
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
      <section className="bg-[#0F1E3D] py-16 lg:py-20 px-6">
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
    </>
  );
}
