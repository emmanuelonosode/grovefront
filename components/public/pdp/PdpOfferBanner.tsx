import { Tag } from "lucide-react";
import type { PropertyLeasingSpecialAPI } from "@/lib/properties";
import { formatShortDate } from "@/lib/propertyDetail";

/**
 * Live concession on this home. The API only returns offers that are running
 * today, so anything rendered here is genuinely claimable.
 */
export function PdpOfferBanner({ offer }: { offer: PropertyLeasingSpecialAPI }) {
  // The feed writes the offer as "Special offer: Get $500 off...". The prefix is
  // noise once it sits inside something already labelled as an offer.
  const headline = offer.title.replace(/^special offers?:\s*/i, "").trim();
  const endsOn = formatShortDate(offer.ends_on);

  return (
    <div className="rounded-[8px] border border-[#f7b928] bg-[#fff8e6] p-5">
      <p className="flex items-start gap-2.5 text-[16px] font-bold leading-[1.5] tracking-[-0.16px] text-[#0a1317]">
        <Tag size={17} strokeWidth={2.25} aria-hidden="true" className="mt-0.5 shrink-0" />
        <span>{headline}</span>
      </p>
      {endsOn && (
        <p className="mt-2 pl-[27px] text-[14px] leading-[1.43] tracking-[-0.14px] text-[#444950]">
          Apply by {endsOn} to claim it. Offer subject to approval and may change.
        </p>
      )}
    </div>
  );
}
