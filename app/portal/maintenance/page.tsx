"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Wrench, Zap, Wind, Settings, Home, Bug, Lock,
  HelpCircle, ChevronDown, CheckCircle, AlertCircle, Clock,
  Image as ImageIcon, Upload, Mail, X,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";
import { timeAgo, cn } from "@/lib/utils";

const API_BASE = "";

const CATEGORIES = [
  { value: "PLUMBING",   label: "Plumbing",         icon: Wrench },
  { value: "ELECTRICAL", label: "Electrical",        icon: Zap },
  { value: "HVAC",       label: "HVAC",              icon: Wind },
  { value: "APPLIANCE",  label: "Appliance",         icon: Settings },
  { value: "STRUCTURAL", label: "Structural",        icon: Home },
  { value: "PEST",       label: "Pest Control",      icon: Bug },
  { value: "SECURITY",   label: "Security / Locks",  icon: Lock },
  { value: "OTHER",      label: "Other",             icon: HelpCircle },
] as const;

const PRIORITIES = [
  { value: "LOW",    label: "Low",    sub: "Non-urgent, no immediate risk",    color: "#414844" },
  { value: "MEDIUM", label: "Medium", sub: "Needs attention soon",             color: "#BC6C25" },
  { value: "HIGH",   label: "High",   sub: "Affecting daily life",             color: "#FF6B00" },
  { value: "URGENT", label: "Urgent", sub: "Safety risk — needs immediate fix", color: "#ba1a1a" },
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SUBMITTED:    { label: "Submitted",    color: "#BC6C25", icon: Clock },
  ACKNOWLEDGED: { label: "Acknowledged", color: "#012d1d", icon: CheckCircle },
  IN_PROGRESS:  { label: "In Progress",  color: "#012d1d", icon: Settings },
  RESOLVED:     { label: "Resolved",     color: "#2E7D32", icon: CheckCircle },
  CLOSED:       { label: "Closed",       color: "#414844", icon: X },
};

interface MaintenanceRequest {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  description?: string;
  preferred_access_time?: string;
  photo_url?: string | null;
  resolved_at?: string | null;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  PLUMBING:   Wrench,
  ELECTRICAL: Zap,
  HVAC:       Wind,
  APPLIANCE:  Settings,
  STRUCTURAL: Home,
  PEST:       Bug,
  SECURITY:   Lock,
  OTHER:      HelpCircle,
};

