"use client";

import { useState, useEffect } from "react";
import { X, Play, ExternalLink } from "lucide-react";
import { trackClick } from "@/lib/telemetry";

interface Props {
  url: string;
  provider: string | null;
  posterUrl: string;
  address: string;
  slug: string;
}

/**
 * 3D walkthrough tour.
 *
 * The iframe is only mounted once the visitor opts in, so a third-party tour
 * player never costs anything on first paint. Tour hosts (insidemaps, zillow,
 * matterport) are already allow-listed in the CSP `frame-src` in next.config.
 */
export function PdpVirtualTour({ url, provider, posterUrl, address, slug }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => { trackClick("virtual_tour_open", { slug }); setOpen(true); }}
        className="group relative block w-full cursor-pointer overflow-hidden rounded-[8px] border border-[#dee3e9] bg-[#f1f4f7]"
        aria-label={`Play the 3D walkthrough tour of ${address}`}
      >
        <img
          src={posterUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="aspect-[16/9] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
        />
        <span className="absolute inset-0 bg-[#0a1317]/35" aria-hidden="true" />
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#0a1317] shadow-[rgba(20,22,26,0.3)_0px_1px_4px_0px]">
            <Play size={22} strokeWidth={2} fill="currentColor" aria-hidden="true" />
          </span>
          <span className="text-[16px] font-bold leading-[1.5] tracking-[-0.16px] text-white">
            Walk through this home
          </span>
          {provider && (
            <span className="text-[12px] leading-[1.33] text-white/75">Tour by {provider}</span>
          )}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`3D tour of ${address}`}
          className="fixed inset-0 z-[9999] flex flex-col bg-[#0a1317]"
        >
          <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-4 sm:px-8">
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-white">
                {address}
              </p>
              <p className="text-[12px] leading-[1.33] text-[#8595a4]">
                3D walkthrough{provider ? ` by ${provider}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-[#ced0d4] hover:text-white"
              >
                <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
                <span className="hidden sm:inline">Open in new tab</span>
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close tour"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            {/* Sits behind the iframe, so a blocked or slow tour still explains itself. */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-[14px] leading-[1.43] tracking-[-0.14px] text-[#8595a4]">
                Loading the tour
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] font-bold leading-[1.43] tracking-[-0.14px] text-white underline"
              >
                Open it in a new tab instead
              </a>
            </div>
            <iframe
              src={url}
              title={`3D walkthrough tour of ${address}`}
              className="absolute inset-0 h-full w-full border-0"
              allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
