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
    s.match(/place_id:([A-Za-z0-9_-]+)/) ??
    s.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i); // embedded ftid form (rare)
  return m?.[1] ?? null;
}

/** Resolve free text (a business name, optionally with city) to a Place ID. */
async function findPlaceIdFromText(query: string): Promise<string | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
  url.searchParams.set("input", query);
  url.searchParams.set("inputtype", "textquery");
  url.searchParams.set("fields", "place_id");
  url.searchParams.set("key", env.googlePlacesApiKey);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json()) as { status?: string; candidates?: { place_id?: string }[] };
  if (data.status !== "OK") return null;
  return data.candidates?.[0]?.place_id ?? null;
}

/** Place Details → current rating + review count. */
async function fetchRating(placeId: string): Promise<PlaceRating | { error: string }> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total,name");
  url.searchParams.set("key", env.googlePlacesApiKey);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { error: "Google-a müraciət alınmadı." };
  const data = (await res.json()) as {
    status?: string;
    result?: { rating?: number; user_ratings_total?: number; name?: string };
  };
  if (data.status === "NOT_FOUND" || data.status === "INVALID_REQUEST") {
    return { error: "Bu Place ID tapılmadı. Düzgün olduğunu yoxlayın." };
  }
  if (data.status !== "OK" || !data.result) {
    return { error: "Google reytinqi alınmadı. Bir azdan yenidən cəhd edin." };
  }
  const r = data.result;
  if (typeof r.rating !== "number") {
    return { error: "Bu Google profilində hələ reytinq yoxdur." };
  }
  return {
    placeId,
    rating: r.rating,
    reviewCount: r.user_ratings_total ?? 0,
    name: r.name ?? null,
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
