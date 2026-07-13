"use client";

import { useState } from "react";
import {
  Calendar, Clock, User, Phone, Mail, ShieldCheck, Camera,
  CheckCircle, ChevronLeft, Loader2, Lock,
} from "lucide-react";
import { cn, compressImageFile } from "@/lib/utils";
import { trackEvent, getStoredUTMs } from "@/lib/tracking";
import { trackClick } from "@/lib/telemetry";

const API_BASE = "";

interface Props {
  propertySlug: string;
  propertyTitle: string;
  listingType?: string;
  propertyId?: number;
  propertyCity?: string;
}

const TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

function nextDays(count: number) {
  const out: { date: Date; iso: string; dow: string; day: number; mon: string }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({
      date: d,
      iso,
      dow: i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" }),
      day: d.getDate(),
      mon: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return out;
}

const DAYS = nextDays(14);

export function TourBookingForm({ propertySlug, propertyTitle, propertyId, propertyCity }: Props) {
  const [step, setStep] = useState(0); // 0 schedule, 1 details, 2 verify-id, 3 success
  const [dateIso, setDateIso] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [publicId, setPublicId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter your name.");
    if (!phone.trim()) return setError("Please enter your phone number.");
    setLoading(true); setError("");
    try {
      const utms = getStoredUTMs();
      const res = await fetch(`${API_BASE}/api/v1/viewings/tour-requests/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property: propertyId,
          full_name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          preferred_date: dateIso || null,
          preferred_time: timeSlot,
          tour_type: "self-tour",
          ...utms,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const detail = data ? Object.values(data).flat().join(" ") : "Something went wrong.";
        throw new Error(detail);
      }
      const data = await res.json();
      setPublicId(data.public_id);
      trackEvent("schedule_tour", { property: propertySlug, date: dateIso, time: timeSlot });
      trackClick("tour_request_submitted", { slug: propertySlug, city: propertyCity });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function submitId(e: React.FormEvent) {
    e.preventDefault();
    if (!idFront) return setError("Please add a photo of your ID.");
    setLoading(true); setError("");
    try {
      // Shrink camera photos in the browser first — a raw phone image (5–12MB)
      // exceeds proxy body limits and the upload dies as an opaque "Load failed".
      const [front, back] = await Promise.all([
        compressImageFile(idFront),
        idBack ? compressImageFile(idBack) : Promise.resolve(null),
      ]);

      // Final guard: if it's still too big to have compressed (e.g. an unusual
      // format the browser couldn't decode), tell the user plainly instead of
      // letting the request drop silently.
      const MAX_BYTES = 10 * 1024 * 1024;
      if (front.size > MAX_BYTES || (back && back.size > MAX_BYTES)) {
        throw new Error("That image is too large to upload. Please use a smaller photo (under 10MB).");
      }

      const fd = new FormData();
      fd.append("id_front", front);
      if (back) fd.append("id_back", back);

      let res: Response;
      try {
        res = await fetch(`${API_BASE}/api/v1/viewings/tour-requests/${publicId}/verify-id/`, {
          method: "POST", body: fd,
        });
      } catch {
        // fetch() itself rejected — network drop, offline, or the request body
        // was refused before a response ("Load failed" in Safari).
        throw new Error("Upload failed — please check your connection and try again with a clear, well-lit photo.");
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail ?? "Upload failed. Please try again.");
      }
      trackClick("tour_id_submitted", { slug: propertySlug });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  /* ── Success ─────────────────────────────────────────── */
  if (step === 3) {
    return (
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={32} className="text-emerald-500" strokeWidth={1.8} />
        </div>
        <h3 className="font-serif text-2xl font-bold text-brand-dark mb-2">Tour request received</h3>
        <p className="text-[14px] text-neutral-500 leading-relaxed max-w-xs mx-auto">
          We&apos;re verifying your ID now. Once you&apos;re approved we&apos;ll confirm your self-tour for{" "}
          <span className="font-semibold text-brand-dark">{DAYS.find((d) => d.iso === dateIso)?.dow ?? "your date"} at {timeSlot || "your time"}</span> and email your access details.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-[12px] text-neutral-400">
          <ShieldCheck size={13} className="text-emerald-500" /> Usually verified within 1–2 business hours.
        </div>
      </div>
    );
  }

  const headerSub =
    step === 0 ? "Pick a date & time" : step === 1 ? "Where can we reach you?" : "Verify your identity";

  return (
    <div className="bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-neutral-100">
        <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand mb-1">Book a self-tour</p>
        <h3 className="font-serif text-xl font-bold text-brand-dark leading-tight">{propertyTitle}</h3>
        <div className="flex items-center gap-1.5 mt-3">
          {[0, 1, 2].map((s) => (
            <div key={s} className={cn("h-1 rounded-full flex-1 transition-colors", s <= step ? "bg-brand" : "bg-neutral-200")} />
          ))}
        </div>
        <p className="text-[12px] text-neutral-400 mt-2">{headerSub}</p>
      </div>

      <div className="px-6 py-5">
        {/* ── Step 0: Schedule ─────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-2.5">
                <Calendar size={13} className="text-brand" /> Choose a day
              </p>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
                {DAYS.map((d) => (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setDateIso(d.iso)}
                    className={cn(
                      "shrink-0 w-[64px] py-2.5 rounded-xl border-2 text-center transition-all active:scale-95",
                      dateIso === d.iso ? "border-brand bg-brand-light" : "border-neutral-200 hover:border-neutral-300",
                    )}
                  >
                    <span className={cn("block text-[11px] font-semibold", dateIso === d.iso ? "text-brand" : "text-neutral-400")}>{d.dow}</span>
                    <span className={cn("block text-[18px] font-bold leading-tight", dateIso === d.iso ? "text-brand" : "text-brand-dark")}>{d.day}</span>
                    <span className="block text-[10px] text-neutral-400">{d.mon}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-neutral-500 mb-2.5">
                <Clock size={13} className="text-brand" /> Choose a time
              </p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeSlot(t)}
                    className={cn(
                      "py-2.5 rounded-xl border-2 text-[13px] font-semibold transition-all active:scale-95",
                      timeSlot === t ? "border-brand bg-brand-light text-brand" : "border-neutral-200 text-brand-dark hover:border-neutral-300",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!dateIso || !timeSlot}
              onClick={() => { setError(""); setStep(1); }}
              className="w-full h-13 py-3.5 bg-brand text-white text-[15px] font-bold rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              Continue
            </button>
          </div>
        )}

        {/* ── Step 1: Details ──────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={submitDetails} className="space-y-4">
            <Field icon={User} label="Full name" value={name} onChange={setName} placeholder="Jane Doe" autoFocus />
            <Field icon={Phone} label="Phone" value={phone} onChange={setPhone} placeholder="(555) 123-4567" type="tel" />
            <Field icon={Mail} label="Email (optional)" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />

            {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5">{error}</p>}

            <div className="flex gap-2.5 pt-1">
              <button type="button" onClick={() => setStep(0)} className="h-13 px-4 rounded-xl border-2 border-neutral-200 text-neutral-600 font-semibold flex items-center gap-1 hover:bg-neutral-50 transition-colors">
                <ChevronLeft size={18} />
              </button>
              <button type="submit" disabled={loading} className="flex-1 h-13 bg-brand text-white text-[15px] font-bold rounded-xl hover:bg-brand-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]">
                {loading ? <Loader2 size={18} className="animate-spin" /> : "Continue to verify ID"}
              </button>
            </div>
            <p className="text-[11px] text-center text-neutral-400">Your request is saved now — verify your ID next to confirm.</p>
          </form>
        )}

        {/* ── Step 2: Verify ID ────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={submitId} className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-3">
              <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-emerald-900 leading-snug">
                Self-tours are unlocked with a private access code, so we verify a photo ID first to keep every home secure. Your ID is kept confidential and used only to confirm your identity.
              </p>
            </div>

            <IdUpload label="Photo ID (front)" file={idFront} onChange={setIdFront} required />
            <IdUpload label="Back of ID (optional)" file={idBack} onChange={setIdBack} />

            {error && <p className="text-[13px] text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5">{error}</p>}

            <button type="submit" disabled={loading} className="w-full h-13 bg-brand text-white text-[15px] font-bold rounded-xl hover:bg-brand-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99]">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><Lock size={16} /> Submit for verification</>}
            </button>
            <p className="text-[11px] text-center text-neutral-400">We&apos;ll confirm your self-tour once your ID is approved.</p>
          </form>
        )}
      </div>
    </div>
  );
}

/* ── Small field ─────────────────────────────────────────── */
function Field({
  icon: Icon, label, value, onChange, placeholder, type = "text", autoFocus,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5 block">{label}</span>
      <div className="flex items-center gap-2.5 rounded-xl border-2 border-neutral-200 focus-within:border-brand px-3.5 transition-colors">
        <Icon size={16} className="text-neutral-400 shrink-0" />
        <input
          type={type}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-12 bg-transparent outline-none text-[15px] text-brand-dark placeholder:text-neutral-300"
        />
      </div>
    </label>
  );
}

/* ── ID upload tile ──────────────────────────────────────── */
function IdUpload({ label, file, onChange, required }: {
  label: string; file: File | null; onChange: (f: File | null) => void; required?: boolean;
}) {
  return (
    <div>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5 block">
        {label}{required && <span className="text-red-400"> *</span>}
      </span>
      <label className={cn(
        "flex items-center justify-center gap-3 w-full py-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
        file ? "border-brand bg-brand-light/40" : "border-neutral-200 bg-neutral-50 hover:border-neutral-300",
      )}>
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onChange(e.target.files?.[0] || null)} />
        {file ? (
          <>
            <CheckCircle size={18} className="text-brand shrink-0" />
            <span className="text-[13px] font-semibold text-brand truncate max-w-[220px]">{file.name}</span>
          </>
        ) : (
          <>
            <Camera size={18} className="text-neutral-400 shrink-0" />
            <span className="text-[13px] text-neutral-500">Tap to take a photo or upload</span>
          </>
        )}
      </label>
    </div>
  );
}
