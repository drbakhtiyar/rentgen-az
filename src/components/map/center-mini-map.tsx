"use client";

import dynamic from "next/dynamic";

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
}: {
  lat: number;
  lng: number;
  name: string;
  slug: string;
}) {
  return (
    <div className="h-[280px] overflow-hidden rounded-2xl border border-slate-200">
      <CentersMapView points={[{ id: "c", name, slug, lat, lng }]} />
    </div>
  );
}
