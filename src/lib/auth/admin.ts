import "server-only";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { normalizePhone } from "@/lib/phone";
import { createSessionToken } from "./jwt";

/** Sentinel "phone" used to store the admin 2FA OTP in the OTPCode table. */
export const ADMIN_2FA_KEY = "admin-2fa";

/** The single admin account the secret link / 2FA opens a session for. */
export async function resolveAdminUser() {
  const phone = normalizePhone(env.adminPhone) ?? "+994500000000";
  return prisma.user.upsert({
    where: { phone },
    create: { phone, role: "ADMIN", lastLoginAt: new Date() },
    update: { role: "ADMIN", lastLoginAt: new Date(), isBlocked: false },
  });
}

export async function adminSessionToken(): Promise<string> {
  const user = await resolveAdminUser();
  return createSessionToken({ userId: user.id, role: "ADMIN", phone: user.phone });
}
