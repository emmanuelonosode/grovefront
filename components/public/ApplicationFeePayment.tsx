"use client";

import { useState, useEffect, useCallback, useId } from "react";
import {
  CheckCircle, Shield, Camera, X, Copy,
  Check, Info, FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = typeof window !== "undefined"
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL ?? "https://admin.primefamilyhousing.com");

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

// ── Inline SVG Logos matching portal payments ────────────────────────────────
export function VenmoLogo() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#3D95CE"/>
      <path d="M22 9c.7 1.2 1 2.6 1 4.3 0 5-4.3 11.5-7.8 15.7H9.1L6.5 9.6l5.6-.5 1.3 10.8c1.2-2.3 2.8-6 2.8-8.5 0-1.4-.2-2.4-.6-3.1L22 9z" fill="white"/>
    </svg>
  );
}

export function PayPalLogo() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#F4F6F8"/>
      <path d="M19.8 8H14a.5.5 0 0 0-.5.4L11 23.6c0 .2.1.4.4.4h2.6c.3 0 .5-.2.5-.5l.6-3.7c.1-.3.3-.5.6-.5H17c3.4 0 5.5-1.7 6-4.9.3-1.4 0-2.6-.6-3.4C21.7 9.7 20.9 8 19.8 8zm.5 5c-.3 2-1.7 2-3 2h-.8l.6-3.6c0-.2.2-.3.3-.3h.4c.9 0 1.8 0 2.2.5.3.4.4.9.3 1.4z" fill="#003087"/>
      <path d="M22.5 13h-2.6c-.2 0-.3.1-.3.3l-.1.5c.5-.7 1.5-1 2.5-1h.2c1.8 0 3 .8 3.4 2.3.7 2.8-1.2 5.2-4 5.2h-.9c-.3 0-.5.2-.6.4l-.6 3.7c0 .2-.2.4-.4.4h-2.4c-.2 0-.4-.2-.3-.4l1.2-7.7" fill="#009CDE"/>
    </svg>
  );
}

export function CashAppLogo() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#00D64F"/>
      <path d="M17.2 9.5V8h-2.4v1.6c-2 .4-3.3 1.8-3.3 3.5 0 2 1.7 2.8 3.3 3.4 1.4.5 2.4.9 2.4 1.8 0 .8-.7 1.3-2 1.3-1.3 0-2.5-.6-3.3-1.4l-1 1.5c.8.9 2 1.5 3.9 1.7V24h2.4v-1.6c2.2-.4 3.5-1.9 3.5-3.7 0-2-1.7-2.9-3.4-3.5-1.4-.5-2.2-.9-2.2-1.6 0-.7.6-1.1 1.5-1.1 1.1 0 2.2.5 2.9 1.2l1-1.5c-.9-.8-2.1-1.3-3.3-1.7z" fill="white"/>
    </svg>
  );
}

export function ChimeLogo() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#1DA462"/>
      <path d="M16 7C10.5 7 6 11.5 6 17s4.5 10 10 10 10-4.5 10-10S21.5 7 16 7zm.5 15.5c-3 0-5.5-2.5-5.5-5.5s2.5-5.5 5.5-5.5c1.5 0 2.8.6 3.8 1.5l-1.8 1.8c-.5-.5-1.2-.8-2-.8-1.7 0-3 1.3-3 3s1.3 3 3 3c.8 0 1.5-.3 2-.8l1.8 1.8c-1 1-2.3 1.5-3.8 1.5z" fill="white"/>
    </svg>
  );
}

export function ZelleLogo() {
  return (
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#6D1ED4"/>
      <path d="M24 9H8v3l9.5 8H8v3h16v-3L14.5 12H24V9z" fill="white"/>
    </svg>
  );
}

