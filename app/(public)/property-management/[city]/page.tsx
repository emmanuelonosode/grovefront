import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight, ShieldCheck, DollarSign, Wrench, BarChart3,
  Clock, Users, Phone, Mail,
} from "lucide-react";
import { getAllCitySlugs, fetchAllCities, resolveCityData } from "@/lib/cities";
import { Button } from "@/components/ui/Button";

export const revalidate = 300;

/* ── Static params ──────────────────────────────────────────────────── */

export async function generateStaticParams() {
  // Only pre-render hardcoded cities at build time — unknown slugs are served
  // via ISR on first request (dynamicParams defaults to true).
  return getAllCitySlugs().map((city) => ({ city }));
}

/* ── Metadata ───────────────────────────────────────────────────────── */

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> }
): Promise<Metadata> {
  const { city: slug } = await params;
  const city = await resolveCityData(slug);
  if (!city) return { title: "Not Found" };

  const title = `Property Management in ${city.name}, ${city.stateCode} | PrimeFamilyHousing`;
  const description = `Professional property management in ${city.name}, ${city.stateCode}. Tenant screening, rent collection, maintenance coordination, and monthly reporting. Let PrimeFamilyHousing manage your investment.`;
  const url = `https://primefamilyhousing.com/property-management/${slug}`;

  return {
    title,
    description,
    keywords: [
      `property management ${city.name}`,
      `${city.name} property management company`,
      `rental property manager ${city.name} ${city.stateCode}`,
      `landlord services ${city.name}`,
      `tenant screening ${city.name}`,
      `rent collection service ${city.name}`,
      `property management fees ${city.name}`,
      `hire property manager ${city.name}`,
      `investment property management ${city.name}`,
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [{ url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"],
    },
  };
}

/* ── Page component ─────────────────────────────────────────────────── */

export default async function PropertyManagementCityPage(
  { params }: { params: Promise<{ city: string }> }
) {
  const { city: slug } = await params;
  const city = await resolveCityData(slug);
  if (!city) notFound();

  const pageUrl = `https://primefamilyhousing.com/property-management/${slug}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Property Management in ${city.name}, ${city.stateCode}`,
    provider: {
      "@type": "RealEstateAgent",
      name: "PrimeFamilyHousing",
      url: "https://primefamilyhousing.com",
      telephone: "+17572082767",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Virginia Beach",
        addressRegion: "VA",
        addressCountry: "US",
      },
    },
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: { "@type": "State", name: city.stateCode },
    },
    description: `Full-service property management in ${city.name} — tenant screening, rent collection, maintenance, and monthly reporting.`,
    url: pageUrl,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",               item: "https://primefamilyhousing.com" },
      { "@type": "ListItem", position: 2, name: "Property Management", item: "https://primefamilyhousing.com/property-management" },
      { "@type": "ListItem", position: 3, name: `${city.name}, ${city.stateCode}`, item: pageUrl },
    ],
  };

  const faqItems = [
    {
      q: `How much does property management cost in ${city.name}?`,
      a: `PrimeFamilyHousing charges a transparent, flat management fee with no hidden costs. Contact us for a free property analysis and quote tailored to your ${city.name} rental.`,
    },
    {
      q: `What does PrimeFamilyHousing handle when managing my ${city.name} property?`,
      a: `We handle everything: tenant screening and placement, rent collection, late fee enforcement, 24/7 maintenance coordination, monthly owner statements, and lease renewals. You own — we manage.`,
    },
    {
      q: `How quickly can you find tenants for my ${city.name} rental?`,
      a: `Our average vacancy period is significantly below market average. We list on all major rental platforms, use targeted digital advertising, and have an active pool of pre-screened applicants.`,
    },
    {
      q: `Do I need to be local to use your property management in ${city.name}?`,
      a: `No. Many of our clients are out-of-state investors. We handle everything locally in ${city.name} so you never need to be present. Monthly digital reports keep you informed from anywhere.`,
    },
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const services = [
    {
      icon: ShieldCheck,
      title: "Tenant Screening",
      desc: "Background checks, credit reports, income verification, and rental history — so you only get qualified, reliable tenants.",
    },
    {
      icon: DollarSign,
      title: "Rent Collection",
      desc: "Automated online rent collection, late fee enforcement, and direct deposit to your account — on time, every month.",
    },
    {
      icon: Wrench,
      title: "Maintenance Coordination",
      desc: "24/7 maintenance request handling with our vetted contractor network. Issues resolved fast, costs kept low.",
    },
    {
      icon: BarChart3,
      title: "Monthly Reporting",
      desc: "Detailed owner statements, expense tracking, and year-end tax documents — everything you need to understand your investment.",
    },
    {
      icon: Clock,
      title: "Vacancy Minimization",
      desc: "Professional listing photos, multi-platform advertising, and proactive renewal outreach to keep your property occupied.",
    },
    {
      icon: Users,
      title: "Lease Management",
      desc: `Full lease preparation, signing, renewals, and compliance with local landlord-tenant laws in ${city.stateCode}.`,
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-[440px] lg:min-h-[500px] flex items-end overflow-hidden">
        <Image
          src={city.heroImage}
          alt={`Property management in ${city.name}, ${city.stateCode}`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-12 pt-32">
          <div className="max-w-2xl bg-white rounded-2xl shadow-2xl p-8 lg:p-12">
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="flex items-center gap-2 text-xs text-neutral-500">
                <li><Link href="/" className="hover:text-brand">Home</Link></li>
                <li className="text-neutral-300">/</li>
                <li className="text-neutral-800 font-medium">Property Management — {city.name}, {city.stateCode}</li>
              </ol>
            </nav>

            <span className="block w-12 h-1.5 rounded-full bg-accent mb-4" />
            <p className="text-[#B87400] text-xs font-bold tracking-[0.2em] uppercase mb-3">
              {city.stateCode} Property Management
            </p>
            <h1 className="font-serif text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight">
              Let Us Manage Your {city.name} Property
            </h1>
            <p className="text-neutral-600 text-lg mt-4 leading-relaxed">
              From tenant screening to maintenance to monthly reporting — we handle everything so you can focus on growing your portfolio.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <Button variant="accent" size="lg" asChild>
                <Link href={`/contact?service=property-management&city=${slug}`}>
                  Get a Free Property Analysis
                  <ArrowRight size={16} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="tel:+17572082767">
                  <Phone size={16} />
                  Call Us Now
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE STATS ───────────────────────────────────────────────── */}
      <section className="bg-brand border-t border-brand-dark/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "24 hrs", label: "Maintenance Response" },
              { value: city.avgRent, label: "Avg. Market Rent" },
              { value: "$0",     label: "Hidden Fees" },
              { value: "2,000+", label: "Families Housed" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-serif text-2xl font-bold text-white">{s.value}</p>
                <p className="text-blue-200 text-xs mt-1 tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES GRID ─────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
          <div className="text-center mb-12">
            <p className="text-brand text-xs font-semibold tracking-[0.2em] uppercase mb-3">What We Handle</p>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark">
              Full-Service Management for {city.name} Landlords
            </h2>
            <p className="text-neutral-500 text-sm mt-3 max-w-xl mx-auto">
              One team. Every detail. You own the property — we run it.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <div key={s.title} className="border border-neutral-100 rounded-sm p-6 bg-neutral-50">
                <div className="w-11 h-11 rounded-sm bg-brand-light flex items-center justify-center mb-4">
                  <s.icon size={20} className="text-brand" />
                </div>
                <h3 className="font-semibold text-brand-dark text-base mb-2">{s.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ──────────────────────────────────────────────────── */}
      <section className="bg-brand-dark py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to stop self-managing?
          </h2>
          <p className="text-blue-200 text-base mb-8 max-w-xl mx-auto">
            Get a free rental market analysis for your {city.name} property. No commitment — just clarity on what your investment could earn.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="accent" size="lg" asChild>
              <Link href={`/contact?service=property-management&city=${slug}`}>
                Request Free Analysis
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Button variant="outline-white" size="lg" asChild>
              <Link href="mailto:info@primefamilyhousing.com">
                <Mail size={16} />
                Email Us
              </Link>
            </Button>
          </div>
          <p className="text-blue-300 text-xs mt-6">
            Or call: <a href="tel:+17572082767" className="text-white font-semibold hover:underline">+1 (757) 208-2767</a>
          </p>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-neutral-100 py-16 lg:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <p className="text-brand text-xs font-semibold tracking-[0.3em] uppercase mb-3">Landlord Questions</p>
            <h2 className="font-serif text-3xl font-bold text-brand-dark">
              Property Management in {city.name} — FAQ
            </h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((faq) => (
              <details key={faq.q} className="group border border-neutral-100 rounded-sm overflow-hidden bg-neutral-50">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-neutral-100 transition-colors">
                  <span className="font-medium text-sm text-brand-dark leading-snug">{faq.q}</span>
                  <div className="shrink-0 w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center group-open:border-brand group-open:bg-brand transition-colors duration-200">
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="text-neutral-400 group-open:text-white group-open:rotate-180 transition-all duration-200">
                      <path d="M1.5 4L5.5 8L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </summary>
                <div className="px-6 pb-5 pt-2 border-t border-neutral-100">
                  <p className="text-neutral-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
