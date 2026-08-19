import type { Metadata, Viewport } from "next";
import { Montserrat, Source_Sans_3 } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { TrackingScripts } from "@/components/TrackingScripts";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import { BUSINESS } from "@/lib/business";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

// theme-color tints the browser UI (mobile address bar, PWA chrome) to the
// brand forest green. In Next 16 this belongs in the viewport export, not metadata.
export const viewport: Viewport = {
  themeColor: "#012d1d",
};

export const metadata: Metadata = {
  title: {
    default: "Prime Family Housing | Quality Houses for Rent across the US",
    // Pages already include the brand in their own title, so the template must
    // NOT append it again (that double-printed the brand in every <title>).
    template: "%s",
  },
  description:
    "Find affordable houses for rent across Atlanta, Charlotte, Houston, Dallas, Tampa, Phoenix & more. Move-in ready single-family homes, fast 24-hour approvals.",
  keywords: [
    // ── Brand ──────────────────────────────────────────────────────
    "Prime Family Housing",
    "PrimeFamilyHousing",
    "primefamilyhousing.com",
    "Prime Family Housing rentals",
    // ── High-intent rental searches ───────────────────────────────
    "homes for rent",
    "houses for rent",
    "rental homes near me",
    "move-in ready rental homes",
    "quality homes for rent",
    "well-maintained rental homes",
    "fast rental approval",
    "24 hour rental approval",
    "family homes for rent",
    "rental homes available now",
    // ── Bedroom-specific (high-intent long-tail) ──────────────────
    "2 bedroom houses for rent",
    "3 bedroom houses for rent",
    "4 bedroom homes for rent",
    "5 bedroom houses for rent",
    "large homes for rent",
    "spacious rental homes",
    // ── Feature-specific ──────────────────────────────────────────
    "pet friendly homes for rent",
    "pet friendly houses for rent",
    "fenced yard rental homes",
    "homes for rent with garage",
    "rental homes with yard",
    "section 8 accepted homes",
    "rental homes for working families",
    // ── City + rental (high-value markets) ───────────────────────
    "houses for rent Atlanta GA",
    "homes for rent Charlotte NC",
    "houses for rent Houston TX",
    "homes for rent Dallas TX",
    "houses for rent Nashville TN",
    "homes for rent Raleigh NC",
    "houses for rent Tampa FL",
    "rental homes Phoenix AZ",
    "houses for rent Orlando FL",
    "houses for rent Denver CO",
    "houses for rent Salt Lake City UT",
    // ── Relocation & life-stage ───────────────────────────────────
    "homes for rent relocating families",
    "rental homes for professionals",
    "houses for rent military families",
    "rental homes for growing families",
    "long term rental homes",
    "property management rental homes",
  ],
  authors: [{ name: "Prime Family Housing", url: "https://primefamilyhousing.com" }],
  creator: "Prime Family Housing",
  publisher: "Prime Family Housing",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://primefamilyhousing.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://primefamilyhousing.com",
    siteName: BUSINESS.displayName,
    title: "Prime Family Housing | Quality Houses for Rent across the US",
    description: "Discover quality, affordable houses for rent — move-in ready single-family homes, fast approvals.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prime Family Housing | Quality Houses for Rent across the US",
    description:
      "Find affordable houses for rent across Atlanta, Charlotte, Houston, Dallas, Tampa & more. Move-in ready single-family homes, fast approvals.",
    creator: "@primefamilyhousing",
  },
  // Icons are provided by the App Router file conventions (app/icon.svg,
  // app/icon.png, app/apple-icon.png) — Next auto-emits the <link> tags with
  // content hashes, so no manual `icons` block is needed (it would duplicate them).
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Google Search Console site verification. Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
  // to the token from the GSC "HTML tag" verification method (the content= value).
  // Preferred long-term: verify the whole DOMAIN property via DNS TXT instead — that
  // also covers admin.* and www.* and survives host changes. This tag is the quick path.
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
  other: {
    "llms-txt": "https://primefamilyhousing.com/llms.txt",
    "llms-full-txt": "https://primefamilyhousing.com/llms-full.txt",
  },
};

