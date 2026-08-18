import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Eye, Home,
  Utensils, Zap, Waves, PawPrint, Thermometer, Info,
  Wind, WashingMachine, Car, Shield, Dumbbell,
  TreePine, CheckCircle2, Refrigerator, Microwave,
  Flame, ShowerHead, Wifi, Fence, Sparkles, Clock, DollarSign,
  HelpCircle, ChevronRight, School, Bus, ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { fetchPropertyBySlug, fetchProperties, toPropertyCardShape } from "@/lib/properties";
import { fetchAllCities, cityToSlug } from "@/lib/cities";
import { stateFullName, stateSlugForCode } from "@/lib/states";
import { PropertyIntentCapture } from "@/components/public/PropertyIntentCapture";
import { VirtualTourButton, VirtualTourBadge, VirtualTourChip } from "@/components/public/VirtualTourButton";
import { PropertyImageGallery } from "@/components/public/PropertyImageGallery";
import { BookTourButton } from "@/components/public/BookTourButton";
import { PropertyTourModal } from "@/components/public/PropertyTourModal";
import { PropertyDetailMapLoader } from "@/components/public/PropertyDetailMapLoader";
import type { DetailMarker } from "@/components/public/PropertyDetailMap";
import { PropertyPageTracker } from "@/components/public/PropertyPageTracker";
import { SidebarWidgets } from "@/components/public/SidebarWidgets";
import { PropertyDetailsTabs } from "@/components/public/PropertyDetailsTabs";
import { PropertyActionStrip } from "@/components/public/PropertyActionStrip";
import { formatPrice, formatNumber } from "@/lib/utils";

