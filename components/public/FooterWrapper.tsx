"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the footer on the full-screen search page. Takes the footer as
 * children (rather than importing it) so the Footer itself stays a server
 * component and can fetch inventory data for the state links.
 */
export function FooterWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/houses-for-rent") return null;
  return <>{children}</>;
}
