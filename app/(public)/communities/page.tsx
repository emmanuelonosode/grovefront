import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Search, Home as HomeIcon } from "lucide-react";
import { fetchAllCities, toDirectoryCities } from "@/lib/cities";
import { STATE_NAMES, stateSlugForCode } from "@/lib/states";

export const metadata = {
  title: "Communities by State | PrimeFamilyHousing",
  description:
    "Explore PrimeFamilyHousing's family-centric communities across the country. Select a state to discover available neighborhoods and move-in ready homes.",
  alternates: { canonical: "https://primefamilyhousing.com/communities" },
  openGraph: {
    title: "Communities by State | PrimeFamilyHousing",
    description:
      "Explore our carefully curated family-centric neighborhoods in top states — find a sanctuary where your family can thrive.",
    url: "https://primefamilyhousing.com/communities",
    type: "website",
  },
};

export const revalidate = 3600;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1625602812206-5ec545ca1231?w=1600&q=75&fm=webp&auto=format";

interface StateCard {
  code: string;
  name: string;
  slug: string;
  cityCount: number;
  homeCount: number;
  image: string;
}

export default async function CommunitiesPage() {
  const dbCities = await fetchAllCities().catch(() => []);
  const cities = toDirectoryCities(dbCities);
  const countBySlug: Record<string, number> = Object.fromEntries(
    dbCities.map((c) => [c.slug, c.count])
  );

  const byState = new Map<string, StateCard>();
  for (const c of cities) {
    if (!STATE_NAMES[c.stateCode]) continue;
    const slug = stateSlugForCode(c.stateCode);
    if (!slug) continue;
    const entry = byState.get(c.stateCode) ?? {
      code: c.stateCode,
      name: STATE_NAMES[c.stateCode],
      slug,
      cityCount: 0,
      homeCount: 0,
      image: "",
    };
    entry.cityCount += 1;
    entry.homeCount += countBySlug[c.slug] ?? 0;
    if (!entry.image && c.heroImage) entry.image = c.heroImage;
    byState.set(c.stateCode, entry);
  }

  const states = [...byState.values()].sort(
    (a, b) => b.homeCount - a.homeCount || b.cityCount - a.cityCount || a.name.localeCompare(b.name)
  );

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "PrimeFamilyHousing Communities by State",
    description: "Family-centric rental communities across the United States.",
    url: "https://primefamilyhousing.com/communities",
    isPartOf: { "@type": "WebSite", name: "PrimeFamilyHousing", url: "https://primefamilyhousing.com" },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[400px] h-[614px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src={HERO_IMAGE}
            alt="A master-planned family community among green hills"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-forest-deep/40" />
        </div>
        <div className="relative z-10 text-center px-4 md:px-12 w-full max-w-7xl mx-auto">
          <h1 className="font-serif font-bold text-white mb-3 drop-shadow-md text-[2.2rem] leading-[1.15] sm:text-[3rem] lg:text-[3.5rem] lg:leading-[1.16]" style={{ letterSpacing: "-0.02em" }}>
            Find Your Community Across the Country
          </h1>
          <p className="text-[17px] sm:text-[18px] leading-[1.55] text-white/90 max-w-2xl mx-auto mb-6 drop-shadow-md">
            Explore our carefully curated family-centric neighborhoods in top states. Discover a
            sanctuary where your family can thrive, guided by our expertise and commitment to
            quality living.
          </p>

          {/* Glass search panel */}
          <form
            action="/houses-for-rent"
            method="GET"
            className="rounded-xl p-3 max-w-xl mx-auto flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-[12px]"
            style={{ background: "rgba(249, 250, 242, 0.85)", border: "1px solid rgba(113, 121, 115, 0.1)" }}
          >
            <Search size={18} className="text-outline ml-3 mr-2 shrink-0" />
            <input
              type="text"
              name="q"
              placeholder="Search for a state or city..."
              className="bg-transparent border-none outline-none w-full text-[16px] text-on-surface placeholder:text-on-surface-variant/60 focus:ring-0 min-w-0"
            />
          </form>
        </div>
      </section>

      {/* ── STATES GRID ──────────────────────────────────────── */}
      <section className="py-12 md:py-16 px-4 md:px-12 max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="font-serif font-semibold text-forest-deep mb-2 text-[26px] leading-[34px] md:text-[32px] md:leading-[40px]">Our Operating States</h2>
          <p className="text-[16px] leading-6 text-on-surface-variant">Select a state to discover available communities and homes.</p>
        </div>

        {states.length === 0 ? (
          <div className="border border-outline-variant rounded-xl bg-surface-container-low p-10 text-center">
            <HomeIcon size={28} className="text-primary mx-auto mb-4" />
            <p className="font-serif text-[20px] font-semibold text-primary mb-2">New communities coming soon</p>
            <p className="text-[14px] text-on-surface-variant">Check back shortly, or browse all available homes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {states.map((s) => (
              <article
                key={s.code}
                className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 bg-surface border border-surface-variant"
              >
                <Link href={`/rentals/${s.slug}`} className="block">
                  <div className="h-64 relative overflow-hidden bg-surface-container">
                    {s.image && (
                      <Image
                        src={s.image}
                        alt={`Family communities in ${s.name}`}
                        fill
                        className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="font-serif font-semibold text-[24px] leading-8 mb-1">{s.name}</h3>
                      <p className="text-[16px] leading-6 opacity-90 flex items-center gap-2">
                        <HomeIcon size={17} />
                        {s.cityCount} Communit{s.cityCount === 1 ? "y" : "ies"}
                      </p>
                    </div>
                  </div>
                  <div className="p-6 flex justify-between items-center bg-surface">
                    <div className="flex gap-2">
                      {s.homeCount > 0 && (
                        <span className="bg-earth-beige/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] leading-4 border border-earth-beige tabular-nums">
                          {s.homeCount} Homes
                        </span>
                      )}
                      <span className="bg-earth-beige/50 text-on-secondary-container px-3 py-1 rounded-full text-[12px] leading-4 border border-earth-beige">
                        Family-Ready
                      </span>
                    </div>
                    <span className="text-primary text-[14px] tracking-[0.05em] font-semibold hover:text-terracotta-warm transition-colors flex items-center gap-1 group-hover:translate-x-1 duration-200">
                      Explore Cities <ArrowRight size={18} />
                    </span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
