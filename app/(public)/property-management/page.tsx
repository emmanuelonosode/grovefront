import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight, ShieldCheck, DollarSign, Wrench, BarChart3,
  Clock, Users, Phone, Mail, FileText, CheckCircle2, MapPin
} from "lucide-react";
import { fetchAllCities, CITIES } from "@/lib/cities";
import { Button } from "@/components/ui/Button";
import { PropertyManagementLeadForm } from "@/components/public/PropertyManagementLeadForm";

export const revalidate = 300;

/* ── Metadata ───────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Professional Property Management Services | PrimeFamilyHousing",
  description:
    "Maximize your rental income with zero hassle. Let PrimeFamilyHousing handle tenant screening, automated rent collection, 24/7 maintenance, and reporting across 12+ US cities.",
  keywords: [
    "property management", "rental property manager", "landlord services",
    "rent collection service", "tenant screening", "vetted renters",
    "investment property management", "PrimeFamilyHousing Property Management"
  ],
  alternates: { canonical: "https://primefamilyhousing.com/property-management" },
  openGraph: {
    title: "Professional Property Management Services | PrimeFamilyHousing",
    description: "Maximize your rental income with zero hassle. Vetted tenants, 24/7 maintenance, and flat fees.",
    url: "https://primefamilyhousing.com/property-management",
    type: "website",
    images: [{ url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80", width: 1200, height: 630, alt: "Professional Property Management" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Professional Property Management Services | PrimeFamilyHousing",
    description: "Maximize your rental income with zero hassle. Vetted tenants, 24/7 maintenance, and flat fees.",
    images: ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80"],
  },
};

/* ── Page component ─────────────────────────────────────────────────── */

