import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { adminSessionToken, ADMIN_2FA_KEY } from "@/lib/auth/admin";
import { createOtp } from "@/lib/otp";
import { sendNotificationEmail } from "@/lib/email";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  ADMIN_CHALLENGE_COOKIE,
  ADMIN_CHALLENGE_MAX_AGE_SECONDS,
  createAdminChallengeToken,
} from "@/lib/auth/jwt";

// Secret admin access link, entered manually:  /admin-giris/<ADMIN_ACCESS_KEY>
// - ADMIN_2FA off  → opens an admin session and redirects to /admin.
// - ADMIN_2FA on   → emails a one-time code and redirects to /admin-giris to verify.

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

  if (!expected || !safeEqual(key, expected)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // --- Two-factor: email a code, then require it on the verify page ---
  if (env.admin2fa) {
    try {
      const otp = await createOtp(ADMIN_2FA_KEY);
      if (otp.ok) {
        // Safety net so the admin can recover the code from server logs.
        console.log(`[admin-2fa] giriş kodu: ${otp.code}`);
        await sendNotificationEmail({
          subject: "[rentgen.az] Admin giriş kodu",
          fields: { Kod: otp.code, Etibarlıdır: "5 dəqiqə" },
        }).catch(() => {});
      }
    } catch {
      /* even if email fails, a previous valid code may still work */
    }
    const challenge = await createAdminChallengeToken();
    const res = NextResponse.redirect(new URL("/admin-giris", req.url));
    res.cookies.set(ADMIN_CHALLENGE_COOKIE, challenge, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_CHALLENGE_MAX_AGE_SECONDS,
    });
    return res;
  }

  // --- Direct access (no 2FA) ---
  let token: string;
  try {
    token = await adminSessionToken();
  } catch {
    return NextResponse.redirect(new URL("/?admin=error", req.url));
  }
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
