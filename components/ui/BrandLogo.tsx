/**
 * PrimeFamilyHousing — SVG wordmark component.
 * Icon: house mark inside a deep-forest circle with an earth-beige roof cutout.
 * Text: "PrimeFamilyHousing" bold + "HOMES FOR FAMILIES" spaced below.
 *
 * variant="on-white"  → deep forest wordmark (nav on light background)
 * variant="on-dark"   → white wordmark       (footer, transparent hero nav)
 */
export function BrandLogo({
  variant = "on-white",
  height = 36,
}: {
  variant?: "on-white" | "on-dark";
  height?: number;
}) {
  const textColor = variant === "on-dark" ? "#FFFFFF" : "#012d1d";
  const subColor = variant === "on-dark" ? "#E9EDC6" : "#7d562d";
  const width = Math.round(height * (218 / 44));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 218 44"
      width={width}
      height={height}
      role="img"
      aria-label="PrimeFamilyHousing"
    >
      {/* ── Icon circle ── */}
      <circle cx="22" cy="22" r="22" fill="#012d1d" />

      {/* House mark — roof + body + door, centered in the circle */}
      <g>
        <polygon points="22,9 35,21 32,21 32,24 12,24 12,21 9,21" fill="#E9EDC6" />
        <rect x="13.5" y="24" width="17" height="11" rx="1.5" fill="#E9EDC6" />
        <rect x="19" y="26.5" width="6" height="8.5" rx="1" fill="#012d1d" />
      </g>

      {/* ── Wordmark ── */}
      <text
        x="52"
        y="21"
        fontFamily="Montserrat, 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="700"
        fontSize="15.5"
        fill={textColor}
        letterSpacing="-0.2"
      >
        PrimeFamilyHousing
      </text>

      {/* Descriptor */}
      <text
        x="53"
        y="34"
        fontFamily="'Source Sans 3', 'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="400"
        fontSize="8"
        fill={subColor}
        letterSpacing="3"
      >
        HOMES FOR FAMILIES
      </text>
    </svg>
  );
}
