"use client";

import { trackClick } from "@/lib/telemetry";
import { formatNumber } from "@/lib/utils";

interface Props {
  slug: string;
  price: number;
  priceLabel: string;
}

/**
 * Mobile checkout bar. Per the design system's PDP collapse rule, the purchase
 * summary becomes a sticky bottom bar below 1024px.
 */
export function PdpMobileBar({ slug, price, priceLabel }: Props) {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dee3e9] bg-white px-4 pt-3 shadow-[rgba(20,22,26,0.3)_0px_-1px_4px_0px] lg:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-center gap-4">
        <p className="shrink-0 text-[18px] font-bold leading-[1.44] text-[#0a1317]">
          ${formatNumber(price)}
          <span className="text-[12px] font-normal text-[#5d6c7b]">{priceLabel || "/mo"}</span>
        </p>

        {/* One action in the persistent bar, and it mirrors the page's primary
            CTA. "Schedule a tour" stays one tap away in the lead panel under
            the hero, so the bar never carries two intents in a space that fits
            one. */}
        <a
          href={`/apply?property=${slug}`}
          onClick={() => trackClick("apply_now", { slug, where: "mobile_bar" })}
          className="flex flex-1 items-center justify-center whitespace-nowrap rounded-[8px] bg-[#0064e0] px-6 py-[14px] text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-white transition-transform active:scale-[0.98]"
        >
          Apply now
        </a>
      </div>
    </div>
  );
}
