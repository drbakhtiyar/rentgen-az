"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Navigation, Loader2, MapPin, ArrowDownWideNarrow } from "lucide-react";
import { CenterCard } from "@/components/centers/center-card";
import type { CenterWithServices } from "@/lib/queries";
import { distanceKm, formatDistance, hasCoords } from "@/lib/geo";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import type { CenterSort } from "@/lib/rating";

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
  activeService,
  sort = "recommended",
  locale = DEFAULT_LOCALE,
}: {
  centers: CenterWithServices[];
  ratings: Record<string, { avg: number; count: number }>;
  /** service slug the patient searched for (enables price sort + highlight) */
  activeService?: string;
  /** active sort, driven by the URL — ordering & pagination happen server-side.
   *  The client only reorders the current page for "distance" (needs geo). */
  sort?: CenterSort;
  locale?: Locale;
}) {
  const t = getDict(locale).centers;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = React.useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Navigate on sort change so ordering + pagination stay in sync across pages.
  const changeSort = React.useCallback(
    (next: CenterSort) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "recommended") params.delete("sort");
      else params.set("sort", next);
      params.delete("page"); // new order → back to page 1
      const s = params.toString();
      router.push(`/rentgen-merkezleri${s ? `?${s}` : ""}`);
    },
    [router, searchParams],
  );

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
    // Server already ordered the full set (recommended / rating / googleRating /
    // price) and paginated it. The client only reorders the current page by
    // distance when location is known (the "nearest" flow).
    if ((sort === "distance" || sort === "recommended") && user) {
      list.sort((a, b) => {
        if (a.dist == null) return 1;
        if (b.dist == null) return -1;
        return a.dist - b.dist;
      });
    }
    return list;
  }, [centers, user, sort]);

  const requestLocation = React.useCallback(() => {
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
  }, []);

  function onNearbyClick() {
    requestLocation();
    if (sort !== "distance") changeSort("distance");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onNearbyClick}
          disabled={loading}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          {t.nearby}
        </button>

        <label className="ml-auto flex items-center gap-2 text-sm text-slate-500">
          <ArrowDownWideNarrow className="h-4 w-4" />
          <span className="hidden sm:inline">{t.sortBy}:</span>
          <select
            value={sort}
            onChange={(e) => {
              const next = e.target.value as CenterSort;
              // "nearest" needs a location; state persists across the soft nav.
              if (next === "distance" && !user) requestLocation();
              changeSort(next);
            }}
            className="h-10 rounded-full border border-slate-200 bg-white px-3 text-sm font-medium text-ink-800 focus:border-brand-400 focus:outline-none"
          >
            <option value="recommended">{t.sortRecommended}</option>
            {activeService && <option value="price">{t.sortCheapest}</option>}
            <option value="rating">{t.sortRating}</option>
            <option value="googleRating">{t.sortGoogleRating}</option>
            <option value="distance">{t.sortNearest}</option>
          </select>
        </label>

        {err && <span className="w-full text-sm text-red-600">{err}</span>}
      </div>

      {points.length > 0 ? (
        {/* 2026-08-16: 360px alçaq idi — fitBounds bütün ölkəni sığdıranda cənub
            (Lənkəran) kəsilirdi. Hündürlük artırıldı ki, default masştabda tam
            ölkə görünsün. */}
        <div className="h-[420px] overflow-hidden rounded-3xl border border-slate-200 shadow-[var(--shadow-soft)] lg:h-[500px]">
          <CentersMapView points={points} user={user} locale={locale} />
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
            <CenterCard
              center={c}
              rating={ratings[c.id]}
              highlightService={activeService}
              locale={locale}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
