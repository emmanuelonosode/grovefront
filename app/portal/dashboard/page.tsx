"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CreditCard,
  Wrench,
  Clock,
  Megaphone,
  ChevronRight,
  FileText,
  BookOpen,
  MessageCircle,
  CheckCircle,
  MapPin,
  BedDouble,
  Bath,
  Ruler,
  Phone,
  Mail,
  FileCheck,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { toCardImageUrl } from "@/lib/utils";

interface Invoice {
  id: number;
  title: string;
  due_date: string;
  total: string;
  status: "SENT" | "PAID" | "DRAFT" | "VOID";
}

interface MaintenanceRequest {
  id: number;
  title: string;
  status: string;
  created_at: string;
}

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  published_at: string | null;
}

interface AppliedProperty {
  slug: string;
  title: string;
  price: string;
  price_label: string;
  bedrooms: number;
  bathrooms: string;
  sqft: number;
  address: string;
  city: string;
  state: string;
  primary_image_url: string | null;
}

interface AppliedAgent {
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
}

interface CostItem {
  label: string;
  detail: string;
  amount: number;
}

interface CostBreakdown {
  monthly_rent: number;
  months_upfront: number;
  items: CostItem[];
  total: number;
  currency: string;
}

interface Application {
  id: number;
  status: string;
  status_display: string;
  property_title: string | null;
  move_in_date: string | null;
  intended_stay_duration: string;
  is_fee_paid: boolean;
  submitted_at: string;
  property_detail: AppliedProperty | null;
  agent: AppliedAgent | null;
  cost_breakdown: CostBreakdown | null;
}

const APP_STATUS_STYLE: Record<string, string> = {
  SUBMITTED: "bg-secondary-container text-on-secondary-fixed",
  UNDER_REVIEW: "bg-secondary-container text-on-secondary-fixed",
  APPROVED: "bg-primary-fixed text-on-primary-fixed",
  ACTIVE: "bg-primary-fixed text-on-primary-fixed",
  REJECTED: "bg-error-container text-on-error-container",
  DRAFT: "bg-surface-container-high text-on-surface-variant",
};

function money(n: number): string {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const ACTIVE_MAINTENANCE = new Set(["SUBMITTED", "ACKNOWLEDGED", "IN_PROGRESS"]);

const MAINTENANCE_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted — awaiting review",
  ACKNOWLEDGED: "Acknowledged by our team",
  IN_PROGRESS: "Technician assigned — in progress",
};

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr + "T00:00:00");
  return Math.ceil((due.getTime() - Date.now()) / 86_400_000);
}

