"use client";

import { useState } from "react";
import Image from "next/image";
import { CalendarDays, Phone, ShieldCheck, Check, LoaderCircle, ChevronRight } from "lucide-react";
import { trackClick } from "@/lib/telemetry";
import { getStoredUTMs } from "@/lib/tracking";
import { formatNumber } from "@/lib/utils";
import { formatMoney } from "@/lib/propertyDetail";

interface Agent {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  avatar_url: string | null;
  has_public_profile?: boolean;
}

interface Props {
  slug: string;
  propertyId: number;
  address: string;
  city: string;
  price: number;
  priceLabel: string;
  isAvailable: boolean;
  /** Rent plus required monthly charges, when the fee feed is available. */
  totalMonthly?: number | null;
  /** e.g. "Available now" or "Available Sep 17, 2026". */
  availabilityLabel?: string | null;
  /** False when the home must be shown by appointment. */
  allowsSelfTour?: boolean;
  agent: Agent | null;
  agentPhoto: string;
  /** Rendered inline on mobile below the identity band, sticky on desktop. */
  variant?: "rail" | "inline";
}

/**
 * The single conversion surface for the page.
 *
 * One primary intent (tour), one secondary (apply), and one low-friction
 * fallback (ask a question) for visitors who aren't ready to commit to either.
 * Everything else that used to live in the sidebar competed with these three
 * and gave the visitor no idea which action was the real one.
 */
