"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyCard } from "./PropertyCard";
import type { Property } from "@/types";

/**
 * Swipeable horizontal row of property cards (for "nearby homes").
 * Native scroll-snap on touch; hover arrows on desktop. Reuses PropertyCard.
 */
export function PropertiesCarousel({ properties }: { properties: Property[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  function scrollBy(dir: number) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.9, 640), behavior: "smooth" });
  }

  if (!properties.length) return null;

  return (
    <div className="relative group/row">
      <div
        ref={scroller}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: "none" }}
      >
        {properties.map((p) => (
          <div key={p.id} className="w-[280px] sm:w-[300px] shrink-0 snap-start">
            <PropertyCard property={p} />
          </div>
        ))}
      </div>

      {/* Arrows — desktop, appear on hover */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        aria-label="Scroll left"
        className="hidden lg:flex absolute -left-4 top-[40%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-neutral-200 items-center justify-center text-brand-dark opacity-0 group-hover/row:opacity-100 hover:bg-neutral-50 transition-opacity cursor-pointer"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
        className="hidden lg:flex absolute -right-4 top-[40%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-neutral-200 items-center justify-center text-brand-dark opacity-0 group-hover/row:opacity-100 hover:bg-neutral-50 transition-opacity cursor-pointer"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
