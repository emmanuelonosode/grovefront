import { redirect } from "next/navigation";
import Link from "next/link";
import {
  MapPin, BedDouble, ShowerHead, Ruler, Car, Check, ChevronRight,
  CalendarDays, Wallet, Wrench, KeyRound, Eye, House, PawPrint, Waves,
  Phone, Mail,
} from "lucide-react";
import { fetchPropertyBySlug, fetchProperties } from "@/lib/properties";
import type { PropertyDetailAPI, PropertyListItemAPI } from "@/lib/properties";
import {
  buildMonthlyCost, buildSchools, buildLeasingOffice, parseAvailability, formatMoney,
  toParagraphs, tourProvider,
} from "@/lib/propertyDetail";
import { cityToSlug } from "@/lib/cities";
import { stateFullName } from "@/lib/states";
import { PropertyIntentCapture } from "@/components/public/PropertyIntentCapture";
import { PropertyTourModal } from "@/components/public/PropertyTourModal";
import { PropertyDetailMapLoader } from "@/components/public/PropertyDetailMapLoader";
import type { DetailMarker } from "@/components/public/PropertyDetailMap";
import { PropertyPageTracker } from "@/components/public/PropertyPageTracker";
import { PdpGallery } from "@/components/public/pdp/PdpGallery";
import { PdpLeadRail } from "@/components/public/pdp/PdpLeadRail";
import { PdpSectionNav } from "@/components/public/pdp/PdpSectionNav";
import { PdpMobileBar } from "@/components/public/pdp/PdpMobileBar";
import { PdpFaq, type FaqItem } from "@/components/public/pdp/PdpFaq";
import { PdpMonthlyCost } from "@/components/public/pdp/PdpMonthlyCost";
import { PdpSchools } from "@/components/public/pdp/PdpSchools";
import { PdpFloorPlans } from "@/components/public/pdp/PdpFloorPlans";
import { PdpVirtualTour } from "@/components/public/pdp/PdpVirtualTour";
import { PdpOfferBanner } from "@/components/public/pdp/PdpOfferBanner";
import { PdpTourAutoOpen } from "@/components/public/pdp/PdpTourAutoOpen";
import { FavoriteButton } from "@/components/public/FavoriteButton";
import { amenityIconFor } from "@/components/public/pdp/amenityIcon";
import { formatNumber } from "@/lib/utils";

export const revalidate = 300;

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";

