import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ShieldCheck, Clock, BadgeDollarSign, BellRing } from "lucide-react";
import { fetchProperties, toPropertyCardShape } from "@/lib/properties";
import { fetchAllCities, toDirectoryCities } from "@/lib/cities";
import { PropertyCard } from "@/components/public/PropertyCard";
import { CityDirectory } from "@/components/public/CityDirectory";
import { TrustSignals } from "@/components/public/TrustSignals";
import { CityLeadCapture } from "@/components/public/CityLeadCapture";
import { Button } from "@/components/ui/Button";

export const revalidate = 300;

const BASE = "https://primefamilyhousing.com";
const URL = `${BASE}/apartments-for-rent`;

async function getApartments() {
  try {
    const data = await fetchProperties({ listing_type: "for-rent", type: "apartment", page_size: "9" });
    return { list: data.results.map(toPropertyCardShape), count: data.count };
  } catch {
    return { list: [] as import("@/types").Property[], count: 0 };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { count } = await getApartments();
  const live = count > 0;
  const title = live
    ? "Apartments for Rent | Move-In Ready Rentals | PrimeFamilyHousing"
    : "Apartments for Rent — Coming Soon | PrimeFamilyHousing";
  const description = live
    ? "Browse affordable apartments for rent — move-in ready, transparent pricing, no hidden fees. Apply online and get a decision in 24 hours."
    : "Affordable apartments for rent are coming soon. Get notified the moment new apartment listings go live in your city — no spam, unsubscribe anytime.";
  return {
    title,
    description,
    keywords: [
      "apartments for rent",
      "affordable apartments for rent",
      "cheap apartments for rent",
      "apartment rentals",
      "apartments for rent near me",
    ],
    alternates: { canonical: URL },
    // Stay out of the index until real apartment inventory exists, so we never
    // rank for "apartments" and then disappoint searchers with an empty page.
    robots: live ? undefined : { index: false, follow: true },
    openGraph: { title, description, type: "website", url: URL },
  };
}

const FAQS = [
  {
    q: "Do you have apartments for rent?",
    a: "We're expanding our rental inventory to include apartments. Add yourself to the notify list and we'll email you the moment apartment listings go live in your city — alongside our move-in ready rental homes.",
  },
  {
    q: "How do I apply for an apartment?",
    a: "When apartments are available you'll apply the same way as our homes: a single online application that takes under 10 minutes, with a decision within 24 hours and no hidden fees.",
  },
  {
    q: "Are your rentals affordable and pet-friendly?",
    a: "Yes. Every PrimeFamilyHousing listing shows transparent pricing and pet policy upfront, with no hidden administrative fees. Many homes are pet-friendly.",
  },
];

export default async function ApartmentsPage() {
  const { list: apartments, count } = await getApartments();
  const live = count > 0;

  const dbCities = await fetchAllCities().catch(() => []);
  // Slim projection — the directory only needs name/photo/count.
  const mergedCities = toDirectoryCities(dbCities);
  const cityCounts: Record<string, number> = Object.fromEntries(dbCities.map((c) => [c.slug, c.count]));

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE },
      { "@type": "ListItem", position: 2, name: "Apartments for Rent", item: URL },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const collectionSchema = live
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Apartments for Rent",
        description: "Affordable, move-in ready apartments for rent with transparent pricing and no hidden fees.",
        url: URL,
        isPartOf: { "@type": "WebSite", name: "PrimeFamilyHousing", url: BASE },
      }
    : null;

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {collectionSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-brand-dark overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "32px 32px" }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-16 lg:pb-20">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-blue-200">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li className="text-blue-400">/</li>
              <li className="text-white font-medium">Apartments for Rent</li>
            </ol>
          </nav>
          <p className="text-brand text-xs font-semibold tracking-[0.2em] uppercase mb-3">
            {live ? "Move-in ready apartments" : "Coming soon"}
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight max-w-3xl">
            Apartments for Rent
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mt-4 leading-relaxed">
            {live
              ? "Browse affordable, move-in ready apartments — transparent pricing, no hidden fees, and a decision within 24 hours."
              : "Apartments are coming soon to PrimeFamilyHousing In the meantime, explore our affordable, move-in ready rental homes — or get notified the moment apartments go live in your city."}
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            {live ? (
              <Button variant="accent" size="lg" asChild>
                <Link href="/homes-for-rent?type=apartment">Browse Apartments <ArrowRight size={16} /></Link>
              </Button>
            ) : (
              <Button variant="accent" size="lg" asChild>
                <Link href="/homes-for-rent">Browse Rental Homes <ArrowRight size={16} /></Link>
              </Button>
            )}
            <Button variant="outline-white" size="lg" asChild>
              <Link href="/apply">Apply Now — 10 Minutes</Link>
            </Button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-10">
            {[
              { icon: BadgeDollarSign, label: "No hidden fees" },
              { icon: ShieldCheck, label: "Move-in ready" },
              { icon: Clock, label: "24-hour decisions" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-white/80 text-sm">
                <b.icon size={15} className="text-brand" /> {b.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {live ? (
        /* ── APARTMENT LISTINGS ─────────────────────────────── */
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-brand text-xs font-semibold tracking-[0.2em] uppercase mb-2">Available now</p>
                <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark">Apartments available to rent</h2>
              </div>
              <Link href="/homes-for-rent?type=apartment" className="hidden sm:flex items-center gap-2 text-sm text-brand font-medium hover:underline">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apartments.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          </div>
        </section>
      ) : (
        /* ── COMING SOON / NOTIFY ───────────────────────────── */
        <section className="bg-[#081C15] py-16 lg:py-20 px-6">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5">
              <BellRing size={22} className="text-brand" />
            </div>
            <p className="text-brand text-xs font-semibold tracking-[0.2em] uppercase mb-3">Be first in line</p>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-4">
              Get notified when apartments go live
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Leave your details and we&apos;ll email you the moment apartment listings open in your area — before they go public.
            </p>
            <CityLeadCapture cityName="Apartments" />
          </div>
        </section>
      )}

      {/* ── SEO CONTENT ──────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark leading-tight mb-6">
            Apartments &amp; rental homes you can trust
          </h2>
          <div className="space-y-5 text-neutral-600 text-[15px] leading-relaxed">
            <p>
              PrimeFamilyHousing is growing its rental selection to include apartments alongside our
              affordable, move-in ready houses. Every listing — apartment or home — shows transparent pricing,
              photos, and pet policy upfront, with no hidden administrative or processing fees.
            </p>
            <p>
              Apply online in under 10 minutes and get a decision within 24 hours. While apartments roll out,
              you can browse hundreds of budget-friendly rental homes by city and move in fast.
            </p>
          </div>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button variant="accent" asChild><Link href="/homes-for-rent">Browse Rentals</Link></Button>
            <Button variant="outline-blue" asChild><Link href="/homes-for-rent?sort=price_asc">See Affordable Homes</Link></Button>
          </div>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────── */}
      <TrustSignals tone="tint" />

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="bg-white py-16 lg:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-brand text-xs font-semibold tracking-[0.3em] uppercase mb-3">Common Questions</p>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark leading-tight mb-10">Apartments — FAQ</h2>
          <div className="space-y-3">
            {FAQS.map((f) => (
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

      {/* ── CITY DIRECTORY ───────────────────────────────────── */}
      <CityDirectory
        cities={mergedCities}
        counts={cityCounts}
        heading="Rentals by city & state"
        intro="Browse move-in ready rentals in every city we serve. Tap a location to see available homes — with apartments rolling out soon."
      />
    </div>
  );
}
