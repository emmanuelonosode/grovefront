import Link from "next/link";
import Image from "next/image";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { CITIES, fetchAllCities } from "@/lib/cities";
import { STATE_NAMES, stateSlugForCode } from "@/lib/states";
import { BUSINESS } from "@/lib/business";

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
      <path d="M24 12.073C24 5.446 18.627 0 12 0S0 5.446 0 12.073c0 6.001 4.388 10.977 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.05 24 18.074 24 12.073z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.16 8.16 0 0 0 4.77 1.52V6.75a4.84 4.84 0 0 1-1-.06z" />
    </svg>
  );
}

// States we serve — links to the /rentals/[state] hub pages (sitewide internal
// linking for SEO). Derived from live inventory so we never link a state whose
// hub page 404s (states with no listings), with the curated CITIES as fallback
// when the API is unreachable.
async function getStateLinks(): Promise<{ name: string; slug: string }[]> {
  const dbCities = await fetchAllCities().catch(() => []);
  const codes = new Set<string>(
    dbCities.length > 0
      ? dbCities.map((c) => (c.state || "").toUpperCase())
      : Object.values(CITIES).map((c) => c.stateCode)
  );
  return [...codes]
    .filter((code) => STATE_NAMES[code])
    .map((code) => ({ name: STATE_NAMES[code], slug: stateSlugForCode(code) }))
    .filter((s) => s.slug)
    .sort((a, b) => a.name.localeCompare(b.name));
}

const footerCols = [
  {
    h: "Rent",
    links: [
      { label: "Browse houses",        href: "/homes-for-rent" },
      { label: "3+ bedroom houses",    href: "/homes-for-rent?beds=3" },
      { label: "Pet-friendly houses",  href: "/homes-for-rent?q=pet" },
      { label: "All cities",           href: "/homes-for-rent#all-cities" },
    ],
  },
  {
    h: "Apply",
    links: [
      { label: "Start application",    href: "/apply" },
      { label: "Application FAQ",      href: "/apply" },
      { label: "Tenant portal",        href: "/portal" },
      { label: "Maintenance",          href: "/portal/maintenance" },
    ],
  },
  {
    h: "About",
    links: [
      { label: "Our team",             href: "/agents" },
      { label: "Renter's guide",       href: "/blog" },
      { label: "Blog & guides",        href: "/blog" },
      { label: "Careers",              href: "/careers" },
    ],
  },
  {
    h: "Contact",
    links: [
      { label: "Get in touch",         href: "/contact" },
      { label: "Property management",  href: "/property-management" },
      { label: "Accessibility",        href: "/accessibility" },
      { label: "Privacy policy",       href: "/privacy" },
    ],
  },
];

export async function Footer() {
  const stateLinks = await getStateLinks();
  return (
    <footer style={{ background: "#081C15", color: "rgba(255,255,255,0.5)" }}>
      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)] gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block opacity-90 hover:opacity-100 transition-opacity">
              <BrandLogo variant="on-dark" height={46} />
            </Link>
            <p className="mt-4 leading-[1.6]" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 240 }}>
              Good Homes. Fair Prices. No Surprises.<br />Housing 2,400+ families across the U.S. since 2012.
            </p>
            <p className="mt-3" style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
              {BUSINESS.address.streetAddress}, {BUSINESS.address.addressLocality} {BUSINESS.address.addressRegion} {BUSINESS.address.postalCode}
            </p>
            <Link
              href="/contact"
              className="inline-block mt-2 transition-colors hover:text-white"
              style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 14, color: "rgba(255,255,255,0.55)" }}
            >
              Contact us →
            </Link>
            <div className="flex gap-2.5 mt-5">
              {[
                { href: "https://www.facebook.com/share/1G6G3YcUd3/?mibextid=wwXIfr", label: "Facebook",  Icon: FacebookIcon },
                { href: "https://www.tiktok.com/@primefamilyhousing",                    label: "TikTok",    Icon: TikTokIcon },
                { href: "https://www.instagram.com/primefamilyhousing",                       label: "Instagram", Icon: InstagramIcon },
                // No LinkedIn: the company page doesn't exist, so this sent every
                // visitor who clicked it to a 404. Restore alongside BUSINESS.sameAs
                // if the page is ever created.
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors border border-white/10 text-white/40 hover:text-earth-beige hover:border-earth-beige"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerCols.map((col) => (
            <div key={col.h}>
              <div
                className="mb-3.5"
                style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)" }}
              >
                {col.h}
              </div>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block py-[5px] transition-colors hover:text-white"
                  style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 14.5, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Rentals by state */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div
            className="mb-3"
            style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)" }}
          >
            Houses for rent by state
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {stateLinks.map((s) => (
              <Link
                key={s.slug}
                href={`/rentals/${s.slug}`}
                className="transition-colors hover:text-white"
                style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 14.5, color: "rgba(255,255,255,0.55)", textDecoration: "none" }}
              >
                Houses for Rent in {s.name}
              </Link>
            ))}
            <Link
              href="/homes-for-rent#all-cities"
              className="transition-colors hover:text-white"
              style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 14.5, color: "#A3B18A", fontWeight: 600, textDecoration: "none" }}
            >
              Browse all cities →
            </Link>
          </div>
        </div>
      </div>

      {/* Compliance strip */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-7xl mx-auto px-8 py-7">
          <div className="flex flex-wrap items-center gap-4 mb-5">
            <div className="bg-white rounded-sm p-1.5" title="Equal Housing Opportunity">
              <Image src="/logos/equal-housing.png" alt="Equal Housing Opportunity" width={40} height={40} className="object-contain" />
            </div>
            <div className="rounded-sm overflow-hidden" title="REALTOR® Member">
              <Image src="/logos/realtor.svg" alt="REALTOR® Member" width={68} height={48} className="object-contain" />
            </div>
            <div className="rounded-sm overflow-hidden" title="Virginia REALTORS® Member">
              <Image src="/logos/virginia-realtors.svg" alt="Virginia REALTORS®" width={80} height={48} className="object-contain" />
            </div>
            <div className="rounded-sm overflow-hidden" title="MLS Participant">
              <Image src="/logos/mls.svg" alt="MLS Participant" width={68} height={48} className="object-contain" />
            </div>
          </div>
          <p style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 12.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.65, maxWidth: "56rem" }}>
            All advertising conforms to the Fair Housing Act. &ldquo;REALTOR&reg;&rdquo; is a registered collective membership mark identifying real estate professionals who are members of the National Association of REALTORS&reg; and subscribe to its Code of Ethics.
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-7xl mx-auto px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 12.5, color: "rgba(255,255,255,0.35)" }}>
            © {new Date().getFullYear()} PrimeFamilyHousing · Equal Housing Opportunity
          </div>
          <div className="flex gap-[18px]">
            {[
              { label: "Privacy",       href: "/privacy" },
              { label: "Terms",         href: "/terms" },
              { label: "Accessibility", href: "/accessibility" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                style={{ fontFamily: "var(--font-source-sans), sans-serif", fontSize: 12.5, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}
                className="hover:text-white/70 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
