"use client";

import { usePathname } from "next/navigation";

/**
 * Drops its children on property detail pages (`/houses-for-rent/<slug>`).
 *
 * Takes the block as children rather than importing it, so the wrapped markup
 * stays server-rendered. It genuinely does not render rather than hiding with
 * CSS, which would leave the links in the HTML for crawlers while invisible to
 * people.
 */
export function HideOnPropertyDetail({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPropertyDetail =
    pathname.startsWith("/houses-for-rent/") && pathname !== "/houses-for-rent/";
  if (isPropertyDetail) return null;
  return <>{children}</>;
}
