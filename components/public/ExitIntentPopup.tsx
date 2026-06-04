"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { X, Phone, User, Clock, Check, PhoneCall } from "lucide-react";
import {
  getBestKnownCity,
  getStoredUTMs,
  getStoredReferralCode,
  getDeviceContext,
  trackEvent,
} from "@/lib/tracking";

const POPUP_TS_KEY   = "hasker_popup_ts";        // 24h cross-session cooldown
const SHOWN_KEY      = "hasker_popup_shown";     // hard once-per-session guard
const LEAD_KEY       = "hasker_lead_captured";   // set by any lead form
const COOLDOWN_MS    = 24 * 60 * 60 * 1000;
const TIMER_DELAY_MS = 30_000;                    // calm — only after real browsing

const INPUT_CLS =
  "w-full h-[50px] rounded-2xl border border-neutral-200 bg-neutral-50/60 pl-11 pr-4 " +
  "text-[15px] text-brand-dark placeholder:text-neutral-400 transition-all " +
  "focus:outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 focus:bg-white";

export function ExitIntentPopup() {
  const pathname = usePathname();

  const [visible,   setVisible]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [city,      setCity]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [name,      setName]      = useState("");
  const [timeline,  setTimeline]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [errorMsg,  setErrorMsg]  = useState("");

  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Trigger — fires at most ONCE. Re-arms on navigation only until it has shown.
  useEffect(() => {
    const suppressed =
      pathname.startsWith("/apply") ||
      pathname.startsWith("/portal") ||
      sessionStorage.getItem(LEAD_KEY) === "true" ||
      sessionStorage.getItem(SHOWN_KEY) === "true" ||
      Date.now() - Number(localStorage.getItem(POPUP_TS_KEY) || 0) < COOLDOWN_MS;

    if (suppressed) return;

    let fired = false;
    const show = () => {
      if (fired) return;
      fired = true;
      // Mark seen the moment it appears — closing without submitting still counts,
      // so it never re-pops this session or for the next 24h.
      sessionStorage.setItem(SHOWN_KEY, "true");
      localStorage.setItem(POPUP_TS_KEY, String(Date.now()));
      setCity(getBestKnownCity());
      setVisible(true);
      cleanup();
    };

    const timer = setTimeout(show, TIMER_DELAY_MS);
    const onLeave = (e: MouseEvent) => { if (e.clientY < 5) show(); }; // desktop exit-intent
    document.addEventListener("mouseleave", onLeave);

    function cleanup() {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", onLeave);
    }
    return cleanup;
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = visible ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setVisible(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  useEffect(() => {
    if (visible && !submitted) setTimeout(() => phoneInputRef.current?.focus(), 200);
  }, [visible, submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) { setErrorMsg("Please add a phone number so we can call."); return; }
    if (!name.trim())  { setErrorMsg("Please add your name."); return; }
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/v1/leads/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:        name.trim(),
          phone:            phone.trim(),
          source:           "CONTACT_FORM",
          interest_type:    "RENT",
          preferred_contact: "PHONE",
          move_in_timeline: timeline || undefined,
          detected_city:    city || undefined,
          message:          `Callback request via exit popup. Phone: ${phone.trim()}` + getDeviceContext(),
          referral_code:    getStoredReferralCode() || undefined,
          ...getStoredUTMs(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { detail?: string }).detail ?? "Submission failed.");
      }
      sessionStorage.setItem(LEAD_KEY, "true");
      trackEvent("generate_lead", { source: "exit_popup", type: "callback", city });
      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      {/* Soft backdrop */}
      <div
        onClick={() => setVisible(false)}
        className="absolute inset-0 bg-brand-dark/55 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Card */}
      <div
        role="dialog" aria-modal="true" aria-labelledby="exit-popup-title"
        className="relative w-full max-w-md bg-white rounded-[28px] overflow-hidden shadow-[0_24px_70px_-12px_rgba(30,58,95,0.4)] ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Close */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 z-10 text-neutral-400 hover:text-brand-dark bg-neutral-100 hover:bg-neutral-200 p-2 rounded-full transition-all cursor-pointer"
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {!submitted ? (
          <>
            {/* Header — warm, calm, centered */}
            <div className="px-7 pt-10 pb-5 text-center">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-brand-light ring-1 ring-brand/10 flex items-center justify-center mb-4">
                <PhoneCall size={22} className="text-brand" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand mb-2">
                {city ? `New homes in ${city}` : "Still searching?"}
              </p>
              <h3 id="exit-popup-title" className="font-serif text-[26px] leading-tight font-bold text-brand-dark">
                Let an agent do<br />the searching.
              </h3>
              <p className="text-[13.5px] text-neutral-500 mt-2.5 leading-relaxed max-w-[19rem] mx-auto">
                Leave your number and a local agent calls within the hour with homes that fit — no endless scrolling.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-7 pb-7 space-y-2.5" noValidate>
              <div className="relative">
                <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  ref={phoneInputRef}
                  type="tel"
                  required
                  aria-label="Phone number"
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setErrorMsg(""); }}
                  className={INPUT_CLS}
                />
              </div>

              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  aria-label="Your name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setErrorMsg(""); }}
                  className={INPUT_CLS}
                />
              </div>

              <div className="relative">
                <Clock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                <select
                  aria-label="Move-in timeline (optional)"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className={`${INPUT_CLS} appearance-none ${timeline ? "" : "text-neutral-400"}`}
                >
                  <option value="">When do you want to move? (optional)</option>
                  <option value="ASAP">As soon as possible</option>
                  <option value="1_3_MONTHS">In 1–3 months</option>
                  <option value="3_6_MONTHS">In 3–6 months</option>
                  <option value="JUST_BROWSING">Just browsing for now</option>
                </select>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-red-600 text-xs font-medium">{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] mt-1 bg-brand text-white font-semibold rounded-2xl hover:bg-brand-hover shadow-lg shadow-brand/20 transition-all flex items-center justify-center gap-2 text-[15px] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><PhoneCall size={16} /> Request my callback</>}
              </button>

              <p className="text-center text-[11px] text-neutral-400 pt-0.5">
                One quick call during business hours · No spam, opt out anytime.
              </p>
            </form>
          </>
        ) : (
          /* Success */
          <div className="px-7 py-12 text-center animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center mb-5">
              <Check size={30} className="text-emerald-500" />
            </div>
            <h4 className="font-serif text-2xl font-bold text-brand-dark">You&apos;re all set</h4>
            <p className="text-[14px] text-neutral-500 mt-2.5 leading-relaxed max-w-[18rem] mx-auto">
              An agent will call <strong className="text-brand-dark">{phone}</strong> shortly
              {city ? <> with homes in <strong className="text-brand-dark">{city}</strong></> : null}.
            </p>
            <button
              onClick={() => setVisible(false)}
              className="mt-6 inline-flex h-11 items-center justify-center px-6 rounded-2xl border border-neutral-200 text-brand-dark text-sm font-semibold hover:bg-neutral-50 transition-colors cursor-pointer"
            >
              Keep browsing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
