import L from "leaflet";

/** Brand-coloured map pin as an inline SVG divIcon (no external image files). */
export function pinIcon(highlight = false): L.DivIcon {
  const color = highlight ? "#0a5ff0" : "#1f7aff";
  return L.divIcon({
    className: "rx-pin",
    html: `<svg width="30" height="40" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
      <path fill="${color}" stroke="white" stroke-width="1.5" d="M12 1C6 1 1 5.9 1 12c0 7.5 11 19 11 19s11-11.5 11-19C23 5.9 18 1 12 1z"/>
      <circle cx="12" cy="12" r="4.2" fill="white"/></svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -36],
  });
}

/** Pulsing dot for the user's current position. */
export function userIcon(): L.DivIcon {
  return L.divIcon({
    className: "rx-userpin",
    html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#11bdd4;border:3px solid white;box-shadow:0 0 0 4px rgba(17,189,212,0.35)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}
