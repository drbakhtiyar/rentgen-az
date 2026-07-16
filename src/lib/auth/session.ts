import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type SessionPayload,
} from "./jwt";

export {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
  type SessionPayload,
};

// Share the session across the apex domain and subdomains (e.g. crm.rentgen.az)
// so a center logged in on rentgen.az is also authenticated on the CRM subdomain.
// Host-only in local dev (no domain), scoped to ".rentgen.az" in production.
const COOKIE_DOMAIN = env.isProd ? ".rentgen.az" : undefined;

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    domain: COOKIE_DOMAIN,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  // Apply the user's saved language preference, if any, so a returning user
  // lands in the language they last chose (persists across devices/logins).
  try {
    const u = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { locale: true },
    });
    if (u?.locale && isLocale(u.locale)) {
      cookieStore.set(LOCALE_COOKIE, u.locale, {
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
  } catch {
    /* preference is best-effort — never block login */
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    domain: COOKIE_DOMAIN,
    maxAge: 0,
  });
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
