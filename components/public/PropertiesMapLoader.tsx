"use client";

import dynamic from "next/dynamic";
import type { MapMarker, MapBounds } from "./PropertiesMap";

const PropertiesMap = dynamic(
  () => import("./PropertiesMap").then((m) => m.PropertiesMap),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-neutral-100 animate-pulse" /> }
);

interface Props {
  markers: MapMarker[];
  activeSlug?: string | null;
  onMarkerClick?: (slug: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  searchQuery?: string;
}

export function PropertiesMapLoader({ markers, activeSlug, onMarkerClick, onBoundsChange, searchQuery }: Props) {
  return (
    <div className="w-full h-full">
      <PropertiesMap
        markers={markers}
        activeSlug={activeSlug}
        onMarkerClick={onMarkerClick}
        onBoundsChange={onBoundsChange}
        searchQuery={searchQuery}
      />
    </div>
  );
}
