import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@/generated/prisma/enums";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";

// Role-gated app prefixes on the main site. Fine-grained checks are re-done in
// pages/actions; this is coarse protection. Order doesn't matter (exact prefix).
const PROTECTED: [prefix: string, roles: Role[]][] = [
  ["/admin", ["ADMIN"]],
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
    if (allowed && isLogin) {
      return NextResponse.redirect(new URL("https://crm.rentgen.az/teqvim"));
    }
    if (pathname.startsWith("/crm")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/crm${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // --- Main site (rentgen.az) — only gate protected prefixes -------------
  // The CRM login page itself is public (phone-only OTP form).
  if (isUnder(pathname, "/crm/giris")) return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  // Run on every request except Next internals, API routes and static files.
  // The crm.* host branch needs to see all paths (it serves the app from "/");
  // on the main host only the PROTECTED prefixes trigger any action.
  matcher: ["/((?!api/|_next/|.*\\.[^/]+$).*)"],
};
