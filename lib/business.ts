/**
 * Single source of truth for the business identity (NAP — Name, Address, Phone).
 * Every JSON-LD emitter and every visible contact block must read from here:
 * Google cross-checks NAP consistency across pages, and conflicting identities
 * (old Winder-GA address / 555 placeholder phone) suppress local rankings.
 */

export const BUSINESS = {
  name: "PrimeFamilyHousing",
  url: "https://primefamilyhousing.com",
  telephone: "+17577924480",
  telephoneDisplay: "(757) 792-4480",
  email: "info@primefamilyhousing.com",
  address: {
    streetAddress: "1425 S 1500 E Unit 222",
    addressLocality: "Clearfield",
    addressRegion: "UT",
    postalCode: "84015",
    addressCountry: "US",
  },
  sameAs: [
    "https://www.facebook.com/share/1G6G3YcUd3/",
    "https://www.tiktok.com/@primefamilyhousing",
    "https://www.instagram.com/primefamilyhousing",
    "https://www.linkedin.com/company/primefamilyhousing",
    "https://twitter.com/primefamilyhousing",
  ],
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
