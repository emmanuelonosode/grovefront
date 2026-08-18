import { NextRequest, NextResponse } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Prime Family Housing Branded Image Proxy & CDN Bridge.
 * 
 * Proxies property photos so Google Crawlers, Google Images, and visitors only see
 * https://primefamilyhousing.com/media/properties/{slug}/{filename}
 * without 404s or exposing external third-party CDN domains.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; filename: string }> }
) {
  const { slug, filename } = await context.params;

  if (!slug || !filename) {
    return new NextResponse("Missing parameters", { status: 400 });
  }

  // Construct target origin URLs
  const candidateUrls = [
    `https://images.invitationhomes.com/web/w_1500,h_1000,c_limit,q_auto/${slug}/${filename}`,
    `https://images.invitationhomes.com/web/w_1500,h_1000,c_limit,q_auto/${filename}`,
    `https://images.invitationhomes.com/web/w_500,h_250,c_limit,q_auto/${slug}/${filename}`,
  ];

  for (const originUrl of candidateUrls) {
    try {
      const upstream = await fetch(originUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PrimeFamilyHousing/1.0",
          "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        cache: "force-cache",
      });

      if (upstream.ok && upstream.status === 200) {
        const contentType = upstream.headers.get("content-type") || "image/jpeg";
        const buffer = await upstream.arrayBuffer();

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Robots-Tag": "index, follow, max-image-preview:large",
          },
        });
      }
    } catch {
      continue;
    }
  }

  // Fallback if not found on origin CDN
  return new NextResponse("Image not found", { status: 404 });
}
