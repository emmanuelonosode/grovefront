"use client";

import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { consentDecided, grantConsent, denyConsent } from "@/lib/tracking";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!consentDecided()) {
      setTimeout(() => setVisible(true), 0);
    }
  }, []);

  if (!visible) return null;

  function handleAccept() {
    grantConsent();
    setVisible(false);
  }

  function handleDecline() {
    denyConsent();
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="cookie-consent fixed bottom-4 inset-x-4 sm:inset-x-auto sm:left-6 sm:bottom-6 z-[9999] sm:max-w-sm bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,20,80,0.22)] ring-1 ring-black/5 p-5 menu-animate"
    >
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-full bg-brand-light flex items-center justify-center shrink-0">
          <Cookie size={17} className="text-brand" />
        </span>
        <div className="min-w-0">
          <p className="text-[14.5px] font-bold text-neutral-900">Cookies &amp; privacy</p>
          <p className="mt-1 text-[13px] text-neutral-600 leading-relaxed">
            We use cookies to improve your experience and understand how you found us.{" "}
            <a href="/privacy" className="text-brand font-semibold underline underline-offset-2 hover:text-brand-hover transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          onClick={handleDecline}
          className="cursor-pointer h-10 text-[13.5px] font-semibold text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:text-neutral-800 transition-colors"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="cursor-pointer h-10 text-[13.5px] font-bold bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