export function getMethodMeta(methodKey: string) {
  const k = (methodKey || "").toUpperCase();
  if (k === "BANK_TRANSFER" || k.includes("ZELLE") || k.includes("BANK")) {
    return {
      name: "Zelle / Bank Transfer",
      logo: "/logo/Zelle_id9UrjyZ9y_1.svg",
      typeBadge: "Zero Processing Fee",
      placeholder: "e.g. Zelle Sender Name or Wire Confirmation #",
      sendLabel: "Send via Zelle / Bank Transfer",
    };
  }
  if (k.includes("CHIME")) {
    return {
      name: "Chime",
      logo: "/logo/chime.png",
      typeBadge: "Chime Pay",
      placeholder: "Your $ChimeSign or Email",
      sendLabel: "Send via Chime",
    };
  }
  if (k.includes("VENMO")) {
    return {
      name: "Venmo",
      logo: "/logo/Venmo_idYMSlb9QP_1.png",
      typeBadge: "Instant Transfer",
      placeholder: "Your @VenmoHandle or Phone",
      sendLabel: "Send via Venmo",
    };
  }
  if (k.includes("CASH")) {
    return {
      name: "Cash App",
      logo: "/logo/Cash_App_Logo_1.png",
      typeBadge: "Cash App Pay",
      placeholder: "Your $Cashtag",
      sendLabel: "Send via Cash App",
    };
  }
  if (k.includes("PAYPAL")) {
    return {
      name: "PayPal",
      logo: "/logo/PayPal_Logo_Alternative_2.webp",
      typeBadge: "PayPal Transfer",
      placeholder: "Your PayPal Email or Name",
      sendLabel: "Send via PayPal",
    };
  }
  if (k.includes("APPLE")) {
    return {
      name: "Apple Pay",
      logo: "/logo/Apple_Logo_2.webp",
      typeBadge: "Apple Cash",
      placeholder: "Your Apple Cash Name or Phone",
      sendLabel: "Send via Apple Cash",
    };
  }
  return {
    name: "Direct Transfer",
    logo: "/logo/logo.png",
    typeBadge: "Verified",
    placeholder: "Transaction Reference ID",
    sendLabel: "Send Payment",
  };
}

export const PAYMENT_LOGOS: Record<string, React.ReactNode> = {
  VENMO: <VenmoLogo />,
  PAYPAL: <PayPalLogo />,
  CASHAPP: <CashAppLogo />,
  CHIME: <ChimeLogo />,
  BANK_TRANSFER: <ZelleLogo />,
};

export interface PaymentConfig {
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
  is_active?: boolean;
}

const EMPTY_BANK: Pick<
  PaymentConfig,
  | "recipient_name"
  | "bank_name"
  | "account_type"
  | "account_number"
  | "routing_number"
  | "swift_bic"
  | "bank_address"
  | "recipient_address"
> = {
  recipient_name: "",
  bank_name: "",
  account_type: "",
  account_number: "",
  routing_number: "",
  swift_bic: "",
  bank_address: "",
  recipient_address: "",
};

export const FALLBACK_METHODS: PaymentConfig[] = [
  {
    method: "CASHAPP",
    display_name: "Cash App",
    handle: "$Michael-Skelton-29",
    extra_instructions: "Make sure to check the details before making any payment.",
    ...EMPTY_BANK,
  },
  {
    method: "VENMO",
    display_name: "Venmo",
    handle: "@Jerrymicheal-Skelton",
    extra_instructions: "Make sure to check the information before making any payment.",
    ...EMPTY_BANK,
  },
  {
    method: "CHIME",
    display_name: "Chime",
    handle: "$Michael-Skelton-29",
    extra_instructions: "Make sure to check the details before making any payment.",
    ...EMPTY_BANK,
  },
  {
    method: "BANK_TRANSFER",
    display_name: "Bank Transfer / Zelle",
    handle: "info@primefamilyhousing.com",
    extra_instructions: "make sure to check the information before making payment.",
    recipient_name: "Jerry Michael Skelton",
    bank_name: "Renasant Bank",
    account_type: "Checking Account",
    account_number: "8017909047",
    routing_number: "000000000",
    swift_bic: "RNSTUS42XXX",
    bank_address: "",
    recipient_address: "",
  },
  {
    method: "PAYPAL",
    display_name: "PayPal",
    handle: "payments@primefamilyhousing.com",
    extra_instructions: "Use Friends & Family to avoid processing delays.",
    ...EMPTY_BANK,
  },
];

export interface ManualPaymentSummary {
  method: string;
  displayName: string;
  referenceId: string;
  proofFile: File | null;
  proofFileName?: string;
  proofFileSize?: number;
  proofPreviewUrl?: string;
  amount: number;
}

// Backwards compatibility alias for components expecting CardSummary shape
export type CardSummary = {
  brand: string;
  last4: string;
  cardholderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  billingAddress: string;
  zipCode: string;
  status: "VERIFIED" | "WAIVED";
  paymentId?: number;
};

