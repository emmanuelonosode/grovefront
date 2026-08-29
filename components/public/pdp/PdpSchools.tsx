import { ExternalLink } from "lucide-react";
import type { SchoolEntry } from "@/lib/propertyDetail";

/**
 * Nearby schools from the listing feed, nearest first.
 * Ratings are deliberately not shown: the feed carries none, and GreatSchools
 * is where that lives, so each row links out instead of implying a score.
 */
export function PdpSchools({ schools, city }: { schools: SchoolEntry[]; city: string }) {
  return (
    <>
      <ul className="border-t border-[#dee3e9]">
        {schools.map((school) => {
          const inner = (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold leading-[1.5] tracking-[-0.16px] text-[#0a1317] group-hover:text-[#0064e0]">
                  {school.name}
                  {school.url && (
                    <ExternalLink
                      size={13}
                      strokeWidth={2}
                      aria-hidden="true"
                      className="ml-1.5 inline-block shrink-0 align-[-1px] text-[#8595a4]"
                    />
                  )}
                </span>
                <span className="mt-1 block text-[14px] leading-[1.43] tracking-[-0.14px] text-[#5d6c7b]">
                  {school.level}
                  {school.grades ? ` · Grades ${school.grades}` : ""}
                </span>
              </span>
              {school.distance !== null && (
                <span className="shrink-0 text-right text-[14px] leading-[1.43] tracking-[-0.14px] text-[#5d6c7b] tabular-nums">
                  {school.distance} mi
                </span>
              )}
            </>
          );

          return (
            <li key={`${school.name}-${school.grades}`} className="border-b border-[#dee3e9]">
              {school.url ? (
                <a
                  href={school.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="group flex items-start gap-6 py-5"
                >
                  {inner}
                </a>
              ) : (
                <div className="flex items-start gap-6 py-5">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-5 max-w-[70ch] text-[14px] leading-[1.43] tracking-[-0.14px] text-[#5d6c7b]">
        Distances are straight-line from the property. School assignment in {city} is set by the
        district and can change, so confirm the catchment with the district before you apply.
      </p>
    </>
  );
}
