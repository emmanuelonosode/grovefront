"use client";

import { useState, useEffect } from "react";
import {
  User, Lock, CheckCircle, Eye, EyeOff,
  Mail, Shield,
} from "lucide-react";
import { apiFetch } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const API_BASE = typeof window !== "undefined" 
  ? "" 
  : (process.env.NEXT_PUBLIC_API_URL ?? "https://admin.primefamilyhousing.com");

function Input({
  label,
  type = "text",
  value,
  onChange,
  readOnly,
  placeholder,
  suffix,
}: {
  label: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold tracking-[0.07em] uppercase text-on-surface-variant mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-surface-container-low rounded-xl px-4 py-3 text-[15px] text-on-surface outline-none",
            "border border-transparent focus:border-brand/30 transition-colors",
            readOnly && "text-on-surface-variant cursor-not-allowed",
            suffix && "pr-12"
          )}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-[11px] font-semibold tracking-[0.07em] uppercase text-on-surface-variant mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full bg-surface-container-low rounded-xl px-4 py-3 text-[15px] text-on-surface outline-none pr-12",
            "border transition-colors",
            error ? "border-[#ba1a1a]/40" : "border-transparent focus:border-brand/30"
          )}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {error && <p className="text-[12px] text-error mt-1">{error}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const { user, updateUser } = useAuth();

  // Personal info state
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "" });
  const [original, setOriginal] = useState({ first_name: "", last_name: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Password state
  const [pwForm, setPwForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      const vals = {
        first_name: user.first_name ?? "",
        last_name:  user.last_name  ?? "",
        phone:      user.phone      ?? "",
      };
      setForm(vals);
      setOriginal(vals);
    }
  }, [user]);

  const isDirty = (
    form.first_name !== original.first_name ||
    form.last_name  !== original.last_name  ||
    form.phone      !== original.phone
  );

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const res = await apiFetch(`${API_BASE}/api/v1/auth/me/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.first_name,
          last_name:  form.last_name,
          phone:      form.phone,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setOriginal({ first_name: form.first_name, last_name: form.last_name, phone: form.phone });
      updateUser({
        first_name: form.first_name,
        last_name:  form.last_name,
        phone:      form.phone,
        full_name:  `${form.first_name} ${form.last_name}`.trim(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pwForm.current_password) errs.current_password = "Required";
    if (pwForm.new_password.length < 8) errs.new_password = "Must be at least 8 characters";
    if (pwForm.confirm !== pwForm.new_password) errs.confirm = "Passwords don't match";
    if (Object.keys(errs).length) { setPwErrors(errs); return; }

    setPwErrors({});
    setPwSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/v1/auth/change-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: pwForm.current_password,
          new_password:     pwForm.new_password,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        const msg = data?.current_password?.[0] ?? data?.detail ?? "Something went wrong.";
        setPwErrors({ current_password: msg });
        return;
      }
      setPwForm({ current_password: "", new_password: "", confirm: "" });
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 4000);
    } catch {
      setPwErrors({ current_password: "Something went wrong. Please try again." });
    } finally {
      setPwSaving(false);
    }
  }

  const roleLabel: Record<string, string> = {
    CLIENT: "Tenant",
    AGENT: "Agent",
    MANAGER: "Manager",
    ADMIN: "Admin",
    ACCOUNTANT: "Accountant",
  };

  return (
    <div className="p-4 md:p-12 w-full max-w-7xl mx-auto">

      {/* Header */}
      <header className="mb-12">
        <h2 className="font-serif font-bold text-on-surface mb-2 text-[32px] leading-10 md:text-[48px] md:leading-[56px]" style={{ letterSpacing: "-0.02em" }}>
          Settings
        </h2>
        <p className="text-[18px] leading-7 text-on-surface-variant">Manage your profile and password.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">

        {/* Personal Info Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          <div className="px-6 pt-6 pb-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
              <User size={20} className="text-primary" strokeWidth={1.8} />
            </div>
            <h3 className="font-serif font-semibold text-on-surface text-[24px] leading-8">Personal Information</h3>
          </div>

          <form onSubmit={handleSaveProfile} className="p-6 pt-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={form.first_name}
                onChange={(v) => setForm((f) => ({ ...f, first_name: v }))}
                placeholder="First name"
              />
              <Input
                label="Last Name"
                value={form.last_name}
                onChange={(v) => setForm((f) => ({ ...f, last_name: v }))}
                placeholder="Last name"
              />
            </div>

            <Input
              label="Phone Number"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="e.g. +1 (555) 000-0000"
            />

            {/* Read-only fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <Input
                label="Email Address"
                value={user?.email ?? ""}
                readOnly
                suffix={<Lock size={14} className="text-outline-variant" />}
              />
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.07em] uppercase text-on-surface-variant mb-1.5">
                  Account Type
                </label>
                <div className="bg-surface-container-low rounded-xl px-4 py-3 flex items-center gap-2">
                  <Shield size={13} className="text-outline-variant" />
                  <span className="text-[15px] text-on-surface-variant">
                    {roleLabel[user?.role ?? ""] ?? user?.role ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            {saveError && (
              <p className="text-[13px] text-error">{saveError}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              {isDirty && (
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-brand text-white text-[13px] font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-60"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  Save Changes
                </button>
              )}
              {saved && (
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#2E7D32]">
                  <CheckCircle size={14} />
                  Saved
                </span>
              )}
              {!isDirty && !saved && (
                <p className="text-[12px] text-on-surface-variant">Make a change to save</p>
              )}
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant overflow-hidden">
          <div className="px-6 pt-6 pb-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0">
              <Lock size={20} className="text-primary" strokeWidth={1.8} />
            </div>
            <h3 className="font-serif font-semibold text-on-surface text-[24px] leading-8">Change Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="p-6 pt-2 space-y-4">
            <PasswordInput
              label="Current Password"
              value={pwForm.current_password}
              onChange={(v) => setPwForm((f) => ({ ...f, current_password: v }))}
              placeholder="Enter your current password"
              error={pwErrors.current_password}
            />
            <PasswordInput
              label="New Password"
              value={pwForm.new_password}
              onChange={(v) => setPwForm((f) => ({ ...f, new_password: v }))}
              placeholder="At least 8 characters"
              error={pwErrors.new_password}
            />
            <PasswordInput
              label="Confirm New Password"
              value={pwForm.confirm}
              onChange={(v) => setPwForm((f) => ({ ...f, confirm: v }))}
              placeholder="Repeat new password"
              error={pwErrors.confirm}
            />

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={pwSaving}
                className="inline-flex items-center gap-2 bg-primary text-on-primary text-[14px] tracking-[0.05em] font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-container transition-colors disabled:opacity-60 active:scale-[0.98]"
              >
                {pwSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : null}
                Update Password
              </button>
              {pwSaved && (
                <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#2E7D32]">
                  <CheckCircle size={14} />
                  Password updated
                </span>
              )}
            </div>
          </form>
        </div>

        </div>

        {/* Contact info card — side column */}
        <div className="bg-forest-deep rounded-xl shadow-sm p-6">
          <p className="text-[16px] leading-6 text-on-primary/80 mb-1">Need to update your email?</p>
          <h3 className="font-serif font-semibold text-on-primary text-[24px] leading-8 mb-4">Our Team is Ready.</h3>
          <p className="text-[12px] leading-4 text-on-primary/60 mb-5">Email changes require verification, so our team handles them personally.</p>
          <a
            href="mailto:info@primefamilyhousing.com?subject=Account Email Change"
            className="w-full flex items-center justify-center gap-2 bg-earth-beige text-on-secondary-container text-[14px] tracking-[0.05em] font-semibold px-4 py-3 rounded-lg hover:bg-surface transition-colors active:scale-[0.98]"
          >
            <Mail size={14} />
            Contact Us
          </a>
        </div>

      </div>
    </div>
  );
}
