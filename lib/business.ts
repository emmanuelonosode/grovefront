/**
 * Single source of truth for the business identity (NAP — Name, Address, Phone).
 * Every JSON-LD emitter and every visible contact block must read from here:
 * Google cross-checks NAP consistency across pages, and conflicting identities
 * (old Winder-GA address / 555 placeholder phone) suppress local rankings.
 */

export const BUSINESS = {
  name: "Prime Family Housing",
  url: "https://primefamilyhousing.com",
  telephone: "+17577924480",
  telephoneDisplay: "(757) 792-4480",
  email: "housing@primefamilyhousing.com",
  address: {
    streetAddress: "1425 S 1500 E Unit 222",
    addressLocality: "Clearfield",
    addressRegion: "UT",
    postalCode: "84015",
    addressCountry: "US",
  },
  // Only profiles that actually resolve belong here. sameAs is how Google ties this
  // site to the business as an entity; entries pointing at 404s are dead weight at
  // best and a trust signal against you at worst. The LinkedIn company page and the
  // @primefamilyhousing Twitter/X handle were both listed here but never existed —
  // removed. Re-add either one only once the profile is live.
  sameAs: [
    "https://www.facebook.com/share/1G6G3YcUd3/",
    "https://www.tiktok.com/@primefamilyhousing",
    "https://www.instagram.com/primefamilyhousing",
  ],
  // Spaced form is deliberate and must match `name` above. Google derives the site name
  // shown under a search result from the WebSite node's `name`, og:site_name and the
  // homepage <title>. Those all said the closed-up "PrimeFamilyHousing", which reads as
  // a rendering of the domain rather than a distinct brand — so Google fell back to
  // displaying "primefamilyhousing.com". The closed-up spellings stay as alternateName
  // so branded searches for either form still resolve here.
  displayName: "Prime Family Housing",
  alternateNames: ["PrimeFamilyHousing", "PrimeFamilyHousing.com"],
  // The current brand mark (house + tree, "Great Places to Call Home"). /logo.svg is the
  // superseded placeholder wordmark — do not reintroduce it.
  logo: {
    url: "https://primefamilyhousing.com/logo/logo.png",
    width: 512,
    height: 280,
  },
} as const;

export function postalAddressSchema() {
  return { "@type": "PostalAddress", ...BUSINESS.address };
}

/** Minimal RealEstateAgent node for use as `provider`/`broker` in other schemas. */
export function realEstateAgentSchema() {
  return {
    "@type": "RealEstateAgent",
    name: BUSINESS.name,
    url: BUSINESS.url,
    telephone: BUSINESS.telephone,
    email: BUSINESS.email,
    address: postalAddressSchema(),
  };
}
