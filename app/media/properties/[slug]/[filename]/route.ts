import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; filename: string }> }
) {
  const { slug, filename } = await context.params;

  if (!slug || !filename) {
    return new NextResponse("Bad Request", { status: 400 });
  }

  // 1. Try local Django backend proxy endpoint with forward headers
  const backendUrl = "http://127.0.0.1:8000/media/properties/" + encodeURIComponent(slug) + "/" + encodeURIComponent(filename);

  try {
    const backendRes = await fetch(backendUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "X-Forwarded-Proto": "https",
        Host: "admin.primefamilyhousing.com",
      },
    });

    if (backendRes.ok) {
      const contentType = backendRes.headers.get("content-type") || "image/jpeg";
      const buffer = await backendRes.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (err) {
    console.error("[Next.js Media Proxy] Error fetching from backend:", err);
  }

  // 2. Direct fallback origin streaming.
  //
  // This is the ONE place the syndication CDN may still be named, and it must
  // stay: it is how the bytes are actually obtained when the Django proxy has
  // not yet cached a file. The fetch is server-side, so the hostname never
  // reaches the browser, appears in no HTML, and is not subject to (or exempted
  // by) the CSP — which is why `images.invitationhomes.com` was removed from
  // `img-src` in next.config.ts without breaking images. Deleting this block
  // would 404 every photo that is not already on disk.
  const directCdnUrl = "https://images.invitationhomes.com/web/w_1500,h_1000,c_limit,q_auto/" + encodeURIComponent(slug) + "/" + encodeURIComponent(filename);
  try {
    const cdnRes = await fetch(directCdnUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (cdnRes.ok) {
      const contentType = cdnRes.headers.get("content-type") || "image/jpeg";
      const buffer = await cdnRes.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  } catch (err) {
    console.error("[Next.js Media Proxy] Fallback fetch failed:", err);
  }

  return new NextResponse("Image Not Found", { status: 404 });
}
