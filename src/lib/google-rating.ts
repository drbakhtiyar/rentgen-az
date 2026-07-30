import "server-only";
import { env } from "@/lib/env";

/**
 * Google rating integration. The platform holds ONE Places API key
 * (GOOGLE_PLACES_API_KEY); each center only provides their Place ID (or their
 * business name / Maps link, which we resolve to a Place ID). We fetch the
 * rating server-side and cache it on the center; a cron refreshes it.
 */

export type PlaceRating = {
  placeId: string;
  rating: number;
  reviewCount: number;
  name: string | null;
};

export function googleConfigured(): boolean {
  return !!env.googlePlacesApiKey;
}

/** A Google Maps place link (place_id:… or …?query_place_id=…) or a raw ID. */
function extractPlaceId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  // Raw Place ID (usually starts with ChIJ/GhIJ/Ei…, but always non-space token).
  if (/^[A-Za-z0-9_-]{15,}$/.test(s) && !s.includes("http")) return s;
  // URL forms that carry the id explicitly.
  const m =
    s.match(/[?&]query_place_id=([A-Za-z0-9_-]+)/) ??
    s.match(/[?&]place_id=([A-Za-z0-9_-]+)/) ??
    s.match(/place_id:([A-Za-z0-9_-]+)/);
  return m?.[1] ?? null;
}

// Places API (New) — https://places.googleapis.com/v1. The legacy
// maps.googleapis.com/maps/api/place endpoints are disabled for new GCP
// projects, so we use the New API (Text Search + Place Details).

/** Resolve free text (a business name, optionally with city) to a Place ID. */
async function findPlaceIdFromText(query: string): Promise<string | null> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googlePlacesApiKey,
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({ textQuery: query, languageCode: "az", regionCode: "AZ" }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { places?: { id?: string }[] };
  return data.places?.[0]?.id ?? null;
}

/** Place Details → current rating + review count. */
async function fetchRating(placeId: string): Promise<PlaceRating | { error: string }> {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": env.googlePlacesApiKey,
        "X-Goog-FieldMask": "id,displayName,rating,userRatingCount",
      },
      cache: "no-store",
    },
  );
  if (res.status === 404) {
    return { error: "Bu Place ID tapılmadı. Düzgün olduğunu yoxlayın." };
  }
  if (!res.ok) {
    return { error: "Google reytinqi alınmadı. Bir azdan yenidən cəhd edin." };
  }
  const r = (await res.json()) as {
    id?: string;
    displayName?: { text?: string };
    rating?: number;
    userRatingCount?: number;
  };
  if (typeof r.rating !== "number") {
    return { error: "Bu Google profilində hələ reytinq yoxdur." };
  }
  return {
    placeId: r.id ?? placeId,
    rating: r.rating,
    reviewCount: r.userRatingCount ?? 0,
    name: r.displayName?.text ?? null,
  };
}

/**
 * Setup entry point: accept a Place ID, a Maps link, or a business name; resolve
 * it to a Place ID and return the current rating. null key → not configured.
 */
export async function resolveAndFetchRating(
  input: string,
): Promise<PlaceRating | { error: string }> {
  if (!googleConfigured()) {
    return { error: "Google inteqrasiyası hələ aktiv deyil (admin API açarı əlavə etməlidir)." };
  }
  const trimmed = input.trim();
  if (!trimmed) return { error: "Google Place ID və ya biznes adı yazın." };
  const placeId = extractPlaceId(trimmed) ?? (await findPlaceIdFromText(trimmed));
  if (!placeId) return { error: "Uyğun Google profili tapılmadı. Biznes adını və ya Place ID-ni yoxlayın." };
  return fetchRating(placeId);
}

/** Cron/refresh entry point: re-fetch the rating for a known Place ID. */
export async function refreshRating(placeId: string): Promise<PlaceRating | { error: string }> {
  if (!googleConfigured()) return { error: "not configured" };
  return fetchRating(placeId);
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const r = (d: number) => (d * Math.PI) / 180;
  const dLat = r(bLat - aLat);
  const dLng = r(bLng - aLng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Location-biased rating: find the place matching `query` NEAR (lat,lng) and
 * return its rating in a single Text Search call. Rejects matches more than
 * ~2 km away (avoids grabbing a nearby bank/hospital for a generic name).
 * Precise because the coordinates come from the center's own Google link.
 */
export async function fetchRatingNear(
  query: string,
  lat: number,
  lng: number,
): Promise<PlaceRating | { error: string }> {
  if (!googleConfigured()) return { error: "not configured" };
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": env.googlePlacesApiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.rating,places.userRatingCount,places.location",
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "az",
      regionCode: "AZ",
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 800 } },
    }),
    cache: "no-store",
  });
  if (!res.ok) return { error: "Google reytinqi alınmadı." };
  const data = (await res.json()) as {
    places?: {
      id?: string;
      displayName?: { text?: string };
      rating?: number;
      userRatingCount?: number;
      location?: { latitude: number; longitude: number };
    }[];
  };
  const p = data.places?.[0];
  if (!p?.id) return { error: "Uyğun Google profili tapılmadı." };
  if (p.location && haversineKm(lat, lng, p.location.latitude, p.location.longitude) > 2) {
    return { error: "Yaxınlıqda uyğun Google profili tapılmadı." };
  }
  if (typeof p.rating !== "number") {
    return { error: "Bu Google profilində hələ reytinq yoxdur." };
  }
  return {
    placeId: p.id,
    rating: p.rating,
    reviewCount: p.userRatingCount ?? 0,
    name: p.displayName?.text ?? null,
  };
}

/** Pull lat/lng out of a Google Maps URL (place link, @-coords, q=, ll=, or the
 *  precise !3d!4d marker). Returns null if none present. */
export function parseLatLngFromMapsUrl(url: string): { lat: number; lng: number } | null {
  const m =
    url.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) ??
    url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) ??
    url.match(/[?&](?:q|ll|sll|destination)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/** Expand a maps.app.goo.gl / goo.gl short link to its final URL (has coords). */
async function expandMapsShortLink(url: string): Promise<string> {
  if (!/maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs/.test(url)) return url;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      cache: "no-store",
    });
    return res.url || url;
  } catch {
    return url;
  }
}

/** Resolve coordinates from any Google Maps link (short or full). */
export async function resolveCoordsFromMapsUrl(
  url: string,
): Promise<{ lat: number; lng: number } | null> {
  const trimmed = url.trim();
  if (!/^https?:\/\//.test(trimmed)) return null;
  const direct = parseLatLngFromMapsUrl(trimmed);
  if (direct) return direct;
  const expanded = await expandMapsShortLink(trimmed);
  return parseLatLngFromMapsUrl(expanded);
}

/** Public Google Maps listing link for a Place ID (for attribution/click-through). */
export function googleMapsUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}