// ── Global entity graph — present on every page ──────────────────────────
// The @graph pattern lets Google resolve all entities together and is the
// correct way to establish an Organisation Knowledge Panel entry.
// alternateName is the primary signal that "PrimeFamilyHousing" is intentional, not a
// typo — Google uses it to suppress "Did you mean?" autocorrections.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://primefamilyhousing.com/#organization",
      "name": BUSINESS.displayName,
      "legalName": BUSINESS.displayName,
      // alternateName teaches Google every branded query that points here
      "alternateName": [
        "PrimeFamilyHousing",
        "PrimeFamilyHousing.com",
        "Prime Family Housing LLC"
      ],
      "url": "https://primefamilyhousing.com",
      "logo": {
        "@type": "ImageObject",
        "@id": "https://primefamilyhousing.com/#logo",
        "url": "https://primefamilyhousing.com/logo/logo.png",
        "contentUrl": "https://primefamilyhousing.com/logo/logo.png",
        "width": 512,
        "height": 280,
        "caption": "PrimeFamilyHousing — Great Places to Call Home"
      },
      "image": { "@id": "https://primefamilyhousing.com/#logo" },
      "description": "PrimeFamilyHousing is a licensed US real estate company founded in 2012, specializing in affordable single-family houses for rent across 12+ US cities. Well-maintained, move-in ready homes. 24-hour application decisions. 2,000+ families housed.",
      "foundingDate": "2012",
      "telephone": "+17577924480",
      "email": "info@primefamilyhousing.com",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "1425 S 1500 E Unit 222",
        "addressLocality": "Clearfield",
        "addressRegion": "UT",
        "postalCode": "84015",
        "addressCountry": "US"
      },
      "contactPoint": [
        {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "telephone": "+17577924480",
          "email": "info@primefamilyhousing.com",
          "availableLanguage": ["English"],
          "hoursAvailable": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"],
            "opens": "09:00",
            "closes": "18:00"
          }
        }
      ],
      // Sourced from BUSINESS so the profile list can't drift between emitters again
      // (the homepage Organization/LocalBusiness schemas had silently fallen out of
      // sync — no TikTok, and a different Facebook URL). BUSINESS.url is appended to
      // keep the self-reference this node has always carried.
      "sameAs": [...BUSINESS.sameAs, BUSINESS.url],
      "slogan": "Quality Homes. Well-Maintained. Move-In Ready.",
      "numberOfEmployees": { "@type": "QuantitativeValue", "minValue": 10, "maxValue": 50 },
      "award": [
        "Equal Housing Opportunity Provider"
      ],
      "hasCredential": [
        { "@type": "EducationalOccupationalCredential", "name": "Licensed Real Estate Broker — Utah", "credentialCategory": "license" },
        { "@type": "EducationalOccupationalCredential", "name": "Licensed Real Estate Broker — Georgia", "credentialCategory": "license" },
        { "@type": "EducationalOccupationalCredential", "name": "Licensed Real Estate Broker — Texas", "credentialCategory": "license" },
        { "@type": "EducationalOccupationalCredential", "name": "Licensed Real Estate Broker — North Carolina", "credentialCategory": "license" },
        { "@type": "EducationalOccupationalCredential", "name": "Licensed Real Estate Broker — Tennessee", "credentialCategory": "license" },
        { "@type": "EducationalOccupationalCredential", "name": "Licensed Real Estate Broker — Arizona", "credentialCategory": "license" }
      ],
      "knowsAbout": [
        "Residential Real Estate",
        "Affordable Housing",
        "Property Rentals",
        "Property Management",
        "Tenant Services",
        "Home Buying"
      ],
      "areaServed": [
        { "@type": "City", "name": "Atlanta",    "containedInPlace": { "@type": "State", "name": "Georgia" } },
        { "@type": "City", "name": "Charlotte",  "containedInPlace": { "@type": "State", "name": "North Carolina" } },
        { "@type": "City", "name": "Houston",    "containedInPlace": { "@type": "State", "name": "Texas" } },
        { "@type": "City", "name": "Dallas",     "containedInPlace": { "@type": "State", "name": "Texas" } },
        { "@type": "City", "name": "Nashville",  "containedInPlace": { "@type": "State", "name": "Tennessee" } },
        { "@type": "City", "name": "Phoenix",    "containedInPlace": { "@type": "State", "name": "Arizona" } },
        { "@type": "City", "name": "Austin",     "containedInPlace": { "@type": "State", "name": "Texas" } },
        { "@type": "City", "name": "Denver",     "containedInPlace": { "@type": "State", "name": "Colorado" } },
        { "@type": "City", "name": "Tampa",      "containedInPlace": { "@type": "State", "name": "Florida" } },
        { "@type": "City", "name": "Raleigh",    "containedInPlace": { "@type": "State", "name": "North Carolina" } }
      ],
      "priceRange": "$$",
      "makesOffer": [
        {
          "@type": "Offer",
          "itemOffered": { "@type": "Service", "name": "Affordable Home Rentals",
            "description": "Quality, affordable single-family houses for rent — inspected, move-in ready, fast approvals." }
        },
        {
          "@type": "Offer",
          "itemOffered": { "@type": "Service", "name": "Property Management",
            "description": "Professional residential property management across 12+ US cities." }
        },
        {
          "@type": "Offer",
          "itemOffered": { "@type": "Service", "name": "Relocation Assistance",
            "description": "Helping families and individuals relocate seamlessly to new cities." }
        }
      ]
    },
    {
      // WebSite schema enables the Sitelinks Searchbox in Google branded results
      "@type": "WebSite",
      "@id": "https://primefamilyhousing.com/#website",
      "url": "https://primefamilyhousing.com",
      // This `name` is the primary signal for the site name Google prints under the
      // result link. It must be the spaced brand, not the closed-up domain-alike form.
      "name": BUSINESS.displayName,
      "alternateName": [...BUSINESS.alternateNames],
      "description": "Official website of Prime Family Housing — affordable rental homes and properties for sale across 12+ US cities. Founded 2012. Move-in ready homes.",
      "publisher": { "@id": "https://primefamilyhousing.com/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://primefamilyhousing.com/houses-for-rent?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", "h2", ".speakable"]
      }
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sourceSans.variable} ${montserrat.variable} h-full scroll-smooth`}>
      <head>
        <meta name="referrer" content="no-referrer" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <AuthProvider>{children}</AuthProvider>
        <TrackingScripts />
        <CookieConsentBanner />
      </body>
    </html>
  );
}
