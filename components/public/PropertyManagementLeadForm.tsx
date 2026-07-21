"use client";

import { useState } from "react";
import { Mail, Phone, User, CheckCircle, ArrowRight, MapPin, Building, MessageSquare } from "lucide-react";
import { getStoredUTMs, trackEvent } from "@/lib/tracking";

const API_BASE = typeof window !== "undefined"
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL ?? "https://admin.primefamilyhousing.com");

const SUPPORTED_CITIES = [
  { value: "atlanta-ga", label: "Atlanta, GA" },
  { value: "charlotte-nc", label: "Charlotte, NC" },
  { value: "houston-tx", label: "Houston, TX" },
  { value: "dallas-tx", label: "Dallas, TX" },
  { value: "nashville-tn", label: "Nashville, TN" },
  { value: "phoenix-az", label: "Phoenix, AZ" },
  { value: "austin-tx", label: "Austin, TX" },
  { value: "miami-fl", label: "Miami, FL" },
  { value: "denver-co", label: "Denver, CO" },
  { value: "seattle-wa", label: "Seattle, WA" },
  { value: "las-vegas-nv", label: "Las Vegas, NV" },
  { value: "tampa-fl", label: "Tampa, FL" },
  { value: "other", label: "Other City / Relocating" },
];

export function PropertyManagementLeadForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("atlanta-ga");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Please enter your name."); return; }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) { setError("Please enter a valid email."); return; }
    if (!address.trim()) { setError("Please enter your property address."); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/v1/leads/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          source: "CONTACT_FORM",
          interest_type: "INVEST",
          preferred_location: city === "other" ? "Other" : city,
          message: `Property Management Inquiry.\nProperty Address: ${address.trim()}\nOwner Message: ${message.trim()}`,
          detected_city: city === "other" ? undefined : city,
          ...getStoredUTMs(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail ?? data.email?.[0] ?? "Submission failed. Please check inputs and try again.");
      }

      setDone(true);
      trackEvent("generate_lead", { city, type: "property-management" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-12 px-6 bg-[#f3f4ec] border border-[#c1ecd4] rounded-none shadow-sm max-w-xl mx-auto">
        <div className="w-16 h-16 rounded-full bg-brand/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-brand" />
        </div>
        <h3 className="font-serif text-2xl font-bold text-[#0B1F3A] mb-3">Analysis Request Received</h3>
        <p className="text-neutral-600 text-sm leading-relaxed mb-6 max-w-sm mx-auto">
          Thank you for reaching out. A local PrimeFamilyHousing property specialist will perform a full rental valuation and contact you within 24 hours.
        </p>
        <div className="text-xs text-neutral-400">
          Have an urgent question? Email us at <a href="mailto:info@primefamilyhousing.com" className="text-brand font-semibold hover:underline">info@primefamilyhousing.com</a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 p-8 rounded-none shadow-sm max-w-xl mx-auto">
      <h3 className="font-serif text-2xl font-bold text-[#0B1F3A] mb-2">Request a Free Rental Analysis</h3>
      <p className="text-neutral-500 text-xs mb-6 leading-relaxed">
        Submit your property details below. We will assess local rental comps and provide a detailed monthly income estimate. No cost, no obligation.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div className="relative">
          <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Your full name *"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            className="w-full bg-[#f3f4ec]/20 border border-neutral-200 rounded-none pl-10 pr-4 py-3 text-[#111827] placeholder-neutral-400 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/10 transition-all"
          />
        </div>

        {/* Email & Phone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="email"
              placeholder="Email address *"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="w-full bg-[#f3f4ec]/20 border border-neutral-200 rounded-none pl-10 pr-4 py-3 text-[#111827] placeholder-neutral-400 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/10 transition-all"
            />
          </div>
          <div className="relative">
            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#f3f4ec]/20 border border-neutral-200 rounded-none pl-10 pr-4 py-3 text-[#111827] placeholder-neutral-400 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/10 transition-all"
            />
          </div>
        </div>

        {/* City Select */}
        <div className="relative">
          <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-[#f3f4ec]/20 border border-neutral-200 rounded-none pl-10 pr-4 py-3 text-[#111827] text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/10 transition-all appearance-none cursor-pointer"
          >
            {SUPPORTED_CITIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>

        {/* Property Address */}
        <div className="relative">
          <Building size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Property street address, City, State, ZIP *"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setError(""); }}
            className="w-full bg-[#f3f4ec]/20 border border-neutral-200 rounded-none pl-10 pr-4 py-3 text-[#111827] placeholder-neutral-400 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/10 transition-all"
          />
        </div>

        {/* Message */}
        <div className="relative">
          <MessageSquare size={14} className="absolute left-3.5 top-4 text-neutral-400 pointer-events-none" />
          <textarea
            placeholder="Tell us about the property (e.g. status, vacancies, size)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full bg-[#f3f4ec]/20 border border-neutral-200 rounded-none pl-10 pr-4 py-3 text-[#111827] placeholder-neutral-400 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/10 transition-all resize-none"
          />
        </div>

        {/* Error message */}
        {error && (
          <p className="text-red-600 text-xs flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
            {error}
          </p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-4 rounded-none transition-colors flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer text-sm tracking-wider uppercase active:scale-[0.98]"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Request Free Analysis
              <ArrowRight size={15} />
            </>
          )}
        </button>
        <p className="text-neutral-400 text-[10px] text-center">
          By clicking, you consent to receive updates. We never share your data.
        </p>
      </form>
    </div>
  );
}
