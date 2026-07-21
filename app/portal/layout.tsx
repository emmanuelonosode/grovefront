"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, CreditCard, FileText, Wrench, User, LogOut, Home, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const BASE_NAV = [
  { label: "Dashboard",     href: "/portal/dashboard",   icon: LayoutDashboard },
  { label: "Rent Payments", href: "/portal/payments",    icon: CreditCard },
  { label: "Maintenance",   href: "/portal/maintenance", icon: Wrench },
  { label: "My Documents",  href: "/portal/documents",   icon: FileText },
  { label: "My Profile",    href: "/portal/profile",     icon: User },
  { label: "Settings",      href: "/portal/settings",    icon: Settings },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [user, isLoading, router, pathname]);

  const isHiringManager = user?.role === "MANAGER" || user?.role === "ADMIN";
  const navItems = isHiringManager
    ? [...BASE_NAV, { label: "Hiring", href: "/portal/hiring", icon: Users }]
    : BASE_NAV;

  // Mobile bottom bar: core tenant items only (4 max) + sign out
  const mobileNavItems = BASE_NAV.slice(0, 4);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-[2.5px] border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  const isActive = (href: string) =>
    pathname === href || (href !== "/portal/dashboard" && pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-surface-container-low shadow-sm shrink-0 p-4">

        {/* Brand */}
        <div className="mb-8 px-2 pt-2">
          <Link href="/" className="font-serif font-semibold text-[20px] leading-7 text-primary">
            PrimeFamilyHousing
          </Link>
          <p className="text-[10px] tracking-[0.18em] uppercase text-on-surface-variant/70 mt-1 font-medium">
            Residents Portal
          </p>
        </div>

        {/* User block — links to settings */}
        <Link
          href="/portal/settings"
          className="flex items-center gap-4 mb-8 pb-6 border-b border-outline-variant px-2 group"
        >
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-[15px] font-semibold text-on-primary shrink-0 select-none">
            {user.first_name?.[0]}{user.last_name?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-on-surface truncate leading-tight group-hover:text-primary transition-colors">
              Welcome, {user.first_name}
            </p>
            <p className="text-[12px] leading-4 text-on-surface-variant truncate">{user.email}</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 space-y-2">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] transition-all duration-150 active:scale-[0.98]",
                  active
                    ? "bg-primary-fixed text-on-primary-fixed font-bold"
                    : "text-on-surface-variant font-medium hover:bg-surface-container-high"
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-4 space-y-2">
          <Link
            href="/portal/payments"
            className="w-full flex items-center justify-center bg-primary text-on-primary font-semibold text-[14px] tracking-[0.05em] py-3 rounded-lg hover:bg-primary-container transition-colors active:scale-[0.98]"
          >
            Make a Payment
          </Link>
          <div className="flex items-center gap-2 pt-2 border-t border-outline-variant">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              <Home size={14} strokeWidth={1.8} />
              Main Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-medium text-on-surface-variant hover:text-error hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <LogOut size={14} strokeWidth={1.8} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile header ────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-xl border-b border-outline-variant px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-serif font-semibold text-[18px] text-primary">
          PrimeFamilyHousing
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/portal/settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
            aria-label="Settings"
          >
            <User size={15} />
          </Link>
          <span className="text-xs text-on-surface-variant font-medium">{user.first_name}</span>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-surface-container transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* ── Mobile bottom nav ────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-xl border-t border-outline-variant flex">
        {mobileNavItems.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 pt-2.5 pb-3 text-[10px] font-semibold tracking-tight transition-colors",
                active ? "text-primary" : "text-on-surface-variant hover:text-primary"
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center gap-1 pt-2.5 pb-3 text-[10px] font-semibold tracking-tight text-on-surface-variant hover:text-error transition-colors"
        >
          <LogOut size={19} strokeWidth={1.8} />
          Sign Out
        </button>
      </nav>

      {/* ── Main ─────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 pt-16 pb-24 lg:pt-0 lg:pb-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}
