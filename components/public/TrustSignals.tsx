import { ShieldCheck, BadgeDollarSign, Clock, BadgeCheck, PawPrint, Headset } from "lucide-react";

const POINTS = [
  {
    icon: ShieldCheck,
    title: "Real, move-in ready homes",
    body: "Every listing is genuine and inspected. What you see in the photos is what you get when you walk in.",
  },
  {
    icon: BadgeDollarSign,
    title: "Transparent pricing, no hidden fees",
    body: "Rent, deposit, and pet policy are shown upfront. The price you see is the price you pay.",
  },
  {
    icon: Clock,
    title: "A real answer in 24 hours",
    body: "Apply online in under 10 minutes and hear back within a day. No waiting, no chasing.",
  },
  {
    icon: BadgeCheck,
    title: "Licensed, accountable brokerage",
    body: "Hasker & Co. is a licensed brokerage held to professional standards in every state we serve.",
  },
  {
    icon: PawPrint,
    title: "Pets are genuinely welcome",
    body: "Many homes are pet-friendly, with policies stated upfront so you never tour the wrong place.",
  },
  {
    icon: Headset,
    title: "Real people, ready to help",
    body: "A specialist is a call or message away. We treat renters like future neighbors, not ticket numbers.",
  },
];

/**
 * Honest, welcoming trust section — genuine signals only (no fabricated reviews).
 * Editorial split layout (warm intro + divided list) rather than a uniform card
 * grid, so it reads human instead of automated.
 */
export function TrustSignals({
  eyebrow = "Why renters choose us",
  heading = "Renting you can actually trust",
  subheading = "We built Hasker & Co. around the things renters told us they wished every landlord did: no games, no fine print, and a straight path to your next home.",
  tone = "light",
}: {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  tone?: "light" | "tint";
}) {
  return (
    <section className={tone === "tint" ? "bg-brand-light border-y border-brand-muted" : "bg-white border-t border-neutral-100"}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-20 items-start">
          {/* Warm intro */}
          <div className="lg:sticky lg:top-28">
            <p className="text-brand text-xs font-semibold tracking-[0.3em] uppercase mb-4">{eyebrow}</p>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-brand-dark leading-tight">{heading}</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-neutral-600 max-w-md">{subheading}</p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-3.5 py-1.5">
              <BadgeCheck size={15} className="text-emerald-500 shrink-0" />
              <span className="text-[12.5px] font-medium text-emerald-800">Equal Housing Opportunity</span>
            </div>
          </div>

          {/* Trust points — divided list, not a card grid */}
          <div className="divide-y divide-[#EDF1F5]">
            {POINTS.map((p, i) => (
              <div key={p.title} className={`flex gap-4 sm:gap-5 py-5 ${i === 0 ? "lg:pt-0" : ""}`}>
                <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center">
                  <p.icon size={18} className="text-brand" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[15px] text-brand-dark">{p.title}</h3>
                  <p className="text-[13.5px] leading-relaxed text-neutral-500 mt-1">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
