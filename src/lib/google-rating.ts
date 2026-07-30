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

/** Public Google Maps listing link for a Place ID (for attribution/click-through). */
export function googleMapsUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}
