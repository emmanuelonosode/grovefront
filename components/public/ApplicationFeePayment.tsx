"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle, Camera, ShieldCheck, Lock, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/auth";
import { cn } from "@/lib/utils";

const API_BASE = typeof window !== "undefined"
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL ?? "https://admin.haskerrealtygroup.com");

interface PaymentConfig {
  method: string;
  display_name: string;
  handle: string;
  extra_instructions: string;
  recipient_name: string;
  bank_name: string;
  account_type: string;
  account_number: string;
  routing_number: string;
  swift_bic: string;
  bank_address: string;
  recipient_address: string;
}

const EMPTY_BANK = {
  recipient_name: "", bank_name: "", account_type: "", account_number: "",
  routing_number: "", swift_bic: "", bank_address: "", recipient_address: "",
};

const FALLBACK_METHODS: PaymentConfig[] = [
  { method: "VENMO",         display_name: "Venmo",         handle: "@HaskerRealty",                  extra_instructions: "",                                          ...EMPTY_BANK },
  { method: "CASHAPP",       display_name: "Cash App",      handle: "$HaskerRealty",                  extra_instructions: "",                                          ...EMPTY_BANK },
  { method: "PAYPAL",        display_name: "PayPal",        handle: "payments@haskerrealtygroup.com", extra_instructions: "Use Friends & Family to avoid delays.",      ...EMPTY_BANK },
  { method: "CHIME",         display_name: "Chime",         handle: "@Hasker-Realty",                 extra_instructions: "",                                          ...EMPTY_BANK },
  { method: "BANK_TRANSFER", display_name: "Bank Transfer", handle: "info@haskerrealtygroup.com",     extra_instructions: "Contact us for full wire transfer details.", ...EMPTY_BANK },
];

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

/* ── Inline payment logos (mirrors the tenant portal) ─────────────────────── */
function VenmoLogo() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#3D95CE"/>
      <path d="M22 9c.7 1.2 1 2.6 1 4.3 0 5-4.3 11.5-7.8 15.7H9.1L6.5 9.6l5.6-.5 1.3 10.8c1.2-2.3 2.8-6 2.8-8.5 0-1.4-.2-2.4-.6-3.1L22 9z" fill="white"/>
    </svg>
  );
}
function PayPalLogo() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#F4F6F8"/>
      <path d="M19.8 8H14a.5.5 0 0 0-.5.4L11 23.6c0 .2.1.4.4.4h2.6c.3 0 .5-.2.5-.5l.6-3.7c.1-.3.3-.5.6-.5H17c3.4 0 5.5-1.7 6-4.9.3-1.4 0-2.6-.6-3.4C21.7 9.7 20.9 8 19.8 8zm.5 5c-.3 2-1.7 2-3 2h-.8l.6-3.6c0-.2.2-.3.3-.3h.4c.9 0 1.8 0 2.2.5.3.4.4.9.3 1.4z" fill="#003087"/>
      <path d="M22.5 13h-2.6c-.2 0-.3.1-.3.3l-.1.5c.5-.7 1.5-1 2.5-1h.2c1.8 0 3 .8 3.4 2.3.7 2.8-1.2 5.2-4 5.2h-.9c-.3 0-.5.2-.6.4l-.6 3.7c0 .2-.2.4-.4.4h-2.4c-.2 0-.4-.2-.3-.4l1.2-7.7" fill="#009CDE"/>
    </svg>
  );
}
function CashAppLogo() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#00D64F"/>
      <path d="M17.2 9.5V8h-2.4v1.6c-2 .4-3.3 1.8-3.3 3.5 0 2 1.7 2.8 3.3 3.4 1.4.5 2.4.9 2.4 1.8 0 .8-.7 1.3-2 1.3-1.3 0-2.5-.6-3.3-1.4l-1 1.5c.8.9 2 1.5 3.9 1.7V24h2.4v-1.6c2.2-.4 3.5-1.9 3.5-3.7 0-2-1.7-2.9-3.4-3.5-1.4-.5-2.2-.9-2.2-1.6 0-.7.6-1.1 1.5-1.1 1.1 0 2.2.5 2.9 1.2l1-1.5c-.9-.8-2.1-1.3-3.3-1.7z" fill="white"/>
    </svg>
  );
}
function ChimeLogo() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#1DA462"/>
      <path d="M16 7C10.5 7 6 11.5 6 17s4.5 10 10 10 10-4.5 10-10S21.5 7 16 7zm.5 15.5c-3 0-5.5-2.5-5.5-5.5s2.5-5.5 5.5-5.5c1.5 0 2.8.6 3.8 1.5l-1.8 1.8c-.5-.5-1.2-.8-2-.8-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.3 2-.8l1.8 1.8c-1 1-2.3 1.5-3.8 1.5z" fill="white"/>
    </svg>
  );
}
function ZelleLogo() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#6D1ED4"/>
      <path d="M24 9H8v3l9.5 8H8v3h16v-3L14.5 12H24V9z" fill="white"/>
    </svg>
  );
}
const PAYMENT_LOGOS: Record<string, React.ReactNode> = {
  VENMO: <VenmoLogo />, PAYPAL: <PayPalLogo />, CASHAPP: <CashAppLogo />,
  CHIME: <ChimeLogo />, BANK_TRANSFER: <ZelleLogo />,
};

