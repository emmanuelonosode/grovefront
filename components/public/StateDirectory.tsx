"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, ArrowRight, MapPin } from "lucide-react";
import { CITIES, type CityData } from "@/lib/cities";
import { STATE_NAMES, stateSlugForCode } from "@/lib/states";

interface Props {
  cities: CityData[];
  /** Live listing counts keyed by city slug (optional — used for totals and city ordering). */
  counts?: Record<string, number>;
}

interface StateGroup {
  code: string;
  name: string;
  slug: string;
  cities: CityData[];
  totalHomes: number;
  /** Landmark/skyline photo — taken from the state's best curated city page. */
  image: string;
}

/** Prefer a curated city's skyline photo (distinctive landmark) over the generic default. */
function pickStateImage(stateCities: CityData[]): string {
  const curated = stateCities.find((c) => CITIES[c.slug]?.heroImage);
  const src = curated ? CITIES[curated.slug].heroImage : stateCities[0]?.heroImage ?? "";
  // Card-sized rendition — the source URLs are w=1600 hero images.
  return src.replace("w=1600", "w=800");
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
    <section id="all-cities" className="bg-white border-t border-[#F1F5F9]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-brand mb-3">
              Browse every market
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark leading-tight">
              Houses for rent by state
            </h2>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-[#475569]">
              Pick a state to see every city we serve — transparent pricing, pet-friendly
              options, and 24-hour application decisions.
            </p>
          </div>

          {/* State / city search */}
          <div className="relative w-full md:w-[300px] shrink-0">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search state or city…"
              aria-label="Search rentals by state or city"
              className="w-full h-11 pl-10 pr-9 rounded-lg border border-neutral-200 bg-white text-[14px] text-neutral-800 placeholder-neutral-400 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {visible.map((state) => {
              // When searching by city, surface the matching cities first.
              const matched = q
                ? state.cities.filter((c) => c.name.toLowerCase().includes(q))
                : [];
              const rest = q ? state.cities.filter((c) => !matched.includes(c)) : state.cities;
              const topCities = [...matched, ...rest].slice(0, 4);
              const moreCount = state.cities.length - topCities.length;

              // The card is a <div>, not one big <Link>: each city chip is its
              // own crawlable anchor to /rentals/[city] (they used to be plain
              // spans — zero link equity), and nesting <a> inside <a> is
              // invalid HTML that browsers break apart unpredictably.
              return (
                <div
                  key={state.code}
                  className="group flex flex-col rounded-2xl border border-neutral-200 bg-white overflow-hidden transition-all duration-200 hover:border-brand hover:shadow-[0_14px_40px_rgba(0,82,255,0.14)] hover:-translate-y-1"
                >
                  {/* Landmark photo header — links to the state hub */}
                  <Link href={`/rentals/${state.slug}`} className="relative block h-40 overflow-hidden bg-neutral-100">
                    {state.image && (
                      <Image
                        src={state.image}
                        alt={`Homes for rent in ${state.name}`}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/10 to-transparent" />
                    <span className="absolute top-3 right-3 rounded-md bg-white/90 px-2 py-1 text-[12px] font-black tracking-wide text-brand-dark">
                      {state.code}
                    </span>
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="font-serif text-[22px] font-bold text-white leading-tight" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}>
                        {state.name}
                      </h3>
                      <p className="text-[13px] font-medium text-white/85" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
                        {state.totalHomes > 0 ? `${state.totalHomes} home${state.totalHomes === 1 ? "" : "s"} for rent · ` : ""}
                        {state.cities.length} {state.cities.length === 1 ? "city" : "cities"}
                      </p>
                    </div>
                  </Link>

                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex flex-wrap gap-2">
                      {topCities.map((city) => (
                        <Link
                          key={city.slug}
                          href={`/rentals/${city.slug}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-[13.5px] text-[#3F4650] hover:border-brand hover:text-brand hover:bg-brand-light transition-colors"
                        >
                          <MapPin size={12} className="text-brand/60 shrink-0" />
                          {city.name}
                          {counts[city.slug] ? (
                            <span className="tabular-nums font-semibold text-brand">{counts[city.slug]}</span>
                          ) : null}
                        </Link>
                      ))}
                      {moreCount > 0 && (
                        <Link
                          href={`/rentals/${state.slug}`}
                          className="inline-flex items-center rounded-full bg-neutral-50 border border-neutral-200 px-3 py-1.5 text-[13.5px] text-neutral-400 hover:border-brand hover:text-brand transition-colors"
                        >
                          +{moreCount} more
                        </Link>
                      )}
                    </div>

                    <Link
                      href={`/rentals/${state.slug}`}
                      className="mt-auto pt-4 flex items-center justify-between text-[14.5px] font-bold text-brand hover:underline"
                    >
                      View all {state.name} rentals
                      <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-8 text-center">
            <p className="text-[15px] font-semibold text-neutral-700">
              No state or city matches “{query}”.
            </p>
            <p className="mt-1 text-[13px] text-neutral-500">
              Try a state name like “Texas” or a city like “Atlanta” — or{" "}
              <Link href="/houses-for-rent" className="text-brand font-semibold hover:underline">
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
