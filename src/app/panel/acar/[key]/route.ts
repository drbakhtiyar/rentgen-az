import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { operatorSessionToken } from "@/lib/auth/operator";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/jwt";

// Secret operator access link, entered manually: /panel/acar/<OPERATOR_ACCESS_KEY>
// Opens a centers-only data-entry session (no OTP) and redirects to /panel.

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
  const expected = env.operatorAccessKey;
  if (!expected || !safeEqual(key, expected)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  let token: string;
  try {
    token = await operatorSessionToken();
  } catch {
    return NextResponse.redirect(new URL("/?operator=error", req.url));
  }

  const res = NextResponse.redirect(new URL("/panel", req.url));
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
