"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toCardImageUrl } from "@/lib/utils";

interface Props {
  images: string[];
  alt: string;
  href: string;
  /** sizes attr for the <Image> — tune per card layout */
  sizes?: string;
}

/**
 * Swipeable image gallery for property cards.
 * - Native horizontal swipe on touch (CSS scroll-snap)
 * - Hover arrows on desktop
 * - Dot indicators
 * - Tapping a slide navigates to `href`; dragging swipes (browser-native)
 */
export function CardImageCarousel({ images, alt, href, sizes = "(max-width:640px) 100vw, (max-width:1024px) 50vw, 20vw" }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <Link href={href} aria-label={alt} className="flex h-full w-full items-center justify-center bg-neutral-100">
        <span className="text-neutral-400 text-xs">No photo</span>
      </Link>
    );
  }

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  function go(dir: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const el = scroller.current;
    if (!el) return;
    const next = Math.max(0, Math.min(images.length - 1, active + dir));
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    setActive(next);
  }

  const multiple = images.length > 1;

  const [isHovering, setIsHovering] = useState(false);
  const [peeking, setPeeking] = useState(false);

  useEffect(() => {
    if (!multiple) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        // Pause briefly after appearing before wiggling
        setTimeout(() => {
          setPeeking(true);
          setTimeout(() => setPeeking(false), 300);
        }, 600);
      }
    }, { threshold: 0.6 });
    if (scroller.current) observer.observe(scroller.current);
    return () => observer.disconnect();
  }, [multiple]);

  useEffect(() => {
    if (!multiple || !isHovering) return;
    const interval = setInterval(() => {
      const el = scroller.current;
      if (!el) return;
      const next = (active + 1) % images.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
      setActive(next);
    }, 1800); // Faster slide when hovered
    return () => clearInterval(interval);
  }, [multiple, isHovering, active, images.length]);

  return (
    <div 
      className="absolute inset-0 group/car"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        {images.map((src, i) => (
          <Link key={i} href={href} aria-label={alt} className={`relative block h-full w-full shrink-0 snap-center transition-transform duration-300 ease-out ${peeking ? "-translate-x-8" : "translate-x-0"}`}>
            <Image
              src={toCardImageUrl(src)}
              alt={i === 0 ? alt : ""}
              fill
              sizes={sizes}
              className="object-cover"
              unoptimized
              loading={i === 0 ? "eager" : "lazy"}
            />
          </Link>
        ))}
      </div>

      {multiple && (
        <>
          {active > 0 && (
            <button
              type="button"
              onClick={(e) => go(-1, e)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 text-brand-dark shadow flex items-center justify-center opacity-0 group-hover/car:opacity-100 hover:bg-white transition-opacity cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
          )}
          {active < images.length - 1 && (
            <button
              type="button"
              onClick={(e) => go(1, e)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 text-brand-dark shadow flex items-center justify-center opacity-0 group-hover/car:opacity-100 hover:bg-white transition-opacity cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          )}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 pointer-events-none">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${i === active ? "w-4 bg-white" : "w-1.5 bg-white/60"}`}
                style={{ boxShadow: "0 0 2px rgba(0,0,0,0.45)" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
