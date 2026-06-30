import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth/jwt";

// Secret admin access link. Not linked anywhere on the site — entered manually:
//   /admin-giris/<ADMIN_ACCESS_KEY>
// A correct key opens an admin session and redirects to /admin.

export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const expected = env.adminAccessKey;

  // No key configured, or mismatch → behave like the route doesn't exist.
  if (!expected || !safeEqual(key, expected)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Ensure a single admin account exists, then open a session for it.
  const phone = normalizePhone(env.adminPhone) ?? "+994500000000";
  let user;
  try {
    user = await prisma.user.upsert({
      where: { phone },
      create: { phone, role: "ADMIN", lastLoginAt: new Date() },
      update: { role: "ADMIN", lastLoginAt: new Date(), isBlocked: false },
    });
  } catch {
    return NextResponse.redirect(new URL("/?admin=error", req.url));
  }

  const token = await createSessionToken({
    userId: user.id,
    role: "ADMIN",
    phone: user.phone,
  });

  const res = NextResponse.redirect(new URL("/admin", req.url));
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
