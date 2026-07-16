import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Role } from "@/generated/prisma/enums";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";

// Role-gated app prefixes on the main site. Fine-grained checks are re-done in
// pages/actions; this is coarse protection. Order doesn't matter (exact prefix).
const PROTECTED: [prefix: string, role: Role][] = [
  ["/admin", "ADMIN"],
  ["/merkez", "CENTER"],
  ["/crm", "CENTER"],
  ["/hekim", "DOCTOR"],
  ["/kabinet", "PATIENT"],
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
  // Center-only. Every path on this host maps to /crm/*.
  if (isCrm) {
    if (!session || session.role !== "CENTER") {
      // The session cookie is scoped to .rentgen.az, so after logging in on the
      // main site the CRM is authenticated automatically.
      const loginUrl = new URL("https://rentgen.az/giris");
      loginUrl.searchParams.set("next", "https://crm.rentgen.az" + pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname.startsWith("/crm")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/crm${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // --- Main site (rentgen.az) — only gate protected prefixes -------------
  for (const [prefix, role] of PROTECTED) {
    if (!isUnder(pathname, prefix)) continue;
    if (!session) {
      const loginUrl = new URL("/giris", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session.role !== role) {
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
