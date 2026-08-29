"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FaqItem {
  q: string;
  a: string;
}

/** Accordion FAQ. Answers stay in the DOM so the FAQPage JSON-LD matches what's rendered. */
export function PdpFaq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="rounded-[8px] border border-[#dee3e9] bg-white">
            <h3>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`pdp-faq-panel-${i}`}
                className="flex w-full cursor-pointer items-center justify-between gap-4 p-6 text-left"
              >
                <span className="text-[18px] font-bold leading-[1.44] text-[#0a1317]">{item.q}</span>
                <ChevronDown
                  size={20}
                  strokeWidth={2}
                  aria-hidden="true"
                  className={`shrink-0 text-[#5d6c7b] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
            </h3>
            <div
              id={`pdp-faq-panel-${i}`}
              hidden={!isOpen}
              className="px-6 pb-6 pt-0 text-[16px] leading-[1.5] tracking-[-0.16px] text-[#444950]"
            >
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
