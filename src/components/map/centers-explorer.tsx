"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Navigation, Loader2, MapPin } from "lucide-react";
import { CenterCard } from "@/components/centers/center-card";
import type { CenterWithServices } from "@/lib/queries";
import { distanceKm, formatDistance, hasCoords } from "@/lib/geo";

const CentersMapView = dynamic(() => import("./centers-map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
      Xəritə yüklənir…
    </div>
  ),
});

export function CentersExplorer({
  centers,
  ratings,
}: {
  centers: CenterWithServices[];
  ratings: Record<string, { avg: number; count: number }>;
}) {
  const [user, setUser] = React.useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  const points = React.useMemo(
    () =>
      centers.filter(hasCoords).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        lat: c.lat as number,
        lng: c.lng as number,
        distance: user
          ? formatDistance(distanceKm(user, { lat: c.lat as number, lng: c.lng as number }))
          : undefined,
      })),
    [centers, user],
  );

  const sorted = React.useMemo(() => {
    const list = centers.map((c) => ({
      c,
      dist: user && hasCoords(c) ? distanceKm(user, { lat: c.lat, lng: c.lng }) : null,
    }));
    if (user) {
      list.sort((a, b) => {
        if (a.dist == null) return 1;
        if (b.dist == null) return -1;
        return a.dist - b.dist;
      });
    }
    return list;
  }, [centers, user]);

  function findNearby() {
    setErr(null);
    if (!("geolocation" in navigator)) {
      setErr("Brauzeriniz geolokasiyanı dəstəkləmir.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setErr("Yerinizi təyin etmək mümkün olmadı — brauzerdə icazə verin.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={findNearby}
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          Yaxınımdakı mərkəzləri tap
        </button>
        {user && (
          <span className="text-sm font-medium text-emerald-600">
            Məsafəyə görə sıralandı ✓
          </span>
        )}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      {points.length > 0 ? (
        <div className="h-[360px] overflow-hidden rounded-2xl border border-slate-200 shadow-[var(--shadow-soft)]">
          <CentersMapView points={points} user={user} />
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          <MapPin className="h-4 w-4" />
          Hələ heç bir mərkəz xəritədə yerini qeyd etməyib.
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map(({ c, dist }) => (
          <div key={c.id} className="relative">
            {dist != null && (
              <span className="absolute right-3 top-3 z-[400] inline-flex items-center gap-1 rounded-full bg-ink-900/85 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                <Navigation className="h-3 w-3" />
                {formatDistance(dist)}
              </span>
            )}
            <CenterCard center={c} rating={ratings[c.id]} />
          </div>
        ))}
      </div>
    </div>
  );
}
