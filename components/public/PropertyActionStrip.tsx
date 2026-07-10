"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Heart, Printer } from "lucide-react";
import { FavoriteButton } from "./FavoriteButton";
import { toast } from "sonner";

interface PropertyActionStripProps {
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
}

export function PropertyActionStrip({ propertyId, propertyTitle, propertyAddress }: PropertyActionStripProps) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("EN");
  const [disliked, setDisliked] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close language menu on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleShare = async () => {
    const url = window.location.href;
    const shareText = `Check out this listing on Hasker & Co: ${propertyAddress}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: propertyTitle,
          text: shareText,
          url: url,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        // Ignored if user dismissed native share dialog
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Listing link copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy link.");
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLanguageSelect = (lang: string) => {
    setCurrentLang(lang);
    setLangMenuOpen(false);
    toast.info(`Language switched to ${lang === "EN" ? "English" : lang === "ES" ? "Spanish" : "Vietnamese"}`);
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
      toast.info("Feedback cleared.");
    } else {
      setDisliked(true);
      toast.info("Feedback registered. We will show you fewer homes like this.");
    }
  };

  return (
    <div className="flex items-center gap-2.5 relative" ref={menuRef}>
      {/* Save / Favorite Button */}
      <FavoriteButton
        propertyId={propertyId}
        className="w-9 h-9 border border-neutral-200 rounded hover:bg-neutral-50 text-neutral-500 flex items-center justify-center transition-colors !p-0 !min-w-[36px] !min-h-[36px]"
      />

      {/* Dislike/Thumb Down Button */}
      <button
        onClick={handleDislike}
        title="Dislike this property"
        className={`w-9 h-9 border rounded flex items-center justify-center transition-colors ${
          disliked
            ? "border-amber-200 bg-amber-50 text-amber-600"
            : "border-neutral-200 hover:bg-neutral-50 text-neutral-500"
        }`}
      >
        <svg className="w-4 h-4" fill={disliked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76 1.037A2 2 0 0118.5 6.036V11m-8 3v5a2 2 0 01-2 2h-.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 11h2M18 11h2a2 2 0 012 2v2a2 2 0 01-2 2h-2m0-6V11" />
        </svg>
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        title="Share property listing"
        className="w-9 h-9 border border-neutral-200 rounded hover:bg-neutral-50 text-neutral-500 flex items-center justify-center transition-colors"
      >
        <Share2 size={15} />
      </button>

      {/* Print Button */}
      <button
        onClick={handlePrint}
        title="Print flyer details"
        className="w-9 h-9 border border-neutral-200 rounded hover:bg-neutral-50 text-neutral-500 flex items-center justify-center transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-5a2 2 0 00-2-2H5a2 2 0 00-2 2v5a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
      </button>

      {/* Language Selector Dropdown */}
      <div className="relative">
        <button
          onClick={() => setLangMenuOpen(!langMenuOpen)}
          className="h-9 px-2 border border-neutral-200 rounded hover:bg-neutral-50 text-neutral-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>{currentLang === "EN" ? "🇺🇸" : currentLang === "ES" ? "🇪🇸" : "🇻🇳"}</span>
          <span className="text-[9px]">▼</span>
        </button>

        {langMenuOpen && (
          <div className="absolute right-0 mt-1 w-28 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50 text-xs text-neutral-700 font-semibold">
            <button
              onClick={() => handleLanguageSelect("EN")}
              className="w-full px-3 py-2 text-left hover:bg-neutral-50 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🇺🇸</span> English
            </button>
            <button
              onClick={() => handleLanguageSelect("ES")}
              className="w-full px-3 py-2 text-left hover:bg-neutral-50 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🇪🇸</span> Español
            </button>
            <button
              onClick={() => handleLanguageSelect("VN")}
              className="w-full px-3 py-2 text-left hover:bg-neutral-50 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🇻🇳</span> Tiếng Việt
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