function RequestCard({ req }: { req: MaintenanceRequest }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.SUBMITTED;
  const StatusIcon = cfg.icon;
  const CatIcon = CATEGORY_ICONS[req.category] ?? HelpCircle;

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-black/[0.015] transition-colors cursor-pointer"
      >
        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
          <CatIcon size={20} className="text-primary" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] leading-6 font-semibold text-on-surface truncate">{req.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[12px] leading-4 font-semibold px-2 py-0.5 rounded-full bg-surface-container-low"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
            <span className="text-[12px] leading-4 text-on-surface-variant">{timeAgo(req.created_at)}</span>
          </div>
        </div>
        <ChevronDown
          size={15}
          className={cn("text-outline-variant transition-transform duration-200 shrink-0", expanded && "rotate-180")}
          strokeWidth={2.5}
        />
      </button>

      {expanded && (
        <div className="border-t border-outline-variant/60 px-5 py-4 space-y-3">
          {req.description && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Description</p>
              <p className="text-[13px] text-on-surface leading-relaxed">{req.description}</p>
            </div>
          )}
          {req.preferred_access_time && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Preferred Access</p>
              <p className="text-[13px] text-on-surface">{req.preferred_access_time}</p>
            </div>
          )}
          {req.photo_url && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant mb-1.5">Photo</p>
              <img
                src={req.photo_url}
                alt="Issue photo"
                className="w-full max-w-xs rounded-xl object-cover max-h-40"
              />
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <StatusIcon size={13} style={{ color: cfg.color }} />
            <span className="text-[12px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
            <span className="text-[11px] text-on-surface-variant">Â· Updated {timeAgo(req.updated_at)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loadError, setLoadError] = useState<"403" | "other" | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [description, setDescription] = useState("");
  const [accessTime, setAccessTime] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/v1/maintenance/`)
      .then(async (res) => {
        if (res.status === 403) { setLoadError("403"); return; }
        if (!res.ok) { setLoadError("other"); return; }
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : (data.results ?? []));
      })
      .catch(() => setLoadError("other"))
      .finally(() => setLoading(false));
  }, []);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Photo must be under 5 MB.");
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!title.trim()) { setFormError("Title is required."); return; }
    if (!category) { setFormError("Please select a category."); return; }
    if (description.trim().length < 10) { setFormError("Please describe the issue (min 10 characters)."); return; }

    setSubmitting(true);
    try {
      const body = new FormData();
      body.append("title", title.trim());
      body.append("category", category);
      body.append("priority", priority);
      body.append("description", description.trim());
      if (accessTime.trim()) body.append("preferred_access_time", accessTime.trim());
      if (photo) body.append("photo", photo);

      const res = await apiFetch(`${API_BASE}/api/v1/maintenance/`, {
        method: "POST",
        body,
        // No Content-Type — let browser set multipart boundary
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data?.detail ?? "Submission failed. Please try again.");
        return;
      }

      const newReq = await res.json();
      setRequests((prev) => [newReq, ...prev]);
      setTitle(""); setCategory(""); setPriority("MEDIUM");
      setDescription(""); setAccessTime("");
      setPhoto(null); setPhotoPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-4 md:p-12 w-full max-w-7xl mx-auto">

      {/* Header */}
      <header className="mb-12">
        <h2 className="font-serif font-bold text-on-surface mb-2 text-[32px] leading-10 md:text-[48px] md:leading-[56px]" style={{ letterSpacing: "-0.02em" }}>
          Maintenance
        </h2>
        <p className="text-[18px] leading-7 text-on-surface-variant">Report issues and track repair status — we respond within 1 business day.</p>
      </header>

      <div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Submit Form ─────────────────────────────────────────── */}
          <div className="w-full lg:w-2/5 shrink-0">
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
              <div className="px-6 pt-6 pb-4">
                <h3 className="font-serif font-semibold text-on-surface text-[24px] leading-8">New Request</h3>
                <p className="text-[14px] leading-5 text-on-surface-variant mt-1">We respond within 1 business day</p>
              </div>

              {/* Success banner */}
              {success && (
                <div className="mx-5 mt-4 flex items-start gap-2.5 bg-primary-fixed/50 border border-[#2E7D32]/20 rounded-xl px-4 py-3">
                  <CheckCircle size={15} className="text-[#2E7D32] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-semibold text-on-surface">Request submitted!</p>
                    <p className="text-[12px] text-on-surface-variant">We&apos;ll be in touch within 1 business day.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-5 space-y-4">

                {/* Title */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.07em] uppercase text-on-surface-variant mb-1.5">
                    Issue Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Leaking kitchen tap"
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-[15px] text-on-surface outline-none border border-transparent focus:border-brand/30 transition-colors"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.07em] uppercase text-on-surface-variant mb-2">
                    Category *
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {CATEGORIES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCategory(value)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all",
                          category === value
                            ? "bg-[#012d1d] text-white"
                            : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                        )}
                      >
                        <Icon size={13} strokeWidth={1.8} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.07em] uppercase text-on-surface-variant mb-2">
                    Priority *
                  </label>
                  <div className="space-y-1.5">
                    {PRIORITIES.map(({ value, label, sub, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPriority(value)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all border",
                          priority === value
                            ? "bg-surface-container-low border-black/10"
                            : "bg-surface-container-lowest border-transparent hover:bg-surface-container-low"
                        )}
                      >
                        <div
                          className="w-1 h-8 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-on-surface">{label}</p>
                          <p className="text-[11px] text-on-surface-variant">{sub}</p>
                        </div>
                        {priority === value && (
                          <CheckCircle size={14} className="ml-auto shrink-0 text-[#2E7D32]" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.07em] uppercase text-on-surface-variant mb-1.5">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue, when it started, and how often it occurs…"
                    rows={4}
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-[15px] text-on-surface outline-none border border-transparent focus:border-brand/30 transition-colors resize-none"
                  />
                </div>

                {/* Access time */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.07em] uppercase text-on-surface-variant mb-1.5">
                    Preferred Access Time <span className="normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={accessTime}
                    onChange={(e) => setAccessTime(e.target.value)}
                    placeholder="e.g. Weekdays after 5pm, anytime Sat”“Sun"
                    className="w-full bg-surface-container-low rounded-xl px-4 py-3 text-[15px] text-on-surface outline-none border border-transparent focus:border-brand/30 transition-colors"
                  />
                </div>

                {/* Photo */}
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.07em] uppercase text-on-surface-variant mb-1.5">
                    Photo <span className="normal-case font-normal">(optional, max 5 MB)</span>
                  </label>
                  {photoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-32 h-32 rounded-xl object-cover border border-outline-variant"
                      />
                      <button
                        type="button"
                        onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#ba1a1a] text-white flex items-center justify-center shadow-sm"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex items-center gap-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl px-4 py-3 text-[13px] text-on-surface-variant transition-colors"
                    >
                      <Upload size={15} />
                      Upload a photo
                    </button>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>

                {formError && (
                  <div className="flex items-start gap-2 text-error bg-error-container/60 rounded-xl px-3.5 py-3">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <p className="text-[13px]">{formError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-brand text-white text-[14px] font-semibold py-3 rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-60"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Wrench size={15} />
                  )}
                  Submit Request
                </button>
              </form>
            </div>
          </div>

          {/* â”€â”€ Request History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-semibold text-on-surface text-[24px] leading-8">Your Requests</h3>
              {requests.length > 0 && (
                <span className="text-[12px] leading-4 text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full font-medium">
                  {requests.length} total
                </span>
              )}
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-black/[0.04] animate-pulse" />
                ))}
              </div>
            ) : loadError === "403" ? (
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center mx-auto mb-3">
                  <AlertCircle size={22} className="text-outline-variant" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] font-semibold text-on-surface mb-1">Account not linked</p>
                <p className="text-[13px] text-on-surface-variant max-w-xs mx-auto leading-relaxed mb-4">
                  Your account isn&apos;t linked to a tenancy yet. Contact our team to get set up.
                </p>
                <a
                  href="mailto:info@primefamilyhousing.com?subject=Account Tenancy Setup"
                  className="inline-flex items-center gap-1.5 bg-brand text-white text-[12px] font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-hover transition-colors"
                >
                  <Mail size={13} />
                  Email Us
                </a>
              </div>
            ) : loadError === "other" ? (
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-error-container/60 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle size={22} className="text-error" strokeWidth={1.5} />
                </div>
                <p className="text-[14px] font-semibold text-on-surface mb-1">Could not load requests</p>
                <p className="text-[13px] text-on-surface-variant max-w-xs mx-auto leading-relaxed mb-4">
                  There was a problem fetching your maintenance history. Please refresh the page or contact us if the issue persists.
                </p>
                <a
                  href="mailto:info@primefamilyhousing.com"
                  className="inline-flex items-center gap-1.5 bg-brand text-white text-[12px] font-semibold px-4 py-2.5 rounded-xl hover:bg-brand-hover transition-colors"
                >
                  <Mail size={13} />
                  Contact Support
                </a>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant py-12 flex flex-col items-center text-center px-6">
                <Image
                  src="/illustrations/spot-tools.png"
                  alt=""
                  width={88}
                  height={88}
                  className="mb-4 opacity-90"
                />
                <p className="text-[14px] font-semibold text-on-surface mb-1">No requests yet</p>
                <p className="text-[13px] text-on-surface-variant max-w-xs leading-relaxed">
                  Submit your first maintenance request using the form.
                </p>
              </div>
            ) : (
              requests.map((req) => <RequestCard key={req.id} req={req} />)
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
