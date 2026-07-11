"use client";

import { FavoriteButton } from "./FavoriteButton";

interface PropertyActionStripProps {
  propertyId: number;
  propertyTitle: string;
  propertyAddress: string;
}

export function PropertyActionStrip({ propertyId }: PropertyActionStripProps) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Save / Favorite */}
      <FavoriteButton
        propertyId={propertyId}
        className="w-9 h-9 border border-neutral-200 rounded hover:bg-neutral-50 text-neutral-500 flex items-center justify-center transition-colors !p-0 !min-w-[36px] !min-h-[36px]"
      />
    </div>
  );
}
