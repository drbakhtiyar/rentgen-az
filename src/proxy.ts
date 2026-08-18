import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@/generated/prisma/enums";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";
import { LOCALE_COOKIE } from "@/lib/i18n";

// Role-gated app prefixes on the main site. Fine-grained checks are re-done in
// pages/actions; this is coarse protection. Order doesn't matter (exact prefix).
const PROTECTED: [prefix: string, roles: Role[]][] = [
  ["/admin", ["ADMIN"]],
  ["/panel", ["OPERATOR", "ADMIN"]],
  ["/merkez", ["CENTER"]],
  ["/crm", ["CENTER", "ASSISTANT"]],
  ["/hekim", ["DOCTOR", "ASSISTANT"]],
  ["/kabinet", ["PATIENT"]],
];

function isUnder(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const isCrm = host.startsWith("crm.");
  const isPacs = host.startsWith("pacs.");

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // --- CRM subdomain (crm.rentgen.az) → serve the /crm app ---------------
  // Center owners + their assistants. Every path on this host maps to /crm/*.
  if (isCrm) {
    const allowed = session && (session.role === "CENTER" || session.role === "ASSISTANT");
    const isLogin = pathname === "/giris" || pathname === "/crm/giris";
    if (!allowed && !isLogin) {
      // Phone-only CRM login (no role tabs) — the system works out who it is.
      return NextResponse.redirect(new URL("https://crm.rentgen.az/giris"));
    }
    // NB: don't blanket-redirect a "logged-in" cookie away from the login page —
    // a deactivated assistant still carries a CENTER/ASSISTANT cookie but has no
    // active link, and bouncing them to /teqvim (which bounces back) would loop.
    // The login page itself redirects genuinely-active sessions to /teqvim.
    if (pathname.startsWith("/crm")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/crm${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // --- PACS subdomain (pacs.rentgen.az) → /pacs qapısı --------------------
  // 2026-08-19: DICOM arxiv subdomeni. Viewer launch-a qədər kök "tezliklə"
  // səhifəsini verir; /viewer yolları olduğu kimi işləyir (öz qapısı var).
  if (isPacs) {
    if (pathname === "/" ) {
      const url = request.nextUrl.clone();
      url.pathname = "/pacs";
      return NextResponse.rewrite(url);
    }
    if (pathname.startsWith("/viewer") || pathname.startsWith("/pacs") || pathname.startsWith("/_next") || pathname.startsWith("/api")) {
      return NextResponse.next();
    }
    // qalan hər şey ana sayta
    return NextResponse.redirect(new URL(`https://rentgen.az${pathname}`));
  }

  // --- Main site (rentgen.az) — only gate protected prefixes -------------
  // The CRM login page itself is public (phone-only OTP form).
  if (isUnder(pathname, "/crm/giris")) return NextResponse.next();
  // The operator secret link sets the session itself → must stay public.
  if (isUnder(pathname, "/panel/acar")) return NextResponse.next();

  // Forward the logical (un-prefixed) path so canonical/hreflang metadata is
  // correct on every page.
  const requestHeaders = new Headers(request.headers);

  // --- Locale prefix: /ru/* serves the Russian version at its own crawlable,
  // self-canonical URL. Rewrite to the un-prefixed path and flag the locale +
  // logical path via request headers (getLocale + metadata read them). ---
  if (pathname === "/ru" || pathname.startsWith("/ru/")) {
    const logical = pathname === "/ru" ? "/" : pathname.slice(3);
    // Private panels have no localized version — never expose them un-gated
    // through the /ru rewrite; send to the real path where auth is enforced.
    if (PROTECTED.some(([prefix]) => isUnder(logical, prefix))) {
      const url = request.nextUrl.clone();
      url.pathname = logical;
      return NextResponse.redirect(url);
    }
    requestHeaders.set("x-locale", "ru");
    requestHeaders.set("x-pathname", logical);
    const url = request.nextUrl.clone();
    url.pathname = logical;
    const res = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    // Keep the visitor in Russian as they follow un-prefixed links.
    res.cookies.set(LOCALE_COOKIE, "ru", {
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return res;
  }
  requestHeaders.set("x-pathname", pathname);

  for (const [prefix, roles] of PROTECTED) {
    if (!isUnder(pathname, prefix)) continue;
    if (!session) {
      const loginUrl = new URL("/giris", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (!roles.includes(session.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    break;
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Run on every request except Next internals, API routes and static files.
  // The crm.* host branch needs to see all paths (it serves the app from "/");
  // on the main host only the PROTECTED prefixes trigger any action.
  matcher: ["/((?!api/|_next/|.*\\.[^/]+$).*)"],
};
