import "server-only";
import { prisma } from "@/lib/db";

/**
 * Invalidate all existing session tokens for a user by bumping their
 * sessionVersion. Tokens embed the version at issue time; getCurrentUser
 * rejects a token whose version no longer matches. Used when an assistant is
 * removed/deactivated (and available for block / logout-all-devices).
 * Best-effort — never throws.
 */
export async function bumpSessionVersion(userId: string): Promise<void> {
  await prisma.user
    .update({ where: { id: userId }, data: { sessionVersion: { increment: 1 } } })
    .catch(() => {});
}