interface Props {
  applicationId: number;
  amount: number;
  applicantName?: string;
  onPaid: () => void;
  onSkip: () => void;
}

/**
 * Final step of the rental application: a $100 application fee paid via the same
 * manual methods the tenant portal uses (Venmo / Cash App / PayPal / Chime /
 * bank). The applicant pays externally, then uploads proof — which posts to the
 * shared `submit-proof` endpoint tied to their rental_application. Staff verify
 * it in the admin, which flips `is_fee_paid`.
 */
export function ApplicationFeePayment({ applicationId, amount, applicantName, onPaid, onSkip }: Props) {
  const [methods, setMethods] = useState<PaymentConfig[]>(FALLBACK_METHODS);
  const [method, setMethod] = useState("VENMO");
  const [refId, setRefId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Entrance animation flag (motion-safe only — see classes below).
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/v1/transactions/payment-config/`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && Array.isArray(data) && data.length > 0) {
          setMethods(data);
          setMethod(data[0].method);
        }
      })
      .catch(() => { /* keep fallback methods */ });
    return () => { active = false; };
  }, []);

  const current = methods.find((m) => m.method === method) ?? methods[0];
  const isBankTransfer = current.method === "BANK_TRANSFER";
  const hasBankDetails = !!(current.account_number || current.routing_number || current.recipient_name);

  const copy = useCallback((value: string) => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, []);

  const bankRows = [
    { label: "Recipient Name",            value: current.recipient_name,    copyable: false },
    { label: "Bank Name",                 value: current.bank_name,         copyable: false },
    { label: "Account Type",              value: current.account_type,      copyable: false },
    { label: "Account Number",            value: current.account_number,    copyable: true },
    { label: "Routing Number (Wire/ABA)", value: current.routing_number,    copyable: true },
    { label: "SWIFT / BIC Code",          value: current.swift_bic,         copyable: true },
    { label: "Bank Address",              value: current.bank_address,      copyable: false },
    { label: "Zelle / Email",             value: isBankTransfer && !hasBankDetails ? current.handle : "", copyable: true },
  ].filter((r) => r.value);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!refId.trim()) { setError("Enter your transaction reference (your username or confirmation ID)."); return; }
    if (!file) { setError("Please upload a screenshot of your payment."); return; }
    setLoading(true); setError("");
    try {
      const formData = new FormData();
      formData.append("rental_application", String(applicationId));
      formData.append("amount", String(amount));
      formData.append("payment_method", method);
      formData.append("reference_id", refId.trim());
      formData.append("proof_file", file);
      formData.append("allocated_items", JSON.stringify(["Application Fee"]));

      const res = await apiFetch(`${API_BASE}/api/v1/transactions/my-payments/submit-proof/`, {
        method: "POST", body: formData,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.detail ?? data?.proof_file ?? (Object.values(data ?? {}).flat()[0] as string) ?? "Failed to submit payment proof.";
        throw new Error(String(msg));
      }
      onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-brand mb-2">Final step</p>
        <h1 className="text-[26px] font-bold text-[#101828] leading-tight">
          {applicantName ? `Almost there, ${applicantName}.` : "Almost there."}
        </h1>
        <p className="mt-2 text-[15px] text-[#667085] leading-relaxed">
          A one-time application fee secures your spot and covers credit &amp; background screening and processing.
        </p>
      </div>

      {/* ── Amount card ─────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#1E3A5F] text-white px-5 py-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">Application fee</p>
          <p className="text-[13px] text-white/70 mt-1">Credit &amp; background screening + processing</p>
        </div>
        <p className="text-[32px] font-bold tabular-nums leading-none">{fmt(amount)}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Method selector ───────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold text-[#667085] uppercase tracking-[0.12em] mb-3">Choose how to pay</p>
          <div className="space-y-2.5">
            {methods.map((m, i) => {
              const active = method === m.method;
              return (
                <button
                  key={m.method}
                  type="button"
                  onClick={() => setMethod(m.method)}
                  style={{ transitionDelay: mounted ? "0ms" : `${i * 45}ms` }}
                  className={cn(
                    "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 text-left",
                    "transition-[transform,opacity,border-color,background-color] duration-200 ease-out active:scale-[0.98]",
                    "motion-safe:[&]:will-change-transform",
                    !mounted && "motion-safe:opacity-0 motion-safe:translate-y-2",
                    active
                      ? "border-brand bg-brand/[0.04] shadow-sm"
                      : "border-[#E5E5EA] bg-white hover:border-[#C7C7CC]"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-sm">
                    {PAYMENT_LOGOS[m.method]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-[15px] font-semibold leading-tight", active ? "text-brand" : "text-[#101828]")}>
                      {m.display_name}
                    </p>
                    {(m.handle || m.recipient_name) && (
                      <p className="text-[13px] text-[#667085] mt-0.5 truncate">{m.handle || m.recipient_name}</p>
                    )}
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors duration-150",
                    active ? "border-brand bg-brand" : "border-[#C7C7CC]"
                  )}>
                    {active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Send-to / bank details ────────────────────────── */}
        {isBankTransfer ? (
          <div className="rounded-2xl overflow-hidden border border-[#E5E5EA]">
            <div className="bg-[#1A3557] px-4 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">{PAYMENT_LOGOS.BANK_TRANSFER}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  {hasBankDetails ? "Wire / ACH Transfer" : current.display_name}
                </p>
                <p className="text-[15px] font-bold text-white leading-tight truncate">{current.bank_name || "Bank Transfer"}</p>
              </div>
              <p className="text-[18px] font-bold text-white tabular-nums shrink-0">{fmt(amount)}</p>
            </div>
            {bankRows.length > 0 && (
              <div className="bg-white divide-y divide-[#F2F2F7]">
                {bankRows.map((row) => (
                  <div key={row.label} className="px-4 py-3.5">
                    <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-[0.1em] mb-1.5">{row.label}</p>
                    <div className="flex items-start gap-2.5">
                      <p className="flex-1 text-[14px] font-semibold text-[#101828] leading-snug break-words min-w-0">{row.value}</p>
                      {row.copyable && (
                        <button
                          type="button"
                          onClick={() => copy(row.value)}
                          className="shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg bg-[#F0F0F5] text-[#3C3C43] hover:bg-[#E5E5EA] transition-colors active:scale-[0.96]"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {current.extra_instructions && (
              <p className="text-[12px] text-amber-700 bg-amber-50 border-t border-amber-100 px-4 py-3 leading-relaxed">
                {current.extra_instructions}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-[#1E3A5F] rounded-2xl p-5 text-white">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Send {fmt(amount)} to</p>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md mt-0.5">{PAYMENT_LOGOS[current.method]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[20px] font-bold tracking-tight break-all leading-snug">{current.handle}</p>
                <p className="text-[12px] text-white/50 mt-0.5">{current.display_name}</p>
              </div>
              {current.handle && (
                <button
                  type="button"
                  onClick={() => copy(current.handle)}
                  className={cn(
                    "shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors active:scale-[0.96] mt-0.5",
                    copied ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                  )}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            {current.extra_instructions && (
              <p className="text-[12px] text-white/40 mt-3 leading-relaxed">{current.extra_instructions}</p>
            )}
          </div>
        )}

        {/* ── Reference ─────────────────────────────────────── */}
        <div>
          <label className="block text-[11px] font-semibold text-[#667085] uppercase tracking-wide mb-1.5 px-1">
            {isBankTransfer ? "Transaction / Confirmation ID" : `Your ${current.display_name} username / reference`}
          </label>
          <input
            value={refId}
            onChange={(e) => setRefId(e.target.value)}
            placeholder={
              method === "CASHAPP" ? "$Cashtag" :
              method === "VENMO" ? "@Username" :
              method === "BANK_TRANSFER" ? "e.g. Wire confirmation number" :
              "Confirmation ID or email"
            }
            className="w-full rounded-xl bg-[#F5F5F7] px-4 py-3.5 text-[15px] text-[#101828] outline-none focus:ring-2 focus:ring-brand/25 focus:bg-white border border-transparent transition-all"
          />
        </div>

        {/* ── Proof upload ──────────────────────────────────── */}
        <div>
          <label className="block text-[11px] font-semibold text-[#667085] uppercase tracking-wide mb-1.5 px-1">
            Payment screenshot
          </label>
          <label className={cn(
            "flex items-center justify-center gap-3 w-full py-5 rounded-2xl border-2 border-dashed cursor-pointer transition-colors",
            file ? "border-brand bg-brand/5" : "border-black/10 bg-[#F5F5F7] hover:border-black/20"
          )}>
            <input type="file" accept="image/*" className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] || null)} />
            {file ? (
              <>
                <CheckCircle size={18} className="text-brand shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-brand truncate max-w-[220px]">{file.name}</p>
                  <p className="text-[10px] text-brand/60">{(file.size / 1024 / 1024).toFixed(1)} MB · tap to change</p>
                </div>
              </>
            ) : (
              <>
                <Camera size={20} className="text-[#667085] opacity-50 shrink-0" />
                <div>
                  <p className="text-[13px] font-medium text-[#667085]">Upload payment screenshot</p>
                  <p className="text-[11px] text-[#667085] opacity-60">PNG, JPG — up to 10 MB</p>
                </div>
              </>
            )}
          </label>
        </div>

        {error && (
          <p className="text-[13px] text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100">{error}</p>
        )}

        {/* ── Submit ────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[60px] flex items-center justify-center gap-2 bg-brand text-white text-[16px] font-bold rounded-2xl shadow-lg shadow-brand/20 hover:bg-brand-hover transition-[transform,background-color] duration-150 ease-out active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? (
            <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
          ) : (
            <><Lock size={16} /> I&apos;ve paid {fmt(amount)} — submit proof</>
          )}
        </button>

        <div className="flex items-center justify-center gap-2 text-[#667085]">
          <ShieldCheck size={13} className="text-[#34C759]" />
          <p className="text-[12px]">Manually verified within 1–2 business hours.</p>
        </div>

        {/* ── Pay later escape hatch ────────────────────────── */}
        <button
          type="button"
          onClick={onSkip}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1.5 text-[14px] font-semibold text-[#667085] hover:text-[#101828] transition-colors disabled:opacity-50 py-1"
        >
          I&apos;ll pay the fee later <ArrowRight size={15} />
        </button>
        <p className="text-center text-[12px] text-[#98A2B3] -mt-3">
          Your application is already submitted. It will be processed once the fee is received.
        </p>
      </form>
    </div>
  );
}
