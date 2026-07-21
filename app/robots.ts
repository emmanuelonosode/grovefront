import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Googlebot-Image crawls property photos for Google Images / search thumbnails
        // Explicitly allow it before the wildcard rule so /*?* doesn't inadvertently block image CDN redirects
        userAgent: "Googlebot-Image",
        allow: "/",
        disallow: [],
      },
      {
        userAgent: "*",
        allow: "/",
        // Private portal routes and internal Next.js paths only. Deliberately NOT
        // blocking query-param URLs (/*?*): blocked URLs can never be recrawled, so
        // Google froze thousands as "Duplicate without user-selected canonical".
        // Param variants carry canonical tags pointing at the clean URLs — letting
        // Google crawl them resolves them as "Alternate page with proper canonical",
        // which is the correct, harmless end state.
        disallow: ["/dashboard", "/portal", "/api", "/_next"],
      },
      {
        // Explicitly allow known LLM/AI crawlers to index the site
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "Google-Extended",
          "Claude-Web",
          "Anthropic-AI",
          "PerplexityBot",
          "Bytespider",
          "CCBot",
        ],
        allow: ["/", "/llms.txt", "/llms-full.txt"],
        disallow: ["/dashboard", "/portal", "/api", "/_next"],
      },
    ],
    sitemap: "https://primefamilyhousing.com/sitemap.xml",
    host: "https://primefamilyhousing.com",
  };
}
