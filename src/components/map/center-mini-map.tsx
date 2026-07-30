"use client";

import dynamic from "next/dynamic";
import { Navigation } from "lucide-react";

const CentersMapView = dynamic(() => import("./centers-map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
      Xəritə yüklənir…
    </div>
  ),
});

export function CenterMiniMap({
  lat,
  lng,
  name,
  slug,
  directionsLabel = "Yol tərifi",
}: {
  lat: number;
  lng: number;
  name: string;
  slug: string;
  directionsLabel?: string;
}) {
  // Google Maps directions to the center. On phones this opens the Google Maps
  // app with live walking / driving / transit options; on desktop the website.
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="relative h-40 overflow-hidden rounded-2xl border border-slate-200 sm:h-48">
      <CentersMapView points={[{ id: "c", name, slug, lat, lng }]} />

      {/* Mobile: a tap anywhere on the map jumps straight to Google directions
          (the interactive map is kept for desktop, where panning is useful).
          Page scrolling still works — an anchor doesn't trap touch. */}
      <a
        href={directions}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={directionsLabel}
        className="absolute inset-0 z-[1000] md:hidden"
      />

      {/* Directions button — visible on every device. */}
      <a
        href={directions}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 z-[1001] inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg ring-1 ring-black/5 hover:bg-brand-700"
      >
        <Navigation className="h-4 w-4" /> {directionsLabel}
      </a>
    </div>
  );
}
