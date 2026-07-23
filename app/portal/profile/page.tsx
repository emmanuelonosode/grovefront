"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home, CreditCard, AlertCircle, CheckCircle, ArrowRight,
  MapPin, Clock, Wrench, Search,
  FileText, ChevronRight, Building2, Mail, Wallet,
  ListTodo, Heart, ChevronDown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/auth";
import { cn, toCardImageUrl } from "@/lib/utils";

const API_BASE = "";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Transaction {
  id: number;
  transaction_type: "RENT" | "SALE" | "LEASE";
  agreed_price: string;
  status: "PENDING" | "DEPOSIT_PAID" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  created_at: string;
  property: { title: string; address: string; city: string; state: string };
}

interface Invoice {
  id: number;
  invoice_number: string;
  issued_date: string;
  due_date: string;
  total: string;
  status: "SENT" | "PAID" | "DRAFT" | "VOID";
  pdf: string | null;
  property_title: string;
  transaction_type: string;
}

interface Application {
  id: number;
  status: string;
  submitted_at: string;
  property_title: string;
}

interface Payment {
  id: number;
  amount: string;
  payment_method: string;
  status: string;
  created_at: string;
}

interface Favorite {
  id: number;
  property: {
    slug: string;
    title: string;
    primary_image_url: string;
    price: string;
    listing_type?: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting(name: string) {
  const h = new Date().getHours();
  const tod = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${tod}, ${name}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function fmtMoney(v: string | number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(typeof v === "string" ? parseFloat(v) : v);
}

function isOverdue(dueDate: string) {
  return new Date(dueDate) < new Date();
}

function todayFormatted() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function txLabel(type: string) {
  return type === "RENT" ? "Rental" : type === "SALE" ? "Purchase" : "Lease";
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    PENDING: "Pending", DEPOSIT_PAID: "Deposit Paid",
    IN_PROGRESS: "Active", COMPLETED: "Completed", CANCELLED: "Cancelled",
  };
  return m[s] ?? s;
}

function appStatusLabel(s: string) {
  const m: Record<string, string> = {
    DRAFT: "Draft",
    PENDING_PAYMENT: "Pending Payment",
    PENDING_VERIFICATION: "Verifying Payment",
    SUBMITTED: "Submitted",
    REVIEWED: "Under Review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    PAYMENT_FAILED: "Payment Failed",
  };
  return m[s] ?? s;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-black/[0.04]", className)} />;
}

// ── Card Shell ────────────────────────────────────────────────────────────────

function Card({
  className,
  children,
  href,
}: {
  className?: string;
  children: React.ReactNode;
  href?: string;
}) {
  const base = cn(
    "bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant",
    href && "cursor-pointer hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:scale-[1.01] transition-all duration-200",
    className
  );
  if (href) return <Link href={href} className={base}>{children}</Link>;
  return <div className={base}>{children}</div>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApp, setExpandedApp] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch(`${API_BASE}/api/v1/transactions/`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      apiFetch(`${API_BASE}/api/v1/transactions/my-invoices/`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      apiFetch(`${API_BASE}/api/v1/leads/apply/my-applications/`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      apiFetch(`${API_BASE}/api/v1/transactions/my-payments/`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
      apiFetch(`${API_BASE}/api/v1/properties/favorites/`).then((r) => (r.ok ? r.json() : [])).catch(() => []),
    ])
      .then(([txData, invData, appData, payData, favData]) => {
        setTransactions(txData?.results ?? (Array.isArray(txData) ? txData : []));
        setInvoices(invData?.results ?? (Array.isArray(invData) ? invData : []));
        setApplications(appData?.results ?? (Array.isArray(appData) ? appData : []));
        setPayments(payData?.results ?? (Array.isArray(payData) ? payData : []));
        setFavorites(favData?.results ?? (Array.isArray(favData) ? favData : []));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = transactions.find((t) =>
    ["IN_PROGRESS", "DEPOSIT_PAID", "PENDING"].includes(t.status)
  );
  const outstanding = invoices
    .filter((i) => i.status === "SENT")
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  const recentPaid = invoices.filter((i) => i.status === "PAID").slice(0, 3);
  const totalOutstanding = outstanding.reduce((s, i) => s + parseFloat(i.total), 0);
  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join("") || "?";

  return (
    <div className="p-4 md:p-12 w-full max-w-7xl mx-auto">
      <div className="space-y-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif font-bold text-on-surface mb-2 text-[32px] leading-10 md:text-[48px] md:leading-[56px]" style={{ letterSpacing: "-0.02em" }}>
              {greeting(user?.first_name ?? "there")}
            </h2>
            <p className="text-[18px] leading-7 text-on-surface-variant">{todayFormatted()}</p>
          </div>
          <div className="shrink-0 w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary text-[16px] font-bold select-none shadow-sm">
            {initials}
          </div>
        </header>

        {/* ── KPI Widgets ───────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[104px]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiWidget
              icon={Home}
              label="Property"
              value={active ? active.property.city : "None"}
              sub={active?.property.state ?? "No lease yet"}
              accent="blue"
            />
            <KpiWidget
              icon={Wallet}
              label="Monthly Rent"
              value={active ? fmtMoney(active.agreed_price) : "—"}
              sub={active ? txLabel(active.transaction_type) : "No active lease"}
              accent="blue"
            />
            <KpiWidget
              icon={AlertCircle}
              label="Outstanding"
              value={outstanding.length > 0 ? fmtMoney(totalOutstanding) : "Clear"}
              sub={outstanding.length > 0 ? `${outstanding.length} due` : "All settled"}
              accent={outstanding.length > 0 ? "amber" : "green"}
              urgent={outstanding.length > 0}
            />
            <KpiWidget
              icon={CheckCircle}
              label="Paid"
              value={String(invoices.filter((i) => i.status === "PAID").length)}
              sub="Invoices paid"
              accent="green"
            />
          </div>
        )}

        {/* ── Bento Grid ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left Column */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <Skeleton className="h-80" />
            ) : active ? (
              <LeaseCard transaction={active} />
            ) : (
              <Card>
                <PanelHeader
                  title="My Applications"
                  badge={applications.length > 0 ? String(applications.length) : undefined}
                  badgeColor="blue"
                  href="/homes-for-rent"
                  linkLabel="Browse"
                />
                {applications.length === 0 ? (
                  <NoLeaseContent />
                ) : (
                  <div className="divide-y divide-black/[0.04] px-2 pb-2">
                    {applications.slice(0, 4).map((app) => (
                      <ApplicationRow
                        key={app.id}
                        app={app}
                        expanded={expandedApp === app.id}
                        onToggle={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                      />
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Right column */}
          <div className="lg:col-span-3 space-y-4">

            {loading ? (
              <Skeleton className="h-48" />
            ) : outstanding.length > 0 && (
              <Card className="overflow-hidden">
                {/* Amber urgency stripe */}
                <div className="h-0.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400" />
                <PanelHeader
                  title="Outstanding"
                  badge={String(outstanding.length)}
                  badgeColor="amber"
                  href="/portal/payments"
                  linkLabel="Pay now"
                />
                <div className="divide-y divide-black/[0.04] px-2">
                  {outstanding.slice(0, 3).map((inv) => (
                    <InvoiceRow key={inv.id} invoice={inv} />
                  ))}
                </div>
              </Card>
            )}

            {loading ? (
              <Skeleton className="h-36" />
            ) : (
              <Card>
                <PanelHeader
                  title="Recent Payments"
                  href="/portal/payments"
                  linkLabel="History"
                />
                {payments.length === 0 ? (
                  <p className="px-5 pb-5 text-[13px] text-on-surface-variant">No payments recorded yet.</p>
                ) : (
                  <div className="divide-y divide-black/[0.04] px-2">
                    {payments.slice(0, 3).map((pay) => (
                      <PaymentRow key={pay.id} payment={pay} />
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* ── Saved Properties ──────────────────────────────────────────── */}
        {!loading && favorites.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-on-surface-variant px-1 mb-2.5">
              Saved Properties
            </p>
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
              {favorites.map((fav) => (
                <div key={fav.id} className="snap-start">
                  <FavoriteCard favorite={fav} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Actions ──────────────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-on-surface-variant px-1 mb-2.5">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: CreditCard, label: "Payments", desc: "Invoices & billing",
                href: "/portal/payments",
                iconBg: "bg-brand/10", iconColor: "text-brand",
              },
              {
                icon: FileText, label: "Documents", desc: "Agreements & files",
                href: "/portal/documents",
                iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
              },
              {
                icon: Wrench, label: "Maintenance", desc: "Submit a request",
                href: "/portal/maintenance",
                iconBg: "bg-amber-50", iconColor: "text-amber-600",
              },
              {
                icon: Search, label: "Browse Homes", desc: "Find properties",
                href: "/homes-for-rent",
                iconBg: "bg-purple-50", iconColor: "text-purple-600",
              },
            ].map(({ icon: Icon, label, desc, href, iconBg, iconColor }) => (
              <Card key={label} href={href} className="p-4 group">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-200", iconBg)}>
                  <Icon size={17} className={iconColor} strokeWidth={1.8} />
                </div>
                <p className="text-[13px] font-semibold text-on-surface leading-snug group-hover:text-brand transition-colors duration-200">
                  {label}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">{desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Support Strip ──────────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-5">
            <div className="flex items-center gap-3.5">
              <Image
                src="/illustrations/spot-handshake.png"
                alt=""
                width={44}
                height={44}
                className="shrink-0"
              />
              <div>
                <p className="text-[13px] font-semibold text-on-surface tracking-tight">
                  PrimeFamilyHousing
                </p>
                <p className="text-[12px] text-on-surface-variant">Your dedicated property management team</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <a
                href="mailto:info@primefamilyhousing.com"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-on-surface-variant border border-black/[0.1] bg-black/[0.03] px-3.5 py-2 rounded-xl hover:bg-black/[0.06] transition-colors duration-200"
              >
                <Mail size={12} />
                Email Us
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white bg-brand px-3.5 py-2 rounded-xl hover:bg-brand-hover transition-colors duration-200"
              >
                Get Support
              </Link>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}

// ── KPI Widget ────────────────────────────────────────────────────────────────

function KpiWidget({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  urgent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  accent: "blue" | "green" | "amber";
  urgent?: boolean;
}) {
  const iconStyles = {
    blue:  { bg: "bg-surface-container",    color: "text-primary"          },
    green: { bg: "bg-primary-fixed/50",     color: "text-[#2E7D32]"        },
    amber: { bg: "bg-secondary-fixed/60",   color: "text-terracotta-warm"  },
  }[accent];

  const valueColor = {
    blue:  "text-on-surface",
    green: "text-on-surface",
    amber: "text-terracotta-warm",
  }[accent];

  return (
    <div className={cn(
      "bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-5 flex items-start gap-4 transition-shadow duration-200",
      urgent && "ring-1 ring-terracotta-warm/30"
    )}>
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", iconStyles.bg)}>
        <Icon size={20} className={iconStyles.color} strokeWidth={1.8} />
      </div>
      <div className="min-w-0">
        <p className="text-[12px] leading-4 text-on-surface-variant mb-1 truncate">{label}</p>
        <p className={cn("font-serif text-[22px] font-semibold tracking-tight leading-7 truncate", valueColor)}>
          {value}
        </p>
        <p className="text-[12px] leading-4 text-on-surface-variant mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  );
}

// ── Lease Card ────────────────────────────────────────────────────────────────

function LeaseCard({ transaction: t }: { transaction: Transaction }) {
  const statusColor: Record<string, string> = {
    IN_PROGRESS:  "text-emerald-400 bg-emerald-400/10",
    DEPOSIT_PAID: "text-brand bg-brand/10",
    PENDING:      "text-amber-400 bg-amber-400/10",
  };
  const sc = statusColor[t.status] ?? "text-white/40 bg-white/[0.06]";

  return (
    <div className="h-full rounded-xl bg-brand-dark overflow-hidden flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
      <div className="h-0.5 bg-gradient-to-r from-brand via-blue-400 to-blue-600" />

      <div className="flex-1 p-5 flex flex-col gap-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-white/[0.08] text-white/60 uppercase tracking-wider">
            {txLabel(t.transaction_type)}
          </span>
          <span className={cn("text-[10px] font-semibold px-2 py-1 rounded-lg", sc)}>
            {statusLabel(t.status)}
          </span>
        </div>

        <div>
          <h2 className="text-[17px] font-semibold text-white tracking-tight leading-snug">
            {t.property.title}
          </h2>
          <p className="text-[12px] text-white/40 mt-1.5 flex items-center gap-1">
            <MapPin size={11} className="shrink-0" />
            {t.property.address}, {t.property.city}, {t.property.state}
          </p>
        </div>

        <div className="rounded-xl bg-white/[0.06] border border-white/[0.07] px-4 py-3.5">
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium mb-1">
            {t.transaction_type === "RENT" ? "Monthly Rent" : "Agreed Price"}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-bold text-white tracking-tight leading-none">
              {fmtMoney(t.agreed_price)}
            </span>
            {t.transaction_type === "RENT" && (
              <span className="text-[13px] text-white/40 font-medium">/mo</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[12px] text-white/30">
          <Clock size={11} className="shrink-0" />
          Member since {fmtDate(t.created_at)}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-auto">
          <Link
            href="/portal/payments"
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand text-white text-[12px] font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-hover transition-colors duration-200"
          >
            <CreditCard size={13} strokeWidth={2} />
            View Invoices
            <ArrowRight size={12} strokeWidth={2} />
          </Link>
          <a
            href="mailto:info@primefamilyhousing.com"
            className="flex-1 flex items-center justify-center gap-1.5 bg-white/[0.08] text-white text-[12px] font-semibold px-4 py-2.5 rounded-xl hover:bg-white/[0.14] transition-colors duration-200 border border-white/[0.07]"
          >
            <Mail size={13} strokeWidth={2} />
            Contact
          </a>
        </div>
      </div>
    </div>
  );
}

// ── No Lease Content (renders inside a Card — no own card wrapper) ─────────────

function NoLeaseContent() {
  return (
    <div className="min-h-[220px] p-6 flex flex-col items-center justify-center text-center gap-3">
      <Image
        src="/illustrations/spot-house.png"
        alt=""
        width={96}
        height={96}
        className="opacity-90"
        priority={false}
      />
      <div>
        <h2 className="text-[15px] font-semibold text-on-surface tracking-tight mb-1.5">
          No active lease yet
        </h2>
        <p className="text-[12px] text-on-surface-variant leading-relaxed max-w-[210px] mx-auto">
          Once our team links your tenancy, everything will appear here.
        </p>
      </div>
      <div className="flex flex-col gap-2 w-full">
        <Link
          href="/homes-for-rent"
          className="flex items-center justify-center gap-1.5 bg-brand text-white text-[12px] font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-hover transition-colors duration-200"
        >
          <Search size={13} strokeWidth={2} />
          Browse Available Homes
        </Link>
        <a
          href="mailto:info@primefamilyhousing.com"
          className="flex items-center justify-center gap-1.5 text-[12px] font-semibold text-on-surface-variant border border-black/[0.1] bg-black/[0.02] px-4 py-2.5 rounded-xl hover:bg-black/[0.04] transition-colors duration-200"
        >
          <Mail size={13} strokeWidth={2} />
          Contact Our Team
        </a>
      </div>
    </div>
  );
}

// ── Panel Header ──────────────────────────────────────────────────────────────

function PanelHeader({
  title,
  badge,
  badgeColor = "blue",
  href,
  linkLabel,
}: {
  title: string;
  badge?: string;
  badgeColor?: "amber" | "blue" | "green";
  href: string;
  linkLabel: string;
}) {
  const bc = {
    amber: "bg-secondary-fixed/60 text-[#BC6C25]",
    blue:  "bg-primary-fixed text-on-primary-fixed",
    green: "bg-primary-fixed/50 text-[#2E7D32]",
  }[badgeColor];

  return (
    <div className="flex items-center justify-between px-6 pt-6 pb-4">
      <div className="flex items-center gap-2.5">
        <span className="font-serif text-[20px] leading-7 font-semibold text-on-surface tracking-tight">{title}</span>
        {badge && (
          <span className={cn("text-[12px] leading-4 font-semibold px-2.5 py-0.5 rounded-full", bc)}>
            {badge}
          </span>
        )}
      </div>
      <Link
        href={href}
        className="flex items-center gap-0.5 text-[12px] font-semibold text-brand hover:text-brand-hover transition-colors duration-200"
      >
        {linkLabel}
        <ChevronRight size={13} strokeWidth={2.5} />
      </Link>
    </div>
  );
}

// ── Invoice Row ───────────────────────────────────────────────────────────────

function InvoiceRow({ invoice: inv }: { invoice: Invoice }) {
  const overdue = isOverdue(inv.due_date);
  return (
    <Link
      href="/portal/payments"
      className="flex items-center gap-3 px-3 py-3.5 hover:bg-black/[0.02] rounded-xl transition-colors duration-200 group"
    >
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
        overdue ? "bg-red-50" : "bg-surface-container-low"
      )}>
        <AlertCircle size={13} className={overdue ? "text-error" : "text-on-surface-variant"} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-on-surface truncate">{inv.invoice_number}</p>
          {overdue && (
            <span className="text-[10px] font-bold bg-red-50 text-error px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0">
              Overdue
            </span>
          )}
        </div>
        <p className="text-[11px] text-on-surface-variant truncate">Due {fmtDate(inv.due_date)}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <p className={cn("text-[13px] font-semibold", overdue ? "text-error" : "text-on-surface")}>
          {fmtMoney(inv.total)}
        </p>
        <ChevronRight size={13} className="text-outline-variant group-hover:text-brand transition-colors duration-200" strokeWidth={2.5} />
      </div>
    </Link>
  );
}

// ── Application Row ───────────────────────────────────────────────────────────

function ApplicationRow({
  app,
  expanded,
  onToggle,
}: {
  app: Application;
  expanded: boolean;
  onToggle: () => void;
}) {
  const roadmap = [
    { id: "submitted", label: "Applied",  done: app.status !== "DRAFT" },
    { id: "payment",   label: "Payment",  done: ["SUBMITTED", "REVIEWED", "APPROVED", "REJECTED"].includes(app.status), failed: app.status === "PAYMENT_FAILED" },
    { id: "reviewing", label: "Review",   done: ["REVIEWED", "APPROVED", "REJECTED"].includes(app.status) },
    { id: "decision",  label: "Decision", done: ["APPROVED", "REJECTED"].includes(app.status), failed: app.status === "REJECTED" },
  ];

  return (
    <div className="overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-3 py-3.5 hover:bg-black/[0.015] transition-colors duration-200 text-left cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
          <ListTodo size={13} className="text-brand" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-on-surface truncate">{app.property_title || "Application"}</p>
          <p className="text-[11px] text-on-surface-variant truncate">
            {app.submitted_at ? `Submitted ${fmtDate(app.submitted_at)}` : "Draft — not yet submitted"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold bg-surface-container-low text-on-surface-variant px-2 py-1 rounded-md uppercase tracking-wide">
            {appStatusLabel(app.status)}
          </span>
          <ChevronDown
            size={14}
            className={cn("text-outline-variant transition-transform duration-200", expanded && "rotate-180")}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-5 pt-1">
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-4">Application Progress</p>

            {/* Progress track */}
            <div className="relative flex items-start">
              {/* Connector line behind circles */}
              <div className="absolute left-[11px] right-[11px] top-[11px] h-0.5 bg-surface-container-high" />
              {roadmap.slice(0, -1).map((step, i) => {
                const nextDone = roadmap[i + 1]?.done;
                return (
                  <div
                    key={step.id + "-line-" + i}
                    className="absolute h-0.5 top-[11px] transition-colors duration-300"
                    style={{
                      left: `calc(${(i / (roadmap.length - 1)) * 100}% + 11px)`,
                      right: `calc(${100 - ((i + 1) / (roadmap.length - 1)) * 100}% + 11px)`,
                      backgroundColor: nextDone ? "#2E7D32" : "transparent",
                    }}
                  />
                );
              })}

              {roadmap.map((step, i) => (
                <div key={step.id} className="flex-1 flex flex-col items-center relative">
                  <div className={cn(
                    "w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 bg-surface-container-lowest relative z-10 transition-colors duration-300",
                    step.done
                      ? (step.failed ? "bg-red-500 border-red-500" : "bg-emerald-500 border-emerald-500")
                      : "border-outline-variant"
                  )}>
                    {step.done ? (
                      step.failed
                        ? <AlertCircle size={11} className="text-white" strokeWidth={2.5} />
                        : <CheckCircle size={11} className="text-white" strokeWidth={2.5} />
                    ) : (
                      <span className="text-[9px] font-bold text-outline-variant">{i + 1}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px] font-bold mt-1.5 uppercase tracking-tight text-center",
                    step.done ? "text-on-surface" : "text-outline-variant"
                  )}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-outline-variant/60 space-y-3">
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                {app.status === "DRAFT"                && "Your application has been saved but not yet submitted."}
                {app.status === "PENDING_PAYMENT"      && "A payment is required to complete your application submission."}
                {app.status === "PENDING_VERIFICATION" && "We are verifying your payment proof. This typically takes 1–2 hours."}
                {app.status === "SUBMITTED"            && "Your application is in our queue and will be reviewed shortly."}
                {app.status === "REVIEWED"             && "Our team is currently reviewing your background and credit history."}
                {app.status === "APPROVED"             && "Congratulations! Your application has been approved. Check your email for next steps."}
                {app.status === "REJECTED"             && "Unfortunately, your application was not approved at this time. Contact us to learn more."}
                {app.status === "PAYMENT_FAILED"       && "Your payment could not be verified. Please resubmit your proof of payment."}
              </p>
              {(app.status === "PENDING_PAYMENT" || app.status === "PAYMENT_FAILED") && (
                <Link
                  href="/portal/payments"
                  className="inline-flex items-center gap-1.5 bg-brand text-white text-[11px] font-bold px-3.5 py-2 rounded-lg hover:bg-brand-hover transition-colors duration-200"
                >
                  <CreditCard size={11} strokeWidth={2.5} />
                  Go to Payments
                  <ArrowRight size={10} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Payment Row ───────────────────────────────────────────────────────────────

function PaymentRow({ payment: pay }: { payment: Payment }) {
  const isVerified = pay.status === "VERIFIED" || pay.status === "SUCCESSFUL";
  const isRejected = pay.status === "REJECTED" || pay.status === "FAILED";

  return (
    <div className="flex items-center gap-3 px-3 py-3.5">
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
        isVerified ? "bg-emerald-50" : isRejected ? "bg-red-50" : "bg-amber-50"
      )}>
        {isVerified ? (
          <CheckCircle size={13} className="text-emerald-600" strokeWidth={2} />
        ) : isRejected ? (
          <AlertCircle size={13} className="text-error" strokeWidth={2} />
        ) : (
          <Clock size={13} className="text-amber-500" strokeWidth={2} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[13px] font-semibold text-on-surface truncate">{pay.payment_method}</p>
          {!isVerified && (
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide shrink-0",
              isRejected ? "bg-red-50 text-error" : "bg-amber-50 text-amber-600"
            )}>
              {pay.status === "PENDING_VERIFICATION" ? "Reviewing" : pay.status}
            </span>
          )}
        </div>
        <p className="text-[11px] text-on-surface-variant truncate">{fmtDate(pay.created_at)}</p>
      </div>
      <p className={cn(
        "text-[13px] font-semibold shrink-0",
        isVerified ? "text-emerald-600" : "text-on-surface"
      )}>
        {fmtMoney(pay.amount)}
      </p>
    </div>
  );
}

// ── Favorite Card ─────────────────────────────────────────────────────────────

function FavoriteCard({ favorite: fav }: { favorite: Favorite }) {
  const isRental = fav.property.listing_type === "for-rent" || fav.property.listing_type === "for-lease";
  return (
    <Link
      href={`/homes-for-rent/${fav.property.slug}`}
      className="group min-w-[200px] w-[200px] shrink-0 bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)] hover:scale-[1.01] transition-all duration-200 cursor-pointer"
    >
      <div className="h-[120px] bg-surface-container-low relative">
        {fav.property.primary_image_url ? (
          <Image
            src={toCardImageUrl(fav.property.primary_image_url)}
            alt={fav.property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="200px"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building2 className="text-outline-variant" size={24} />
          </div>
        )}
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
          <Heart size={12} className="text-error fill-[#ba1a1a]" />
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-[13px] font-semibold text-on-surface truncate">{fav.property.title}</h3>
        <p className="text-[12px] text-brand font-medium mt-0.5">
          {fmtMoney(fav.property.price)}{isRental ? "/mo" : ""}
        </p>
      </div>
    </Link>
  );
}
