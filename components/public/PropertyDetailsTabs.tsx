"use client";

import { useEffect, useState, useRef, useMemo } from "react";

interface PropertyDetailsTabsProps {
  hasMap: boolean;
  hasVirtualTour: boolean;
}

export function PropertyDetailsTabs({ hasMap, hasVirtualTour }: PropertyDetailsTabsProps) {
  const [activeTab, setActiveTab] = useState("features");
  const isClickScrolling = useRef(false);

  const tabs = useMemo(() => [
    { id: "features", label: "Home Features" },
    { id: "details", label: "Property Details" },
    ...(hasVirtualTour ? [{ id: "virtual-tour", label: "360 Tour" }] : []),
    ...(hasMap ? [{ id: "map", label: "Location Map" }] : []),
  ], [hasMap, hasVirtualTour]);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    isClickScrolling.current = true;
    
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - 130; // Navbar + Tab strip offset
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    // Allow scroll spy to take over after scroll animation ends
    setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isClickScrolling.current) return;

      const scrollPosition = window.scrollY + 160; // offset buffer
      
      // Find the active section based on scroll position
      let currentActive = "features";
      for (const tab of tabs) {
        const element = document.getElementById(tab.id);
        if (element) {
          const top = element.offsetTop;
          if (scrollPosition >= top - 20) {
            currentActive = tab.id;
          }
        }
      }
      setActiveTab(currentActive);
    };

    window.addEventListener("scroll", handleScroll);
    // Trigger initial run
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tabs]);

  return (
    <div className="border-y border-neutral-200 bg-white sticky top-16 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center gap-6 overflow-x-auto text-[14px] font-semibold text-[#4A4B4D] h-12 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`py-3 px-1 border-b-2 transition-all font-bold whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "text-[#1A73E8] border-[#1A73E8]"
                : "text-neutral-500 border-transparent hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
