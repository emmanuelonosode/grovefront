"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BedDouble, DollarSign } from "lucide-react";
import { looksNaturalLanguage, parseSmartQuery } from "@/lib/properties";

const BED_OPTIONS = [
  { label: "Beds", value: "" },
  { label: "2+ Beds", value: "2" },
  { label: "3+ Beds", value: "3" },
  { label: "4+ Beds", value: "4" },
];

const PRICE_OPTIONS = [
  { label: "Price", min: "", max: "" },
  { label: "$1k – $2k", min: "1000", max: "2000" },
  { label: "$2k – $3k", min: "2000", max: "3000" },
  { label: "$3k+", min: "3000", max: "" },
];

export function HeroSearch() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [beds, setBeds] = useState("");
  const [priceIdx, setPriceIdx] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const term = location.trim();

    // Smart path: parse natural-language queries into structured filters.
    if (term && looksNaturalLanguage(term)) {
      setAiLoading(true);
      const smart = await parseSmartQuery(term);
      setAiLoading(false);
      if (smart) {
        if (!smart.listing_type) smart.listing_type = "for-rent";
        const p = new URLSearchParams();
        Object.entries(smart).forEach(([k, v]) => { if (v) p.set(k, v); });
        router.push(`/homes-for-rent?${p.toString()}`);
        return;
      }
    }

    const params = new URLSearchParams();
    params.set("listing_type", "for-rent");
    if (term) params.set("q", term);
    if (beds) params.set("beds", beds);
    const price = PRICE_OPTIONS[priceIdx];
    if (price.min) params.set("min_price", price.min);
    if (price.max) params.set("max_price", price.max);
    router.push(`/homes-for-rent?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="max-w-4xl mx-auto bg-surface rounded-xl shadow-lg p-2 flex flex-col md:flex-row items-center gap-2"
    >
      {/* Location */}
      <div className="flex-1 w-full flex items-center px-4 py-3 bg-surface-container-lowest rounded-lg border border-surface-variant focus-within:border-primary transition-colors">
        <Search size={20} className="text-outline mr-3 shrink-0" />
        <input
          type="text"
          placeholder="City, Neighborhood, or Zip"
          value={location}
          autoComplete="off"
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 outline-none text-[16px] text-on-surface placeholder-on-surface-variant/70 p-0 min-w-0"
        />
      </div>

      {/* Beds + Price */}
      <div className="w-full md:w-auto flex gap-2">
        <div className="flex-1 flex items-center px-4 py-3 bg-surface-container-lowest rounded-lg border border-surface-variant">
          <BedDouble size={18} className="text-outline mr-2 shrink-0" />
          <select
            value={beds}
            onChange={(e) => setBeds(e.target.value)}
            aria-label="Bedrooms"
            className="w-full bg-transparent border-none focus:ring-0 outline-none text-[16px] text-on-surface p-0 cursor-pointer"
          >
            {BED_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex items-center px-4 py-3 bg-surface-container-lowest rounded-lg border border-surface-variant">
          <DollarSign size={18} className="text-outline mr-2 shrink-0" />
          <select
            value={priceIdx}
            onChange={(e) => setPriceIdx(Number(e.target.value))}
            aria-label="Price range"
            className="w-full bg-transparent border-none focus:ring-0 outline-none text-[16px] text-on-surface p-0 cursor-pointer"
          >
            {PRICE_OPTIONS.map((o, i) => (
              <option key={o.label} value={i}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={aiLoading}
        className="w-full md:w-auto bg-primary text-on-primary font-semibold text-[14px] tracking-[0.05em] px-8 py-4 rounded-lg hover:bg-primary-container transition-colors shadow-md active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-70"
      >
        {aiLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {aiLoading ? "Thinking…" : "Search Homes"}
      </button>
    </form>
  );
}
