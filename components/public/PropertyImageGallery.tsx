"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Grid3x3, ZoomIn, ShieldCheck, MapPin } from "lucide-react";

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

function toBackendUrl(url: string | null, fallbackUrl: string): string {
  if (!url) return fallbackUrl || FALLBACK;
  if (url.startsWith("/media/")) {
    return "https://admin.primefamilyhousing.com" + url;
  }
  if (url.startsWith("https://primefamilyhousing.com/media/")) {
    return url.replace("https://primefamilyhousing.com/media/", "https://admin.primefamilyhousing.com/media/");
  }
  return url;
}

function isFloorplan(url: string | null, caption?: string | null): boolean {
  if (!url) return false;
  const str = (url + " " + (caption || "")).toLowerCase();
  return str.includes("floorplan") || str.includes("floor-plan") || str.includes("schematic") || str.includes("layout");
}

export function PropertyImageGallery({ images, title, fallback }: Props) {
  // Sort real photos first so floorplans don't dominate the top 5 hero mosaic
  const sortedImages = [...(images || [])].sort((a, b) => {
    const aFp = isFloorplan(a.image_url, a.caption) ? 1 : 0;
    const bFp = isFloorplan(b.image_url, b.caption) ? 1 : 0;
    return aFp - bFp;
  });

  const allImages = sortedImages.length > 0 ? sortedImages : [{ id: "fb", image_url: fallback || FALLBACK }];
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);

  const prev = useCallback(() => {
    setLightboxIdx((curr) => {
      if (curr === null) return null;
      return curr === 0 ? allImages.length - 1 : curr - 1;
    });
  }, [allImages.length]);

  const next = useCallback(() => {
    setLightboxIdx((curr) => {
      if (curr === null) return null;
      return curr === allImages.length - 1 ? 0 : curr + 1;
    });
  }, [allImages.length]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIdx, prev, next]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setCurrentSlide(idx);
  }, []);

  const scrollToSlide = useCallback((idx: number) => {
    scrollRef.current?.scrollTo({ left: idx * scrollRef.current.clientWidth, behavior: "smooth" });
  }, []);

  const primary = allImages[0];
  const gallery = allImages.slice(0, 5);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs">
      {/* ── DESKTOP: MOSAIC HERO GRID ── */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[460px] lg:h-[520px] p-2 bg-slate-900/5">
        
        {/* Large Main Feature Photo */}
        <div
          className="col-span-2 row-span-2 relative h-full w-full overflow-hidden rounded-xl cursor-pointer group bg-slate-200"
          onClick={() => openLightbox(0)}
        >
          <img
            src={toBackendUrl(primary.image_url, fallback)}
            alt={primary.caption ?? title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
            <span className="text-white text-xs font-semibold flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg">
              <ZoomIn size={14} /> View full photo gallery
            </span>
          </div>
        </div>

        {/* 4 Supporting Mosaic Photos */}
        {gallery.slice(1, 5).map((img, i) => (
          <div
            key={img.id || i}
            className="relative h-full w-full overflow-hidden rounded-xl cursor-pointer group bg-slate-200"
            onClick={() => openLightbox(i + 1)}
          >
            <img
              src={toBackendUrl(img.image_url, fallback)}
              alt={img.caption ?? `${title} photo ${i + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
            
            {/* View All Photos Overlay Badge on 4th thumbnail */}
            {i === 3 && allImages.length > 5 && (
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-1 text-white font-bold text-sm hover:bg-slate-950/80 transition-colors">
                <Grid3x3 size={20} className="text-blue-400" />
                <span>+{allImages.length - 5} More Photos</span>
              </div>
            )}
          </div>
        ))}

        {/* Floating View All Button */}
        {allImages.length > 1 && (
          <button
            onClick={() => openLightbox(0)}
            className="absolute bottom-5 right-5 hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg hover:bg-white hover:text-blue-600 transition-all z-10 cursor-pointer border border-slate-200"
          >
            <Grid3x3 size={15} className="text-blue-600" /> View All {allImages.length} Photos
          </button>
        )}
      </div>

      {/* ── MOBILE: TOUCH SWIPE CAROUSEL ── */}
      <div className="md:hidden relative bg-slate-950">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
          {allImages.map((img, i) => (
            <div
              key={img.id || i}
              className="relative w-screen shrink-0 snap-center aspect-[4/3] bg-slate-900"
              onClick={() => openLightbox(i)}
            >
              <img
                src={toBackendUrl(img.image_url, fallback)}
                alt={img.caption ?? title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Prev arrow */}
        {allImages.length > 1 && currentSlide > 0 && (
          <button
            onClick={() => scrollToSlide(currentSlide - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-10"
            aria-label="Previous photo"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {/* Next arrow */}
        {allImages.length > 1 && currentSlide < allImages.length - 1 && (
          <button
            onClick={() => scrollToSlide(currentSlide + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-10"
            aria-label="Next photo"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Slide counter */}
        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-bold">
          {currentSlide + 1} / {allImages.length}
        </div>
      </div>

      {/* ── LIGHTBOX MODAL ── */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col"
          onClick={closeLightbox}
        >
          {/* Header */}
          <div
            className="shrink-0 flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white">
              <p className="text-sm font-bold truncate">{title}</p>
              <p className="text-xs text-slate-400">Photo {lightboxIdx + 1} of {allImages.length}</p>
            </div>
            <button
              onClick={closeLightbox}
              className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Main Full View Photo */}
          <div
            className="flex-1 relative flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={toBackendUrl(allImages[lightboxIdx].image_url, fallback)}
              alt={allImages[lightboxIdx].caption ?? title}
              className="max-w-full max-h-[82vh] object-contain rounded-lg shadow-2xl"
            />

            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {allImages.length > 1 && (
            <div
              className="shrink-0 flex gap-2 px-6 py-3.5 overflow-x-auto bg-slate-900/90 border-t border-slate-800"
              onClick={(e) => e.stopPropagation()}
              style={{ scrollbarWidth: "none" } as React.CSSProperties}
            >
              {allImages.map((img, i) => (
                <button
                  key={img.id || i}
                  onClick={() => setLightboxIdx(i)}
                  className={`relative w-16 h-12 shrink-0 rounded-lg overflow-hidden transition-all cursor-pointer ${
                    i === lightboxIdx ? "ring-2 ring-blue-500 scale-105" : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={toBackendUrl(img.image_url, fallback)}
                    alt={`${title} thumb ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
