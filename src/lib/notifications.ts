import "server-only";
import { prisma } from "./db";
import { sendPushToUser } from "./push";

export type NotifType =
  | "NEW_REQUEST"
  | "RESULT_READY"
  | "PARTNER_REQUEST"
  | "PARTNER_ACCEPTED"
  | "PARTNER_REJECTED"
  | "ADMIN_MESSAGE"
  | "PATIENT_UPDATED"
  | "WORKPLACE_REQUEST"
  | "WORKPLACE_ACCEPTED"
  | "WORKPLACE_REJECTED"
  | "STATUS_UPDATE"
  | "REVIEW_REPLY"
  | "REVIEW_INVITE"
  | "NEW_MESSAGE"
  | "CENTER_BROADCAST"
  | "PLAN_EXPIRING"
  | "PLAN_EXPIRED"
  | "PLAN_DATA_WARNING";

/** Create an in-app notification for a user (best-effort — never throws). */
export async function notifyUser(
  userId: string | null | undefined,
  type: NotifType,
  title: string,
  body?: string | null,
  link?: string | null,
): Promise<void> {
  if (!userId) return;
  try {
    await prisma.notification.create({
      data: { userId, type, title, body: body ?? null, link: link ?? null },
    });
  } catch {
    /* best-effort */
  }
  // Also push to the user's mobile devices (no-op if they have no tokens).
  // Kept out of the try above so a push failure can't mask a DB error, and
  // sendPushToUser never throws on its own.
  await sendPushToUser(userId, title, body ?? undefined, { type, link: link ?? null });
}

/** Unread notification count for a user (for the nav badge). */
export async function unreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({ where: { userId, read: false } });
  } catch {
    return 0;
  }
}
