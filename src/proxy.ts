import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt";

// Coarse route protection. Fine-grained checks are re-done in pages/actions.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const loginUrl = new URL("/giris", request.url);
  loginUrl.searchParams.set("next", pathname);

  if (!session) {
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/merkez") && session.role !== "CENTER") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/hekim") && session.role !== "DOCTOR") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (pathname.startsWith("/kabinet") && session.role !== "PATIENT") {
    // admins/centers shouldn't use the patient cabinet
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/merkez/:path*", "/hekim/:path*", "/kabinet/:path*"],
};
