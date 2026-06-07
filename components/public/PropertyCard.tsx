"use client";

import Link from "next/link";
import Image from "next/image";
import { Bed, Bath, Maximize, Home, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { FavoriteButton } from "@/components/public/FavoriteButton";
import { CardImageCarousel } from "@/components/public/CardImageCarousel";
import { formatPrice, formatNumber } from "@/lib/utils";
import type { Property } from "@/types";

interface PropertyCardProps {
  property: Property;
  variant?: "default" | "compact" | "horizontal";
}


export function PropertyCard({ property, variant = "default" }: PropertyCardProps) {
  const primaryImage = property.images.find((i) => i.isPrimary) ?? property.images[0];
  // Primary first, then the rest — feeds the swipeable card carousel.
  const galleryImages = [...property.images]
    .sort((a, b) => (a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1))
    .map((i) => i.url)
    .filter(Boolean);

  const listingBadgeVariant =
    property.listingType === "for-sale"
      ? "sale"
      : property.listingType === "for-rent"
      ? "rent"
      : "accent";

  const listingLabel =
    property.listingType === "for-sale"
      ? "For Sale"
      : property.listingType === "for-rent"
      ? "For Rent"
      : "For Lease";

  const isRental = property.listingType === "for-rent" || property.listingType === "for-lease";

  const detailHref = `/houses-for-rent/${property.slug}`;
  const applyHref  = `/apply?property=${property.slug}`;

  // ─── Horizontal variant ────────────────────────────────────────────
  if (variant === "horizontal") {
    return (
      <article className="group flex bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all duration-200">
        {/* Image */}
        <div className="relative w-36 sm:w-52 shrink-0 overflow-hidden bg-neutral-100">
          <Link href={detailHref} className="absolute inset-0 z-0 block" tabIndex={-1} aria-hidden="true" />
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="208px"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Home size={24} className="text-neutral-300" />
            </div>
          )}
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none flex gap-1.5">
            <Badge variant={listingBadgeVariant}>{listingLabel}</Badge>
          </div>
        </div>

        {/* Body */}
        <Link href={detailHref} className="flex flex-col justify-between p-4 flex-1 min-w-0">
          <div className="min-w-0">
            <p className="font-bold text-[1.2rem] text-neutral-900 leading-none mb-2">
              {isRental
                ? formatPrice(property.price, { perMonth: true })
                : formatPrice(property.price, { compact: true })}
            </p>
            <div className="flex items-center gap-1 text-[12px] text-neutral-500 mb-2">
              <span className="font-medium text-neutral-700">{property.bedrooms}</span> bed
              <span className="text-neutral-300 mx-1">·</span>
              <span className="font-medium text-neutral-700">{property.bathrooms}</span> bath
              <span className="text-neutral-300 mx-1">·</span>
              <span className="font-medium text-neutral-700">{formatNumber(property.sqft)}</span> sqft
            </div>
            <p className="text-[12px] text-neutral-500 truncate">
              {property.address}, {property.city}, {property.state}
            </p>
          </div>
        </Link>
      </article>
    );
  }

  // ─── Default / compact variant ─────────────────────────────────────
  return (
    <article className="group flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-neutral-300 transition-all duration-200">

      {/* Image — swipeable carousel */}
      <div className="relative aspect-[3/2] overflow-hidden bg-neutral-100">
        {galleryImages.length > 0 ? (
          <CardImageCarousel
            images={galleryImages}
            alt={property.title}
            href={detailHref}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <Link href={detailHref} className="flex h-full w-full items-center justify-center" aria-label={`View ${property.title}`}>
            <Home size={36} className="text-neutral-300" />
          </Link>
        )}

        {/* Badges — non-interactive, pointer-events-none */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5 pointer-events-none">
          <Badge variant={listingBadgeVariant}>{listingLabel}</Badge>
          {property.isFeatured && <Badge variant="featured">Featured</Badge>}
          {property.status === "under-contract" && (
            <Badge variant="under-contract">Under Contract</Badge>
          )}
        </div>

        {/* Favorite — z-10, fully interactive, independent of card link */}
        <div className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/95 shadow-sm flex items-center justify-center">
          <FavoriteButton propertyId={Number(property.id)} size={16} className="min-w-0 min-h-0" />
        </div>

        {/* Available pill */}
        {isRental && (
          <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0" />
              Available
            </span>
          </div>
        )}
      </div>

      {/* Info — linked to property detail */}
      <Link href={detailHref} className="flex flex-col p-4 flex-1 min-w-0">

        {/* Price — most important, shown first */}
        <p className="font-bold text-[1.35rem] leading-none text-neutral-900">
          {isRental
            ? formatPrice(property.price, { perMonth: true })
            : formatPrice(property.price, { compact: true })}
          {isRental && (
            <span className="text-[0.8rem] font-normal text-neutral-400 ml-1">/mo</span>
          )}
        </p>

        {/* Specs — with icons so the numbers are unmistakable */}
        <div className="flex items-center gap-3.5 text-[13px] text-neutral-600 mt-2">
          <span className="flex items-center gap-1">
            <Bed size={15} className="text-neutral-400" />
            <span className="font-semibold text-neutral-700">
              {property.bedrooms === 0 ? "Studio" : property.bedrooms}
            </span>
            {property.bedrooms !== 0 && <span className="text-neutral-500">bed</span>}
          </span>
          <span className="flex items-center gap-1">
            <Bath size={15} className="text-neutral-400" />
            <span className="font-semibold text-neutral-700">{property.bathrooms}</span>
            <span className="text-neutral-500">bath</span>
          </span>
          {property.sqft > 0 && (
            <span className="flex items-center gap-1">
              <Maximize size={14} className="text-neutral-400" />
              <span className="font-semibold text-neutral-700">{formatNumber(property.sqft)}</span>
              <span className="text-neutral-500">sqft</span>
            </span>
          )}
        </div>

        {/* Address */}
        <p className="text-[13px] text-neutral-500 truncate mt-2">
          {property.address}
        </p>
        <p className="text-[12px] text-neutral-400 truncate mt-0.5">
          {property.neighborhood
            ? `${property.neighborhood} · ${property.city}, ${property.state}`
            : `${property.city}, ${property.state} ${property.zip}`}
        </p>
      </Link>

      {/* CTAs — Book Tour + Apply Now (identical to the search-results card) */}
      <div className="px-4 pb-4 flex gap-2">
        <Link
          href={`${detailHref}#schedule-form`}
          className="flex-1 flex items-center justify-center gap-1.5 py-3 border-2 border-brand-dark/80 text-brand-dark hover:bg-brand-dark hover:text-white text-[12px] font-bold rounded-lg transition-colors duration-150"
        >
          <Calendar size={12} /> Book Tour
        </Link>
        {isRental && (
          <Link
            href={applyHref}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-brand hover:bg-brand-hover text-white text-[12px] font-bold rounded-lg transition-colors duration-150"
          >
            Apply Now <ArrowRight size={11} />
          </Link>
        )}
      </div>
    </article>
  );
}
