"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, ArrowLeft, ArrowRight, Images } from "lucide-react";

interface Img {
  id: string | number;
  image_url: string | null;
  caption?: string | null;
}

interface Props {
  images: Img[];
  title: string;
  fallback: string;
}

const FALLBACK = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";

/** Media rows are stored with mixed hosts; normalise everything onto the media host. */
function toBackendUrl(url: string | null, fallbackUrl: string): string {
  if (!url) return fallbackUrl || FALLBACK;
  if (url.startsWith("/media/")) return "https://admin.primefamilyhousing.com" + url;
  if (url.startsWith("https://primefamilyhousing.com/media/")) {
    return url.replace("https://primefamilyhousing.com/media/", "https://admin.primefamilyhousing.com/media/");
  }
  return url;
}

/** Floorplan scans read as broken photography in a hero mosaic, so they sort last. */
function isFloorplan(url: string | null, caption?: string | null): boolean {
  if (!url) return false;
  const str = (url + " " + (caption || "")).toLowerCase();
  return ["floorplan", "floor-plan", "schematic", "layout"].some((k) => str.includes(k));
}

export function PdpGallery({ images, title, fallback }: Props) {
  const sorted = [...(images || [])].sort(
    (a, b) => Number(isFloorplan(a.image_url, a.caption)) - Number(isFloorplan(b.image_url, b.caption)),
  );
  const all = sorted.length > 0 ? sorted : [{ id: "fb", image_url: fallback || FALLBACK }];

  const [lightbox, setLightbox] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  const prev = useCallback(() => setLightbox((c) => (c === null ? null : c === 0 ? all.length - 1 : c - 1)), [all.length]);
  const next = useCallback(() => setLightbox((c) => (c === null ? null : c === all.length - 1 ? 0 : c + 1)), [all.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, prev, next]);

  const onRailScroll = useCallback(() => {
    const el = railRef.current;
    if (el) setSlide(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const scrollTo = useCallback((i: number) => {
    const el = railRef.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }, []);

  const mosaic = all.slice(0, 5);

  return (
    <>
      {/* Desktop: photography IS the surface treatment, no card chrome, 32px rounding. */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[420px] lg:h-[500px]">
        <button
          type="button"
          onClick={() => setLightbox(0)}
          aria-label={`Open photo gallery, ${all.length} photos`}
          className="col-span-2 row-span-2 relative overflow-hidden rounded-[8px] bg-[#f1f4f7] cursor-pointer group"
        >
          <img
            src={toBackendUrl(mosaic[0].image_url, fallback)}
            alt={mosaic[0].caption ?? `${title}, main photo`}
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        </button>

        {mosaic.slice(1, 5).map((img, i) => (
          <button
            type="button"
            key={img.id ?? i}
            onClick={() => setLightbox(i + 1)}
            aria-label={`Open photo ${i + 2} of ${all.length}`}
            className={[
              "relative overflow-hidden bg-[#f1f4f7] cursor-pointer group",
              i === 1 ? "rounded-[8px]" : "",
              i === 3 ? "rounded-[8px]" : "",
              i === 0 || i === 2 ? "rounded-[8px]" : "",
            ].join(" ")}
          >
            <img
              src={toBackendUrl(img.image_url, fallback)}
              alt={img.caption ?? `${title}, photo ${i + 2}`}
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          </button>
        ))}

        {all.length > 1 && (
          <button
            type="button"
            onClick={() => setLightbox(0)}
            className="absolute bottom-6 right-6 z-10 inline-flex items-center gap-2 rounded-[8px] bg-white px-[22px] py-[10px] text-[14px] font-bold tracking-[-0.14px] text-[#0a1317] shadow-[rgba(20,22,26,0.3)_0px_1px_4px_0px] transition-transform active:scale-[0.98] cursor-pointer"
          >
            <Images size={16} strokeWidth={2} />
            All {all.length} photos
          </button>
        )}
      </div>

      {/* Mobile: swipe rail. Full-bleed, 4:3. The photo is the whole first impression. */}
      <div className="md:hidden relative -mx-4">
        <div
          ref={railRef}
          onScroll={onRailScroll}
          className="pdp-rail flex overflow-x-auto snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {all.map((img, i) => (
            <button
              type="button"
              key={img.id ?? i}
              onClick={() => setLightbox(i)}
              aria-label={`Open photo ${i + 1} of ${all.length}`}
              className="relative w-full shrink-0 snap-center aspect-[4/3] bg-[#f1f4f7]"
            >
              <img
                src={toBackendUrl(img.image_url, fallback)}
                alt={img.caption ?? `${title}, photo ${i + 1}`}
                fetchPriority={i === 0 ? "high" : "auto"}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {all.length > 1 && (
          <>
            {slide > 0 && (
              <button
                type="button"
                onClick={() => scrollTo(slide - 1)}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 text-[#1c1e21] flex items-center justify-center shadow-[rgba(20,22,26,0.3)_0px_1px_4px_0px]"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            {slide < all.length - 1 && (
              <button
                type="button"
                onClick={() => scrollTo(slide + 1)}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 text-[#1c1e21] flex items-center justify-center shadow-[rgba(20,22,26,0.3)_0px_1px_4px_0px]"
              >
                <ArrowRight size={18} />
              </button>
            )}
            <span className="absolute bottom-3 right-4 rounded-[8px] bg-[#0a1317]/80 px-[10px] py-1 text-[12px] font-bold leading-[1.33] text-white">
              {slide + 1} / {all.length}
            </span>
          </>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photo gallery`}
          className="fixed inset-0 z-[9999] flex flex-col bg-[#0a1317]"
        >
          <div className="shrink-0 flex items-center justify-between gap-4 px-4 sm:px-8 py-4">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-white">{title}</p>
              <p className="text-[12px] leading-[1.33] text-[#8595a4]">
                Photo {lightbox + 1} of {all.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close gallery"
              className="w-10 h-10 shrink-0 rounded-full bg-white/10 text-white flex items-center justify-center transition-colors hover:bg-white/20 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center px-4 pb-2 min-h-0">
            <img
              src={toBackendUrl(all[lightbox].image_url, fallback)}
              alt={all[lightbox].caption ?? `${title}, photo ${lightbox + 1}`}
              className="max-w-full max-h-full object-contain rounded-[8px]"
            />
            {all.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous photo"
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next photo"
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ArrowRight size={20} />
                </button>
              </>
            )}
          </div>

          {all.length > 1 && (
            <div className="pdp-rail shrink-0 flex gap-2 overflow-x-auto px-4 sm:px-8 py-4">
              {all.map((img, i) => (
                <button
                  type="button"
                  key={img.id ?? i}
                  onClick={() => setLightbox(i)}
                  aria-label={`View photo ${i + 1}`}
                  aria-current={i === lightbox}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-[8px] transition-opacity cursor-pointer ${
                    i === lightbox ? "opacity-100 ring-2 ring-white" : "opacity-45 hover:opacity-80"
                  }`}
                >
                  <img
                    src={toBackendUrl(img.image_url, fallback)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