function dueChip(days: number): { label: string; cls: string } {
  if (days < 0)  return { label: `Overdue by ${-days} day${days === -1 ? "" : "s"}`, cls: "bg-error-container text-on-error-container" };
  if (days === 0) return { label: "Due today", cls: "bg-secondary-container text-on-secondary-fixed" };
  return { label: `Due in ${days} day${days === 1 ? "" : "s"}`, cls: "bg-surface-container-low text-on-surface-variant" };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const QUICK_LINKS = [
  { label: "Lease & Documents",     href: "/portal/documents", icon: FileText },
  { label: "Community Guidelines",  href: "/terms",            icon: BookOpen },
  { label: "Contact Support",       href: "/contact",          icon: MessageCircle },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [requests, setRequests] = useState<MaintenanceRequest[] | null>(null);
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [inv, maint, blog, apps] = await Promise.allSettled([
        apiFetch(`/api/v1/transactions/my-invoices/`).then((r) => (r.ok ? r.json() : [])),
        apiFetch(`/api/v1/maintenance/`).then((r) => (r.ok ? r.json() : [])),
        fetch(`/api/v1/blog/posts/`).then((r) => (r.ok ? r.json() : null)),
        apiFetch(`/api/v1/leads/apply/my-applications/`).then((r) => (r.ok ? r.json() : [])),
      ]);
      setInvoices(inv.status === "fulfilled" ? (Array.isArray(inv.value) ? inv.value : inv.value?.results ?? []) : []);
      setRequests(maint.status === "fulfilled" ? (Array.isArray(maint.value) ? maint.value : maint.value?.results ?? []) : []);
      const blogData = blog.status === "fulfilled" ? blog.value : null;
      setPosts(blogData ? (Array.isArray(blogData) ? blogData : blogData.results ?? []) : []);
      setApplications(apps.status === "fulfilled" ? (Array.isArray(apps.value) ? apps.value : apps.value?.results ?? []) : []);
      setLoading(false);
    })();
  }, []);

  // Most recent application that has an applied-for property attached
  const application = (applications ?? []).find((a) => a.property_detail) ?? null;

  // Next unpaid invoice, soonest due date first
  const openInvoices = (invoices ?? []).filter((i) => i.status === "SENT");
  const nextInvoice = [...openInvoices].sort((a, b) => a.due_date.localeCompare(b.due_date))[0] ?? null;

  const activeRequests = (requests ?? []).filter((r) => ACTIVE_MAINTENANCE.has(r.status));
  const latestActive = [...activeRequests].sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;

  const announcements = (posts ?? []).slice(0, 2);

  return (
    <div className="p-4 md:p-12 w-full max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-12">
        <h2 className="font-serif font-bold text-on-surface mb-2 text-[32px] leading-10 md:text-[48px] md:leading-[56px]" style={{ letterSpacing: "-0.02em" }}>
          Dashboard
        </h2>
        <p className="text-[18px] leading-7 text-on-surface-variant">
          {user?.first_name ? `Welcome back, ${user.first_name}. ` : ""}Here is your home at a glance.
        </p>
      </header>

      {/* ── Your Application: applied home + agent + cost breakdown ──── */}
      {application?.property_detail && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif font-semibold text-on-surface text-[24px] leading-8">Your Application</h3>
            <span className={`text-[12px] leading-4 font-semibold px-3 py-1 rounded-full ${APP_STATUS_STYLE[application.status] ?? "bg-surface-container-high text-on-surface-variant"}`}>
              {application.status_display}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Applied-for home */}
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
              <div className="relative h-56 bg-surface-container">
                {application.property_detail.primary_image_url && (
                  <Image
                    src={toCardImageUrl(application.property_detail.primary_image_url)}
                    alt={application.property_detail.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-6">
                  <p className="text-[13px] text-earth-beige mb-1 flex items-center gap-1">
                    <MapPin size={14} />
                    {application.property_detail.address}, {application.property_detail.city}, {application.property_detail.state}
                  </p>
                  <h4 className="font-serif font-semibold text-white text-[24px] leading-8">{application.property_detail.title}</h4>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mb-5">
                  <span className="flex items-center gap-2 text-[15px] text-on-surface">
                    <BedDouble size={18} className="text-primary" />
                    {application.property_detail.bedrooms} Bed{application.property_detail.bedrooms === 1 ? "" : "s"}
                  </span>
                  <span className="flex items-center gap-2 text-[15px] text-on-surface">
                    <Bath size={18} className="text-primary" />
                    {Number(application.property_detail.bathrooms)} Bath
                  </span>
                  {application.property_detail.sqft > 0 && (
                    <span className="flex items-center gap-2 text-[15px] text-on-surface">
                      <Ruler size={18} className="text-primary" />
                      {application.property_detail.sqft.toLocaleString()} sqft
                    </span>
                  )}
                  <span className="ml-auto font-serif font-semibold text-primary text-[22px]">
                    {money(Number(application.property_detail.price))}
                    <span className="text-[14px] font-normal text-on-surface-variant">{application.property_detail.price_label || "/mo"}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 pt-4 border-t border-outline-variant/60 text-[13px] text-on-surface-variant">
                  {application.move_in_date && (
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-primary" /> Move-in {formatDate(application.move_in_date)}
                    </span>
                  )}
                  {application.intended_stay_duration && (
                    <span className="flex items-center gap-1.5">
                      <FileCheck size={14} className="text-primary" /> {application.intended_stay_duration}
                    </span>
                  )}
                  <Link href={`/homes-for-rent/${application.property_detail.slug}`} className="ml-auto text-primary font-semibold hover:underline flex items-center gap-1">
                    View listing <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Cost breakdown + agent */}
            <div className="space-y-6">
              {/* Cost breakdown */}
              {application.cost_breakdown && (
                <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6">
                  <h4 className="font-serif font-semibold text-on-surface text-[18px] leading-7 mb-4">Move-in Cost Breakdown</h4>
                  <div className="space-y-3">
                    {application.cost_breakdown.items.map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] text-on-surface leading-5">{item.label}</p>
                          {item.detail && <p className="text-[12px] text-on-surface-variant leading-4">{item.detail}</p>}
                        </div>
                        <span className="text-[14px] font-semibold text-on-surface tabular-nums shrink-0">{money(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant">
                    <span className="text-[15px] font-semibold text-on-surface">Estimated total</span>
                    <span className="font-serif font-semibold text-primary text-[20px] tabular-nums">{money(application.cost_breakdown.total)}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-3 leading-4">
                    Estimate based on your applied home. Your agent will confirm exact amounts and payment instructions.
                  </p>
                  <Link
                    href="/portal/payments"
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-on-primary text-[14px] tracking-[0.05em] font-semibold py-3 rounded-lg hover:bg-primary-container transition-colors active:scale-[0.98]"
                  >
                    Make a Payment
                  </Link>
                </div>
              )}

              {/* Agent */}
              {application.agent && (
                <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6">
                  <h4 className="font-serif font-semibold text-on-surface text-[18px] leading-7 mb-4">Your Agent</h4>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-surface-container overflow-hidden shrink-0 flex items-center justify-center">
                      {application.agent.avatar_url ? (
                        <Image src={application.agent.avatar_url} alt={application.agent.full_name} width={56} height={56} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-[16px] font-semibold text-primary">
                          {application.agent.full_name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold text-on-surface leading-5 truncate">{application.agent.full_name}</p>
                      <p className="text-[12px] text-on-surface-variant">PrimeFamilyHousing</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {application.agent.phone && (
                      <a href={`tel:${application.agent.phone}`} className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-surface-container border border-outline-variant/50 transition-colors text-[14px] text-on-surface">
                        <Phone size={16} className="text-primary shrink-0" /> {application.agent.phone}
                      </a>
                    )}
                    <a href={`mailto:${application.agent.email}`} className="flex items-center gap-3 p-3 rounded-lg bg-surface hover:bg-surface-container border border-outline-variant/50 transition-colors text-[14px] text-on-surface min-w-0">
                      <Mail size={16} className="text-primary shrink-0" /> <span className="truncate">{application.agent.email}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Top overview (bento) ─────────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Rent card */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <CreditCard size={30} className="text-terracotta-warm" />
              {loading ? (
                <span className="bg-surface-container-low text-transparent px-3 py-1 rounded-full text-[12px] animate-pulse">loading</span>
              ) : nextInvoice ? (
                <span className={`px-3 py-1 rounded-full text-[12px] leading-4 ${dueChip(daysUntil(nextInvoice.due_date)).cls}`}>
                  {dueChip(daysUntil(nextInvoice.due_date)).label}
                </span>
              ) : (
                <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-[12px] leading-4 flex items-center gap-1">
                  <CheckCircle size={12} /> All paid up
                </span>
              )}
            </div>
            <p className="text-[16px] leading-6 text-on-surface-variant mb-1">Current Rent Due</p>
            <h3 className="font-serif font-semibold text-on-surface mb-4 text-[32px] leading-10">
              {loading ? "…" : nextInvoice ? `$${Number(nextInvoice.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"}
            </h3>
            {nextInvoice && (
              <p className="text-[12px] leading-4 text-on-surface-variant mb-4">
                {nextInvoice.title} · due {formatDate(nextInvoice.due_date)}
              </p>
            )}
          </div>
          <Link
            href="/portal/payments"
            className="w-full text-center bg-primary text-on-primary font-semibold text-[14px] tracking-[0.05em] py-3 rounded-lg hover:bg-primary/90 transition-colors active:scale-[0.98]"
          >
            Make a Payment
          </Link>
        </div>

        {/* Maintenance card */}
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <Wrench size={30} className="text-sage-soft" />
              <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-[12px] leading-4">
                {loading ? "…" : `${activeRequests.length} Active`}
              </span>
            </div>
            <p className="text-[16px] leading-6 text-on-surface-variant mb-1">Maintenance Requests</p>
            <h3 className="font-serif font-semibold text-on-surface mb-4 text-[24px] leading-8 truncate">
              {loading ? "…" : latestActive ? latestActive.title : "No open requests"}
            </h3>
            {latestActive && (
              <p className="text-[12px] leading-4 text-on-surface-variant mb-4 flex items-center gap-1">
                <Clock size={14} />
                {MAINTENANCE_STATUS_LABEL[latestActive.status] ?? latestActive.status}
              </p>
            )}
          </div>
          <Link
            href="/portal/maintenance"
            className="w-full text-center border border-outline text-primary font-semibold text-[14px] tracking-[0.05em] py-3 rounded-lg hover:bg-surface-container-low transition-colors active:scale-[0.98]"
          >
            Request Maintenance
          </Link>
        </div>

        {/* Context image card */}
        <div className="rounded-xl overflow-hidden shadow-sm relative group h-full min-h-[200px]">
          <Image
            src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=75&fm=webp&auto=format"
            alt="Our maintenance team is ready to help"
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 to-transparent flex flex-col justify-end p-6">
            <p className="text-[16px] leading-6 text-on-primary mb-1">Need Help?</p>
            <h4 className="font-serif font-semibold text-on-primary text-[24px] leading-8">Our Team is Ready.</h4>
          </div>
        </div>
      </section>

      {/* ── Community board + quick links ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Community board — latest news from the blog */}
        <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif font-semibold text-on-surface text-[24px] leading-8">Community Board</h3>
            <Link href="/blog" className="text-primary font-semibold text-[14px] tracking-[0.05em] hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-6">
            {loading && (
              <p className="text-[14px] text-on-surface-variant animate-pulse">Loading updates…</p>
            )}
            {!loading && announcements.length === 0 && (
              <p className="text-[14px] text-on-surface-variant">No announcements right now — check back soon.</p>
            )}
            {announcements.map((post) => (
              <div key={post.id} className="flex gap-4 pb-6 border-b border-outline-variant last:border-0 last:pb-0">
                <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                  <Megaphone size={20} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] leading-4 text-on-surface-variant mb-1">{formatDate(post.published_at)}</p>
                  <h4 className="text-[18px] leading-7 font-bold text-on-surface mb-2">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </h4>
                  <p className="text-[16px] leading-6 text-on-surface-variant line-clamp-2">{post.excerpt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick links */}
        <section className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6 flex flex-col">
          <h3 className="font-serif font-semibold text-on-surface text-[24px] leading-8 mb-6">Quick Links</h3>
          <div className="space-y-4 flex-1">
            {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="flex items-center justify-between p-4 rounded-lg bg-surface hover:bg-surface-container transition-colors border border-outline-variant/50 group"
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-[16px] leading-6 text-on-surface">{label}</span>
                </div>
                <ChevronRight size={18} className="text-on-surface-variant" />
              </Link>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-outline-variant">
            <p className="text-[12px] leading-4 text-on-surface-variant text-center">
              Need something else?
              <br />
              <Link href="/contact" className="text-primary font-semibold hover:underline">
                Contact the Leasing Office.
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
