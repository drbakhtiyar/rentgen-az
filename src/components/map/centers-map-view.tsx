"use client";

import "leaflet/dist/leaflet.css";
import * as React from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { BAKU } from "@/lib/geo";
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

export default function CentersMapView({
  points,
  user,
  zoom,
}: {
  points: MapPoint[];
  user?: { lat: number; lng: number } | null;
  /** Override the initial zoom. Defaults to street-level for a single point. */
  zoom?: number;
}) {
  const center: [number, number] = user
    ? [user.lat, user.lng]
    : points[0]
      ? [points[0].lat, points[0].lng]
      : BAKU;

  // A single center should show at street level (like a pin drop); many
  // centers stay city-wide so they all fit.
  const initialZoom = zoom ?? (points.length === 1 ? 16 : 11);

  return (
    <MapContainer
      center={center}
      zoom={initialZoom}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {user && <Recenter center={[user.lat, user.lng]} zoom={13} />}
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
            <Link href={`/rentgen-merkezleri/${p.slug}`}>Ətraflı →</Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