export const revalidate = 300;

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";

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
    const priceLabel = property.listing_type === "for-rent"
      ? ` – $${Number(property.price).toLocaleString()}/mo`
      : ` – $${Number(property.price).toLocaleString()}`;

    const streetAddress = property.address ?? "";
    const fullAddr = `${streetAddress}, ${property.city}, ${property.state}${property.zip_code ? " " + property.zip_code : ""}`;
    const seoTitle = streetAddress
      ? `${fullAddr} — ${bedsLabel}${typeLabel} ${actionLabel}${priceLabel}`
      : `${bedsLabel}${typeLabel} ${actionLabel} in ${property.city}, ${property.state}${priceLabel}`;

    const featureList = [
      property.bedrooms ? `${property.bedrooms} bed` : null,
      property.bathrooms ? `${property.bathrooms} bath` : null,
      property.sqft ? `${Number(property.sqft).toLocaleString()} sqft` : null,
    ].filter(Boolean).join(", ");
    const addrPrefix = streetAddress ? `${fullAddr}. ` : "";
    const seoDesc = `${addrPrefix}${featureList ? featureList + ". " : ""}Inspected, move-in ready luxury single family home for rent managed by Prime Family Housing. 24/7 maintenance, pet friendly, apply online.`;

    const ogImage = property.images?.[0]?.image_url
      ? property.images[0].image_url
      : FALLBACK_IMAGE;

    return {
      title: `${seoTitle} | PrimeFamilyHousing`,
      description: seoDesc.slice(0, 160),
      keywords: [
        ...(streetAddress ? [
          streetAddress,
          `${streetAddress} ${property.city}`,
          `${streetAddress} ${property.city} ${property.state}`,
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
      openGraph: {
        title: `${seoTitle} | PrimeFamilyHousing`,
        description: seoDesc.slice(0, 160),
        url: `https://primefamilyhousing.com/houses-for-rent/${decodedSlug}`,
        images: [{ url: ogImage, width: 1200, height: 630, alt: property.title }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${seoTitle} | PrimeFamilyHousing`,
        description: seoDesc.slice(0, 160),
        images: [ogImage],
      },
    };
  } catch {
    return {
      title: "Property Details | PrimeFamilyHousing",
      description: "Explore available houses for rent with Prime Family Housing.",
    };
  }
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  let property: any;
  try {
    property = await fetchPropertyBySlug(decodedSlug);
  } catch {
    notFound();
  }

  if (!property) {
    notFound();
  }

  // Fetch similar homes
  let similarProperties: any[] = [];
  try {
    const listRes = await fetchProperties({
      city: property.city,
      page_size: "4",
      
    });
    similarProperties = listRes.results
      .filter((p: any) => p.slug !== decodedSlug && p.id !== property.id)
      .slice(0, 3)
      .map(toPropertyCardShape);
  } catch {
    similarProperties = [];
  }

  const images = property.images && property.images.length > 0 ? property.images : [];
  const primaryImage = images.find((img: any) => img.is_primary) ?? images[0];

  const agent = property.agent;
  const agentPhoto = agent?.avatar_url || "/images/agent-placeholder.jpg";
  const agencyName = "Prime Family Housing";

  const allAmenityNames: string[] = [
    ...(property.amenities?.map((a: any) => (typeof a === "string" ? a : a.name)) ?? []),
    ...(property.amenity_categories?.flatMap((c: any) => c.amenities?.map((a: any) => a.name) ?? []) ?? []),
  ].filter((v, i, a) => a.indexOf(v) === i);

  const isPetFriendly = allAmenityNames.some((name) =>
    /pet|dog|cat|fenced|yard|animal/i.test(name)
  );

  const virtualTourUrl = property.virtual_tour_url || (property as any).tour_360_url || null;

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

  const nearbyMarkers: DetailMarker[] = similarProperties.map((sim: any) => ({
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
  const fullAddress = `${property.address}, ${property.city}, ${property.state}${property.zip_code ? " " + property.zip_code : ""}`.trim();
  const stateName = stateFullName(property.state);
  const stateSlug = stateSlugForCode(property.state);
  const citySlug = cityToSlug(property.city, property.state);
  const stateHref = `/houses-for-rent?state=${property.state}`;
  const cityHref = `/rentals/${citySlug}`;

  // Price formatting
  const priceNum = Number(property.price) || 0;
  const originalPriceNum = Number(property.original_price) || (priceNum > 0 ? Math.round(priceNum / 0.85) : 0);
  const monthlySavings = originalPriceNum > priceNum ? originalPriceNum - priceNum : 0;
  const isAvailable = property.status === "available";

  // Breadcrumbs Schema
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

  // Structured Data Schema
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
      geo: {
        "@type": "GeoCoordinates",
        latitude: currentMarker.lat,
        longitude: currentMarker.lng,
      },
    }),
    numberOfBedrooms: Number(property.bedrooms || 3),
    numberOfBathroomsTotal: Number(property.bathrooms || 2),
    floorSize: { "@type": "QuantitativeValue", value: property.sqft || 1500, unitCode: "FTK" },
    petsAllowed: isPetFriendly,
    amenityFeature: allAmenityNames.slice(0, 15).map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
  };

  const listingSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    mainEntity: residenceSchema,
    name: `${fullAddress} — Single Family House for Rent`,
    description: property.description ?? "",
    url: `https://primefamilyhousing.com/houses-for-rent/${property.slug}`,
    image: images.length > 0
      ? images.map((img: any) => ({
          "@type": "ImageObject",
          url: img.image_url ?? FALLBACK_IMAGE,
          width: 1200,
          height: 630,
          caption: img.caption ?? property.title,
        }))
      : [{ "@type": "ImageObject", url: FALLBACK_IMAGE, width: 1200, height: 630 }],
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "USD",
      availability: isAvailable ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: property.price,
        priceCurrency: "USD",
        unitCode: "MON",
        billingIncrement: 1,
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "34",
      bestRating: "5",
      worstRating: "1",
    },
    datePosted: (property as any).created_at ?? new Date().toISOString(),
    broker: {
      "@type": "RealEstateAgent",
      name: "Prime Family Housing Leasing Team",
      email: "leasing@primefamilyhousing.com",
      telephone: "(888) 774-6310",
      url: "https://primefamilyhousing.com",
    },
  };

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What is the monthly rent and deposit for ${property.address}, ${property.city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `The monthly rent for this ${property.bedrooms}-bedroom home is $${formatNumber(priceNum)}/month. Security deposits are typically equivalent to one month's rent subject to credit approval.`,
        },
      },
      {
        "@type": "Question",
        name: `Are pets allowed at ${property.address}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: isPetFriendly
            ? `Yes! This single-family home is pet-friendly for cats and dogs with a nominal deposit and monthly pet rent. Up to 2 pets welcome.`
            : `Please contact our leasing team regarding pet policies and exceptions for this property.`,
        },
      },
      {
        "@type": "Question",
        name: `What smart home amenities are included with this house?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Every Prime Family Housing rental comes equipped with keyless smart digital locks, video doorbell access, smart climate controls, and high-speed media wiring.`,
        },
      },
      {
        "@type": "Question",
        name: `How quickly can I move into this ${property.city} home?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Applications receive decisions within 24 hours. Move-ins can be scheduled immediately following lease verification and signing.`,
        },
      },
    ],
  };

  // Video Schema
  const videoSchema = virtualTourUrl ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `Virtual Tour — ${fullAddress}`,
    description: `Take an interactive 3D virtual tour of ${fullAddress} in ${property.city}, ${property.state}.`,
    thumbnailUrl: [primaryImage?.image_url ?? FALLBACK_IMAGE],
    uploadDate: (property as any).created_at ?? new Date().toISOString(),
    contentUrl: virtualTourUrl,
    embedUrl: virtualTourUrl,
  } : null;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900">
      <PropertyIntentCapture city={property.city} listingType={property.listing_type} />
      <PropertyPageTracker slug={property.slug} price={Number(property.price)} listingType={property.listing_type} />
      
      {/* JSON-LD Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {videoSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />
      )}

      {/* ── TOP BREADCRUMB ── */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-2.5 flex items-center gap-2 text-[13px] text-slate-500 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-blue-600 font-medium">Home</Link>
          <span>/</span>
          <Link href="/houses-for-rent" className="hover:text-blue-600 font-medium">Houses for Rent</Link>
          <span>/</span>
          <Link href={stateHref} className="hover:text-blue-600 font-medium">{stateName}</Link>
          <span>/</span>
          <Link href={cityHref} className="hover:text-blue-600 font-medium">{property.city}</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold truncate">{property.address}</span>
        </div>
      </div>

      {/* ── IMAGE GALLERY HERO ── */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <PropertyImageGallery
            images={images}
            title={property.title}
            fallback={FALLBACK_IMAGE}
          />
        </div>
      </div>

      {/* ── PRICE & ADDRESS INFO BAND ── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 min-w-0 space-y-3">
            
            {/* Price & Badges */}
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                {formatPrice(property.price)}{property.price_label || "/mo"}
              </span>

              {originalPriceNum > priceNum && (
                <span className="text-base sm:text-lg text-slate-400 line-through font-semibold">
                  ${formatNumber(originalPriceNum)}/mo
                </span>
              )}

              {monthlySavings > 0 && (
                <span className="bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-1 rounded-full border border-blue-200 uppercase tracking-wider">
                  Save ${formatNumber(monthlySavings)}/mo (15% Off)
                </span>
              )}

              <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {isAvailable ? "Available Now" : property.status.replace("-", " ")}
              </span>

              {isPetFriendly && (
                <span className="bg-indigo-50 text-indigo-700 text-xs font-black px-2.5 py-1 rounded-full border border-indigo-200 uppercase tracking-wider flex items-center gap-1">
                  <PawPrint size={12} /> Pet Friendly
                </span>
              )}
            </div>

            {/* Address & Direct Actions */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {property.address}, {property.city}, {property.state} {property.zip_code}
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                {property.bedrooms} Bed, {String(property.bathrooms)} Bath Single-Family Rental in {property.city} • Managed by Prime Family Housing
              </p>
            </div>

            {/* Key Specs Strip */}
            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-700 font-semibold">
              <div className="flex items-center gap-1.5">
                <Home size={16} className="text-blue-600" />
                <span>{property.bedrooms} <span className="text-slate-500 font-normal">Bedrooms</span></span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <ShowerHead size={16} className="text-blue-600" />
                <span>{String(property.bathrooms)} <span className="text-slate-500 font-normal">Bathrooms</span></span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-blue-600" />
                <span>{property.sqft ? formatNumber(property.sqft) : "1,500"} <span className="text-slate-500 font-normal">Sq Ft</span></span>
              </div>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5">
                <Car size={16} className="text-blue-600" />
                <span>{property.garage || 2} <span className="text-slate-500 font-normal">Car Garage</span></span>
              </div>
            </div>

          </div>

          {/* Hero Action CTA Card */}
          <div className="shrink-0 bg-slate-50 border border-slate-200/90 rounded-2xl p-5 w-full md:w-80 shadow-sm flex flex-col gap-3">
            <BookTourButton
              label="Schedule Self Tour"
              className="w-full px-5 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-center text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
            />
            <a
              href={`/apply?property=${property.slug}`}
              className="w-full px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-center text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              Apply Online Now
            </a>
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1 font-medium">
              <span className="flex items-center gap-1"><Clock size={12} className="text-blue-600" /> 24-Hour Approval</span>
              <span className="flex items-center gap-1"><Shield size={12} className="text-emerald-600" /> Move-In Guarantee</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── TABS NAVIGATION STRIP ── */}
      <PropertyDetailsTabs hasMap={hasCoords} hasVirtualTour={!!virtualTourUrl} />

      {/* ── MAIN CONTENT BODY ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

          {/* LEFT COLUMN: Deep Content Modules (Eliminating Thin Content) */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* 1. OVERVIEW & SEO DESCRIPTION */}
            <section id="features" className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  About {property.address}
                </h2>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">
                  Prime Family Housing Certified Rental
                </p>
              </div>

              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-[15px] space-y-4">
                <p>{property.description}</p>
              </div>

              {/* Key Highlights Grid */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase">Year Built</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">{property.year_built || "2018"}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase">Property Type</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">Single Family</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase">Stories</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">{property.stories || 1}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase">Status</p>
                  <p className="text-base font-black text-emerald-600 mt-0.5">Move-In Ready</p>
                </div>
              </div>
            </section>

            {/* 2. TRANSPARENT MONTHLY COST & AFFORDABILITY ESTIMATOR */}
            <section id="cost-calculator" className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <DollarSign className="text-blue-600" size={24} />
                    Estimated Monthly Living Cost
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Transparent, upfront pricing breakdown with zero hidden surprises</p>
                </div>
                <span className="bg-blue-50 text-blue-700 text-xs font-black px-3 py-1 rounded-full border border-blue-200">
                  Affordable Rent
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between py-2.5 border-b border-slate-100 text-sm font-medium">
                    <span className="text-slate-600">Base Monthly Rent</span>
                    <span className="font-bold text-slate-900">${formatNumber(priceNum)}/mo</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-slate-100 text-sm font-medium">
                    <span className="text-slate-600">Smart Home & Keyless Package</span>
                    <span className="font-bold text-slate-900">$20/mo</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-slate-100 text-sm font-medium">
                    <span className="text-slate-600">Air Filter Delivery Service</span>
                    <span className="font-bold text-slate-900">$12/mo</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-slate-100 text-sm font-medium">
                    <span className="text-slate-600">Estimated Utilities (Water/Gas/Elec)</span>
                    <span className="font-bold text-slate-500">~$160/mo</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl p-5 flex flex-col justify-between shadow-md">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-blue-200 font-bold">Total Estimated Monthly</p>
                    <p className="text-3xl font-black mt-1">${formatNumber(priceNum + 192)}<span className="text-sm text-blue-200 font-normal">/mo</span></p>
                    <p className="text-xs text-blue-100 mt-2">Includes base rent, smart security hub, HVAC filter replacement program, and standard estimated municipal utilities.</p>
                  </div>
                  <a
                    href={`/apply?property=${property.slug}`}
                    className="mt-4 w-full py-2.5 bg-white text-blue-700 hover:bg-blue-50 text-center font-bold text-sm rounded-lg transition-colors shadow-sm block"
                  >
                    Lock In This Rate
                  </a>
                </div>
              </div>
            </section>

            {/* 3. HOME AMENITIES & SMART FEATURES */}
            <section id="details" className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Amenities & Premium Features
              </h2>
              {allAmenityNames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {allAmenityNames.map((name) => {
                    const cfg = getAmenityConfig(name);
                    const Icon = cfg.Icon;
                    return (
                      <div
                        key={name}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Icon size={18} />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Complete features available upon scheduled tour.</p>
              )}
            </section>

            {/* 4. PRIME RESIDENT FIRST QUALITY GUARANTEE */}
            <section className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-md space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <Shield className="text-emerald-400" size={24} />
                  The Prime Family Housing Guarantee
                </h2>
                <p className="text-xs text-slate-400 mt-1">Standard with every single-family home in our residential network</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2.5 font-bold text-emerald-400 text-sm mb-1.5">
                    <Clock size={18} /> 24/7 Priority Emergency Maintenance
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Submit maintenance requests instantly via our tenant portal. Our dedicated technicians handle critical repairs promptly.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2.5 font-bold text-blue-400 text-sm mb-1.5">
                    <CheckCircle2 size={18} /> Certified 120-Point Move-In Inspection
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Every property undergoes HVAC servicing, plumbing pressure testing, electrical safety checks, and deep sanitization before key handover.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2.5 font-bold text-indigo-400 text-sm mb-1.5">
                    <Zap size={18} /> Integrated Smart Home System
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Control door locks, smart thermostats, and security alerts from your mobile phone for complete peace of mind.
                  </p>
                </div>

                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/60">
                  <div className="flex items-center gap-2.5 font-bold text-amber-400 text-sm mb-1.5">
                    <DollarSign size={18} /> Zero Hidden Fees & Transparent Leasing
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Clear itemized monthly statements, straightforward lease extension options, and no unexpected fee markups.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. PET POLICY & LEASING GUIDELINES */}
            <section id="pet-policy" className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <PawPrint className="text-blue-600" size={24} />
                  Pet Policy & Lease Terms
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">We love pets! Review guidelines and move-in requirements below.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Dogs & Cats</p>
                  <p className="text-base font-black text-slate-900 mt-1">Welcome (Up to 2)</p>
                  <p className="text-xs text-slate-600 mt-1">All non-aggressive breeds welcome with registration.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Pet Deposit & Rent</p>
                  <p className="text-base font-black text-slate-900 mt-1">$300 Deposit / $35 Mo</p>
                  <p className="text-xs text-slate-600 mt-1">Assistance & service animals exempt from all fees.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase">Lease Lengths</p>
                  <p className="text-base font-black text-slate-900 mt-1">12 to 24 Months</p>
                  <p className="text-xs text-slate-600 mt-1">Flexible renewal terms with predictable rate locks.</p>
                </div>
              </div>
            </section>

            {/* 6. NEIGHBORHOOD & LIFESTYLE HIGHLIGHTS */}
            <section id="neighborhood" className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <MapPin className="text-blue-600" size={24} />
                  Neighborhood & Commute in {property.city}, {property.state}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Local education, commute access, and neighborhood amenities</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1">
                    <School size={16} /> Schools & Education
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Served by {property.city} Public School District with top-rated elementary and high schools within a 10-minute drive.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1">
                    <Bus size={16} /> Commuter Access
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Fast connectivity to regional highway corridors, bus transit lines, and major employer hubs across {stateName}.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-sm mb-1">
                    <ShoppingBag size={16} /> Dining & Retail
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    Minutes from {property.city} town center, supermarkets, fitness centers, and family entertainment venues.
                  </p>
                </div>
              </div>
            </section>

            {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ SECTION FOR GOOGLE SERP) */}
            <section id="faq" className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <HelpCircle className="text-blue-600" size={24} />
                  Frequently Asked Questions
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Common questions about renting {property.address}</p>
              </div>

              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    How do I apply for {property.address}?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Applying is 100% online through Prime Family Housing. Submit your basic contact info, proof of income, and ID verification. Decisions are typically delivered within 24 business hours.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    Can I schedule an in-person self tour?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Yes! Click "Schedule Self Tour" above to pick a date and time that fits your schedule. You will receive a secure temporary digital access code to tour the home at your convenience.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    What are the income and credit requirements?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    We generally look for verifiable household gross income of at least 3x the monthly rent and a clean rental history. Co-signers and guarantor applications are also accepted.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    How are maintenance requests handled?
                  </h3>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    Residents have 24/7 access to our online maintenance portal and emergency hotline. Routine maintenance is scheduled with verified, bonded service professionals.
                  </p>
                </div>
              </div>
            </section>

            {/* 8. 360 VIRTUAL TOUR */}
            {virtualTourUrl && (
              <section id="virtual-tour" className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Interactive 3D Virtual Tour
                </h2>
                <div className="max-w-3xl rounded-xl overflow-hidden shadow-sm border border-slate-200">
                  <VirtualTourButton url={virtualTourUrl} thumbnailUrl={primaryImage?.image_url ?? FALLBACK_IMAGE} />
                </div>
              </section>
            )}

            {/* 9. LOCATION MAP */}
            <section id="map" className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Property Location & Street Map
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">{fullAddress}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  Directions <ChevronRight size={14} />
                </a>
              </div>

              {hasCoords ? (
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden border border-slate-200 h-[380px]">
                    <PropertyDetailMapLoader current={currentMarker} nearby={nearbyMarkers} satellite={true} />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-sm">
                  <p className="font-bold text-slate-900 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600 shrink-0" />
                    {fullAddress}
                  </p>
                </div>
              )}
            </section>

            {/* 10. SIMILAR HOMES FOR RENT */}
            {similarProperties.length > 0 && (
              <section className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Similar Houses for Rent in {property.city}
                  </h2>
                  <Link href={cityHref} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                    View all {property.city} rentals <ChevronRight size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {similarProperties.map((simProp: any) => (
                    <Link
                      key={simProp.id}
                      href={`/houses-for-rent/${simProp.slug}`}
                      className="group border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all flex flex-col bg-white"
                    >
                      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                        {simProp.primary_image_url ? (
                          <img
                            src={simProp.primary_image_url}
                            alt={simProp.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Home size={28} />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-black px-2 py-0.5 rounded shadow-sm">
                          {formatPrice(simProp.price, { perMonth: true })}
                        </span>
                      </div>
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {simProp.address}
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5 truncate">
                            {simProp.city}, {simProp.state}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-100 text-xs font-semibold text-slate-600">
                          <span>{simProp.bedrooms} Bed</span>
                          <span>•</span>
                          <span>{simProp.bathrooms} Bath</span>
                          {simProp.sqft && (
                            <>
                              <span>•</span>
                              <span>{formatNumber(simProp.sqft)} Sqft</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* RIGHT COLUMN: Sticky Sidebar */}
          <div className="w-full lg:w-[340px] shrink-0 space-y-6">
            <div className="sticky top-[136px] space-y-6">
              <SidebarWidgets
                property={{
                  id: property.id,
                  slug: property.slug,
                  title: property.title,
                  address: property.address,
                  city: property.city,
                  state: property.state,
                  zip_code: property.zip_code,
                  listing_type: property.listing_type,
                  status: property.status,
                  price: Number(property.price)
                }}
                agent={agent}
                agentPhoto={agentPhoto}
                agencyName={agencyName}
              />
            </div>
          </div>

        </div>
      </div>

      <PropertyTourModal
        propertySlug={property.slug}
        propertyTitle={property.title}
        listingType={property.listing_type}
        propertyId={property.id}
        propertyCity={property.city}
      />

      {/* Mobile bottom sticky bar */}
      <div
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-4 pt-2.5">
          <p className="text-lg font-black text-slate-900 leading-none">
            ${formatNumber(priceNum)}<span className="text-xs font-bold text-slate-500">/mo</span>
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available Now
          </span>
        </div>
        <div className="px-4 pt-2 pb-3 grid grid-cols-2 gap-2.5">
          <BookTourButton
            label="Book a Tour"
            withIcon={false}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-bold transition-colors text-center block cursor-pointer shadow-md shadow-blue-500/20"
          />
          <a
            href={`/apply?property=${property.slug}`}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 text-sm font-bold transition-colors text-center block"
          >
            Apply Now
          </a>
        </div>
      </div>

      <div className="lg:hidden h-28" />
    </div>
  );
}

// ── Amenity Icon Helper ────────────────────────────────────────────────────────
interface AmenityConfig { Icon: LucideIcon; iconCls: string; bgCls: string; }

function getAmenityConfig(name: string): AmenityConfig {
  const n = name.toLowerCase();
  if (/granite|quartz|counter|island|kitchen|dishwasher|utensil|cook/.test(n))
    return { Icon: Utensils, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
  if (/refrigerator|fridge/.test(n))
    return { Icon: Refrigerator, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
  if (/microwave/.test(n))
    return { Icon: Microwave, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
  if (/stove|range|oven|fireplace/.test(n))
    return { Icon: Flame, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
  if (/stainless|appliance/.test(n))
    return { Icon: Sparkles, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
  if (/washer|dryer|laundry|washing/.test(n))
    return { Icon: WashingMachine, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
  if (/air.condition|central.air|\bac\b|hvac/.test(n))
    return { Icon: Wind, iconCls: "text-cyan-600", bgCls: "bg-cyan-100" };
  if (/heat|furnace|thermostat/.test(n))
    return { Icon: Thermometer, iconCls: "text-red-600", bgCls: "bg-red-100" };
  if (/shower|bath/.test(n))
    return { Icon: ShowerHead, iconCls: "text-sky-600", bgCls: "bg-sky-100" };
  if (/electric|utility|power/.test(n))
    return { Icon: Zap, iconCls: "text-yellow-600", bgCls: "bg-yellow-100" };
  if (/wifi|internet|cable|network/.test(n))
    return { Icon: Wifi, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
  if (/pool|swim/.test(n))
    return { Icon: Waves, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
  if (/garage|parking|car/.test(n))
    return { Icon: Car, iconCls: "text-slate-600", bgCls: "bg-slate-100" };
  if (/yard|fence|patio|outdoor|garden|balcony/.test(n))
    return { Icon: Fence, iconCls: "text-emerald-600", bgCls: "bg-emerald-100" };
  if (/tree|park|trail|walk|nature/.test(n))
    return { Icon: TreePine, iconCls: "text-emerald-600", bgCls: "bg-emerald-100" };
  if (/gym|fitness|dumbbell|workout/.test(n))
    return { Icon: Dumbbell, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
  if (/gated|security|guard|camera|alarm/.test(n))
    return { Icon: Shield, iconCls: "text-emerald-600", bgCls: "bg-emerald-100" };
  if (/pet|dog|cat|animal/.test(n))
    return { Icon: PawPrint, iconCls: "text-indigo-600", bgCls: "bg-indigo-100" };
  if (/hoa|community|club/.test(n))
    return { Icon: Home, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
  return { Icon: CheckCircle2, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
}
