"use client";

import "leaflet/dist/leaflet.css";
import * as React from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import { BAKU } from "@/lib/geo";
import { pinIcon } from "./icons";

type Pos = { lat: number; lng: number } | null;

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function Recenter({ pos }: { pos: Pos }) {
  const map = useMap();
  React.useEffect(() => {
    if (pos) map.setView([pos.lat, pos.lng], Math.max(map.getZoom(), 14));
  }, [map, pos]);
  return null;
}

export default function LocationPickerMap({
  value,
  onPick,
}: {
  value: Pos;
  onPick: (lat: number, lng: number) => void;
}) {
  const center: [number, number] = value ? [value.lat, value.lng] : BAKU;
  return (
    <MapContainer center={center} zoom={value ? 14 : 11} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <Recenter pos={value} />
      {value && (
        <Marker
          position={[value.lat, value.lng]}
          icon={pinIcon(true)}
          draggable
          eventHandlers={{
            dragend: (e) => {
              const p = e.target.getLatLng();
              onPick(p.lat, p.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
