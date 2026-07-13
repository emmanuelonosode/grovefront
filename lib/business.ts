/**
 * Single source of truth for the business identity (NAP — Name, Address, Phone).
 * Every JSON-LD emitter and every visible contact block must read from here:
 * Google cross-checks NAP consistency across pages, and conflicting identities
 * (old Winder-GA address / 555 placeholder phone) suppress local rankings.
 */

export const BUSINESS = {
  name: "Hasker & Co. Realty Group",
  url: "https://haskerrealtygroup.com",
  telephone: "+17572082767",
  telephoneDisplay: "(757) 208-2767",
  email: "info@haskerrealtygroup.com",
  address: {
    streetAddress: "213 Bob Ln",
    addressLocality: "Virginia Beach",
    addressRegion: "VA",
    postalCode: "23454",
    addressCountry: "US",
  },
  sameAs: [
    "https://www.facebook.com/share/1G6G3YcUd3/",
    "https://www.tiktok.com/@haskerrealtygroup",
    "https://www.instagram.com/haskerrealty",
    "https://www.linkedin.com/company/haskerrealty",
    "https://twitter.com/haskerrealty",
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
