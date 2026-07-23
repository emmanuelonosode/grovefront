import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    // HSTS: 1 year, include subdomains — enable only in production with HTTPS
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline scripts + scripts from same origin
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: same origin + inline (Tailwind injects inline styles at runtime)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: same origin, Unsplash, InvitationHomes, Rently CDN + S3, CARTO tiles, HAR static
      // (Google/Meta tracking hosts removed — no third-party analytics.)
      "img-src 'self' data: blob: https://admin.primefamilyhousing.com https://images.unsplash.com https://images.invitationhomes.com https://*.invitationhomes.com https://*.zillowstatic.com https://d39tc8gklidfbm.cloudfront.net https://s3.amazonaws.com https://maps.gstatic.com https://maps.googleapis.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://unpkg.com https://*.harstatic.com",
      // API connections: same origin + backend API + CARTO + IP geolocation (native location capture).
      // (GTM / GA4 / Meta Pixel hosts removed — analytics is first-party only.)
      "connect-src 'self' https://admin.primefamilyhousing.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com https://ipapi.co",
      // Media
      "media-src 'self'",
      // Iframes: Google Maps embed + virtual tour providers
      "frame-src https://maps.google.com https://www.google.com https://www.insidemaps.com https://insidemap.app https://*.insidemaps.com https://www.zillow.com https://my.matterport.com https://*.matterport.com https://*.tours.com https://*.kuula.co https://kuula.co https://*.roundme.com https://*.panoraven.com https://*.viewstl.com https://*.immoviewer.com https://*.ogulo.com https://ogulo.com",
      // Object tags (none)
      "object-src 'none'",
      // Base URI
      "base-uri 'self'",
      // Form submissions
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Prevent Next.js from redirecting /api/v1/auth/token/ → /api/v1/auth/token
  // before the rewrite proxy runs. Without this, POST bodies are lost on 308.
  skipTrailingSlashRedirect: true,

  // Disable streamed metadata for ALL user agents. With streaming enabled,
  // notFound() thrown from generateMetadata/page lands after the 200 status is
  // committed, so missing listings return 200 + <meta noindex> instead of a
  // real 404 — polluting Search Console. Blocking metadata restores true 404s.
  htmlLimitedBots: /.*/,

  async redirects() {
    return [
      // www → non-www permanent redirect (301).
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.primefamilyhousing.com" }],
        destination: "https://primefamilyhousing.com/:path*",
        permanent: true,
      },
      // /properties → /homes-for-rent (route rename, 301 preserves SEO equity;
      // points directly at the final path — no redirect chain through /houses-for-rent)
      {
        source: "/properties",
        destination: "/homes-for-rent",
        permanent: true,
      },
      {
        source: "/properties/:slug*",
        destination: "/homes-for-rent/:slug*",
        permanent: true,
      },
      // /houses-for-rent → /homes-for-rent (route rename, 301 preserves SEO equity)
      {
        source: "/houses-for-rent",
        destination: "/homes-for-rent",
        permanent: true,
      },
      {
        source: "/houses-for-rent/:slug*",
        destination: "/homes-for-rent/:slug*",
        permanent: true,
      },
      // Legacy grouped sub-sitemaps → the single central sitemap. Keeps stale
      // GSC/crawler references resolving instead of 404ing.
      {
        source: "/sitemaps/:path*",
        destination: "/sitemap.xml",
        permanent: true,
      },
    ];
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      {
        // Backend-served media (agent avatars, etc.)
        protocol: "https",
        hostname: "admin.primefamilyhousing.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.invitationhomes.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.invitationhomes.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.zillowstatic.com",
        pathname: "/**",
      },
      // Rently property photos (CloudFront CDN + legacy S3)
      {
        protocol: "https",
        hostname: "d39tc8gklidfbm.cloudfront.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s3.amazonaws.com",
        pathname: "/**",
      },
      // HAR listing and agent photos
      {
        protocol: "https",
        hostname: "*.harstatic.com",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://admin.primefamilyhousing.com";
    return [
      // Rule 1: URL already has trailing slash — pass through as-is
      {
        source: "/api/v1/:path*/",
        destination: `${backendUrl}/api/v1/:path*/`,
      },
      // Rule 2: URL has no trailing slash (Next.js stripped it) — add one for Django
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*/`,
      },
    ];
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
