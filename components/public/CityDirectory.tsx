import Link from "next/link";
import { MapPin } from "lucide-react";
import type { DirectoryCity } from "@/lib/cities";
import { STATE_NAMES } from "@/lib/states";

interface Props {
  cities: DirectoryCity[];
  /** Live listing counts keyed by city slug (optional — shown next to each city). */
  counts?: Record<string, number>;
  heading?: string;
  intro?: string;
}

/**
 * Server-rendered, fully crawlable directory of every city landing page, grouped
 * by state. This is the internal-linking hub that lets Google discover and pass
 * authority to all `/rentals/[city]` pages — the engine for ranking
 * "houses for rent in [city]" nationally. Plain links, no client JS.
 */
export function CityDirectory({ cities, counts = {}, heading, intro }: Props) {
  // De-dupe by slug, then group by full state name.
  const seen = new Set<string>();
  const groups = new Map<string, DirectoryCity[]>();

  for (const city of cities) {
    if (!city.slug || seen.has(city.slug)) continue;
    seen.add(city.slug);
    const stateName = STATE_NAMES[city.stateCode] ?? city.state ?? city.stateCode ?? "Other";
    if (!groups.has(stateName)) groups.set(stateName, []);
    groups.get(stateName)!.push(city);
  }

  // Sort states by number of cities (most inventory first), then alphabetically.
  const orderedStates = [...groups.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0])
  );
  if (orderedStates.length === 0) return null;

  return (
    <section id="all-cities" className="bg-white border-t border-[#F1F5F9]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="mb-10">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
            Browse every market
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark leading-tight">
            {heading ?? "Houses for rent by city & state"}
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#475569]">
            {intro ??
              "Find affordable houses and apartments for rent in every city we serve. Browse move-in ready rentals by location — transparent pricing, pet-friendly options, and 24-hour application decisions."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
          {orderedStates.map(([stateName, stateCities]) => {
            const sorted = [...stateCities].sort((a, b) => {
              const ca = counts[a.slug] ?? 0;
              const cb = counts[b.slug] ?? 0;
              return cb - ca || a.name.localeCompare(b.name);
            });
            return (
              <div key={stateName}>
                <h3 className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-[0.12em] text-brand-dark mb-3 pb-2 border-b border-[#F1F5F9]">
                  <MapPin size={13} className="text-brand shrink-0" />
                  Houses for Rent in {stateName}
                </h3>
                <ul className="space-y-1.5">
                  {sorted.map((city) => {
                    const n = counts[city.slug];
                    return (
                      <li key={city.slug}>
                        <Link
                          href={`/rentals/${city.slug}`}
                          className="group flex items-baseline justify-between gap-2 text-[14px] text-[#475569] hover:text-brand transition-colors"
                        >
                          <span className="group-hover:underline">
                            {city.name}, {city.stateCode}
                          </span>
                          {n ? (
                            <span className="shrink-0 text-[11px] tabular-nums text-neutral-400">
                              {n}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
