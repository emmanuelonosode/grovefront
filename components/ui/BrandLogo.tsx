/**
 * PrimeFamilyHousing — official brand mark (house + tree over a hill swoosh).
 *
 * Renders the real vector logo from /public/brand as an <img> (the browser
 * rasterizes SVG crisply at any size — no next/image SVG config needed).
 *
 * variant="on-white" → forest-green (nav on a light/solid background)
 * variant="on-dark"  → beige        (footer, transparent hero nav)
 *
 * mark="lockup" → full stack: icon + "Primefamilyhousing" + tagline
 *                 (native ratio 77.22 : 42.21 ≈ 1.83 : 1)
 * mark="emblem" → icon only, for compact/inline spots
 *                 (native ratio 75.63 : 27.26 ≈ 2.77 : 1)
 *
 * `height` drives the size; width is derived from the mark's native ratio.
 */
const RATIO = {
  lockup: 77.22 / 42.21,
  emblem: 75.63 / 27.26,
} as const;

export function BrandLogo({
  variant = "on-white",
  mark = "lockup",
  height = 44,
}: {
  variant?: "on-white" | "on-dark";
  mark?: "lockup" | "emblem";
  height?: number;
}) {
  const tone = variant === "on-dark" ? "beige" : "green";
  const src = `/brand/${mark === "emblem" ? "emblem" : "logo-lockup"}-${tone}.svg`;
  const width = Math.round(height * RATIO[mark]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="PrimeFamilyHousing — Great Places to Call Home"
      width={width}
      height={height}
      style={{ height, width: "auto", display: "block" }}
    />
  );
}
