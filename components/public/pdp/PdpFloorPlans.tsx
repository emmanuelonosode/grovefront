"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { PropertyFloorPlanAPI } from "@/lib/properties";

/** Floor plan scans, opened full size in an overlay. */
export function PdpFloorPlans({ plans, address }: { plans: PropertyFloorPlanAPI[]; address: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const usable = plans.filter((p) => p.image_url);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (usable.length === 0) return null;

  return (
    <>
      <ul className={`grid gap-5 ${usable.length > 1 ? "sm:grid-cols-2" : "max-w-2xl"}`}>
        {usable.map((plan, i) => (
          <li key={plan.image_url}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Enlarge floor plan ${i + 1} of ${usable.length}`}
              className="block w-full cursor-pointer overflow-hidden rounded-[8px] border border-[#dee3e9] bg-white p-3 transition-colors hover:border-[#8595a4]"
            >
              <img
                src={plan.thumbnail_url || plan.image_url}
                alt={`Floor plan ${i + 1} for ${address}`}
                loading="lazy"
                decoding="async"
                className="h-56 w-full object-contain"
              />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Floor plan ${open + 1} for ${address}`}
          className="fixed inset-0 z-[9999] flex flex-col bg-[#0a1317]"
          onClick={() => setOpen(null)}
        >
          <div className="flex shrink-0 items-center justify-between px-4 py-4 sm:px-8">
            <p className="text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-white">
              Floor plan {open + 1} of {usable.length}
            </p>
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Close floor plan"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
            <img
              src={usable[open].image_url}
              alt={`Floor plan ${open + 1} for ${address}`}
              className="max-h-full max-w-full rounded-[8px] bg-white object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
