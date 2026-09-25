"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PropertyCard } from "@/components/public/PropertyCard";
import type { Property } from "@/types";

interface Props {
  properties: Property[];
  totalCount: number | null;
}

type Tab = "all" | "for-rent" | "for-sale";

export function FeaturedPropertiesSection({ properties, totalCount }: Props) {
  const [tab, setTab] = useState<Tab>("all");

  const forRent = properties.filter((p) => p.listingType === "for-rent");
  const forSale = properties.filter((p) => p.listingType === "for-sale");

  const shown = tab === "all" ? properties : tab === "for-rent" ? forRent : forSale;
  const display = shown.length > 0 ? shown : properties;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all",      label: "All homes", count: properties.length },
    { id: "for-rent", label: "For rent",  count: forRent.length },
    { id: "for-sale", label: "For sale",  count: forSale.length },
  ];

  const viewAllHref =
    tab === "for-rent" ? "/houses-for-rent?listing_type=for-rent" :
    tab === "for-sale" ? "/houses-for-rent?listing_type=for-sale" :
    "/houses-for-rent";

  return (
    <section className="bg-white px-4 py-20 md:px-12 md:py-24">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-accent">Move-in ready</p>
            <h2 className="mt-3 font-serif text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-brand-dark md:text-[38px]">
              Available rentals this week.
            </h2>
            {totalCount != null && (
              <p className="mt-4 text-[16px] leading-relaxed text-on-surface-variant md:text-[17px]">
                {totalCount.toLocaleString()} homes listed — inspected, maintained, and ready for you.
              </p>
            )}
          </div>
          <Link
            href="/houses-for-rent"
            className="group inline-flex shrink-0 items-center gap-1.5 text-[15px] font-semibold text-brand-dark hover:text-accent"
          >
            Browse all rentals <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Tabs — only when the grid actually mixes rentals and sales */}
        {forRent.length > 0 && forSale.length > 0 && (
          <div role="tablist" aria-label="Filter homes" className="mb-8 inline-flex gap-1 rounded-full bg-brand-light p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition-colors ${
                  tab === t.id ? "bg-brand text-white" : "text-on-surface-variant hover:text-brand-dark"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                    tab === t.id ? "bg-white/20 text-white" : "bg-white text-on-surface-variant"
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Property grid */}
        {display.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {display.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href={viewAllHref}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-7 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Browse all available homes
                {totalCount != null && (
                  <span className="font-normal text-white/60 tabular-nums">{totalCount.toLocaleString()}</span>
                )}
                <ArrowRight size={16} />
              </Link>
              <p className="mt-4 text-[14px] text-on-surface-variant">
                Ready to apply?{" "}
                <Link href="/apply" className="font-semibold text-brand-dark underline-offset-4 hover:text-accent hover:underline">
                  Start your application
                </Link>
              </p>
            </div>
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="font-serif text-[18px] font-bold text-brand-dark">New listings coming soon.</p>
            <p className="mt-2 text-[15px] text-on-surface-variant">Check back shortly or browse all available rentals.</p>
          </div>
        )}
      </div>
    </section>
  );
}
