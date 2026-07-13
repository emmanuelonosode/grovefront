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
 */
export function toCardImageUrl(url: string): string {
  if (!url) return url;
  if (url.includes("images.invitationhomes.com")) {
    return url
      .replace("/w_1500,h_1000,", "/w_640,h_427,")
      .replace("/c_fill,w_1200/", "/c_fill,w_640/");
  }
  if (url.includes("images.unsplash.com")) {
    return url.replace("w=1600", "w=800");
  }
  return url;
}
