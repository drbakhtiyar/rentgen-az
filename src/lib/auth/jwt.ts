// Edge-safe JWT helpers (no next/headers, no server-only) — usable from proxy.ts.
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE_NAME = "rx_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Short-lived challenge proving the secret admin link was opened (2FA step 1).
export const ADMIN_CHALLENGE_COOKIE = "rx_admin_challenge";
export const ADMIN_CHALLENGE_MAX_AGE_SECONDS = 60 * 10; // 10 minutes

export type SessionPayload = {
  userId: string;
  role: Role;
  phone: string;
  /** User.sessionVersion at issue time — lets a removed/blocked user's existing
   * tokens be invalidated by bumping the DB value. Missing on old tokens (→ 0). */
  v?: number;
};

function secretKey() {
  return new TextEncoder().encode(env.authSecret);
}

export async function createAdminChallengeToken(): Promise<string> {
  return new SignJWT({ purpose: "admin-2fa" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_CHALLENGE_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifyAdminChallengeToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return payload.purpose === "admin-2fa";
  } catch {
    return false;
  }
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.userId === "string" &&
      typeof payload.role === "string" &&
      typeof payload.phone === "string"
    ) {
      return {
        userId: payload.userId,
        role: payload.role as Role,
        phone: payload.phone,
        v: typeof payload.v === "number" ? payload.v : 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}
