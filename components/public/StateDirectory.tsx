"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, ArrowRight, MapPin } from "lucide-react";
import { CITIES, type DirectoryCity } from "@/lib/cities";
import { STATE_NAMES, stateSlugForCode } from "@/lib/states";

interface Props {
  cities: DirectoryCity[];
  /** Live listing counts keyed by city slug (optional — used for totals and city ordering). */
  counts?: Record<string, number>;
}

interface StateGroup {
  code: string;
  name: string;
  slug: string;
  cities: DirectoryCity[];
  totalHomes: number;
  /** Landmark/skyline photo — taken from the state's best curated city page. */
  image: string;
}

/** Prefer a curated city's skyline photo (distinctive landmark) over the generic default. */
function pickStateImage(stateCities: DirectoryCity[]): string {
  const curated = stateCities.find((c) => CITIES[c.slug]?.heroImage);
  // heroImage is already a card-sized rendition (see toDirectoryCities).
  return curated ? curated.heroImage : stateCities[0]?.heroImage ?? "";
}

/**
 * Card-based state directory for the homepage: one card per state with live
 * inventory, top cities, and a link to the state hub. A search box filters by
 * state or city name. All links are in the server-rendered HTML (client
 * component ≠ client-only render), so crawlability is preserved.
 */
export function StateDirectory({ cities, counts = {} }: Props) {
  const [query, setQuery] = useState("");

  const states = useMemo<StateGroup[]>(() => {
    const seen = new Set<string>();
    const groups = new Map<string, StateGroup>();

    for (const city of cities) {
      if (!city.slug || seen.has(city.slug)) continue;
      seen.add(city.slug);
      const code = city.stateCode?.toUpperCase();
      if (!code || !STATE_NAMES[code]) continue;
      if (!groups.has(code)) {
        groups.set(code, {
          code,
          name: STATE_NAMES[code],
          slug: stateSlugForCode(code),
          cities: [],
          totalHomes: 0,
          image: "",
        });
      }
      const g = groups.get(code)!;
      g.cities.push(city);
      g.totalHomes += counts[city.slug] ?? 0;
    }

    for (const g of groups.values()) {
      g.cities.sort(
        (a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0) || a.name.localeCompare(b.name)
      );
      g.image = pickStateImage(g.cities);
    }

    // Most inventory first, then most cities, then alphabetical.
    return [...groups.values()].sort(
      (a, b) => b.totalHomes - a.totalHomes || b.cities.length - a.cities.length || a.name.localeCompare(b.name)
    );
  }, [cities, counts]);

  const q = query.trim().toLowerCase();
  const visible = q
    ? states.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase() === q ||
          s.cities.some((c) => c.name.toLowerCase().includes(q))
      )
    : states;

  if (states.length === 0) return null;

  return (
    <section id="all-cities" className="bg-background border-t border-outline-variant/40">
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-16 md:py-24">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <p className="text-[14px] font-semibold tracking-widest uppercase text-primary mb-2">
              Browse Every Market
            </p>
            <h2 className="font-serif font-semibold text-primary leading-tight text-[28px] md:text-[40px]">
              Houses for rent by state
            </h2>
            <p className="mt-3 text-[18px] leading-7 text-on-surface-variant">
              Pick a state to see every city we serve — transparent pricing, pet-friendly
              options, and 24-hour application decisions.
            </p>
          </div>

          {/* State / city search */}
          <div className="relative w-full md:w-auto md:min-w-[320px] shrink-0">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search state or city..."
              aria-label="Search rentals by state or city"
              className="block w-full h-12 pl-10 pr-9 rounded-lg border border-outline-variant bg-surface text-[15px] text-on-surface placeholder-outline outline-none shadow-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((state) => {
              // When searching by city, surface the matching cities first.
              const matched = q
                ? state.cities.filter((c) => c.name.toLowerCase().includes(q))
                : [];
              const rest = q ? state.cities.filter((c) => !matched.includes(c)) : state.cities;
              const topCities = [...matched, ...rest].slice(0, 4);
              const moreCount = state.cities.length - topCities.length;

              // The card is a <div>, not one big <Link>: each city chip is its
              // own crawlable anchor to /rentals/[city], and nesting <a> in <a>
              // is invalid HTML that browsers break apart unpredictably.
              return (
                <div
                  key={state.code}
                  className="group flex flex-col bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] border border-surface-variant hover:-translate-y-1 transition-transform duration-300"
                >
                  {/* Landmark photo header — links to the state hub */}
                  <Link href={`/rentals/${state.slug}`} className="relative block h-64 w-full overflow-hidden bg-surface-container">
                    {state.image && (
                      <Image
                        src={state.image}
                        alt={`Homes for rent in ${state.name}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent" />
                    <span className="absolute top-4 right-4 rounded-full bg-surface px-3 py-1 text-[14px] font-bold tracking-wide text-primary shadow-sm">
                      {state.code}
                    </span>
                    <div className="absolute bottom-4 left-4 right-4 text-on-primary">
                      <h3 className="font-serif font-semibold text-[24px] leading-8 mb-1 drop-shadow-md">
                        {state.name}
                      </h3>
                      <p className="text-[16px] leading-6 opacity-90">
                        {state.totalHomes > 0 ? `${state.totalHomes} home${state.totalHomes === 1 ? "" : "s"} for rent · ` : ""}
                        {state.cities.length} {state.cities.length === 1 ? "city" : "cities"}
                      </p>
                    </div>
                  </Link>

                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div className="flex flex-wrap gap-2 mb-6">
                      {topCities.map((city) => (
                        <Link
                          key={city.slug}
                          href={`/rentals/${city.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low border border-outline-variant/30 rounded-full text-on-surface text-[14px] hover:bg-earth-beige hover:border-earth-beige transition-colors"
                        >
                          <MapPin size={15} className="text-outline shrink-0" />
                          {city.name}
                          {counts[city.slug] ? (
                            <span className="font-semibold ml-0.5 tabular-nums">{counts[city.slug]}</span>
                          ) : null}
                        </Link>
                      ))}
                      {moreCount > 0 && (
                        <Link
                          href={`/rentals/${state.slug}`}
                          className="inline-flex items-center px-3 py-1.5 bg-surface-variant/50 border border-transparent rounded-full text-outline text-[14px] hover:bg-surface-variant transition-colors"
                        >
                          +{moreCount} more
                        </Link>
                      )}
                    </div>

                    <Link
                      href={`/rentals/${state.slug}`}
                      className="mt-auto pt-4 flex items-center justify-between w-full border-t border-surface-variant text-[14px] tracking-[0.05em] font-semibold text-primary hover:text-forest-deep transition-colors"
                    >
                      <span>View all {state.name} rentals</span>
                      <ArrowRight size={18} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-8 text-center">
            <p className="text-[15px] font-semibold text-on-surface">
              No state or city matches “{query}”.
            </p>
            <p className="mt-1 text-[13px] text-on-surface-variant">
              Try a state name like “Texas” or a city like “Atlanta” — or{" "}
              <Link href="/houses-for-rent" className="text-primary font-semibold hover:underline">
                browse all rentals
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