interface Props {
  amount?: number;
  adultsCount?: number;
  onAdultsCountChange?: (count: number) => void;
  applicantName?: string;
  initialData?: ManualPaymentSummary | null;
  onPaid: (paymentData: ManualPaymentSummary) => void;
}

export function ApplicationFeePayment({
  amount = 35.00,
  adultsCount = 1,
  onAdultsCountChange,
  applicantName,
  initialData,
  onPaid,
}: Props) {
  const fileInputId = useId();
  const [adults, setAdults] = useState<number>(adultsCount || 1);
  const [methods, setMethods] = useState<PaymentConfig[]>(FALLBACK_METHODS);
  const [method, setMethod] = useState<string>(initialData?.method || "BANK_TRANSFER");
  const [refId, setRefId] = useState<string>(initialData?.referenceId || "");
  const [file, setFile] = useState<File | null>(initialData?.proofFile || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.proofPreviewUrl || null);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (adultsCount && adultsCount >= 1) {
      setAdults(adultsCount);
    }
  }, [adultsCount]);

  const FEE_PER_ADULT = 35.00;
  const currentTotal = adults * FEE_PER_ADULT;

  const handleAdultsChange = (next: number) => {
    setAdults(next);
    onAdultsCountChange?.(next);
  };

  // Fetch active payment methods from backend
  useEffect(() => {
    let active = true;
    async function fetchConfigs() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/transactions/payment-config/`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && active) {
            const manualOnly = data.filter(
              (m: PaymentConfig) => m.is_active !== false && !m.method.startsWith("CARD_")
            );
            if (manualOnly.length > 0) {
              setMethods(manualOnly);
              // If current method is not in returned list, select first
              setMethod((prev) => (manualOnly.some((m: PaymentConfig) => m.method === prev) ? prev : manualOnly[0].method));
            }
          }
        }
      } catch {
        // Fallback already pre-populated
      }
    }
    fetchConfigs();
    return () => { active = false; };
  }, []);

  // Clean up object URL on unmount if it was a blob URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const copy = useCallback((value: string, key: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  }, []);

  const current = methods.find((m) => m.method === method) || methods[0] || FALLBACK_METHODS[0];
  const currentMeta = getMethodMeta(current.method);
  const isBankTransfer = current.method === "BANK_TRANSFER" || current.method.includes("ZELLE");
  const hasBankDetails = !!(current.account_number || current.routing_number || current.recipient_name);

  const bankRows = [
    { label: "Recipient Name",            value: current.recipient_name,    key: "recipient_name",  copyable: true },
    { label: "Bank Name",                 value: current.bank_name,         key: "bank_name" },
    { label: "Account Type",              value: current.account_type,      key: "account_type" },
    { label: "Account Number",            value: current.account_number,    key: "account_number",  copyable: true },
    { label: "Routing Number (Wire/ABA)", value: current.routing_number,    key: "routing_number",  copyable: true },
    { label: "SWIFT / BIC Code",          value: current.swift_bic,         key: "swift_bic",       copyable: true },
    { label: "Bank Address",              value: current.bank_address,      key: "bank_address" },
    { label: "Recipient Address",         value: current.recipient_address, key: "recipient_address" },
    { label: "Zelle / Email",             value: isBankTransfer && !hasBankDetails ? current.handle : "", key: "handle", copyable: true },
  ].filter((r) => Boolean(r.value));

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!refId.trim()) {
      setError(
        isBankTransfer
          ? "Please enter your wire or transfer confirmation number."
          : `Please enter your ${currentMeta.name} username or transaction reference.`
      );
      return;
    }

    if (!file && !previewUrl) {
      setError("Please upload a screenshot of your transfer receipt before continuing.");
      return;
    }

    onPaid({
      method: current.method,
      displayName: currentMeta.name,
      referenceId: refId.trim(),
      proofFile: file,
      proofFileName: file?.name || initialData?.proofFileName || "payment-receipt.png",
      proofFileSize: file?.size || initialData?.proofFileSize || 0,
      proofPreviewUrl: previewUrl || initialData?.proofPreviewUrl,
      amount: currentTotal,
    });
  };

  return (
    <div className="max-w-[560px] mx-auto font-sans text-[#30313d] bg-white py-2 select-none">
      {/* ── Header / Order Summary ── */}
      <div className="mb-6">
        <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-brand mb-1">
          Application Fee Payment
        </p>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[24px] font-bold text-[#101828] tracking-tight">
            Pay {fmt(currentTotal)} Refundable Fee
          </h2>
          <div className="flex items-baseline gap-1 bg-[#F5F5F7] px-3 py-1 rounded-xl shrink-0">
            <span className="text-[20px] font-black text-[#101828] tabular-nums">
              {fmt(currentTotal)}
            </span>
            <span className="text-[11px] font-bold text-[#6E6E73] uppercase tracking-wider">
              USD
            </span>
          </div>
        </div>

        <p className="text-[13px] text-[#475467] mt-1.5 flex items-center gap-1.5">
          <Shield size={15} className="text-[#2E7D32] shrink-0" />
          <span>Pay using your preferred payment app. 100% refundable if not approved.</span>
        </p>

        {/* Adult Selection Card */}
        <div className="mt-4 bg-[#f8f9fa] border border-[#e6ebf1] rounded-2xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[14px] font-bold text-[#101828]">
                Number of Adult Applicants (18+)
              </p>
              <p className="text-[12px] text-[#667085] mt-0.5">
                $35.00 screening fee per adult
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-neutral-300 rounded-xl bg-white overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => handleAdultsChange(Math.max(1, adults - 1))}
                  disabled={adults <= 1}
                  className="w-9 h-9 flex items-center justify-center text-lg font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  aria-label="Decrease adults"
                >
                  –
                </button>
                <span className="w-12 text-center text-[15px] font-black text-brand-dark tabular-nums select-none">
                  {adults}
                </span>
                <button
                  type="button"
                  onClick={() => handleAdultsChange(Math.min(10, adults + 1))}
                  disabled={adults >= 10}
                  className="w-9 h-9 flex items-center justify-center text-lg font-bold text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  aria-label="Increase adults"
                >
                  +
                </button>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] font-bold text-[#667085] uppercase tracking-wider">Total Fee</p>
                <p className="text-[17px] font-black text-brand tabular-nums">{fmt(currentTotal)}</p>
              </div>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-neutral-200/60 flex items-center justify-between text-[11.5px] text-[#667085]">
            <span>Calculation: {adults} {adults === 1 ? "adult" : "adults"} × $35.00</span>
            <span className="font-semibold text-brand-dark">Amount Due: {fmt(currentTotal)}</span>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-3.5 text-[12px] text-[#475467] leading-relaxed bg-[#f8f9fa] border border-[#e6ebf1] rounded-xl p-3.5 flex items-start gap-2.5">
          <Info size={16} className="text-brand shrink-0 mt-0.5" />
          <div>
            <p>
              Send exactly <strong>{fmt(currentTotal)}</strong> using any of our verified payment options below. Once transferred, enter your reference username and upload a quick screenshot receipt.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleContinue} className="space-y-6">
        {/* ── Choose Payment Method (matching portal payment list) ── */}
        <div>
          <label className="block text-[11px] font-bold text-[#475467] uppercase tracking-[0.12em] mb-2.5">
            1. Select Payment Method
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            {methods.map((m) => {
              const active = method === m.method;
              const meta = getMethodMeta(m.method);
              return (
                <button
                  key={m.method}
                  type="button"
                  onClick={() => {
                    setMethod(m.method);
                    setError("");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer",
                    active
                      ? "border-brand bg-brand/[0.04] shadow-sm ring-2 ring-brand/10"
                      : "border-[#E5E5EA] bg-white hover:border-[#D1D1D6]"
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200/80 shadow-xs shrink-0 flex items-center justify-center p-1.5 overflow-hidden">
                    {meta.logo ? (
                      <img
                        src={meta.logo}
                        alt={meta.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      PAYMENT_LOGOS[m.method] || <FileText size={22} className="text-brand" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-[15px] font-black leading-tight", active ? "text-brand" : "text-[#101828]")}>
                        {meta.name}
                      </p>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                        {meta.typeBadge}
                      </span>
                    </div>
                    <p className="text-[12.5px] text-[#475467] font-semibold mt-0.5 truncate">
                      {m.display_name && m.display_name !== meta.name ? m.display_name : (m.recipient_name || "Official Account")}
                    </p>
                    {m.handle && (
                      <p className="text-[11.5px] text-[#667085] truncate font-mono">
                        {m.handle}
                      </p>
                    )}
                  </div>
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                    active ? "border-brand bg-brand" : "border-[#D0D5DD]"
                  )}>
                    {active && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Payment Details Card (matching portal payments styling) ── */}
        <div>
          <label className="block text-[11px] font-bold text-[#475467] uppercase tracking-[0.12em] mb-2.5">
            2. Send {fmt(currentTotal)} to Account
          </label>

          {isBankTransfer ? (
            /* Bank Transfer — dark navy header + stacked rows with Copy buttons */
            <div className="rounded-2xl overflow-hidden border border-[#D0D5DD] shadow-sm">
              <div className="bg-[#1A3557] px-4 py-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={currentMeta.logo || "/logo/Zelle_id9UrjyZ9y_1.svg"}
                    alt={currentMeta.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                    {hasBankDetails ? "Wire / ACH Transfer" : currentMeta.name}
                  </p>
                  <p className="text-[15px] font-bold text-white leading-tight truncate">
                    {current.bank_name || currentMeta.name}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-white/60 leading-none mb-0.5">Amount due</p>
                  <p className="text-[18px] font-bold text-white leading-none tabular-nums">
                    {fmt(currentTotal)}
                  </p>
                </div>
              </div>

              {bankRows.length > 0 && (
                <div className="bg-white divide-y divide-[#F2F2F7]">
                  {bankRows.map((row) => (
                    <div key={row.key} className="px-4 py-3">
                      <p className="text-[10.5px] font-bold text-[#667085] uppercase tracking-[0.08em] mb-1">
                        {row.label}
                      </p>
                      <div className="flex items-start gap-2.5">
                        <p className="flex-1 text-[14px] font-semibold text-[#101828] leading-snug break-words min-w-0 font-mono">
                          {row.value}
                        </p>
                        {row.copyable && row.value && (
                          <button
                            type="button"
                            onClick={() => copy(row.value!, row.key)}
                            className={cn(
                              "shrink-0 text-[11px] font-bold px-3 py-1.5 rounded-lg min-w-[62px] text-center transition-all cursor-pointer",
                              copied === row.key
                                ? "bg-[#D1FAE5] text-[#065F46]"
                                : "bg-[#F0F0F5] text-[#475467] hover:bg-[#E5E5EA]"
                            )}
                            aria-label={`Copy ${row.label}`}
                          >
                            {copied === row.key ? "✓ Done" : "Copy"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-[#F8F9FA] border-t border-[#E5E5EA] px-4 py-3">
                {current.extra_instructions && (
                  <p className="text-[12px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-2 leading-relaxed font-medium">
                    {current.extra_instructions}
                  </p>
                )}
                <p className="text-[12px] text-[#667085]">
                  Include your name <span className="font-semibold text-[#101828]">({applicantName || "Applicant Name"})</span> in the memo / wire reference field.
                </p>
              </div>
            </div>
          ) : (
            /* P2P (Venmo, Cash App, PayPal, Chime) — dark forest container */
            <div className="bg-[#081C15] rounded-2xl p-5 text-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  Send via {currentMeta.name}
                </p>
                <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white/80">
                  {currentMeta.typeBadge}
                </span>
              </div>
              <div className="flex items-start gap-3.5 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white p-1.5 overflow-hidden shrink-0 shadow-md mt-0.5 flex items-center justify-center">
                  {currentMeta.logo ? (
                    <img
                      src={currentMeta.logo}
                      alt={currentMeta.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    PAYMENT_LOGOS[current.method]
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[21px] font-bold tracking-tight break-all leading-snug font-mono">
                    {current.handle}
                  </p>
                  <p className="text-[13px] text-white/70 mt-0.5 font-medium">
                    {current.display_name && current.display_name !== currentMeta.name ? current.display_name : (current.recipient_name || "Official Account")}
                  </p>
                </div>
                {current.handle && (
                  <button
                    type="button"
                    onClick={() => copy(current.handle, "handle")}
                    className={cn(
                      "shrink-0 text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition-all mt-1 flex items-center gap-1 cursor-pointer",
                      copied === "handle"
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-white/15 text-white hover:bg-white/25"
                    )}
                  >
                    {copied === "handle" ? (
                      <>
                        <Check size={12} strokeWidth={3} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <p className="text-[12px] text-white/60">Amount to send</p>
                <p className="text-[20px] font-black tabular-nums text-white">
                  {fmt(currentTotal)}
                </p>
              </div>

              {current.extra_instructions && (
                <p className="text-[12px] text-amber-200 bg-amber-900/30 border border-amber-400/20 rounded-xl px-3 py-2 mt-3 leading-relaxed">
                  {current.extra_instructions}
                </p>
              )}

              <p className="text-[12px] text-white/50 mt-2.5 leading-relaxed">
                Include your name <span className="font-semibold text-white/90">({applicantName || "Applicant Name"})</span> in the note/description so our system can instantly match your verification.
              </p>
            </div>
          )}
        </div>

        {/* ── 3. Reference ID & Receipt Upload ── */}
        <div className="space-y-4 pt-1">
          <label className="block text-[11px] font-bold text-[#475467] uppercase tracking-[0.12em]">
            3. Confirm Your Transfer
          </label>

          {/* Reference ID input */}
          <div>
            <label htmlFor="ref-id-input" className="block text-[13px] font-semibold text-[#344054] mb-1.5">
              {isBankTransfer ? "Transaction / Wire Confirmation Number *" : `Your ${currentMeta.name} Username / Ref *`}
            </label>
            <input
              id="ref-id-input"
              type="text"
              value={refId}
              onChange={(e) => {
                setRefId(e.target.value);
                setError("");
              }}
              placeholder={currentMeta.placeholder}
              className="w-full h-11 px-3.5 rounded-xl border border-[#D0D5DD] shadow-sm text-[14.5px] text-[#101828] outline-none transition-all placeholder:text-[#98A2B3] bg-white focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Receipt Screenshot upload */}
          <div>
            <label htmlFor={fileInputId} className="block text-[13px] font-semibold text-[#344054] mb-1.5">
              Receipt Screenshot *
            </label>
            <label
              htmlFor={fileInputId}
              className={cn(
                "flex flex-col sm:flex-row items-center justify-center gap-3 w-full p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center sm:text-left",
                file || previewUrl
                  ? "border-emerald-500 bg-emerald-50/40"
                  : "border-[#D0D5DD] bg-[#F9FAFB] hover:border-brand/50 hover:bg-brand/[0.02]"
              )}
            >
              <input
                id={fileInputId}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const selected = e.target.files?.[0] || null;
                  if (previewUrl && previewUrl.startsWith("blob:")) {
                    URL.revokeObjectURL(previewUrl);
                  }
                  setFile(selected);
                  if (selected) {
                    setPreviewUrl(URL.createObjectURL(selected));
                  } else {
                    setPreviewUrl(initialData?.proofPreviewUrl || null);
                  }
                  setError("");
                }}
              />

              {file || previewUrl ? (
                <div className="flex items-center gap-4 w-full">
                  {previewUrl && (
                    <div className="w-14 h-14 rounded-xl border border-emerald-300 overflow-hidden shrink-0 bg-white shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-emerald-700">
                      <CheckCircle size={16} className="shrink-0" />
                      <p className="text-[14px] font-bold truncate">
                        {file?.name || initialData?.proofFileName || "Receipt Attached"}
                      </p>
                    </div>
                    <p className="text-[11.5px] text-emerald-600 mt-0.5">
                      {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB · ` : ""}Tap or drop new image to change
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (previewUrl && previewUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setFile(null);
                      setPreviewUrl(null);
                    }}
                    className="p-2 rounded-xl text-[#667085] hover:text-[#101828] hover:bg-black/5 transition-colors shrink-0 cursor-pointer"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-white border border-[#E5E5EA] shadow-xs flex items-center justify-center shrink-0">
                    <Camera size={20} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#101828]">
                      Upload screenshot of your payment receipt
                    </p>
                    <p className="text-[12px] text-[#667085] mt-0.5">
                      JPG or PNG screenshot up to 10 MB
                    </p>
                  </div>
                </>
              )}
            </label>
          </div>
        </div>

        {/* Validation error */}
        {error && (
          <div className="text-[13px] text-[#D92D20] bg-[#FEF3F2] px-4 py-3 rounded-xl border border-[#FECDCA] flex items-start gap-2 animate-fadeIn">
            <Info size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* CTA Button */}
        <button
          type="submit"
          className="w-full h-12 bg-brand hover:bg-brand-hover text-white rounded-xl text-[15px] font-bold transition-all shadow-[0_2px_4px_rgba(26,86,219,0.2)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
        >
          Save Payment &amp; Continue to Review
        </button>

        {/* Guarantee footer */}
        <p className="text-[11px] text-[#667085] text-center leading-normal px-2">
          By continuing, you confirm your {fmt(amount)} application verification fee transfer. All application fees are strictly refundable if your application is not approved.
        </p>
      </form>
    </div>
  );
}
