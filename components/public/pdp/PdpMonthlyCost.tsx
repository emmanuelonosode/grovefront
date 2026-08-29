import { Info } from "lucide-react";
import type { MonthlyCostBreakdown } from "@/lib/propertyDetail";
import { formatMoney } from "@/lib/propertyDetail";

/**
 * The real cost of living here, itemised from the `fees` feed.
 *
 * Every figure comes from the listing data. Nothing is estimated, which is why
 * there is an explicit note about what the total leaves out rather than an
 * invented utilities line.
 */
export function PdpMonthlyCost({
  cost,
  priceLabel,
}: {
  cost: MonthlyCostBreakdown;
  priceLabel: string;
}) {
  const required = cost.charges.filter((c) => c.required);
  const optional = cost.charges.filter((c) => !c.required);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
      <div>
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Monthly charges for this home</caption>
          <tbody>
            <tr className="border-b border-[#dee3e9]">
              <th scope="row" className="py-4 pr-4 align-top font-normal">
                <span className="block text-[16px] font-bold leading-[1.5] tracking-[-0.16px] text-[#0a1317]">
                  Base rent
                </span>
              </th>
              <td className="py-4 text-right align-top text-[16px] font-bold leading-[1.5] tracking-[-0.16px] text-[#0a1317] tabular-nums whitespace-nowrap">
                ${formatMoney(cost.baseRent)}
              </td>
            </tr>

            {required.map((charge) => (
              <tr key={charge.title} className="border-b border-[#dee3e9]">
                <th scope="row" className="py-4 pr-4 align-top font-normal">
                  <span className="block text-[16px] leading-[1.5] tracking-[-0.16px] text-[#1c1e21]">
                    {charge.title}
                  </span>
                  {charge.description && charge.description !== charge.title && (
                    <span className="mt-1 block max-w-[46ch] text-[14px] leading-[1.43] tracking-[-0.14px] text-[#5d6c7b]">
                      {charge.description}
                    </span>
                  )}
                </th>
                <td className="py-4 text-right align-top text-[16px] leading-[1.5] tracking-[-0.16px] text-[#1c1e21] tabular-nums whitespace-nowrap">
                  ${formatMoney(charge.amount)}
                </td>
              </tr>
            ))}

            {optional.map((charge) => (
              <tr key={charge.title} className="border-b border-[#dee3e9]">
                <th scope="row" className="py-4 pr-4 align-top font-normal">
                  <span className="block text-[16px] leading-[1.5] tracking-[-0.16px] text-[#1c1e21]">
                    {charge.title}{" "}
                    <span className="ml-1 rounded-[8px] bg-[#f1f4f7] px-2 py-0.5 align-middle text-[12px] font-bold leading-[1.33] text-[#5d6c7b]">
                      Optional
                    </span>
                  </span>
                  {charge.description && charge.description !== charge.title && (
                    <span className="mt-1 block max-w-[46ch] text-[14px] leading-[1.43] tracking-[-0.14px] text-[#5d6c7b]">
                      {charge.description}
                    </span>
                  )}
                </th>
                <td className="py-4 text-right align-top text-[16px] leading-[1.5] tracking-[-0.16px] text-[#5d6c7b] tabular-nums whitespace-nowrap">
                  ${formatMoney(charge.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lg:pt-4">
        <div className="rounded-[8px] bg-[#0a1317] p-8 text-white">
          <p className="text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-[#ced0d4]">
            Billed monthly
          </p>
          <p className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[36px] font-medium leading-[1.28] tabular-nums">
              ${formatMoney(cost.requiredTotal)}
            </span>
            <span className="text-[16px] leading-[1.5] text-[#ced0d4]">{priceLabel || "/mo"}</span>
          </p>
          <p className="mt-4 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#ced0d4]">
            Base rent plus the {required.length} required monthly{" "}
            {required.length === 1 ? "charge" : "charges"} listed.
          </p>
        </div>

        <p className="mt-5 flex gap-2.5 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#5d6c7b]">
          <Info size={16} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
          <span>
            Utilities, the security deposit and any pet rent are billed separately and are not
            included in this figure.
          </span>
        </p>
      </div>
    </div>
  );
}
