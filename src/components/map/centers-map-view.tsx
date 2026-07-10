"use client";

import "leaflet/dist/leaflet.css";
import * as React from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { BAKU } from "@/lib/geo";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { pinIcon, userIcon } from "./icons";

export type MapPoint = {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  distance?: string;
};

function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

// Fit the view to all pins: close pins get a street-level zoom, far-apart
// pins zoom out just enough to show them all. `maxZoom` caps how close a
// single/tight cluster is shown.
function FitToPoints({
  positions,
  maxZoom,
}: {
  positions: [number, number][];
  maxZoom: number;
}) {
  const map = useMap();
  const key = positions.map((p) => p.join(",")).join("|");
  React.useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], maxZoom);
    } else {
      map.fitBounds(positions, { padding: [40, 40], maxZoom });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key, maxZoom]);
  return null;
}

export default function CentersMapView({
  points,
  user,
  zoom,
  locale = DEFAULT_LOCALE,
}: {
  points: MapPoint[];
  user?: { lat: number; lng: number } | null;
  /** Override the initial zoom. Defaults to street-level for a single point. */
  zoom?: number;
  locale?: Locale;
}) {
  const detailsLabel = getDict(locale).cta.details;
  const center: [number, number] = user
    ? [user.lat, user.lng]
    : points[0]
      ? [points[0].lat, points[0].lng]
      : BAKU;

  // Street-level cap so a single center / tight cluster shows at the same
  // scale as a Google-Maps pin drop.
  const maxZoom = zoom ?? 16;

  return (
    <MapContainer
      center={center}
      zoom={maxZoom}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* No user → fit the pins tightly. With a user (nearby search) keep them centred. */}
      {user ? (
        <Recenter center={[user.lat, user.lng]} zoom={13} />
      ) : (
        <FitToPoints
          positions={points.map((p) => [p.lat, p.lng])}
          maxZoom={maxZoom}
        />
      )}
      {user && (
        <Marker position={[user.lat, user.lng]} icon={userIcon()}>
          <Popup>Siz buradasınız</Popup>
        </Marker>
      )}
      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon()}>
          <Popup>
            <strong>{p.name}</strong>
            {p.distance ? ` · ${p.distance}` : ""}
            <br />
            <Link href={`/rentgen-merkezleri/${p.slug}`}>{detailsLabel} →</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
