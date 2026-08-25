/**
 * US state registry — shared source of truth for state name ↔ code ↔ slug.
 * Used by the state hub pages (/rentals/[state]), the city directory, and the footer.
 */

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "Washington, D.C.",
};

export function stateNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.,]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** "GA" → "georgia", "NC" → "north-carolina" */
export function stateSlugForCode(code: string): string {
  const name = STATE_NAMES[code?.toUpperCase()];
  return name ? stateNameToSlug(name) : "";
}

// slug → { code, name } lookup built once from STATE_NAMES.
const SLUG_TO_STATE: Record<string, { code: string; name: string }> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [stateNameToSlug(name), { code, name }])
);

export interface StateInfo {
  code: string;
  name: string;
  slug: string;
}

/** Returns state info if the slug is a known US state (e.g. "georgia"), else null. */
export function getStateBySlug(slug: string): StateInfo | null {
  const hit = SLUG_TO_STATE[slug?.toLowerCase()];
  return hit ? { code: hit.code, name: hit.name, slug: slug.toLowerCase() } : null;
}

export function stateFullName(code: string): string {
  return STATE_NAMES[code?.toUpperCase()] ?? code;
}

export interface StateMedia {
  hero: string;
  og: string;
  feature?: string;
}

export const STATE_HERO_IMAGES: Record<string, StateMedia> = {
  FL: {
    hero: "/images/states/florida/florida-hero.jpg",
    og: "https://primefamilyhousing.com/images/states/florida/florida-og.jpg",
    feature: "/images/states/florida/florida-beach-palms.jpg",
  },
};

export function getStateMedia(code: string): StateMedia | null {
  return STATE_HERO_IMAGES[code?.toUpperCase()] ?? null;
}
