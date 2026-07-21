"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AUTOPLAY_MS = 6000;

/**
 * Full-bleed hero background carousel: crossfades through the images,
 * auto-advances, and supports swipe + arrow/dot navigation. Fills its
 * nearest positioned ancestor (render inside an absolutely-positioned wrap).
 */
export function HeroCarousel({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchX = useRef<number | null>(null);

  const goTo = useCallback(
    (i: number) => setIndex(((i % images.length) + images.length) % images.length),
    [images.length]
  );

  // Autoplay — restarted whenever the user navigates so it never fights a
  // manual choice. Skipped entirely for prefers-reduced-motion users.
  const restartAutoplay = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % images.length), AUTOPLAY_MS);
  }, [images.length]);

  useEffect(() => {
    restartAutoplay();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [restartAutoplay]);

  const navigate = (i: number) => {
    goTo(i);
    restartAutoplay();
  };

  return (
    <div
      className="absolute inset-0"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) navigate(index + (dx < 0 ? 1 : -1));
      }}
    >
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          aria-hidden={i !== index}
          fill
          className={`object-cover object-center transition-opacity duration-1000 ${
            i === index ? "opacity-90" : "opacity-0"
          }`}
          sizes="100vw"
          priority={i === 0}
          fetchPriority={i === 0 ? "high" : "auto"}
        />
      ))}

      {/* Arrows */}
      <button
        type="button"
        aria-label="Previous photo"
        onClick={() => navigate(index - 1)}
        className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-forest-deep/35 text-white/90 backdrop-blur-sm hover:bg-forest-deep/60 transition-colors cursor-pointer"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        aria-label="Next photo"
        onClick={() => navigate(index + 1)}
        className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 items-center justify-center rounded-full bg-forest-deep/35 text-white/90 backdrop-blur-sm hover:bg-forest-deep/60 transition-colors cursor-pointer"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Go to photo ${i + 1}`}
            aria-current={i === index}
            onClick={() => navigate(i)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
              i === index ? "w-6 bg-earth-beige" : "w-2 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
