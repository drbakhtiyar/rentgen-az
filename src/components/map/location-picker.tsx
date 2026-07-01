"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Navigation, Search, Loader2 } from "lucide-react";

const LocationPickerMap = dynamic(() => import("./location-picker-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-400">
      Xəritə yüklənir…
    </div>
  ),
});

export function LocationPicker({
  lat,
  lng,
  getAddress,
  onChange,
}: {
  lat?: number | null;
  lng?: number | null;
  /** returns the current address text from the form (for geocoding) */
  getAddress?: () => string;
  onChange: (lat: number, lng: number) => void;
}) {
  const [pos, setPos] = React.useState<{ lat: number; lng: number } | null>(
    typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null,
  );
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  function set(la: number, ln: number) {
    setPos({ lat: la, lng: ln });
    onChange(la, ln);
  }

  async function geocode() {
    setErr(null);
    const address = getAddress?.().trim();
    if (!address) {
      setErr("Əvvəlcə ünvanı yazın, sonra 'Ünvandan tap'a basın.");
      return;
    }
    setBusy(true);
    try {
      const q = encodeURIComponent(`${address}, Azərbaycan`);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
        { headers: { Accept: "application/json" } },
      );
      const data = (await res.json()) as { lat: string; lon: string }[];
      if (data[0]) set(parseFloat(data[0].lat), parseFloat(data[0].lon));
      else setErr("Ünvan tapılmadı. Xəritədən əl ilə seçin.");
    } catch {
      setErr("Axtarış alınmadı. Xəritədən əl ilə seçin.");
    } finally {
      setBusy(false);
    }
  }

  function useMyLocation() {
    setErr(null);
    if (!("geolocation" in navigator)) {
      setErr("Geolokasiya dəstəklənmir.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => set(p.coords.latitude, p.coords.longitude),
      () => setErr("Yer təyin edilmədi — icazə verin."),
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={geocode}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-sm font-medium text-ink-800 hover:bg-slate-50 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Ünvandan tap
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-sm font-medium text-ink-800 hover:bg-slate-50"
        >
          <Navigation className="h-4 w-4" /> Cari yerim
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Xəritəyə klikləyin və ya nişanı sürüşdürün — mərkəzin dəqiq yerini seçin.
      </p>
      <div className="h-[300px] overflow-hidden rounded-xl border border-slate-200">
        <LocationPickerMap value={pos} onPick={set} />
      </div>
      {pos && (
        <p className="text-xs text-emerald-600">
          Seçilmiş yer: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
        </p>
      )}
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}
