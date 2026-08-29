"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface Props {
  hasMap: boolean;
  hasAmenities: boolean;
  hasTour: boolean;
  hasCosts: boolean;
  hasFloorPlans: boolean;
  hasSchools: boolean;
}

/**
 * Pill-tab section nav. The caller owns the sticky wrapper so the rail can
 * live inside the content column alongside the sticky lead rail.
 *
 * Scroll-spy runs on IntersectionObserver rather than a scroll listener, so it
 * doesn't fire work on every scroll frame.
 */
export function PdpSectionNav({
  hasMap, hasAmenities, hasTour, hasCosts, hasFloorPlans, hasSchools,
}: Props) {
  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      ...(hasAmenities ? [{ id: "features", label: "Features" }] : []),
      ...(hasTour ? [{ id: "tour", label: "3D tour" }] : []),
      ...(hasCosts ? [{ id: "costs", label: "Monthly cost" }] : []),
      ...(hasFloorPlans ? [{ id: "floorplans", label: "Floor plan" }] : []),
      ...(hasSchools ? [{ id: "schools", label: "Schools" }] : []),
      ...(hasMap ? [{ id: "location", label: "Location" }] : []),
      { id: "leasing", label: "Leasing" },
      { id: "faq", label: "Questions" },
      { id: "nearby", label: "Nearby homes" },
    ],
    [hasMap, hasAmenities, hasTour, hasCosts, hasFloorPlans, hasSchools],
  );

  const [active, setActive] = useState(tabs[0].id);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.intersectionRatio);
          else visible.delete(entry.target.id);
        }
        // Whichever tracked section currently occupies the most of the reading
        // band wins; falling back to the last known tab avoids flicker in gaps.
        let best: string | null = null;
        let bestRatio = 0;
        for (const [id, ratio] of visible) {
          if (ratio > bestRatio) { best = id; bestRatio = ratio; }
        }
        if (best) setActive(best);
      },
      // Band sits below the 80px navbar + 56px tab rail, ignoring the lower half.
      { rootMargin: "-152px 0px -45% 0px", threshold: [0, 0.15, 0.4, 0.75, 1] },
    );

    const nodes = tabs
      .map((t) => document.getElementById(t.id))
      .filter((n): n is HTMLElement => n !== null);
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [tabs]);

  // Keep the active pill in view on narrow screens.
  //
  // This scrolls the rail's own scrollLeft rather than calling scrollIntoView:
  // scrollIntoView also scrolls every scrollable ancestor, including the
  // document, so on mount it dragged the whole page down to the nav (~628px on
  // a 390px viewport) and the visitor never saw the gallery or the headline.
  useEffect(() => {
    const rail = railRef.current;
    const el = rail?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!rail || !el) return;

    const left = el.offsetLeft;
    const right = left + el.offsetWidth;
    const viewLeft = rail.scrollLeft;
    const viewRight = viewLeft + rail.clientWidth;
    if (left >= viewLeft && right <= viewRight) return;

    rail.scrollTo({
      left: Math.max(0, left - 16),
      behavior: "smooth",
    });
  }, [active]);

  return (
    <div
      ref={railRef}
      className="pdp-rail hidden md:flex items-center gap-2 overflow-x-auto py-2.5"
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            data-tab={tab.id}
            aria-current={isActive ? "true" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-[8px] px-4 text-[14px] font-bold leading-[1.43] tracking-[-0.14px] transition-colors ${
              isActive
                ? "bg-[#0a1317] text-white"
                : "border border-[#ced0d4] bg-white text-[#1c1e21] hover:bg-[#f1f4f7]"
            }`}
          >
            {tab.label}
          </a>
        );
      })}
    </div>
  );
}
