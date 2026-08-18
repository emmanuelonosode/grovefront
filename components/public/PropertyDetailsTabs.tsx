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
    { id: "features", label: "Overview" },
    { id: "cost-calculator", label: "Monthly Cost" },
    { id: "details", label: "Amenities" },
    { id: "pet-policy", label: "Pet Policy" },
    { id: "neighborhood", label: "Neighborhood" },
    { id: "faq", label: "FAQs" },
    ...(hasVirtualTour ? [{ id: "virtual-tour", label: "360 Tour" }] : []),
    ...(hasMap ? [{ id: "map", label: "Map" }] : []),
  ], [hasMap, hasVirtualTour]);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    isClickScrolling.current = true;
    
    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - 130;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isClickScrolling.current) return;

      const scrollPosition = window.scrollY + 160;
      
      let currentActive = "features";
      for (const tab of tabs) {
        const element = document.getElementById(tab.id);
        if (element) {
          const top = element.offsetTop;
          if (scrollPosition >= top - 30) {
            currentActive = tab.id;
          }
        }
      }
      setActiveTab(currentActive);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tabs]);

  return (
    <div className="border-y border-slate-200 bg-white lg:sticky lg:top-20 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center gap-6 overflow-x-auto text-[14px] font-semibold text-slate-600 h-12 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`py-3 px-1 border-b-2 transition-all font-bold whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "text-blue-600 border-blue-600"
                : "text-slate-500 border-transparent hover:text-slate-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
