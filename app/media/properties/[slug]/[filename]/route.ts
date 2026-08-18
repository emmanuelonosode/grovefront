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

  const backendUrl = ;

  try {
    const backendRes = await fetch(backendUrl, {
      headers: {
        Accept: "image/*",
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

  const directCdnUrl = ;
  try {
    const cdnRes = await fetch(directCdnUrl, {
      headers: {
        Accept: "image/*",
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