/** Below this, the view count reads as "nobody is looking" and hurts more than it helps. */
const MIN_VIEWS_TO_SHOW = 8;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    const property = await fetchPropertyBySlug(decodedSlug);

    const bedsLabel = property.bedrooms ? `${property.bedrooms}-Bed ` : "";
    const typeLabel =
      property.type === "residential" ? "House" :
        property.type === "condo" ? "Condo" :
          property.type === "townhouse" ? "Townhouse" :
            property.type === "apartment" ? "Apartment" : "Home";
    const actionLabel =
      property.listing_type === "for-sale" ? "for Sale" :
        property.listing_type === "for-lease" ? "for Lease" : "for Rent";

    const streetAddress = property.address ?? "";
    const fullAddr = `${streetAddress}, ${property.city}, ${property.state}${property.zip_code ? " " + property.zip_code : ""}`.trim();
    const formattedPrice = property.price
      ? `$${Math.round(Number(property.price)).toLocaleString()}/mo`
      : "";

    const seoTitle = streetAddress
      ? `${fullAddr} · ${formattedPrice}`
      : `${bedsLabel}${typeLabel} ${actionLabel} in ${property.city}, ${property.state} · ${formattedPrice}`;

    const featureList = [
      property.bedrooms ? `${property.bedrooms} bed` : null,
      property.bathrooms ? `${property.bathrooms} bath` : null,
      property.sqft ? `${Number(property.sqft).toLocaleString()} sq ft` : null,
    ].filter(Boolean).join(", ");

    const seoDesc = `${formattedPrice ? formattedPrice + ". " : ""}${fullAddr}. Move-in ready ${featureList ? featureList + " " : ""}single-family home for rent. 24-hour application approval. Schedule a self-tour online.`;

    const ogImage = property.images?.[0]?.image_url || FALLBACK_IMAGE;

    return {
      title: `${seoTitle} | Prime Family Housing`,
      description: seoDesc.slice(0, 160),
      keywords: [
        ...(streetAddress ? [
          streetAddress,
          `${streetAddress} ${property.city}`,
          `${streetAddress} ${property.city} ${property.state}`,
          `${fullAddr}`,
          `${fullAddr} rental`,
          `${fullAddr} for rent`,
          `houses for rent in ${property.city} ${property.state}`,
          `single family homes for rent in ${property.city}`,
        ] : []),
        `${bedsLabel.trim()} ${typeLabel} ${actionLabel} ${property.city}`.trim(),
        `affordable ${typeLabel.toLowerCase()} ${property.city}`,
        `${property.city} ${typeLabel.toLowerCase()} ${actionLabel} move-in ready`,
        `${property.city} pet friendly rentals`,
        `Prime Family Housing ${property.city}`,
      ],
      alternates: { canonical: `https://primefamilyhousing.com/houses-for-rent/${decodedSlug}` },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      openGraph: {
        title: `${seoTitle} | Prime Family Housing`,
        description: seoDesc.slice(0, 160),
        url: `https://primefamilyhousing.com/houses-for-rent/${decodedSlug}`,
        siteName: "Prime Family Housing",
        images: [{ url: ogImage, width: 1200, height: 800, alt: `${fullAddr} - Prime Family Housing` }],
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title: `${seoTitle} | Prime Family Housing`,
        description: seoDesc.slice(0, 160),
        site: "@primefamilyhousing",
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: "Houses for Rent | Prime Family Housing",
      description: "Explore available move-in ready houses for rent with Prime Family Housing.",
    };
  }
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  let property: PropertyDetailAPI | null = null;
  try {
    property = await fetchPropertyBySlug(decodedSlug);
  } catch {
    property = null;
  }

  // Smart 301 fallback for expired/delisted listings: a hard 404 burns crawl budget
  // and drops the URL from the index, so send the visitor and Googlebot to the
  // relevant city hub instead.
  if (!property) {
    const s = decodedSlug.toLowerCase();
    const cityMap: Record<string, string> = {
      "atlanta": "atlanta-ga", "charlotte": "charlotte-nc", "houston": "houston-tx",
      "dallas": "dallas-tx", "tampa": "tampa-fl", "orlando": "orlando-fl",
      "jacksonville": "jacksonville-fl", "las-vegas": "las-vegas-nv", "vegas": "las-vegas-nv",
      "phoenix": "phoenix-az", "mesa": "phoenix-az", "sacramento": "sacramento-ca",
      "denver": "denver-co", "seattle": "seattle-wa", "chicago": "chicago-il",
      "austin": "austin-tx", "san-antonio": "san-antonio-tx", "minneapolis": "minneapolis-mn",
      "salt-lake": "salt-lake-city-ut", "miami": "miami-fl",
    };
    for (const [key, citySlug] of Object.entries(cityMap)) {
      if (s.includes(key)) redirect(`/rentals/${citySlug}`);
    }
    redirect("/houses-for-rent");
  }

  // Deliberately NOT toPropertyCardShape(): that maps to a camelCase `Property`
  // with no primary_image_url and no coordinates, which silently left every
  // nearby card imageless and every nearby map pin at lat/lng 0,0.
  let similarProperties: PropertyListItemAPI[] = [];
  try {
    const listRes = await fetchProperties({ city: property.city, page_size: "4" });
    similarProperties = listRes.results
      .filter((p) => p.slug !== decodedSlug && p.id !== property!.id)
      .slice(0, 3);
  } catch {
    similarProperties = [];
  }

  const images = property.images && property.images.length > 0 ? property.images : [];
  const primaryImage = images.find((img) => img.is_primary) ?? images[0];

  const agent = property.agent;
  const agentPhoto = agent?.avatar_url || "/images/agent-placeholder.jpg";

  // Amenities arrive either flat or grouped by category. Prefer the grouped shape
  // when the API supplies it. The categories are real structure worth showing.
  const rawCategories: { name: string; amenities: string[] }[] =
    (property.amenity_categories ?? [])
      .map((c) => ({
        name: c.name,
        amenities: (c.amenities ?? [])
          .map((a) => (typeof a === "string" ? a : a?.name))
          .filter((n): n is string => Boolean(n && n.trim())),
      }))
      .filter((c) => c.amenities.length > 0);

  const flatAmenities: string[] = (property.amenities ?? [])
    .map((a) => (typeof a === "string" ? a : a?.name))
    .filter((n): n is string => Boolean(n && n.trim()));

  const amenityGroups = rawCategories.length > 0
    ? rawCategories
    : flatAmenities.length > 0
      ? [{ name: "Features", amenities: flatAmenities }]
      : [];

  const allAmenityNames: string[] = [
    ...flatAmenities,
    ...rawCategories.flatMap((c) => c.amenities),
  ].filter((v, i, a) => a.indexOf(v) === i);

  // Extended feed data. The deployed API omits these today (see PropertyDetailAPI),
  // so every block below is guarded and simply does not render until it ships.
  const monthlyCost = buildMonthlyCost(property.fees, Math.round(Number(property.price)) || 0);
  const schools = buildSchools(property.schools);
  const leasingOffice = buildLeasingOffice(property.office_info);
  const availability = parseAvailability(property.available_on);
  const floorPlans = (property.floor_plans ?? []).filter((fp) => fp?.image_url);
  const descriptionParagraphs = toParagraphs(property.description);
  // Already date-filtered server-side, so anything here is claimable today.
  const offer = property.leasing_special ?? null;

  // The boolean is authoritative when present; fall back to reading the amenity
  // list only when the backend hasn't sent it.
  const isPetFriendly =
    property.is_pet_friendly ??
    allAmenityNames.some((name) => /pet|dog|cat|fenced|yard|animal/i.test(name));
  const hasPool =
    property.has_pool ?? allAmenityNames.some((name) => /pool|spa|hot tub/i.test(name));
  // ~12% of homes cannot be toured unaccompanied, so the self-tour promise has
  // to be conditional rather than blanket.
  const allowsSelfTour = property.allow_selfshow !== false;

  // Populated on ~49% of listings: insidemaps (63%) and Zillow 3D Home (37%).
  const virtualTourUrl = property.virtual_tour_url || property.tour_360_url || null;
  const tourHost = tourProvider(virtualTourUrl);

  const currentMarker: DetailMarker = {
    slug: property.slug,
    title: property.title,
    price: Number(property.price),
    price_label: property.price_label || "/mo",
    lat: Number(property.latitude ?? 0),
    lng: Number(property.longitude ?? 0),
    image_url: primaryImage?.image_url ?? null,
    beds: property.bedrooms ?? 0,
    baths: Number(property.bathrooms ?? 0),
    city: property.city,
    state: property.state,
  };

  const nearbyMarkers: DetailMarker[] = similarProperties.map((sim) => ({
    slug: sim.slug,
    title: sim.title,
    price: Number(sim.price),
    price_label: sim.price_label || "/mo",
    lat: Number(sim.latitude ?? 0),
    lng: Number(sim.longitude ?? 0),
    image_url: sim.primary_image_url ?? null,
    beds: sim.bedrooms ?? 0,
    baths: Number(sim.bathrooms ?? 0),
    city: sim.city,
    state: sim.state,
  }));

  const hasCoords = Number(currentMarker.lat) !== 0 && Number(currentMarker.lng) !== 0;
  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code ?? ""}`.trim();
  const stateName = stateFullName(property.state);
  const citySlug = cityToSlug(property.city, property.state);
  const stateHref = `/houses-for-rent?state=${property.state}`;
  const cityHref = `/rentals/${citySlug}`;

  // `price` is a Decimal(12,2), so it arrives with cents. Rent is quoted in
  // whole dollars, so round once here and derive everything from it.
  const priceNum = Math.round(Number(property.price)) || 0;
  const priceLabel = property.price_label || "/mo";
  const isAvailable = property.status === "available";
  const incomeGuideline = priceNum * 3;
  const recentViews = Number(property.recent_view_count ?? 0);

  // Only spec rows the API actually populated. `stories` is excluded on purpose:
  // it is the model default (1) on every record, so it carries no information.
  const specRows: { label: string; value: string }[] = [
    { label: "Property type", value: "Single-family home" },
    ...(property.year_built ? [{ label: "Year built", value: String(property.year_built) }] : []),
    ...(property.sqft ? [{ label: "Interior", value: `${formatNumber(property.sqft)} sq ft` }] : []),
    ...(property.lot_size ? [{ label: "Lot size", value: `${property.lot_size} acres` }] : []),
    ...(property.garage ? [{ label: "Garage", value: `${property.garage}-car` }] : []),
    ...(property.condition ? [{ label: "Condition", value: property.condition === "new" ? "New construction" : property.condition.charAt(0).toUpperCase() + property.condition.slice(1) }] : []),
    // `neighborhood` is deliberately omitted: it holds the operator's market name
    // (only 24 distinct values across 4303 rows, e.g. "Denver" on a Colorado
    // Springs home), which contradicts the address shown directly above it.
    ...(availability ? [{ label: "Available", value: availability.label.replace(/^Available /, "") }] : []),
  ];

  // One source of truth for the FAQ so the rendered copy and the JSON-LD can
  // never drift apart.
  const faqItems: FaqItem[] = [
    {
      q: `How do I apply for ${property.address}?`,
      a: "Applying is entirely online. Submit your contact details, proof of income and ID verification, and you will have a decision within 24 business hours.",
    },
    {
      q: "Can I tour the home before applying?",
      a: allowsSelfTour
        ? "Yes. Schedule a self-guided tour for a time that suits you and you will receive a secure temporary access code to visit the home on your own."
        : "Yes. This home is shown by appointment, so pick a time that suits you and a leasing specialist will meet you there.",
    },
    {
      q: "What are the income and credit requirements?",
      a: `We look for verifiable household gross income of roughly 3x the monthly rent, which is about $${formatNumber(incomeGuideline)} per month for this home, along with a clean rental history. Co-signer and guarantor applications are also accepted.`,
    },
    {
      q: isPetFriendly ? "Are pets allowed at this home?" : "What is the pet policy for this home?",
      a: isPetFriendly
        ? "This home is pet friendly. Pet deposits, monthly pet rent and breed restrictions vary by home, so confirm the specifics with the leasing team before you apply. Assistance and service animals are exempt from pet fees."
        : "Pet policies vary by home. Contact the leasing team to confirm whether pets can be accommodated at this address before you apply.",
    },
    {
      q: "How are maintenance requests handled?",
      a: "Residents submit requests through the online resident portal at any time, and there is a hotline for emergencies. Work is carried out by vetted, licensed contractors.",
    },
  ];

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://primefamilyhousing.com" },
      { "@type": "ListItem", position: 2, name: "Houses for Rent", item: "https://primefamilyhousing.com/houses-for-rent" },
      { "@type": "ListItem", position: 3, name: stateName, item: `https://primefamilyhousing.com${stateHref}` },
      { "@type": "ListItem", position: 4, name: `${property.city} Rentals`, item: `https://primefamilyhousing.com${cityHref}` },
      { "@type": "ListItem", position: 5, name: property.address ?? property.title, item: `https://primefamilyhousing.com/houses-for-rent/${property.slug}` },
    ],
  };

  const residenceSchema = {
    "@type": "SingleFamilyResidence",
    "@id": `https://primefamilyhousing.com/houses-for-rent/${property.slug}#residence`,
    name: fullAddress,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.zip_code,
      addressCountry: "US",
    },
    ...(hasCoords && {
      geo: { "@type": "GeoCoordinates", latitude: currentMarker.lat, longitude: currentMarker.lng },
    }),
    ...(property.bedrooms ? { numberOfBedrooms: Number(property.bedrooms) } : {}),
    ...(property.bathrooms ? { numberOfBathroomsTotal: Number(property.bathrooms) } : {}),
    ...(property.sqft
      ? { floorSize: { "@type": "QuantitativeValue", value: property.sqft, unitCode: "FTK" } }
      : {}),
    ...(property.year_built ? { yearBuilt: Number(property.year_built) } : {}),
    petsAllowed: isPetFriendly,
    ...(allAmenityNames.length > 0
      ? {
          amenityFeature: allAmenityNames.slice(0, 15).map((name) => ({
            "@type": "LocationFeatureSpecification",
            name,
            value: true,
          })),
        }
      : {}),
  };

  // Note: no aggregateRating. There is no review data behind this listing, and
  // marking up ratings the site cannot show is a structured-data violation.
  const listingSchema = {
    "@context": "https://schema.org",
    "@type": ["RealEstateListing", "Product"],
    mainEntity: residenceSchema,
    name: fullAddress,
    description: `${fullAddress} is a ${property.bedrooms || 3}-bedroom single-family rental home in ${property.city}, ${property.state}. Monthly rent is $${formatNumber(priceNum)}/month.`,
    url: `https://primefamilyhousing.com/houses-for-rent/${property.slug}`,
    thumbnailUrl: primaryImage?.image_url ?? FALLBACK_IMAGE,
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: primaryImage?.image_url ?? FALLBACK_IMAGE,
      contentUrl: primaryImage?.image_url ?? FALLBACK_IMAGE,
      width: 1200,
      height: 800,
      caption: `${fullAddress} - Prime Family Housing`,
    },
    image: images.length > 0
      ? images.map((img) => img.image_url ?? FALLBACK_IMAGE)
      : [primaryImage?.image_url ?? FALLBACK_IMAGE],
    offers: {
      "@type": "Offer",
      price: String(property.price),
      priceCurrency: "USD",
      url: `https://primefamilyhousing.com/houses-for-rent/${property.slug}`,
      availability: isAvailable ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: String(property.price),
        priceCurrency: "USD",
        unitCode: "MON",
        billingIncrement: 1,
      },
    },
    datePosted: property.created_at ?? new Date().toISOString(),
    broker: {
      "@type": "RealEstateAgent",
      name: "Prime Family Housing",
      email: "info@primefamilyhousing.com",
      telephone: "+17577924480",
      url: "https://primefamilyhousing.com",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const videoSchema = virtualTourUrl ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `Virtual tour of ${fullAddress}`,
    description: `Interactive 3D virtual tour of ${fullAddress} in ${property.city}, ${property.state}.`,
    thumbnailUrl: [primaryImage?.image_url ?? FALLBACK_IMAGE],
    uploadDate: property.created_at ?? new Date().toISOString(),
    contentUrl: virtualTourUrl,
    embedUrl: virtualTourUrl,
  } : null;

  const leadRailProps = {
    slug: property.slug,
    propertyId: property.id,
    address: property.address,
    city: property.city,
    price: priceNum,
    priceLabel,
    isAvailable,
    totalMonthly: monthlyCost?.requiredTotal ?? null,
    availabilityLabel: availability?.label ?? null,
    allowsSelfTour,
    agent,
    agentPhoto,
  };

  return (
    <div className="pdp min-h-screen pt-20">
      <PropertyIntentCapture city={property.city} listingType={property.listing_type} />
      <PropertyPageTracker slug={property.slug} price={priceNum} listingType={property.listing_type} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {videoSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />
      )}

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-[1280px] px-4 pt-5 lg:px-8">
        <ol className="pdp-rail flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[14px] leading-[1.43] tracking-[-0.14px]">
          <li><Link href="/" className="-my-2 inline-flex min-h-11 items-center py-2 text-[#5d6c7b] hover:text-[#0064e0]">Home</Link></li>
          <li aria-hidden="true" className="text-[#8595a4]">/</li>
          <li><Link href="/houses-for-rent" className="-my-2 inline-flex min-h-11 items-center py-2 text-[#5d6c7b] hover:text-[#0064e0]">Houses for Rent</Link></li>
          <li aria-hidden="true" className="text-[#8595a4]">/</li>
          <li><Link href={stateHref} className="-my-2 inline-flex min-h-11 items-center py-2 text-[#5d6c7b] hover:text-[#0064e0]">{stateName}</Link></li>
          <li aria-hidden="true" className="text-[#8595a4]">/</li>
          <li><Link href={cityHref} className="-my-2 inline-flex min-h-11 items-center py-2 text-[#5d6c7b] hover:text-[#0064e0]">{property.city}</Link></li>
          <li aria-hidden="true" className="text-[#8595a4]">/</li>
          <li aria-current="page" className="font-bold text-[#1c1e21]">{property.address}</li>
        </ol>
      </nav>

      {/* ── Gallery hero ───────────────────────────────────────────────── */}
      <div className="relative mx-auto mt-4 max-w-[1280px] px-4 lg:px-8">
        <PdpGallery images={images} title={fullAddress} fallback={FALLBACK_IMAGE} />
      </div>

      {/* ── Content + sticky lead rail ─────────────────────────────────
          One grid spanning the identity band AND the body, so the rail keeps
          sticking all the way down the page instead of scrolling away with
          the header. `items-start` stops the aside stretching to full grid
          height, which would make `position: sticky` a no-op. */}
      <div className="mx-auto max-w-[1280px] px-4 lg:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
          <div className="min-w-0">

            {/* Identity band */}
            <header className="pt-8">
              <div className="flex flex-wrap items-center gap-2">
              {!isAvailable ? (
                <span className="inline-flex items-center rounded-[8px] bg-[#f7b928] px-2.5 py-1 text-[12px] font-bold leading-[1.33] text-[#0a1317] capitalize">
                  {String(property.status).replace("-", " ")}
                </span>
              ) : availability && !availability.isNow ? (
                /* A real move-in date beats a vague "available now". */
                <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#0a1317] px-2.5 py-1 text-[12px] font-bold leading-[1.33] text-white">
                  <CalendarDays size={12} strokeWidth={2.5} aria-hidden="true" />
                  {availability.label}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#31a24c] px-2.5 py-1 text-[12px] font-bold leading-[1.33] text-white">
                  <Check size={12} strokeWidth={3} aria-hidden="true" /> Available now
                </span>
              )}

              {isPetFriendly && (
                <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#ced0d4] px-2.5 py-1 text-[12px] font-bold leading-[1.33] text-[#1c1e21]">
                  <PawPrint size={12} strokeWidth={2.5} aria-hidden="true" /> Pet friendly
                </span>
              )}
              {hasPool && (
                <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#ced0d4] px-2.5 py-1 text-[12px] font-bold leading-[1.33] text-[#1c1e21]">
                  <Waves size={12} strokeWidth={2.5} aria-hidden="true" /> Pool
                </span>
              )}
              {allowsSelfTour && (
                <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#ced0d4] px-2.5 py-1 text-[12px] font-bold leading-[1.33] text-[#1c1e21]">
                  <KeyRound size={12} strokeWidth={2.5} aria-hidden="true" /> Self-guided tour
                </span>
              )}
              {recentViews >= MIN_VIEWS_TO_SHOW && (
                <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#ced0d4] px-2.5 py-1 text-[12px] font-bold leading-[1.33] text-[#1c1e21]">
                  <Eye size={12} strokeWidth={2.5} aria-hidden="true" /> {recentViews} views this month
                </span>
              )}
            </div>

            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-[28px] font-medium leading-[1.21] text-[#0a1317] sm:text-[36px] sm:leading-[1.28] lg:text-[48px] lg:leading-[1.17]">
                  {property.address}
                </h1>
                <p className="mt-2 text-[18px] font-normal leading-[1.44] text-[#5d6c7b]">
                  {property.city}, {property.state} {property.zip_code}
                </p>
              </div>
              <FavoriteButton
                propertyId={property.id}
                size={18}
                showText
                className="-my-2 inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[8px] border border-[#ced0d4] px-4 py-2 text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-[#0a1317] transition-colors hover:bg-[#f1f4f7]"
              />
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="pdp-display text-[36px] font-medium leading-[1.28] text-[#0a1317]">
                  ${formatNumber(priceNum)}
                </span>
                <span className="text-[18px] font-normal leading-[1.44] text-[#5d6c7b]">{priceLabel}</span>
              </div>
              {monthlyCost && monthlyCost.requiredTotal > priceNum && (
                <p className="mt-1.5 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#5d6c7b]">
                  ${formatMoney(monthlyCost.requiredTotal)}{priceLabel} with required monthly charges.{" "}
                  <a href="#costs" className="-my-1 inline-block py-1 font-bold text-[#0064e0] hover:underline">
                    See the breakdown
                  </a>
                </p>
              )}

              {offer && (
                <div className="mt-5">
                  <PdpOfferBanner offer={offer} />
                </div>
              )}
            </div>

            {/* Key specs. Four facts, no dividers, no card chrome. */}
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[#dee3e9] pt-6 sm:grid-cols-4">
              <div className="flex items-start gap-2.5">
                <BedDouble size={20} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0 text-[#5d6c7b]" />
                <div>
                  <dt className="text-[12px] leading-[1.33] text-[#5d6c7b]">Bedrooms</dt>
                  <dd className="text-[18px] font-bold leading-[1.44] text-[#0a1317]">{property.bedrooms}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <ShowerHead size={20} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0 text-[#5d6c7b]" />
                <div>
                  <dt className="text-[12px] leading-[1.33] text-[#5d6c7b]">Bathrooms</dt>
                  <dd className="text-[18px] font-bold leading-[1.44] text-[#0a1317]">{String(property.bathrooms)}</dd>
                </div>
              </div>
              {property.sqft ? (
                <div className="flex items-start gap-2.5">
                  <Ruler size={20} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0 text-[#5d6c7b]" />
                  <div>
                    <dt className="text-[12px] leading-[1.33] text-[#5d6c7b]">Interior</dt>
                    <dd className="text-[18px] font-bold leading-[1.44] text-[#0a1317]">{formatNumber(property.sqft)} sq ft</dd>
                  </div>
                </div>
              ) : null}
              {property.garage ? (
                <div className="flex items-start gap-2.5">
                  <Car size={20} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0 text-[#5d6c7b]" />
                  <div>
                    <dt className="text-[12px] leading-[1.33] text-[#5d6c7b]">Garage</dt>
                    <dd className="text-[18px] font-bold leading-[1.44] text-[#0a1317]">{property.garage}-car</dd>
                  </div>
                </div>
              ) : null}
            </dl>

            </header>

            {/* Mobile and tablet get the conversion panel inline, right after
                the facts, since they have no rail column. */}
            <div className="mt-8 lg:hidden">
              <PdpLeadRail {...leadRailProps} variant="inline" />
            </div>

            {/* Section nav sticks under the 80px navbar, inside the content
                column so it never overlaps the rail. */}
            <div className="sticky top-20 z-30 -mx-4 mt-10 border-y border-[#dee3e9] bg-white/95 px-4 backdrop-blur-sm lg:mx-0 lg:px-0">
              <PdpSectionNav
                hasMap={hasCoords}
                hasAmenities={amenityGroups.length > 0}
                hasTour={!!virtualTourUrl}
                hasCosts={monthlyCost !== null}
                hasFloorPlans={floorPlans.length > 0}
                hasSchools={schools.length > 0}
              />
            </div>

            {/* ── Body ─────────────────────────────────────────────────── */}
            <main className="pb-16">

            {/* Overview: prose left, spec table right. */}
            <section id="overview" className="pt-12 pb-14">
              <h2 className="text-[28px] font-medium leading-[1.21] text-[#0a1317] sm:text-[36px] sm:leading-[1.28]">
                About this home
              </h2>
              <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                <div className="max-w-[65ch] space-y-4">
                  {descriptionParagraphs.map((para, i) => (
                    <p key={i} className="text-[16px] leading-[1.5] tracking-[-0.16px] text-[#444950]">
                      {para}
                    </p>
                  ))}
                </div>

                {specRows.length > 0 && (
                  <div className="rounded-[8px] bg-[#f1f4f7] p-6">
                    <h3 className="text-[18px] font-bold leading-[1.44] text-[#0a1317]">The details</h3>
                    <dl className="mt-4 space-y-3">
                      {specRows.map((row) => (
                        <div key={row.label} className="flex items-baseline justify-between gap-4">
                          <dt className="text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-[#1c1e21]">{row.label}</dt>
                          <dd className="text-right text-[14px] leading-[1.43] tracking-[-0.14px] text-[#444950]">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </section>

            {/* Features: amenity chips, grouped by the category the API returns. */}
            {amenityGroups.length > 0 && (
              <section id="features" className="border-t border-[#dee3e9] py-14">
                <h2 className="text-[28px] font-medium leading-[1.21] text-[#0a1317] sm:text-[36px] sm:leading-[1.28]">
                  What this home has
                </h2>
                <div className="mt-6 space-y-8">
                  {amenityGroups.map((group) => (
                    <div key={group.name}>
                      <h3 className="text-[18px] font-bold leading-[1.44] text-[#0a1317]">{group.name}</h3>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {group.amenities.map((name) => {
                          const Icon = amenityIconFor(name);
                          return (
                            <li
                              key={name}
                              className="inline-flex items-center gap-2 rounded-[8px] border border-[#ced0d4] bg-white px-4 py-2 text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-[#1c1e21]"
                            >
                              <Icon size={15} strokeWidth={2} aria-hidden="true" className="shrink-0 text-[#5d6c7b]" />
                              {name}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 3D walkthrough, where the listing has one. */}
            {virtualTourUrl && (
              <section id="tour" className="border-t border-[#dee3e9] py-14">
                <h2 className="text-[28px] font-medium leading-[1.21] text-[#0a1317] sm:text-[36px] sm:leading-[1.28]">
                  Take the tour
                </h2>
                <p className="mt-3 max-w-[62ch] text-[16px] leading-[1.5] tracking-[-0.16px] text-[#5d6c7b]">
                  Walk the whole home room by room before you book a visit.
                </p>
                <div className="mt-8">
                  <PdpVirtualTour
                    url={virtualTourUrl}
                    provider={tourHost}
                    posterUrl={primaryImage?.image_url ?? FALLBACK_IMAGE}
                    address={fullAddress}
                    slug={property.slug}
                  />
                </div>
              </section>
            )}

            {/* Monthly cost: every figure itemised from the `fees` feed. */}
            {monthlyCost && (
              <section id="costs" className="border-t border-[#dee3e9] py-14">
                <h2 className="text-[28px] font-medium leading-[1.21] text-[#0a1317] sm:text-[36px] sm:leading-[1.28]">
                  What it costs each month
                </h2>
                <p className="mt-3 max-w-[62ch] text-[16px] leading-[1.5] tracking-[-0.16px] text-[#5d6c7b]">
                  The charges below are billed with your rent. There are no others.
                </p>
                <div className="mt-8">
                  <PdpMonthlyCost cost={monthlyCost} priceLabel={priceLabel} />
                </div>
              </section>
            )}

            {/* Floor plans, when the feed carries the scans. */}
            {floorPlans.length > 0 && (
              <section id="floorplans" className="border-t border-[#dee3e9] py-14">
                <h2 className="text-[28px] font-medium leading-[1.21] text-[#0a1317] sm:text-[36px] sm:leading-[1.28]">
                  Floor {floorPlans.length === 1 ? "plan" : "plans"}
                </h2>
                <div className="mt-8">
                  <PdpFloorPlans plans={floorPlans} address={property.address} />
                </div>
              </section>
            )}

            {/* Nearby schools, nearest first. */}
            {schools.length > 0 && (
              <section id="schools" className="border-t border-[#dee3e9] py-14">
                <h2 className="text-[28px] font-medium leading-[1.21] text-[#0a1317] sm:text-[36px] sm:leading-[1.28]">
                  Schools nearby
                </h2>
                <div className="mt-8">
                  <PdpSchools schools={schools} city={property.city} />
                </div>
              </section>
            )}

            {/* Location: full-bleed map. */}
            {hasCoords && (
              <section id="location" className="border-t border-[#dee3e9] py-14">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <h2 className="text-[28px] font-medium leading-[1.21] text-[#0a1317] sm:text-[36px] sm:leading-[1.28]">
                      Where it is
                    </h2>
                    <p className="mt-2 flex items-center gap-1.5 text-[16px] leading-[1.5] tracking-[-0.16px] text-[#5d6c7b]">
                      <MapPin size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
                      {fullAddress}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-[8px] border-2 border-[rgba(10,19,23,0.12)] px-[22px] py-[10px] text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-[#0a1317] transition-colors hover:bg-[#f1f4f7]"
                  >
                    Get directions
                    <ChevronRight size={15} strokeWidth={2.5} aria-hidden="true" />
                  </a>
                </div>
                <div className="mt-6 h-[420px] overflow-hidden rounded-[8px] border border-[#dee3e9]">
                  <PropertyDetailMapLoader current={currentMarker} nearby={nearbyMarkers} satellite />
                </div>
              </section>
            )}

            {/* Leasing: dark promo strip. Four steps, then the money facts. */}
            <section id="leasing" className="border-t border-[#dee3e9] py-14">
              <div className="rounded-[8px] bg-[#0a1317] p-8 text-white sm:p-12">
                <h2 className="max-w-[18ch] text-[28px] font-medium leading-[1.21] sm:text-[36px] sm:leading-[1.28]">
                  From tour to keys in four steps
                </h2>
                <p className="mt-4 max-w-[52ch] text-[16px] leading-[1.5] tracking-[-0.16px] text-[#ced0d4]">
                  Every part of leasing this home happens online, on your schedule.
                </p>

                <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      Icon: CalendarDays,
                      title: "Tour it",
                      body: allowsSelfTour
                        ? "Book a self-guided tour and get a temporary access code for the front door."
                        : "Book a tour and a leasing specialist will meet you at the home.",
                    },
                    { Icon: KeyRound, title: "Apply online", body: "Submit income and ID verification from your phone in about ten minutes." },
                    { Icon: Wallet, title: "Get a decision", body: "Applications receive a decision within 24 business hours." },
                    { Icon: Wrench, title: "Move in", body: "Sign the lease digitally, then manage rent and repairs from the resident portal." },
                  ].map(({ Icon, title, body }) => (
                    <li key={title}>
                      <Icon size={24} strokeWidth={1.75} aria-hidden="true" className="text-white" />
                      <h3 className="mt-4 text-[18px] font-bold leading-[1.44] text-white">{title}</h3>
                      <p className="mt-2 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#ced0d4]">{body}</p>
                    </li>
                  ))}
                </ol>

                <div className="mt-10 flex flex-col gap-5 border-t border-white/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-[52ch] text-[14px] leading-[1.43] tracking-[-0.14px] text-[#ced0d4]">
                    Income guideline for this home is about{" "}
                    <span className="font-bold text-white">${formatNumber(incomeGuideline)}/mo</span>{" "}
                    gross household income. Co-signers accepted.
                  </p>
                  <Link
                    href={`/apply?property=${property.slug}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-[8px] bg-white px-7 py-3.5 text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-[#0a1317] transition-colors hover:bg-[#f1f4f7]"
                  >
                    Apply now
                  </Link>
                </div>

                {/* The office that actually manages this address. */}
                {leasingOffice && (
                  <div className="mt-8 border-t border-white/15 pt-8">
                    <p className="text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-white">
                      Leasing office for this home
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
                      {leasingOffice.phone && (
                        <a
                          href={leasingOffice.phoneHref}
                          className="-my-2 inline-flex min-h-11 items-center gap-2 py-2 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#ced0d4] hover:text-white"
                        >
                          <Phone size={15} strokeWidth={2} aria-hidden="true" />
                          {leasingOffice.phone}
                        </a>
                      )}
                      {leasingOffice.email && (
                        <a
                          href={`mailto:${leasingOffice.email}`}
                          className="-my-2 inline-flex min-h-11 items-center gap-2 py-2 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#ced0d4] hover:text-white"
                        >
                          <Mail size={15} strokeWidth={2} aria-hidden="true" />
                          {leasingOffice.email}
                        </a>
                      )}
                      {leasingOffice.license && (
                        <span className="text-[14px] leading-[1.43] tracking-[-0.14px] text-[#8595a4]">
                          Brokerage license {leasingOffice.license}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Questions: accordion. */}
            <section id="faq" className="border-t border-[#dee3e9] py-14">
              <h2 className="text-[28px] font-medium leading-[1.21] text-[#0a1317] sm:text-[36px] sm:leading-[1.28]">
                Questions renters ask
              </h2>
              <div className="mt-6">
                <PdpFaq items={faqItems} />
              </div>
            </section>

            {/* Nearby: card grid, exactly as many cells as there are homes. */}
            <section id="nearby" className="border-t border-[#dee3e9] pt-14">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-[28px] font-medium leading-[1.21] text-[#0a1317] sm:text-[36px] sm:leading-[1.28]">
                  More homes in {property.city}
                </h2>
                <Link
                  href={cityHref}
                  className="-my-2 inline-flex min-h-11 items-center gap-1 py-2 text-[16px] font-bold leading-[1.5] tracking-[-0.16px] text-[#0064e0] hover:underline"
                >
                  See all
                  <ChevronRight size={16} strokeWidth={2.5} aria-hidden="true" />
                </Link>
              </div>

              {similarProperties.length > 0 ? (
                <ul
                  className={`mt-6 grid gap-5 sm:grid-cols-2 ${
                    similarProperties.length >= 3 ? "lg:grid-cols-3" : ""
                  }`}
                >
                  {similarProperties.map((sim) => (
                    <li key={sim.id}>
                      <Link href={`/houses-for-rent/${sim.slug}`} className="group block">
                        <div className="relative aspect-[4/3] overflow-hidden rounded-[8px] bg-[#f1f4f7]">
                          {sim.primary_image_url ? (
                            <img
                              src={sim.primary_image_url}
                              alt={`${sim.address}, ${sim.city}`}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[#8595a4]">
                              <House size={28} strokeWidth={1.5} aria-hidden="true" />
                            </div>
                          )}
                        </div>
                        <p className="mt-3 text-[18px] font-bold leading-[1.44] text-[#0a1317]">
                          ${formatNumber(Math.round(Number(sim.price)))}
                          <span className="text-[14px] font-normal text-[#5d6c7b]">{sim.price_label || "/mo"}</span>
                        </p>
                        <p className="mt-0.5 truncate text-[14px] leading-[1.43] tracking-[-0.14px] text-[#1c1e21] group-hover:text-[#0064e0]">
                          {sim.address}
                        </p>
                        <p className="mt-0.5 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#5d6c7b]">
                          {sim.bedrooms} bd · {sim.bathrooms} ba
                          {sim.sqft ? ` · ${formatNumber(sim.sqft)} sq ft` : ""}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6 rounded-[8px] bg-[#f1f4f7] p-8 text-center">
                  <p className="text-[16px] leading-[1.5] tracking-[-0.16px] text-[#444950]">
                    This is currently our only listing in {property.city}.
                  </p>
                  <Link
                    href="/houses-for-rent"
                    className="mt-4 inline-flex items-center justify-center rounded-[8px] bg-[#0a1317] px-[30px] py-[14px] text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-white transition-colors hover:bg-[#444950]"
                  >
                    Browse all homes
                  </Link>
                </div>
              )}
            </section>
            </main>
          </div>

          {/* Desktop sticky lead rail. top-24 clears the 80px navbar. */}
          <aside className="hidden lg:block lg:sticky lg:top-24">
            <PdpLeadRail {...leadRailProps} variant="rail" />
          </aside>
        </div>
      </div>

      <PdpTourAutoOpen />
      <PropertyTourModal
        propertySlug={property.slug}
        propertyTitle={property.title}
        listingType={property.listing_type}
        propertyId={property.id}
        propertyCity={property.city}
      />

      <PdpMobileBar slug={property.slug} price={priceNum} priceLabel={priceLabel} />
      <div className="h-24 lg:hidden" aria-hidden="true" />
    </div>
  );
}
