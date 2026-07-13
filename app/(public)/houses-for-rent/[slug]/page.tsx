import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin, Eye, Home,
  Utensils, Zap, Waves, PawPrint, Thermometer, Info,
  Wind, WashingMachine, Car, Shield, Dumbbell,
  TreePine, CheckCircle2, Refrigerator, Microwave,
  Flame, ShowerHead, Wifi, Fence,
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

// Inject Cloudinary resize transformation so Google receives a 1200×630 image
function toOgImageUrl(url: string): string {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", "/upload/c_fill,w_1200,h_630,f_jpg,q_auto/");
  }
  return url;
}

export async function generateStaticParams() {
  // Return empty — pages are built on-demand via ISR (dynamicParams = true by default)
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

    // Address-first title so address searches rank: "123 Main St, Atlanta GA — 3-Bed House for Rent"
    const streetAddress = property.address ?? "";
    const fullAddr = `${streetAddress}, ${property.city}, ${property.state}${property.zip_code ? " " + property.zip_code : ""}`;
    const seoTitle = streetAddress
      ? `${streetAddress} — ${bedsLabel}${typeLabel} ${actionLabel} in ${property.city}, ${property.state}${priceLabel}`
      : `${bedsLabel}${typeLabel} ${actionLabel} in ${property.city}, ${property.state}${priceLabel}`;

    // Description leads with address + features so it shows in snippet for address searches
    const featureList = [
      property.bedrooms ? `${property.bedrooms} bed` : null,
      property.bathrooms ? `${property.bathrooms} bath` : null,
      property.sqft ? `${Number(property.sqft).toLocaleString()} sqft` : null,
    ].filter(Boolean).join(", ");
    const addrPrefix = streetAddress ? `${fullAddr}. ` : "";
    const seoDesc = `${addrPrefix}${featureList ? featureList + ". " : ""}Affordable ${typeLabel.toLowerCase()} ${actionLabel} — inspected and move-in ready. Apply online, decision in 24 hours.`;

    const ogImage = property.images?.[0]?.image_url
      ? toOgImageUrl(property.images[0].image_url)
      : FALLBACK_IMAGE;

    return {
      title: `${seoTitle} | Hasker & Co. Realty Group`,
      description: seoDesc.slice(0, 160),
      keywords: [
        // Address-specific — ranks when someone Googles the exact address
        ...(streetAddress ? [
          streetAddress,
          `${streetAddress} ${property.city}`,
          `${streetAddress} ${property.city} ${property.state}`,
          `${fullAddr} rental`,
          `${fullAddr} for rent`,
        ] : []),
        // City + type keywords
        `${bedsLabel.trim()} ${typeLabel} ${actionLabel} ${property.city}`.trim(),
        `affordable ${typeLabel.toLowerCase()} ${property.city}`,
        `${property.city} ${typeLabel.toLowerCase()} ${actionLabel} move-in ready`,
        `${property.city} ${actionLabel}`,
      ],
      alternates: { canonical: `https://haskerrealtygroup.com/houses-for-rent/${decodedSlug}` },
      openGraph: {
        title: `${seoTitle} | Hasker & Co. Realty Group`,
        description: seoDesc.slice(0, 160),
        type: "website",
        url: `https://haskerrealtygroup.com/houses-for-rent/${decodedSlug}`,
        images: [{ url: ogImage, width: 1200, height: 630, alt: seoTitle }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${seoTitle} | Hasker & Co. Realty Group`,
        description: seoDesc.slice(0, 160),
        images: [ogImage],
      },
    };
  } catch (err) {
    // Real 404 → notFound() here, BEFORE streaming starts, so the response
    // carries a true 404 status (thrown from the page body it would stream
    // as 200 + noindex). Any other failure (backend down) must be a 5xx so
    // Google retries instead of deindexing the page.
    if ((err as { status?: number })?.status === 404) notFound();
    throw err;
  }
}

function parseAmenity(name: string): { label: string; value: string } {
  const parts = name.split(":");
  if (parts.length > 1) {
    return {
      label: parts[0].trim(),
      value: parts.slice(1).join(":").trim()
    };
  }
  return { label: "", value: name.trim() };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);

  let property;
  try {
    property = await fetchPropertyBySlug(decodedSlug);
  } catch (err) {
    // 404 only for genuinely missing listings. A backend outage must surface
    // as a 5xx — 404ing every property page during an outage tells Google to
    // deindex the whole inventory.
    if ((err as { status?: number })?.status === 404) notFound();
    throw err;
  }

  const isAvailable = property.status === "available";
  const unavailableLabel =
    property.status === "rented" ? "rented" :
      property.status === "sold" ? "sold" :
        property.status === "under-contract" ? "under contract" :
          property.status === "off-market" ? "off the market" :
            "no longer available";

  const images = property.images ?? [];
  const primaryImage = images.find((i) => i.is_primary) ?? images[0];
  const amenityCategories = (property as any).amenity_categories ?? [];
  const allAmenities = amenityCategories.flatMap((cat: any) => cat.amenities ?? []);
  const finalAmenities = allAmenities.length > 0 ? allAmenities : (property.amenities ?? []);
  const agent = property.agent;

  // Similar homes + city list are independent — fetch in parallel (they were
  // serial round-trips, a noticeable chunk of TTFB on uncached renders).
  const [similarRaw, allCities] = await Promise.all([
    fetchProperties({ q: property.city, listing_type: property.listing_type, page_size: "12" }).catch(() => null),
    fetchAllCities(),
  ]);
  const similarResults = (similarRaw?.results ?? []).filter((p) => p.slug !== property.slug);
  const similar = similarResults.slice(0, 10).map(toPropertyCardShape);

  // City/state landing-page links. These pages carry the SEO weight for
  // "houses for rent in X" queries, so every property page must link to them —
  // but only when the target actually resolves (a city with zero active
  // listings 404s), otherwise fall back to the query-param search view.
  const citySlug = cityToSlug(property.city, property.state);
  const cityPageExists = allCities.some((c) => c.slug === citySlug);
  const stateSlug = stateSlugForCode(property.state);
  const statePageExists =
    Boolean(stateSlug) &&
    allCities.some((c) => (c.state || "").toUpperCase() === property.state?.toUpperCase());
  const cityHref = cityPageExists
    ? `/rentals/${citySlug}`
    : `/houses-for-rent?q=${encodeURIComponent(property.city)}`;
  const stateHref = statePageExists
    ? `/rentals/${stateSlug}`
    : `/houses-for-rent?state=${property.state}`;
  const stateName = stateFullName(property.state);

  // Only use real coordinates from the backend — never approximate the pin location.
  const dbLat = Number((property as any).latitude ?? 0);
  const dbLng = Number((property as any).longitude ?? 0);
  const finalLat = dbLat;
  const finalLng = dbLng;

  // Map markers for the detail page map
  const currentMarker: DetailMarker = {
    slug: property.slug,
    title: property.title,
    price: Number(property.price),
    price_label: property.price_label ?? "",
    lat: finalLat,
    lng: finalLng,
    image_url: primaryImage?.image_url ?? null,
    beds: property.bedrooms ?? 0,
    baths: property.bathrooms ?? 0,
    city: property.city,
    state: property.state,
  };
  const nearbyMarkers: DetailMarker[] = similarResults
    .filter((p) => Number.isFinite(Number(p.latitude)) && Number(p.latitude) !== 0)
    .slice(0, 20)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      price: Number(p.price),
      price_label: p.price_label ?? "",
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      image_url: p.primary_image_url ?? null,
      beds: p.bedrooms ?? 0,
      baths: p.bathrooms ?? 0,
      city: p.city,
      state: p.state,
    }));

  // Pet policy: check if any amenity is pet-related
  const allAmenityNames = [
    ...amenityCategories.flatMap((c: any) => c.amenities.map((a: any) => a.name as string)),
    ...(property.amenities ?? []).map((a) => a.name),
  ];
  const isPetFriendly = allAmenityNames.some((n) =>
    /pet|dog|cat|animal/i.test(n)
  );

  const listingLabel =
    property.listing_type === "for-sale" ? "For Sale" :
      property.listing_type === "for-rent" ? "For Rent" : "For Lease";


  const priceDisplay =
    property.listing_type === "for-rent"
      ? formatPrice(property.price, { perMonth: true })
      : formatPrice(property.price);

  const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;

  const createdDate = new Date(property.created_at || Date.now());
  const diffTime = Math.abs(Date.now() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const daysOnMarket = Math.max(1, diffDays);

  const CONDITION_LABELS: Record<string, string> = {
    new: "New Construction",
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
  };

  const agentPhoto = agent?.avatar_url || "/images/default-avatar.png";
  const agencyName = agent?.id === 2 ? "PFG/PENN" : "Hasker & Co. Realty Group";

  // Social proof — only shown when genuinely compelling (real distinct-visitor
  // count from analytics, gated by a minimum so small numbers never appear).
  const MIN_VIEWS_FOR_SOCIAL_PROOF = 12;
  const recentViews = property.recent_view_count ?? 0;
  const showViews = recentViews >= MIN_VIEWS_FOR_SOCIAL_PROOF;

  // Only link a tour that actually exists on this listing — no demo fallback.
  const virtualTourUrl = (property as any).virtual_tour_url || (property as any).tour_360_url || "";

  // Map only renders with real coordinates; otherwise show a neighborhood block.
  const hasCoords = Number.isFinite(currentMarker.lat) && currentMarker.lat !== 0
    && Number.isFinite(currentMarker.lng) && currentMarker.lng !== 0;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://haskerrealtygroup.com" },
      { "@type": "ListItem", position: 2, name: "Properties", item: "https://haskerrealtygroup.com/houses-for-rent" },
      { "@type": "ListItem", position: 3, name: stateName, item: `https://haskerrealtygroup.com${stateHref}` },
      { "@type": "ListItem", position: 4, name: `${property.city}, ${property.state}`, item: `https://haskerrealtygroup.com${cityHref}` },
      {
        "@type": "ListItem",
        position: 5,
        // Use address in breadcrumb so it appears in Google's breadcrumb trail for address searches
        name: property.address
          ? `${property.address}, ${property.city}, ${property.state}`
          : property.title,
        item: `https://haskerrealtygroup.com/houses-for-rent/${decodedSlug}`,
      },
    ],
  };

  const listingSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    // Lead with full address so Google indexes the address as the canonical name of this listing
    name: property.address
      ? `${property.address}, ${property.city}, ${property.state} ${property.zip_code ?? ""}`.trim()
      : property.title,
    alternateName: property.title,
    description: property.description ?? "",
    url: `https://haskerrealtygroup.com/houses-for-rent/${property.slug}`,
    image: images.length > 0
      ? images.map((img) => ({
        "@type": "ImageObject",
        url: toOgImageUrl(img.image_url ?? FALLBACK_IMAGE),
        width: 1200,
        height: 630,
        caption: img.caption ?? property.title,
      }))
      : [{ "@type": "ImageObject", url: FALLBACK_IMAGE, width: 1200, height: 630 }],
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: { "@type": "QuantitativeValue", value: property.sqft, unitCode: "FTK" },
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.zip_code,
      addressCountry: "US",
    },
    ...(Number(currentMarker.lat) !== 0 && {
      geo: {
        "@type": "GeoCoordinates",
        latitude: currentMarker.lat,
        longitude: currentMarker.lng,
      },
    }),
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "USD",
      availability: property.status === "available" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
    datePosted: (property as any).created_at ?? undefined,
    petsAllowed: isPetFriendly,
    amenityFeature: allAmenityNames.slice(0, 20).map((name) => ({
      "@type": "LocationFeatureSpecification",
      name,
      value: true,
    })),
    ...(agent && {
      broker: {
        "@type": "RealEstateAgent",
        name: agent.full_name ?? `${agent.first_name} ${agent.last_name}`,
        ...(agent.email && { email: agent.email }),
        memberOf: {
          "@type": "Organization",
          name: "Hasker & Co. Realty Group",
          url: "https://haskerrealtygroup.com",
        },
      },
    }),
  };

  // Virtual tour → VideoObject so the tour can earn a video thumbnail in search.
  const tourThumb = images[0]?.image_url ? toOgImageUrl(images[0].image_url) : FALLBACK_IMAGE;
  const videoSchema = virtualTourUrl
    ? {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: `Virtual tour — ${property.address ?? property.title}`,
      description: `Take a virtual tour of ${property.address ?? property.title} in ${property.city}, ${property.state}.`,
      thumbnailUrl: [tourThumb],
      uploadDate: (property as any).created_at ?? new Date().toISOString(),
      contentUrl: virtualTourUrl,
      embedUrl: virtualTourUrl,
    }
    : null;

  return (
    <main className="bg-neutral-50/30">
      <PropertyIntentCapture city={property.city} listingType={property.listing_type} />
      <PropertyPageTracker slug={property.slug} price={Number(property.price)} listingType={property.listing_type} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }} />
      {videoSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />
      )}

      {/* ── BREADCRUMBS ── */}
      <div className="pt-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-[13px] text-[#5C5E62] overflow-x-auto whitespace-nowrap">
            <Link href={stateHref} className="hover:text-blue-600 cursor-pointer">
              {stateName}
            </Link>
            <span className="text-neutral-400 font-normal">&gt;</span>
            <Link href={cityHref} className="hover:text-blue-600 cursor-pointer">
              {property.city}
            </Link>
            <span className="text-neutral-400 font-normal">&gt;</span>
            <Link href={`/houses-for-rent?q=${property.zip_code}`} className="hover:text-blue-600 cursor-pointer">
              {property.zip_code}
            </Link>
            {property.neighborhood && (
              <>
                <span className="text-neutral-400 font-normal">&gt;</span>
                <Link href={`/houses-for-rent?q=${encodeURIComponent(property.neighborhood)}`} className="hover:text-blue-600 cursor-pointer font-medium text-neutral-800">
                  {property.neighborhood}
                </Link>
              </>
            )}
            <span className="text-neutral-400 font-normal">&gt;</span>
            <span className="text-[#5C5E62] font-semibold">Details</span>
          </nav>
        </div>

        {/* ── PHOTO GALLERY ──────────────────────────────────────── */}
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
          <div className="relative rounded-xl overflow-hidden shadow-sm">
            <PropertyImageGallery
              images={images}
              title={property.title}
              fallback={FALLBACK_IMAGE}
            />
            {/* 360° tour entry point — overlaid on the gallery so it can't be missed */}
            {virtualTourUrl && <VirtualTourBadge url={virtualTourUrl} />}
          </div>
        </div>

        {/* ── PHOTO GALLERY CONTROLS (below gallery) ── */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button className="bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 text-xs font-bold px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {images.length} photos
            </button>
            {virtualTourUrl && <VirtualTourChip url={virtualTourUrl} />}
          </div>

          <PropertyActionStrip
            propertyId={Number(property.id)}
            propertyTitle={property.title}
            propertyAddress={property.address}
          />
        </div>

        {/* ── PRICE & ADDRESS INFO BAND ── */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-5 pb-6 flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-neutral-100">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-sans text-[28px] sm:text-[36px] font-black tracking-tight text-[#2A2B2D]">
                {formatPrice(property.price)}{property.price_label || ((property.listing_type === "for-rent" || property.listing_type === "for-lease") ? "/month" : "")}
              </span>
              <span className="bg-[#FAF4FF] text-[#6200EE] text-[11px] font-extrabold px-2 py-0.5 rounded border border-[#E8D0FF] uppercase tracking-wider">
                {listingLabel}
              </span>
              <span className="bg-[#E6F4EA] text-[#137333] text-[11px] font-extrabold px-2 py-0.5 rounded border border-[#C2E7C9] uppercase tracking-wider">
                {property.status === "available" ? "Active" : property.status.replace("-", " ")}
              </span>
              {property.is_featured && (
                <span className="bg-brand-light text-brand text-[11px] font-extrabold px-2 py-0.5 rounded border border-brand-muted uppercase tracking-wider">
                  Featured
                </span>
              )}
              {showViews && (
                <span className="bg-[#FFF4E5] text-[#B06000] text-[11.5px] font-bold px-2 py-0.5 rounded border border-[#FFE7C4] uppercase tracking-wide flex items-center gap-1">
                  <Eye size={12} /> {recentViews} views in the last 30 days
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-[20px] sm:text-[22px] font-black text-[#2A2B2D]">
                {property.address}, {property.city}, {property.state} {property.zip_code}
              </h1>
              <div className="flex items-center gap-2 text-[14px]">
                {hasCoords && (
                  <>
                    <a href="#map" className="text-[#1A73E8] hover:underline cursor-pointer font-semibold">View Map</a>
                    <span className="text-neutral-300">|</span>
                  </>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A73E8] hover:underline cursor-pointer font-semibold"
                >
                  Get Directions
                </a>
              </div>
            </div>

            {property.condition === "new" && (
              <div className="mt-3 flex items-center gap-1.5 text-[#C5221F] font-bold text-[13.5px]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                New construction
              </div>
            )}

            {/* Not-available notice */}
            {!isAvailable && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-[13.5px] text-amber-900">
                <Info size={16} className="mt-0.5 shrink-0" />
                <span>
                  This home is currently <strong>{unavailableLabel}</strong>.{" "}
                  <Link href={cityHref} className="font-bold underline">
                    See similar homes in {property.city}
                  </Link>
                </span>
              </div>
            )}

            {/* Key Specs Container — grid on mobile, inline row with separators on desktop */}
            <div className="mt-5 border border-neutral-200/80 bg-neutral-50/50 rounded p-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center sm:gap-y-2 sm:gap-x-5 text-[14px] text-[#4A4B4D]">
              <div className="flex items-center gap-1 font-bold">
                <span>{property.bedrooms}</span> <span className="font-normal text-neutral-500">Bedroom(s)</span>
              </div>
              <span className="hidden sm:inline text-neutral-300">|</span>
              <div className="flex items-center gap-1 font-bold">
                <span>{String(property.bathrooms)}</span> <span className="font-normal text-neutral-500">Full Bath(s)</span>
              </div>
              <span className="hidden sm:inline text-neutral-300">|</span>
              <div className="flex items-center gap-1 font-bold">
                <span>{property.sqft ? formatNumber(property.sqft) : "—"}</span> <span className="font-normal text-neutral-500">Sqft</span>
              </div>
              {property.lot_size ? (
                <>
                  <span className="hidden sm:inline text-neutral-300">|</span>
                  <div className="flex items-center gap-1 font-bold">
                    <span>{formatNumber(Math.round(Number(property.lot_size) * 43560))}</span> <span className="font-normal text-neutral-500">Lot Sqft</span>
                  </div>
                </>
              ) : null}
              <span className="hidden sm:inline text-neutral-300">|</span>
              <div className="flex items-center gap-1 font-bold col-span-2">
                <span className="font-normal text-neutral-500">
                  {property.listing_type === 'for-sale' ? 'Sale' : 'Rental'} - {property.type === 'residential' ? 'Single Family Detached' : property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                </span>
              </div>
              <span className="hidden sm:inline text-neutral-300">|</span>
              
            </div>
          </div>

          {/* Hero CTA card — tour first (softer ask), then apply */}
          <div className="shrink-0 flex flex-col items-stretch gap-2 bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 md:p-5 w-full md:w-auto md:min-w-[280px] self-stretch md:self-auto justify-center">
            <BookTourButton
              label="Book a Free Tour"
              className="w-full px-6 py-3 bg-brand hover:bg-brand-hover text-white text-center text-sm font-bold rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
            />
            <a
              href={`/apply?property=${property.slug}`}
              className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-neutral-900 text-center text-sm font-bold rounded transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Apply Now
            </a>
            <span className="text-[11px] text-neutral-500 text-center">
              24-hour decisions
            </span>
          </div>
        </div>
      </div>

      {/* ── INFO TABS STRIP ── */}
      <PropertyDetailsTabs hasMap={hasCoords} hasVirtualTour={!!virtualTourUrl} />

      {/* ── MAIN BODY ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

          {/* LEFT COLUMN: Main Listing Details */}
          <div className="flex-1 min-w-0 bg-white border border-neutral-200/80 rounded-xl p-6 md:p-8 space-y-10">

            {/* 1. HOME FEATURES */}
            <section id="features" className="relative space-y-5">
              <h2 className="text-[22px] sm:text-[24px] font-black text-[#2A2B2D]">
                Home Features
              </h2>
              {amenityCategories.length > 0 ? (
                <div className="space-y-7">
                  {amenityCategories.map((cat: any) => (
                    <div key={cat.id ?? "other"}>
                      <h3 className="text-[12px] font-black text-[#6A6C70] uppercase tracking-wider mb-3">
                        {cat.name}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-[14px]">
                        {(cat.amenities ?? []).map((a: any) => {
                          const { label, value } = parseAmenity(a.name);
                          const { Icon, iconCls, bgCls } = getAmenityConfig(a.name);
                          return (
                            <div key={a.id} className="flex items-start gap-3 bg-neutral-50/50 border border-neutral-100/80 rounded-lg p-3">
                              <span className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bgCls}`}>
                                <Icon size={15} className={iconCls} />
                              </span>
                              <div className="flex flex-col min-w-0">
                                {label && (
                                  <span className="text-[10px] font-bold text-[#6A6C70] mb-0.5 uppercase tracking-wider">
                                    {label}
                                  </span>
                                )}
                                <span className="text-[#2A2B2D] font-semibold">
                                  {value}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : finalAmenities.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-[14px]">
                  {finalAmenities.map((a: any) => {
                    const { label, value } = parseAmenity(a.name);
                    const { Icon, iconCls, bgCls } = getAmenityConfig(a.name);
                    return (
                      <div key={a.id} className="flex items-start gap-3 bg-neutral-50/50 border border-neutral-100/80 rounded-lg p-3">
                        <span className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bgCls}`}>
                          <Icon size={15} className={iconCls} />
                        </span>
                        <div className="flex flex-col min-w-0">
                          {label && (
                            <span className="text-[10px] font-bold text-[#6A6C70] mb-0.5 uppercase tracking-wider">
                              {label}
                            </span>
                          )}
                          <span className="text-[#2A2B2D] font-semibold">
                            {value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-neutral-500 text-sm">No special features listed.</p>
              )}
            </section>

            {/* 2. PROPERTY DETAILS */}
            <section id="details" className="pt-8 border-t border-neutral-100 relative space-y-6">
              <div>
                <h2 className="text-[22px] sm:text-[24px] font-black text-[#2A2B2D] mb-4">
                  Property Details
                </h2>
                <h3 className="text-[11px] font-black text-[#6A6C70] mb-2 uppercase tracking-wider">
                  About this property
                </h3>
                <p className="text-[#5C5E62] text-[15px] sm:text-[16px] leading-[1.65] whitespace-pre-line">
                  {property.description}
                </p>
              </div>

              <div className="pt-6 border-t border-neutral-100">
                <div className="mb-4">
                  <span className="font-bold text-sm uppercase tracking-wider text-neutral-400">Specifications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-6 text-[15px]">
                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">List Price</div>
                    <div className="text-[#2A2B2D] font-semibold">
                      {formatPrice(property.price)}{property.price_label || ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Listing Status</div>
                    <div className="text-[#2A2B2D] font-semibold capitalize">
                      {property.status === "available" ? listingLabel : property.status.replace("-", " ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Address</div>
                    <div className="text-[#2A2B2D] font-semibold">{property.address}</div>
                  </div>

                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">City</div>
                    <Link href={cityHref} className="text-[#1A73E8] hover:underline cursor-pointer font-bold">
                      {property.city}
                    </Link>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">State</div>
                    <Link href={stateHref} className="text-[#1A73E8] hover:underline cursor-pointer font-bold">
                      {stateName}
                    </Link>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Zip Code</div>
                    <Link href={`/houses-for-rent?q=${property.zip_code}`} className="text-[#1A73E8] hover:underline cursor-pointer font-bold">
                      {property.zip_code}
                    </Link>
                  </div>

                  {property.neighborhood && (
                    <div>
                      <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Neighborhood</div>
                      <Link href={`/houses-for-rent?q=${encodeURIComponent(property.neighborhood)}`} className="text-[#1A73E8] hover:underline cursor-pointer font-bold leading-tight">
                        {property.neighborhood}
                      </Link>
                    </div>
                  )}
                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Property Type</div>
                    <div className="text-[#2A2B2D] font-semibold">
                      {property.listing_type === 'for-sale' ? 'Sale' : 'Rental'} - {property.type === 'residential' ? 'Single Family Detached' : property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Bedroom</div>
                    <div className="text-[#2A2B2D] font-semibold">{property.bedrooms} Bedroom(s)</div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Bath</div>
                    <div className="text-[#2A2B2D] font-semibold">{String(property.bathrooms)} Full Bath(s)</div>
                  </div>

                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Garages</div>
                    <div className="text-[#2A2B2D] font-semibold">{property.garage ? `${property.garage} Garage(s)` : "No Garage"}</div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Stories</div>
                    <div className="text-[#2A2B2D] font-semibold">{property.stories || 1}</div>
                  </div>
                  <div>
                    <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Building Size</div>
                    <div className="text-[#2A2B2D] font-semibold">{property.sqft ? `${formatNumber(property.sqft)} Sqft` : "—"}</div>
                  </div>

                  {property.year_built ? (
                    <div>
                      <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Year Built</div>
                      <div className="text-[#2A2B2D] font-semibold">{property.year_built}</div>
                    </div>
                  ) : null}
                  {property.lot_size ? (
                    <div>
                      <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Lot Size</div>
                      <div className="text-[#2A2B2D] font-semibold">{formatNumber(Math.round(Number(property.lot_size) * 43560))} Sqft ({Number(property.lot_size)} acres)</div>
                    </div>
                  ) : null}

                  {(property as any).cross_street && (
                    <div>
                      <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Cross Street</div>
                      <div className="text-[#2A2B2D] font-semibold">{(property as any).cross_street}</div>
                    </div>
                  )}
                  {(property as any).condition && (
                    <div>
                      <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">Condition</div>
                      <div className="text-[#2A2B2D] font-semibold">
                        {CONDITION_LABELS[(property as any).condition] ?? (property as any).condition}
                      </div>
                    </div>
                  )}
                  {(property as any).tour_360_url && (
                    <div>
                      <div className="text-[12px] font-bold text-[#6A6C70] mb-0.5">3D Home Tour</div>
                      <a href={(property as any).tour_360_url} target="_blank" rel="noopener noreferrer" className="text-[#1A73E8] hover:underline cursor-pointer font-bold block">
                        View 3D Tour
                      </a>
                    </div>
                  )}

                </div>
              </div>
            </section>

            {/* 3. 360 VIEW */}
            {virtualTourUrl && (
              <section id="virtual-tour" className="pt-8 border-t border-neutral-100 space-y-4">
                <h2 className="text-[22px] sm:text-[24px] font-black text-[#2A2B2D]">
                  360 View
                </h2>
                <div className="max-w-2xl">
                  <VirtualTourButton url={virtualTourUrl} thumbnailUrl={primaryImage?.image_url ?? FALLBACK_IMAGE} />
                </div>
              </section>
            )}

            {/* 4. LOCATION MAP */}
            <section id="map" className="pt-8 border-t border-neutral-100 space-y-4">
              <h2 className="text-[22px] sm:text-[24px] font-black text-[#2A2B2D]">
                Locate on the map
              </h2>
              {hasCoords ? (
                <div className="space-y-4">
                  <div className="rounded-xl overflow-hidden border border-neutral-200 h-[380px]">
                    <PropertyDetailMapLoader current={currentMarker} nearby={nearbyMarkers} satellite={true} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${currentMarker.lat},${currentMarker.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-neutral-200 rounded py-2.5 text-center text-[13.5px] font-bold text-[#4A4B4D] hover:bg-neutral-50 transition-colors"
                    >
                      Street view
                    </a>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-neutral-200 rounded py-2.5 text-center text-[13.5px] font-bold text-[#4A4B4D] hover:bg-neutral-50 transition-colors"
                    >
                      Get directions
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-[15px]">
                  <p className="font-semibold text-[#2A2B2D] flex items-center gap-2">
                    <MapPin size={16} className="text-brand shrink-0" />
                    {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city}, {property.state} {property.zip_code}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-[13.5px] font-bold text-[#1A73E8] hover:underline"
                  >
                    Search this address on Google Maps
                  </a>
                </div>
              )}
            </section>

            {/* 5. SIMILAR HOUSES IN THE SAME AREA */}
            {similar.length > 0 && (
              <section className="pt-8 border-t border-neutral-100 space-y-5">
                <div>
                  <h2 className="text-[22px] sm:text-[24px] font-black text-[#2A2B2D]">
                    See More Similar Houses
                  </h2>
                  <p className="text-[13px] text-neutral-500">
                    Houses in the same area and of the same type
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similar.slice(0, 4).map((simProp) => (
                    <Link
                      key={simProp.id}
                      href={`/houses-for-rent/${simProp.slug}`}
                      className="group flex flex-col bg-white border border-neutral-200/80 rounded-xl overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all"
                    >
                      <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
                        {simProp.images && simProp.images.length > 0 ? (
                          <img
                            src={simProp.images[0].url}
                            alt={simProp.title}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
                            <span className="text-neutral-300">No Image</span>
                          </div>
                        )}
                        <span className="absolute top-2 left-2 bg-accent text-neutral-900 text-[10.5px] font-black px-2 py-0.5 rounded">
                          {formatPrice(simProp.price, { perMonth: simProp.listingType === 'for-rent' || simProp.listingType === 'for-lease' })}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-sm text-[#2A2B2D] truncate group-hover:text-[#1A73E8] transition-colors">
                            {simProp.address}
                          </p>
                          <p className="text-neutral-500 text-[11px] mt-0.5 truncate">
                            {simProp.city}, {simProp.state}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100 text-[11px] font-bold text-[#6A6C70]">
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

            {/* 6. BROWSE THE AREA — links into the city/state landing pages */}
            <section className="pt-8 border-t border-neutral-100">
              <h2 className="text-[15px] font-black text-[#2A2B2D] mb-3">
                Keep Browsing
              </h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[14px] font-semibold">
                <Link href={cityHref} className="text-[#1A73E8] hover:underline">
                  All homes for rent in {property.city}, {property.state} →
                </Link>
                <Link href={stateHref} className="text-[#1A73E8] hover:underline">
                  All {stateName} rentals →
                </Link>
              </div>
            </section>

          </div>

          {/* RIGHT COLUMN: Sticky HAR-style Sidebar */}
          <div className="w-full lg:w-[340px] shrink-0 pt-0 lg:pt-0 space-y-6">
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
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-neutral-100 shadow-[0_-6px_24px_rgba(11,31,58,0.10)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-4 pt-2.5">
          <p className="text-[18px] font-black text-[#2A2B2D] leading-none">
            {priceDisplay}
            <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{listingLabel}</span>
          </p>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {property.status === "available" ? "Active" : property.status.replace("-", " ")}
          </span>
        </div>
        <div className="px-4 pt-2 pb-3 grid grid-cols-2 gap-2.5">
          <BookTourButton
            label="Book a Tour"
            withIcon={false}
            className="w-full bg-brand hover:bg-brand-hover text-white rounded-lg py-3 text-sm font-bold transition-colors text-center block cursor-pointer"
          />
          <a
            href={`/apply?property=${property.slug}`}
            className="w-full bg-accent hover:bg-accent-hover text-neutral-900 rounded-lg py-3 text-sm font-bold transition-colors text-center block"
          >
            Apply Now
          </a>
        </div>
      </div>

      {/* Spacer for mobile sticky bar */}
      <div className="lg:hidden h-28" />
    </main>
  );
}

// ── Amenity icon helper ───────────────────────────────────────────────────────
interface AmenityConfig { Icon: LucideIcon; iconCls: string; bgCls: string; }

function getAmenityConfig(name: string): AmenityConfig {
  const n = name.toLowerCase();
  if (/granite|quartz|counter|island|kitchen|dishwasher|utensil|cook/.test(n))
    return { Icon: Utensils, iconCls: "text-orange-600", bgCls: "bg-orange-100" };
  if (/refrigerator|fridge/.test(n))
    return { Icon: Refrigerator, iconCls: "text-orange-600", bgCls: "bg-orange-100" };
  if (/microwave/.test(n))
    return { Icon: Microwave, iconCls: "text-orange-600", bgCls: "bg-orange-100" };
  if (/stove|range|oven/.test(n))
    return { Icon: Flame, iconCls: "text-rose-600", bgCls: "bg-rose-100" };
  if (/fireplace/.test(n))
    return { Icon: Flame, iconCls: "text-red-600", bgCls: "bg-red-100" };
  if (/stainless|appliance/.test(n))
    return { Icon: Refrigerator, iconCls: "text-orange-600", bgCls: "bg-orange-100" };
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
    return { Icon: Wifi, iconCls: "text-violet-600", bgCls: "bg-violet-100" };
  if (/pool|swim/.test(n))
    return { Icon: Waves, iconCls: "text-blue-600", bgCls: "bg-blue-100" };
  if (/garage|parking|car/.test(n))
    return { Icon: Car, iconCls: "text-slate-600", bgCls: "bg-slate-100" };
  if (/yard|fence|patio|outdoor|garden|balcony/.test(n))
    return { Icon: Fence, iconCls: "text-green-600", bgCls: "bg-green-100" };
  if (/tree|park|trail|walk|nature/.test(n))
    return { Icon: TreePine, iconCls: "text-emerald-600", bgCls: "bg-emerald-100" };
  if (/gym|fitness|dumbbell|workout/.test(n))
    return { Icon: Dumbbell, iconCls: "text-amber-600", bgCls: "bg-amber-100" };
  if (/gated|security|guard|camera|alarm/.test(n))
    return { Icon: Shield, iconCls: "text-red-600", bgCls: "bg-red-100" };
  if (/pet|dog|cat|animal/.test(n))
    return { Icon: PawPrint, iconCls: "text-teal-600", bgCls: "bg-teal-100" };
  if (/gas/.test(n))
    return { Icon: Flame, iconCls: "text-rose-600", bgCls: "bg-rose-100" };
  if (/hoa|community|club/.test(n))
    return { Icon: Home, iconCls: "text-indigo-600", bgCls: "bg-indigo-100" };
  return { Icon: CheckCircle2, iconCls: "text-brand", bgCls: "bg-brand/10" };
}
