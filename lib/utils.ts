import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  price: number,
  options: { compact?: boolean; perMonth?: boolean } = {}
): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: options.compact ? "compact" : "standard",
  }).format(price);

  return options.perMonth ? `${formatted}/mo` : formatted;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

export function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + "…" : str;
}

/**
 * Downscale a listing photo URL for card/thumbnail contexts. Images arrive
 * sized for hero display (1500px+) but cards render at ~200–500px — with
 * `images.unoptimized` in next.config, the full-size file ships to the
 * browser. Only URL patterns we recognize are rewritten; anything else is
 * returned untouched so an upstream format change can never break images.
 *
 * Listing photos are now served from our own /media/properties/... proxy, which
 * caches one canonical size and takes no width parameter — so there is nothing
 * to rewrite for them and they fall through unchanged. (The branch that
 * rewrote the syndication CDN's transform segment was removed with the URLs
 * themselves; resizing those would now mean teaching the proxy to accept a
 * size hint, not string-editing the path.)
 */
export function toCardImageUrl(url: string): string {
  if (!url) return url;
  if (url.includes("images.unsplash.com")) {
    return url.replace("w=1600", "w=800");
  }
  return url;
}

/**
 * Downscale + re-encode an image File in the browser before upload. Phone
 * cameras produce 5–12MB photos that blow past proxy body limits
 * (nginx client_max_body_size defaults to 1MB) — a dropped connection surfaces
 * in the browser as an opaque "Load failed". Shrinking to ~maxDim px JPEG puts
 * a government-ID photo well under 1MB while staying readable.
 *
 * Non-images (e.g. a PDF/HEIC the canvas can't decode) are returned untouched
 * so the caller's own size guard still applies.
 */
export async function compressImageFile(
  file: File,
  { maxDim = 1600, quality = 0.72 }: { maxDim?: number; quality?: number } = {},
): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read-failed"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("decode-failed"));
    el.src = dataUrl;
  }).catch(() => null);
  if (!img) return file; // browser couldn't decode (e.g. HEIC) — send original

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  if (!blob || blob.size >= file.size) return file; // never upsize

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
}
