"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ChevronRight, ShieldCheck, Calendar } from "lucide-react";
import { ActiveSpecialModal } from "./ActiveSpecialModal";
import { trackClick } from "@/lib/telemetry";

// Opens the shared <PropertyTourModal> mounted on the property page.
const openTour = (slug: string) => {
  trackClick("book_tour", { slug });
  window.dispatchEvent(new Event("pfh:open-tour"));
};

interface PropertyLeadCTAsProps {
  mode: "banner" | "sidebar" | "mobile-sticky";
  propertyId: number;
  propertySlug: string;
  propertyTitle: string;
  propertyPrice: number;
  propertyCity: string;
  /** When false (home rented/sold/etc.), show "browse similar / notify me" instead of Apply/Tour. */
  available?: boolean;
}

// Opens the shared callback/notify modal (FloatingCallbackButton listens for this).
const openNotify = (city: string) => {
  trackClick("notify_similar", { city });
  window.dispatchEvent(new Event("pfh:open-callback"));
};

export function PropertyLeadCTAs({
  mode,
  propertyId,
  propertySlug,
  propertyTitle,
  propertyPrice,
  propertyCity,
  available = true,
}: PropertyLeadCTAsProps) {
  const [specialOpen, setSpecialOpen] = useState(false);

  const browseHref = `/houses-for-rent?q=${encodeURIComponent(propertyCity || "")}`;

  // ── Home no longer available — redirect intent to similar homes ─────────────
  if (!available && mode === "sidebar") {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-neutral-100 border border-neutral-200 p-4 text-center">
          <p className="text-sm font-bold text-brand-dark">This home is no longer available</p>
          <p className="text-xs text-neutral-500 mt-1 leading-snug">
            It&apos;s been taken — but we can help you find a similar place{propertyCity ? ` in ${propertyCity}` : ""}.
          </p>
        </div>
        <Link
          href={browseHref}
          onClick={() => trackClick("browse_similar", { city: propertyCity })}
          className="w-full flex items-center justify-center gap-1.5 h-13 py-3.5 bg-brand hover:bg-brand-hover text-white text-sm font-bold rounded-xl shadow-lg shadow-brand/15 transition-all cursor-pointer"
        >
          Browse similar homes <ChevronRight size={16} />
        </Link>
        <button
          onClick={() => openNotify(propertyCity)}
          className="w-full flex items-center justify-center h-13 py-3.5 border-2 border-brand-dark/90 text-brand-dark hover:bg-brand-dark hover:text-white text-sm font-bold rounded-xl transition-all cursor-pointer bg-white"
        >
          Notify me of new listings
        </button>
      </div>
    );
  }

  if (!available && mode === "mobile-sticky") {
    return (
      <div className="flex items-center gap-2.5 w-full">
        <button
          onClick={() => openNotify(propertyCity)}
          className="flex-1 h-12 border-2 border-brand-dark text-brand-dark text-sm font-bold rounded-xl flex items-center justify-center hover:bg-brand-dark hover:text-white transition-all cursor-pointer bg-white"
        >
          Notify me
        </button>
        <Link
          href={browseHref}
          onClick={() => trackClick("browse_similar", { city: propertyCity })}
          className="flex-1 h-12 bg-brand text-white text-sm font-bold rounded-xl flex items-center justify-center hover:bg-brand-hover transition-colors cursor-pointer shadow-md shadow-brand/20"
        >
          Browse similar
        </Link>
      </div>
    );
  }

  if (mode === "banner") {
    return (
      <>
        <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-4 sm:p-5 hover:shadow-sm transition-shadow duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 border border-amber-500/20">
                <Sparkles size={17} />
              </div>
              <div>
                <h4 className="font-serif text-sm sm:text-base font-bold text-brand-dark flex items-center gap-2">
                  Exclusive Rent Special Active
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                </h4>
                <p className="text-xs text-neutral-500 mt-1 leading-normal max-w-xl">
                  Get your <strong className="text-brand-dark font-semibold">first month&apos;s rent FREE</strong> on qualifying rentals. Limited time — offer ends soon.
                </p>
              </div>
            </div>

            <button
              onClick={() => { trackClick("special_offer_open", { slug: propertySlug }); setSpecialOpen(true); }}
              className="shrink-0 bg-brand hover:bg-brand-hover text-white text-xs font-bold py-3 px-5 rounded-xl transition-all shadow-md shadow-brand/10 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              Claim Special Offer
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <ActiveSpecialModal
          open={specialOpen}
          onClose={() => setSpecialOpen(false)}
          propertyId={propertyId}
          propertySlug={propertySlug}
          propertyTitle={propertyTitle}
          propertyCity={propertyCity}
        />
      </>
    );
  }

  if (mode === "sidebar") {
    return (
      <div className="space-y-3">
        {/* Trust badge */}
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100/80 rounded-xl p-3.5 text-xs text-emerald-800">
          <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
          <div className="leading-snug">
            <span className="font-bold">Instant Pre-Screening:</span> Qualify online in 30s. No hard credit checks.
          </div>
        </div>

        {/* Book a Tour — primary (opens the tour modal) */}
        <button
          onClick={() => openTour(propertySlug)}
          className="w-full flex items-center justify-center gap-2 h-13 py-3.5 bg-brand hover:bg-brand-hover text-white text-sm font-bold rounded-xl shadow-lg shadow-brand/15 hover:shadow-brand/25 transition-all cursor-pointer"
        >
          <Calendar size={16} /> Book a Tour
        </button>

        {/* Apply Now — secondary */}
        <Link
          href={`/apply?property=${propertySlug}`}
          onClick={() => trackClick("apply_now", { slug: propertySlug, where: "sidebar" })}
          className="w-full flex items-center justify-center h-13 py-3.5 border-2 border-brand-dark/90 text-brand-dark hover:bg-brand-dark hover:text-white text-sm font-bold rounded-xl transition-all cursor-pointer bg-white"
        >
          Apply Now
        </Link>

        <p className="text-[10px] text-center text-neutral-400">
          Guideline: Monthly Gross Income ≥ 3x rent (${(propertyPrice * 3).toLocaleString()}/mo)
        </p>
      </div>
    );
  }

  if (mode === "mobile-sticky") {
    return (
      <div className="flex items-stretch gap-3 w-full">
        {/* Book a Tour — low-commitment option (opens the tour modal) */}
        <button
          onClick={() => openTour(propertySlug)}
          className="flex-1 h-13 px-3 border-2 border-brand-dark text-brand-dark text-[15px] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-brand-dark hover:text-white active:scale-[0.98] transition-all cursor-pointer bg-white"
        >
          <Calendar size={17} /> Book Tour
        </button>

        {/* Apply Now — primary conversion, given more visual weight */}
        <Link
          href={`/apply?property=${propertySlug}`}
          onClick={() => trackClick("apply_now", { slug: propertySlug, where: "mobile_sticky" })}
          className="flex-[1.25] h-13 px-3 bg-brand text-white text-[15px] font-bold rounded-xl flex items-center justify-center gap-1 hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-brand/25"
        >
          Apply Now <ChevronRight size={17} />
        </Link>
      </div>
    );
  }

  return null;
}
