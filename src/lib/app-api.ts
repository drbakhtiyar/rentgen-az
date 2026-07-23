import "server-only";
import { NextResponse } from "next/server";

/**
 * Shared-secret gate for the mobile-app backend endpoints (/api/app/*).
 * The Rork Cloudflare Worker sends `x-app-key`; the key lives only server-side
 * (env APP_API_KEY), never in the app bundle. Returns an error response when
 * the key is missing/wrong, or null when the caller is authorized.
 */
export function requireAppKey(req: Request): NextResponse | null {
  const expected = process.env.APP_API_KEY;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "app api not configured" }, { status: 503 });
  }
  const got = req.headers.get("x-app-key");
  if (got !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}

/** Absolute https URL or null — tolerates relative paths stored in the DB. */
export function absoluteAssetUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://rentgen.az").replace(/\/$/, "");
  if (value.startsWith("//")) return `https:${value}`;
  return `${base}${value.startsWith("/") ? "" : "/"}${value}`;
}

/** Last 9 digits (Azerbaijani national number) — tolerant of +994/0 prefixes. */
export function nationalDigits(phone: string): string {
  return (phone ?? "").replace(/\D/g, "").slice(-9);
}

/** "Səmra Əliyeva" → { firstName: "Səmra", lastName: "Əliyeva" }. */
export function splitName(full: string): { firstName: string; lastName: string } {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}
