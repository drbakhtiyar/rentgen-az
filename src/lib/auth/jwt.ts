// Edge-safe JWT helpers (no next/headers, no server-only) — usable from proxy.ts.
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE_NAME = "rx_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  userId: string;
  role: Role;
  phone: string;
};

function secretKey() {
  return new TextEncoder().encode(env.authSecret);
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
      };
    }
    return null;
  } catch {
    return null;
  }
}
