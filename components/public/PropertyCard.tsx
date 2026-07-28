"use client";

import Link from "next/link";
import Image from "next/image";
import { Bed, Bath, Maximize, Home } from "lucide-react";
import { CardImageCarousel } from "@/components/public/CardImageCarousel";
import { formatPrice, formatNumber, toCardImageUrl } from "@/lib/utils";
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

  const isRental = property.listingType === "for-rent" || property.listingType === "for-lease";

  const detailHref = `/houses-for-rent/${property.slug}`;

  // ─── Horizontal variant ────────────────────────────────────────────
  if (variant === "horizontal") {
    return (
      <article className="group flex bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-neutral-300 transition-all duration-200">
        {/* Image */}
        <div className="relative w-36 sm:w-52 shrink-0 overflow-hidden bg-neutral-100">
          <Link href={detailHref} className="absolute inset-0 z-0 block" tabIndex={-1} aria-hidden="true" />
          {primaryImage ? (
            <Image
              src={toCardImageUrl(primaryImage.url)}
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
        </div>

        {/* Body */}
        <Link href={detailHref} className="flex flex-col justify-between p-4 flex-1 min-w-0">
          <div className="min-w-0">
            <p className="font-bold text-[1.2rem] text-neutral-900 leading-none mb-2">
              {isRental
                ? formatPrice(property.price, { perMonth: true })
                : formatPrice(property.price, { compact: true })}
            </p>
            <div className="flex items-center gap-3 text-[13px] text-neutral-500 mb-2">
              <span className="flex items-center gap-1"><Bed size={14} className="text-brand" /><span className="font-bold text-neutral-900">{property.bedrooms}</span> bed</span>
              <span className="flex items-center gap-1"><Bath size={14} className="text-brand" /><span className="font-bold text-neutral-900">{property.bathrooms}</span> bath</span>
              <span className="flex items-center gap-1"><Maximize size={13} className="text-brand" /><span className="font-bold text-neutral-900">{formatNumber(property.sqft)}</span> sqft</span>
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

        {/* Specs — segmented stat strip so beds/baths/sqft read at a glance */}
        <div className="grid grid-cols-3 mt-2.5 rounded-lg border border-neutral-100 bg-neutral-50/70 divide-x divide-neutral-100 text-center">
          <div className="py-2 px-1">
            <div className="flex items-center justify-center gap-1.5">
              <Bed size={15} className="text-brand shrink-0" />
              <span className="text-[15px] font-bold text-neutral-900 leading-none">
                {property.bedrooms === 0 ? "Studio" : property.bedrooms}
              </span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mt-1">Beds</p>
          </div>
          <div className="py-2 px-1">
            <div className="flex items-center justify-center gap-1.5">
              <Bath size={15} className="text-brand shrink-0" />
              <span className="text-[15px] font-bold text-neutral-900 leading-none">{property.bathrooms}</span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mt-1">Baths</p>
          </div>
          <div className="py-2 px-1">
            <div className="flex items-center justify-center gap-1.5">
              <Maximize size={14} className="text-brand shrink-0" />
              <span className="text-[15px] font-bold text-neutral-900 leading-none">
                {property.sqft > 0 ? formatNumber(property.sqft) : "—"}
              </span>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mt-1">Sqft</p>
          </div>
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

      {/* Available Now on the bottom */}
      {isRental && (
        <div className="px-4 pb-4">
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[12px] font-bold px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
            Available Now
          </span>
        </div>
      )}
    </article>
  );
}
