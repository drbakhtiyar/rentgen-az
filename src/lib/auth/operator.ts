import "server-only";
import { prisma } from "@/lib/db";
import { createSessionToken } from "./jwt";

/** Sentinel owner of the shared operator (data-entry) session. */
export const OPERATOR_PHONE = "+994000000001";
/** Display name shown in the operator panel instead of a phone/"admin". */
export const OPERATOR_NAME = "Nərmin";

/** The single operator account the secret link opens a session for. */
export async function resolveOperatorUser() {
  return prisma.user.upsert({
    where: { phone: OPERATOR_PHONE },
    create: { phone: OPERATOR_PHONE, role: "OPERATOR", lastLoginAt: new Date() },
    update: { role: "OPERATOR", lastLoginAt: new Date(), isBlocked: false },
  });
}

export async function operatorSessionToken(): Promise<string> {
  const user = await resolveOperatorUser();
  return createSessionToken({ userId: user.id, role: "OPERATOR", phone: user.phone });
}
