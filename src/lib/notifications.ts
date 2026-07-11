import "server-only";
import { prisma } from "./db";

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
  | "NEW_MESSAGE";

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
}

/** Unread notification count for a user (for the nav badge). */
export async function unreadNotificationCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({ where: { userId, read: false } });
  } catch {
    return 0;
  }
}