export default async function PropertyManagementPage() {
  const dbCities = await fetchAllCities();

  // Merge hardcoded CITIES and DB cities to get a unique list for SEO routing
  const uniqueCitiesMap = new Map();
  
  // Add hardcoded cities first
  Object.values(CITIES).forEach(c => {
    uniqueCitiesMap.set(c.slug, { slug: c.slug, name: c.name, stateCode: c.stateCode });
  });

  // Merge DB cities (adds any custom cities from database)
  dbCities.forEach(c => {
    if (!uniqueCitiesMap.has(c.slug)) {
      uniqueCitiesMap.set(c.slug, { slug: c.slug, name: c.city, stateCode: c.state });
    }
  });

  const allCities = Array.from(uniqueCitiesMap.values()).sort((a, b) => a.name.localeCompare(b.name));

  const pageUrl = "https://primefamilyhousing.com/property-management";

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Professional Property Management Services",
    provider: {
      "@type": "RealEstateAgent",
      name: "PrimeFamilyHousing",
      url: "https://primefamilyhousing.com",
      telephone: "+17577924480",
      address: {
        "@type": "PostalAddress",
        streetAddress: "1425 S 1500 E Unit 222",
        addressLocality: "Clearfield",
        addressRegion: "UT",
        postalCode: "84015",
        addressCountry: "US",
      },
    },
    description: "Full-service single-family home property management, including tenant placement, rent collection, 24/7 maintenance coordination, and financial reporting.",
    url: pageUrl,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home",               item: "https://primefamilyhousing.com" },
      { "@type": "ListItem", position: 2, name: "Property Management", item: pageUrl },
    ],
  };

  const faqItems = [
    {
      q: "What are your property management fees?",
      a: "We charge a transparent flat monthly management fee based on the property location and rental rate. There are no hidden admin fees, no setup charges, and no markups on routine maintenance work.",
    },
    {
      q: "How do you screen and vet potential tenants?",
      a: "Our vetting process includes comprehensive credit checks, nationwide criminal background checks, employment and income verification (minimum 3x rent-to-income ratio), and previous landlord reference checks.",
    },
    {
      q: "How are maintenance requests handled?",
      a: "Tenants submit requests through their online portal. For emergencies, we run a 24/7 dispatch line. We coordinate all repairs with our pre-vetted, insured local contractor network and require owner approval for any repairs over $500.",
    },
    {
      q: "When and how do I receive my rental payouts?",
      a: "Rent is due on the 1st of each month. Direct deposit payouts are processed and sent to your bank account by the 10th of the month, along with your monthly financial statement in the owner portal.",
    },
    {
      q: "Do I have to live nearby to work with PrimeFamilyHousing?",
      a: "Not at all. We specialize in turn-key management for out-of-state and international investors. We handle inspections, lease signings, keys, and tenant requests locally so you don't have to travel.",
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
      title: "Tenant Screening & Vetting",
      desc: "Comprehensive credit checks, criminal background screens, and income verification. We find renters who care for your home.",
    },
    {
      icon: DollarSign,
      title: "Direct Rent Payouts",
      desc: "Automated online collection keeps payments steady. Rent payouts are deposited straight to your bank account by the 10th of each month.",
    },
    {
      icon: Wrench,
      title: "24/7 Maintenance Care",
      desc: "In-house triage and a vetted local contractor network. We handle emergency calls and routine repairs with zero contractor markups.",
    },
    {
      icon: BarChart3,
      title: "Transparent Portal Reporting",
      desc: "Log in anytime to see real-time income, maintenance work orders, annual tax documents, and property inspection records.",
    },
    {
      icon: FileText,
      title: "Leasing & Legal Compliance",
      desc: "Custom lease agreements drafted by real estate attorneys. Full compliance with local state landlord-tenant laws and Fair Housing regulations.",
    },
    {
      icon: Clock,
      title: "Vacancy Minimization",
      desc: "High-quality photography and multi-platform syndication (Zillow, MLS, Social Media) paired with rapid screening to keep slots filled.",
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative bg-[#0B1F3A] text-white pt-32 pb-24 overflow-hidden">
        {/* Background Subtle grid overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f3f4ec_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Copy */}
            <div className="lg:col-span-7 text-left">
              <p className="text-brand text-xs font-semibold tracking-[0.35em] uppercase mb-4">
                PrimeFamilyHousing Property Management
              </p>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-white mb-6">
                Worry-Free Leasing.<br />
                <span className="text-brand">Consistent Returns.</span>
              </h1>
              <p className="text-blue-100 text-base sm:text-lg max-w-xl leading-relaxed mb-8">
                PrimeFamilyHousing manages single-family rental homes with institution-grade precision and local care. Vetted tenants, 24/7 maintenance coordination, and transparent flat fees. No surprise charges.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="accent" size="lg" asChild>
                  <a href="#analysis-section">
                    Get Free Rental Analysis
                    <ArrowRight size={16} />
                  </a>
                </Button>
                <Button variant="outline-white" size="lg" asChild>
                  <a href="#supported-markets">
                    Browse Served Cities
                  </a>
                </Button>
              </div>
            </div>

            {/* Hero Image / Badge */}
            <div className="lg:col-span-5 relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-square bg-brand-dark rounded-xl overflow-hidden border border-white/10 shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80"
                alt="Professional property management handshake and home keys"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A]/70 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 bg-[#0B1F3A]/90 backdrop-blur-sm p-5 border border-white/10">
                <p className="text-xs font-semibold text-brand tracking-widest uppercase mb-1">Owner Guarantee</p>
                <p className="text-sm font-bold text-white leading-snug">
                  If we don&apos;t lease your property in 30 days, your first month of management is 100% free.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUE STATS BANNER ───────────────────────────────────────────── */}
      <section className="bg-brand text-white border-t border-brand-dark/20 py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "$0", label: "Hidden Admin Fees" },
              { value: "24h", label: "Typical Response" },
              { value: "4.9 ★", label: "Trustpilot Rating" },
              { value: "2,000+", label: "Families Housed" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center">
                <p className="font-serif text-3xl sm:text-4xl font-bold">{s.value}</p>
                <p className="text-blue-100 text-xs sm:text-sm mt-1.5 tracking-wide font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CORE SERVICES ────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-brand text-xs font-semibold tracking-[0.25em] uppercase mb-3">Our Core Program</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1F3A]">
              We Run It. You Own It.
            </h2>
            <p className="text-neutral-500 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
              Managing rental properties doesn&apos;t need to be a second job. Our comprehensive property management program covers every detail from screening to payouts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s) => (
              <div key={s.title} className="border border-neutral-100 bg-[#f3f4ec]/20 p-8 hover:border-brand/35 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-[#f3f4ec] flex items-center justify-center mb-5">
                    <s.icon size={22} className="text-brand" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#0B1F3A] mb-3">{s.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
                <div className="mt-6 w-8 h-[2px] bg-brand/35" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ONBOARDING PROCESS ───────────────────────────────────────────── */}
      <section className="bg-[#f3f4ec] py-24 border-y border-neutral-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-brand text-xs font-semibold tracking-[0.25em] uppercase mb-3">Onboarding</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1F3A]">
              Getting Started in Three Steps
            </h2>
            <p className="text-neutral-500 text-sm mt-3 max-w-xl mx-auto leading-relaxed">
              We make transferring management or launching your first listing seamless.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Property Consultation",
                desc: "We perform a local market analysis comparing listings to estimate your optimal rent rate. We walk through any needed pre-listing cosmetic updates."
              },
              {
                step: "02",
                title: "Marketing & Syndication",
                desc: "We take high-definition photos and syndicate your home to all major portals. We screen applicants and structure the legal lease contracts."
              },
              {
                step: "03",
                title: "Passive Income",
                desc: "We handle rent collection, routine inspections, and tenant relations. You track operations, statements, and payouts directly inside the owner portal."
              }
            ].map((p) => (
              <div key={p.step} className="relative flex flex-col justify-start">
                <span className="font-serif text-5xl font-black text-brand/10 select-none mb-3 block">{p.step}</span>
                <h3 className="font-serif text-xl font-bold text-[#0B1F3A] mb-3">{p.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEAD CAPTURE & VALUE ─────────────────────────────────────────── */}
      <section id="analysis-section" className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Value Checkpoints */}
            <div className="lg:col-span-6">
              <p className="text-brand text-xs font-semibold tracking-[0.25em] uppercase mb-4">Partner Benefits</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-6 leading-tight">
                Institutional Support,<br />
                With a Local Focus.
              </h2>
              <p className="text-neutral-500 text-base leading-relaxed mb-8">
                Unlike local self-managed portals or massive national aggregators with disconnected call centers, PrimeFamilyHousing gives you the best of both worlds.
              </p>

              <ul className="space-y-4">
                {[
                  { title: "No Placement Fees", desc: "Unlike firms that charge 100% of the first month's rent for placement, we incorporate tenant procurement into our program." },
                  { title: "In-House Maintenance Inspectors", desc: "We deploy our own specialized technicians to perform routine inspection checks to prevent minor leaks from becoming expensive repairs." },
                  { title: "No Hidden Costs", desc: "Zero setup fees, zero lease renewal surcharges, and no markup margins on contractor repairs." },
                  { title: "Full Legal Protection", desc: "Our processes align strictly with federal Fair Housing laws, shielding you from compliance liabilities." }
                ].map((item) => (
                  <li key={item.title} className="flex items-start gap-4">
                    <CheckCircle2 size={20} className="text-brand shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-[#0B1F3A] text-sm">{item.title}</h4>
                      <p className="text-neutral-500 text-xs sm:text-sm mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Form */}
            <div className="lg:col-span-6 w-full">
              <PropertyManagementLeadForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── DYNAMIC CITY LIST (SEO HUBS) ─────────────────────────────────── */}
      <section id="supported-markets" className="bg-[#f3f4ec] py-20 border-t border-neutral-200/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-brand text-xs font-semibold tracking-[0.25em] uppercase mb-3">Our Markets</p>
            <h2 className="font-serif text-3xl font-bold text-[#0B1F3A]">Supported Cities &amp; Regions</h2>
            <p className="text-neutral-500 text-sm mt-2">Find localized rental management information for your city.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Plain text links — no per-row icons. Rendering two inline SVGs
                across all ~565 rows serialized ~1MB into this page. */}
            {allCities.map((city) => (
              <Link
                key={city.slug}
                href={`/property-management/${city.slug}`}
                className="bg-white border border-neutral-200/70 p-4 hover:border-brand hover:shadow-md transition-all group flex items-center gap-2.5 min-w-0"
              >
                <span className="text-brand shrink-0" aria-hidden="true">·</span>
                <span className="text-sm font-semibold text-[#0B1F3A] truncate group-hover:text-brand transition-colors">
                  {city.name}, {city.stateCode}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ SECTION ─────────────────────────────────────────────────── */}
      <section className="bg-white py-24 border-t border-neutral-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-brand text-xs font-semibold tracking-[0.35em] uppercase mb-4">Landlord Help</p>
            <h2 className="font-serif text-3xl font-bold text-[#0B1F3A]">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((faq) => (
              <details
                key={faq.q}
                className="group border border-neutral-200 rounded-xl bg-[#f3f4ec]/10 overflow-hidden hover:border-brand/40 transition-colors"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none hover:bg-neutral-50 transition-colors">
                  <span className="font-medium text-sm text-[#0B1F3A] leading-snug">{faq.q}</span>
                  <div className="shrink-0 w-7 h-7 rounded-full border border-neutral-200 flex items-center justify-center group-open:border-brand group-open:bg-brand transition-colors duration-200">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 11 11"
                      fill="none"
                      className="text-neutral-400 group-open:text-white group-open:rotate-180 transition-all duration-200"
                    >
                      <path
                        d="M1.5 4L5.5 8L9.5 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </summary>
                <div className="px-6 pb-5 pt-2 border-t border-neutral-100 bg-white">
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
