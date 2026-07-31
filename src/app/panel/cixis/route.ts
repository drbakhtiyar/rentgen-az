import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SESSION_COOKIE_NAME } from "@/lib/auth/jwt";

// Robust logout: clears BOTH the host-only session cookie (set by the secret
// links /panel/acar and /admin-giris) AND the apex-domain cookie (OTP logins).
// next/headers cookies().set() overwrites by name, so it can't emit both — we
// append raw Set-Cookie headers instead.

export const dynamic = "force-dynamic";

function logout(req: Request): NextResponse {
  const res = NextResponse.redirect(new URL("/", req.url), { status: 303 });
  const secure = env.isProd ? "; Secure" : "";
  const base = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
  res.headers.append("Set-Cookie", base); // host-only cookie
  if (env.isProd) {
    res.headers.append("Set-Cookie", `${base}; Domain=.rentgen.az`); // apex-domain cookie
  }
  return res;
}

export async function POST(req: Request) {
  return logout(req);
}

export async function GET(req: Request) {
  return logout(req);
}
