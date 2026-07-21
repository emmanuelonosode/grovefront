"use client";

import { useEffect, useState } from "react";

/**
 * Rotating hero headline + subtitle. Crossfades through a set of phrases on a
 * timer so the hero copy feels alive. Honors prefers-reduced-motion (holds on
 * the first phrase, no animation).
 */
const PHRASES: { title: string; subtitle: string }[] = [
  {
    title: "Find Your Family's Next Chapter",
    subtitle: "Discover thoughtfully designed homes in communities built for connection, stability, and growth.",
  },
  {
    title: "Room to Grow, Roots to Stay",
    subtitle: "Spacious, move-in ready rentals with honest pricing and none of the runaround.",
  },
  {
    title: "A Home Where Your Family Belongs",
    subtitle: "Pet-friendly homes near great schools and parks — decisions in 24 hours.",
  },
  {
    title: "Your Sanctuary Starts Here",
    subtitle: "Quality homes across 12+ U.S. cities, backed by a team that actually shows up.",
  },
];

const ROTATE_MS = 5000;

export function HeroHeadline() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const interval = setInterval(() => {
      // Fade out, swap text, fade back in
      setVisible(false);
      const swap = setTimeout(() => {
        setIndex((i) => (i + 1) % PHRASES.length);
        setVisible(true);
      }, 450);
      return () => clearTimeout(swap);
    }, ROTATE_MS);
    return () => clearInterval(interval);
  }, []);

  const phrase = PHRASES[index];

  return (
    <div
      style={{
        transition: "opacity 450ms ease",
        opacity: visible ? 1 : 0,
      }}
    >
      <h1
        className="font-serif font-bold text-white mb-6 drop-shadow-lg text-[2.2rem] leading-[1.15] sm:text-[3rem] lg:text-[3.5rem] lg:leading-[1.16]"
        style={{ letterSpacing: "-0.02em" }}
      >
        {phrase.title}
      </h1>
      <p className="text-[17px] sm:text-[18px] leading-[1.55] text-earth-beige mb-10 max-w-2xl mx-auto drop-shadow-md">
        {phrase.subtitle}
      </p>
    </div>
  );
}
