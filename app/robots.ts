import type { MetadataRoute } from "next";

// https://developers.google.com/search/docs/advanced/robots/robots_txt
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/preview",
          "/test",
          "/docs",
          "/api",
          "/*.json",
          "/admin",
        ],
      },
    ],
    // Kept from the previous version: this is a separate top-level directive rather
    // than part of the user-agent block, and dropping it would remove the only
    // in-file pointer to the sitemap while Search Console is still being fixed.
    sitemap: "https://primefamilyhousing.com/sitemap.xml",
  };
}
