"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { TourBookingForm } from "./TourBookingForm";

interface Props {
  propertySlug: string;
  propertyTitle: string;
  listingType: string;
  propertyId?: number;
  propertyCity?: string;
}

/**
 * Tour-booking modal. Mounts once on the property detail page and opens when any
 * "Book a Tour" CTA dispatches the `hasker:open-tour` window event — so a visitor
 * can schedule a tour from anywhere on the page without scrolling to a form.
 * Wraps the self-contained multi-step PropertyInquiryForm.
 */
export function PropertyTourModal(props: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("hasker:open-tour", handler);
    return () => window.removeEventListener("hasker:open-tour", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9996] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-brand-dark/70 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Book a tour"
        className="relative w-full sm:max-w-md my-0 sm:my-8 max-h-[100vh] sm:max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 text-neutral-400 hover:text-brand-dark bg-white/90 hover:bg-white shadow-sm p-2 rounded-full transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
        <TourBookingForm {...props} />
      </div>
    </div>
  );
}
