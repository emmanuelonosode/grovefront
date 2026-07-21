"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Phone, Mail, Calendar } from "lucide-react";
import { trackClick } from "@/lib/telemetry";

interface Property {
  id: number;
  slug: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  listing_type: string;
  status: string;
  price: number;
}

interface Agent {
  id: number;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  avatar_url: string | null;
}

interface SidebarWidgetsProps {
  property: Property;
  agent: Agent | null;
  agentPhoto: string;
  agencyName: string;
}

export function SidebarWidgets({ property, agent, agentPhoto, agencyName }: SidebarWidgetsProps) {
  const [showPhone, setShowPhone] = useState(false);
  const [comments, setComments] = useState("");
  const [subscribeInput, setSubscribeInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submittingSubscribe, setSubmittingSubscribe] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");

  // Generate dynamic upcoming dates starting from today
  const [upcomingDates, setUpcomingDates] = useState<{ label: string; date: string; month: string }[]>([]);

  useEffect(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const result = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : days[d.getDay()];
      result.push({
        label,
        date: String(d.getDate()).padStart(2, "0"),
        month: months[d.getMonth()]
      });
    }
    setUpcomingDates(result);
  }, []);

  const handleOpenTour = () => {
    trackClick("book_tour", { slug: property.slug, where: "sidebar_dates" });
    window.dispatchEvent(new Event("pfh:open-tour"));
  };

  const handleRequestInfo = () => {
    trackClick("request_info_sidebar", { slug: property.slug });
    // Save comments to localStorage so the tour/inquiry form can prepopulate if needed
    if (comments.trim()) {
      localStorage.setItem(`inquiry_comments_${property.slug}`, comments.trim());
    }
    window.dispatchEvent(new Event("pfh:open-tour"));
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribeInput.trim()) {
      setSubscribeError("Please enter your email or phone.");
      return;
    }

    setSubmittingSubscribe(true);
    setSubscribeError("");

    try {
      const isEmail = subscribeInput.includes("@");
      const payload = {
        full_name: "Open House Subscriber",
        email: isEmail ? subscribeInput.trim() : "subscriber@primefamilyhousing.com",
        phone: !isEmail ? subscribeInput.trim() : undefined,
        source: "NEWSLETTER",
        interest_type: "RENT",
        property_interest: property.id,
        services_requested: [property.slug],
        message: `Subscribed to upcoming open house notifications for ${property.address}, ${property.city}. Input provided: ${subscribeInput.trim()}`
      };

      const res = await fetch("/api/v1/leads/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to subscribe. Please try again.");
      }

      setSubscribed(true);
      setSubscribeInput("");
    } catch (err) {
      setSubscribeError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmittingSubscribe(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent card */}
      {agent && (
        <div className="bg-white border border-neutral-200/80 rounded-xl p-5 md:p-6 shadow-sm space-y-4">
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#6A6C70]">Listing agent</span>
          
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded overflow-hidden shrink-0 border border-neutral-100 bg-neutral-50">
              <Image
                src={agentPhoto}
                alt={agent.full_name}
                fill
                className="object-cover"
                sizes="64px"
                unoptimized
              />
            </div>
            <div>
              <h3 className="text-[16px] font-black text-[#2A2B2D] leading-tight">
                {agent.full_name}
              </h3>
              <p className="text-[13px] text-[#6A6C70] font-medium mt-0.5">{agencyName}</p>
              
              <a
                href={`/agents/${agent.id}`}
                className="inline-flex items-center gap-1 mt-1 text-[#1A73E8] text-[13px] font-bold hover:underline"
              >
                View profile →
              </a>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100">
            {showPhone ? (
              <a href={`tel:${agent.phone}`} className="flex items-center gap-1.5 text-[#1A73E8] text-[14px] font-bold hover:underline">
                <Phone size={14} className="shrink-0" />
                <span>{agent.phone}</span>
              </a>
            ) : (
              <button 
                onClick={() => setShowPhone(true)}
                className="flex items-center gap-1.5 text-[#1A73E8] text-[14px] font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                <Phone size={14} className="shrink-0" />
                <span>View phone</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Apply Now / Actions Card */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100/80 rounded-xl p-3.5 text-xs text-emerald-800">
          <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div className="leading-snug">
            <span className="font-bold">Instant Pre-Screening:</span> Qualify online in 30s. No hard credit checks.
          </div>
        </div>

        <a
          href={`/apply?property=${property.slug}`}
          onClick={() => trackClick("apply_now", { slug: property.slug, where: "sidebar" })}
          className="w-full flex items-center justify-center gap-1.5 h-12 bg-accent hover:bg-accent-hover text-neutral-900 text-sm font-bold rounded transition-colors text-center cursor-pointer shadow-md shadow-amber-500/20"
        >
          Apply Now
        </a>

        <p className="text-[10px] text-center text-neutral-400">
          Guideline: Monthly Gross Income ≥ 3x rent (${(property.price * 3).toLocaleString()}/mo)
        </p>
      </div>

      {/* Schedule a tour picker */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 md:p-6 shadow-sm">
        <span className="text-[12px] font-bold uppercase tracking-wider text-[#6A6C70]">Schedule a tour</span>
        <p className="font-serif text-[22px] font-bold text-brand-dark leading-[1.2] mt-2 mb-[14px]">
          See it in person.
        </p>

        {/* Horizontal Date Picker */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {upcomingDates.map((d, index) => (
            <button
              key={d.date}
              onClick={handleOpenTour}
              className={`border rounded-lg p-2.5 flex flex-col items-center justify-center transition-all ${
                index === 0
                  ? "border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]"
                  : "border-neutral-200 text-neutral-800 hover:border-neutral-300"
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wide text-neutral-400">{d.label.slice(0, 5)}</span>
              <span className="text-[20px] font-black leading-none my-1">{d.date}</span>
              <span className="text-[10px] font-bold tracking-wider">{d.month}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 text-center">
          <button 
            onClick={handleOpenTour}
            className="text-[#1A73E8] hover:underline text-[13.5px] font-bold cursor-pointer bg-transparent border-none p-0"
          >
            Other dates
          </button>
        </div>
      </div>

      {/* Ask the agent a question form */}
      <div className="bg-white border border-neutral-200/80 rounded-xl p-5 md:p-6 shadow-sm space-y-4">
        <h3 className="text-[16px] font-black text-[#2A2B2D]">
          Ask the agent a question!
        </h3>

        <div className="flex gap-3">
          {agent?.phone ? (
            <a 
              href={`tel:${agent.phone}`}
              className="flex-1 border border-neutral-200 hover:bg-neutral-50 rounded py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-600"
            >
              <Phone size={13} /> Call
            </a>
          ) : (
            <button className="flex-1 border border-neutral-200 hover:bg-neutral-50 rounded py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-600 opacity-50 cursor-not-allowed">
              <Phone size={13} /> Call
            </button>
          )}
          {agent?.email ? (
            <a 
              href={`mailto:${agent.email}`}
              className="flex-1 border border-neutral-200 hover:bg-neutral-50 rounded py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-600"
            >
              <Mail size={13} /> Email
            </a>
          ) : (
            <button className="flex-1 border border-neutral-200 hover:bg-neutral-50 rounded py-2 flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-600 opacity-50 cursor-not-allowed">
              <Mail size={13} /> Email
            </button>
          )}
        </div>

        <textarea
          className="w-full border border-neutral-200 rounded p-3 text-[14px] text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 h-24"
          placeholder="Your comments..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />

        <button 
          onClick={handleRequestInfo}
          className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white rounded py-3 text-sm font-bold transition-colors"
        >
          Request info
        </button>

        <div className="text-center pt-2">
          <p className="text-[12px] text-neutral-500">
            Are you working with a buyer agent?
          </p>
          <button 
            onClick={handleOpenTour}
            className="text-[#1A73E8] hover:underline text-[13px] font-bold cursor-pointer inline-flex items-center gap-0.5 mt-1 bg-transparent border-none p-0"
          >
            Connect with your agent now <span className="text-[10px]">➔</span>
          </button>
        </div>
      </div>

      {/* Open House Notifications Alert Box */}
      <div className="bg-[#0D2451] rounded-xl p-5 md:p-6 shadow-md text-white space-y-4 relative overflow-hidden">
        <div className="flex gap-4">
          <div className="w-11 h-11 rounded-full bg-accent flex items-center justify-center shrink-0 shadow-lg">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 22a2.01 2.01 0 002-2h-4a2.01 2.01 0 002 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </div>
          <div>
            <h4 className="text-[15px] font-black leading-tight text-white/95">
              Get notifications of the upcoming open houses for {property.address}
            </h4>
          </div>
        </div>

        {subscribed ? (
          <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-100 rounded p-3 text-xs text-center font-bold">
            ✓ Successfully subscribed to open house alerts!
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-3">
            <input
              type="text"
              placeholder="Email or Phone"
              className="w-full bg-white text-neutral-800 rounded px-3.5 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-neutral-400 font-semibold"
              value={subscribeInput}
              onChange={(e) => setSubscribeInput(e.target.value)}
              disabled={submittingSubscribe}
            />
            {subscribeError && (
              <p className="text-[#FF4F60] text-xs font-bold">{subscribeError}</p>
            )}
            <button 
              type="submit"
              className="w-full bg-[#1A73E8] hover:bg-blue-600 text-white rounded py-2.5 text-xs font-extrabold uppercase tracking-widest transition-colors shadow disabled:opacity-50"
              disabled={submittingSubscribe}
            >
              {submittingSubscribe ? "Subscribing..." : "Subscribe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