export function PdpLeadRail({
  slug, propertyId, address, city, price, priceLabel,
  isAvailable, totalMonthly, availabilityLabel, allowsSelfTour = true,
  agent, agentPhoto, variant = "rail",
}: Props) {
  const [askOpen, setAskOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const openTour = (where: string) => {
    trackClick("book_tour", { slug, where });
    window.dispatchEvent(new Event("pfh:open-tour"));
  };

  async function submitAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter your name.");
    if (!contact.trim()) return setError("Please enter an email or phone number so we can reply.");

    setState("sending");
    setError("");
    try {
      const isEmail = contact.includes("@");
      const res = await fetch("/api/v1/leads/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name.trim(),
          email: isEmail ? contact.trim() : "",
          phone: isEmail ? "" : contact.trim(),
          source: "PROPERTY_INQUIRY",
          interest_type: "RENT",
          property_interest: propertyId,
          message:
            `Question about ${address}, ${city}.\n\n` +
            (message.trim() || "No message provided."),
          ...getStoredUTMs(),
        }),
      });
      if (!res.ok) throw new Error("We couldn't send that just now. Please try again.");
      trackClick("property_question_submitted", { slug, city });
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("idle");
    }
  }

  return (
    <div
      className={
        variant === "rail"
          ? "rounded-[8px] border border-[#dee3e9] bg-white p-6 shadow-[rgba(20,22,26,0.3)_0px_1px_4px_0px]"
          : "rounded-[8px] border border-[#dee3e9] bg-white p-6"
      }
    >
      {/* Price restated at the point of decision. The visitor may have scrolled far. */}
      <div className="flex items-baseline gap-2">
        <span className="pdp-display text-[28px] font-bold leading-[1.21] text-[#0a1317]">
          ${formatNumber(price)}
        </span>
        <span className="text-[16px] font-normal leading-[1.5] tracking-[-0.16px] text-[#5d6c7b]">
          {priceLabel || "/mo"}
        </span>
      </div>

      {/* The all-in figure, so the rail never quotes a number the cost section
          then contradicts. */}
      {typeof totalMonthly === "number" && totalMonthly > price && (
        <p className="mt-1.5 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#5d6c7b]">
          ${formatMoney(totalMonthly)}{priceLabel || "/mo"} with required charges
        </p>
      )}

      <p className="mt-3 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#5d6c7b]">
        {address}, {city}
      </p>

      {isAvailable && (
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-[8px] bg-[#31a24c] px-2.5 py-1 text-[12px] font-bold leading-[1.33] text-white">
          <Check size={12} strokeWidth={3} aria-hidden="true" />
          {availabilityLabel || "Available now"}
        </span>
      )}

      {/* Primary: cobalt buy-CTA. Applying is the commerce action on the page. */}
      <a
        href={`/apply?property=${slug}`}
        onClick={() => trackClick("apply_now", { slug, where: variant })}
        className="mt-5 flex w-full items-center justify-center rounded-[8px] bg-[#0064e0] px-[30px] py-[14px] text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-white transition-colors hover:bg-[#0457cb] active:bg-[#0457cb] active:scale-[0.98]"
      >
        Apply now
      </a>

      {/* Secondary: outlined ghost, one clear step down in weight. */}
      <button
        type="button"
        onClick={() => openTour(variant === "rail" ? "rail" : "inline")}
        className="mt-2.5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] border-2 border-[#0a1317] px-[28px] py-[12px] text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-[#0a1317] transition-colors hover:bg-[#f1f4f7]"
      >
        <CalendarDays size={16} strokeWidth={2.5} aria-hidden="true" />
        Schedule a tour
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] leading-[1.33] text-[#5d6c7b]">
        <ShieldCheck size={13} strokeWidth={2} aria-hidden="true" className="shrink-0 text-[#31a24c]" />
        {allowsSelfTour ? "Free to apply. Tour on your own schedule." : "Free to apply. Tours by appointment."}
      </p>

      {/* Low-friction third rung: capture the visitor who won't book or apply yet. */}
      <div className="mt-5 border-t border-[#dee3e9] pt-5">
        {state === "sent" ? (
          <div className="rounded-[8px] bg-[#f1f4f7] p-4 text-center">
            <Check size={20} strokeWidth={2.5} className="mx-auto text-[#31a24c]" />
            <p className="mt-2 text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-[#0a1317]">
              Message sent
            </p>
            <p className="mt-1 text-[12px] leading-[1.33] text-[#5d6c7b]">
              A leasing specialist will reply within one business day.
            </p>
          </div>
        ) : askOpen ? (
          <form onSubmit={submitAsk} className="space-y-3">
            <div>
              <label htmlFor="pdp-ask-name" className="block text-[12px] font-bold leading-[1.33] text-[#1c1e21]">
                Your name
              </label>
              <input
                id="pdp-ask-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="mt-1 h-11 w-full rounded-[8px] border border-[#ced0d4] bg-white px-3 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#1c1e21] placeholder:text-[#5d6c7b] focus:border-[#1876f2] focus:outline-none focus:ring-1 focus:ring-[#1876f2]"
                placeholder="Jamila Okonkwo"
              />
            </div>
            <div>
              <label htmlFor="pdp-ask-contact" className="block text-[12px] font-bold leading-[1.33] text-[#1c1e21]">
                Email or phone
              </label>
              <input
                id="pdp-ask-contact"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                autoComplete="email"
                className="mt-1 h-11 w-full rounded-[8px] border border-[#ced0d4] bg-white px-3 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#1c1e21] placeholder:text-[#5d6c7b] focus:border-[#1876f2] focus:outline-none focus:ring-1 focus:ring-[#1876f2]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="pdp-ask-msg" className="block text-[12px] font-bold leading-[1.33] text-[#1c1e21]">
                Question <span className="font-normal text-[#5d6c7b]">(optional)</span>
              </label>
              <textarea
                id="pdp-ask-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-none rounded-[8px] border border-[#ced0d4] bg-white p-3 text-[14px] leading-[1.43] tracking-[-0.14px] text-[#1c1e21] placeholder:text-[#5d6c7b] focus:border-[#1876f2] focus:outline-none focus:ring-1 focus:ring-[#1876f2]"
                placeholder="Is the yard fenced?"
              />
            </div>

            {error && (
              <p className="text-[12px] font-bold leading-[1.33] text-[#f0284a]">{error}</p>
            )}

            <button
              type="submit"
              disabled={state === "sending"}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-[#0a1317] px-[30px] py-[14px] text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-white transition-colors hover:bg-[#444950] disabled:bg-[#bcc0c4]"
            >
              {state === "sending" ? (
                <>
                  <LoaderCircle size={15} strokeWidth={2.5} className="animate-spin" /> Sending
                </>
              ) : (
                "Send question"
              )}
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => {
              setAskOpen(true);
              trackClick("ask_question_open", { slug, where: variant });
            }}
            className="-my-2 flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 py-2 text-left"
          >
            <span className="text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-[#0a1317]">
              Not ready yet? Ask a question
            </span>
            <ChevronRight size={16} strokeWidth={2.5} className="shrink-0 text-[#5d6c7b]" />
          </button>
        )}
      </div>

      {/* Agent as reassurance, not as a competing CTA. */}
      {agent && (
        <div className="mt-5 flex items-center gap-3 border-t border-[#dee3e9] pt-5">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#f1f4f7]">
            <Image src={agentPhoto} alt="" fill sizes="40px" className="object-cover" unoptimized />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-[#0a1317]">
              {agent.full_name}
            </p>
            <p className="text-[12px] leading-[1.33] text-[#5d6c7b]">Prime Family Housing</p>
          </div>
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              onClick={() => trackClick("agent_call", { slug, where: variant })}
              aria-label={`Call ${agent.full_name}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#ced0d4] text-[#0a1317] transition-colors hover:bg-[#f1f4f7]"
            >
              <Phone size={16} strokeWidth={2} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
