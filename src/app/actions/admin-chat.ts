"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/auth/rbac";
import { searchAdminUsers, type AdminSearchItem } from "@/lib/admin-chat";
import type { ChatMessage } from "./chat";

export type AdminChatResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function toMessages(
  rows: { id: string; fromAdmin: boolean; content: string; createdAt: Date }[],
  mineWhenAdmin: boolean,
): ChatMessage[] {
  return rows.map((m) => ({
    id: m.id,
    senderId: m.fromAdmin ? "admin" : "user",
    senderRole: m.fromAdmin ? "ADMIN" : "USER",
    content: m.content,
    readAt: null,
    createdAt: m.createdAt.toISOString(),
    mine: m.fromAdmin === mineWhenAdmin,
  }));
}

// ---- User side (doctor / center ↔ admin) ----

/** Ensure the current user's admin thread exists; returns its id. */
async function ensureThread(userId: string): Promise<string> {
  const t = await prisma.adminThread.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
  return t.id;
}

/** Current user (doctor/center) sends a message to admin. */
export async function sendToAdminAction(content: string): Promise<AdminChatResult<{ id: string }>> {
  const me = await getCurrentUser();
  if (!me || (me.role !== "DOCTOR" && me.role !== "CENTER")) {
    return { ok: false, error: "İcazə yoxdur." };
  }
  const text = content.trim();
  if (!text) return { ok: false, error: "Mesaj boşdur." };
  if (text.length > 4000) return { ok: false, error: "Mesaj çox uzundur." };

  try {
    const threadId = await ensureThread(me.id);
    const msg = await prisma.adminMessage.create({
      data: { threadId, fromAdmin: false, content: text },
      select: { id: true, createdAt: true },
    });
    await prisma.adminThread.update({
      where: { id: threadId },
      data: { lastMessageAt: msg.createdAt },
    });
    revalidatePath("/admin/sohbetler");
    return { ok: true, id: msg.id };
  } catch {
    return { ok: false, error: "Mesaj göndərilmədi." };
  }
}

/** Current user's admin-thread messages; marks admin messages as read. */
export async function fetchAdminThreadMessagesAction(): Promise<
  AdminChatResult<{ messages: ChatMessage[] }>
> {
  const me = await getCurrentUser();
  if (!me || (me.role !== "DOCTOR" && me.role !== "CENTER")) {
    return { ok: false, error: "İcazə yoxdur." };
  }
  const threadId = await ensureThread(me.id);
  await prisma.adminThread
    .update({ where: { id: threadId }, data: { userReadAt: new Date() } })
    .catch(() => {});
  const rows = await prisma.adminMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, fromAdmin: true, content: true, createdAt: true },
  });
  // User perspective: their own (fromAdmin=false) messages are "mine".
  return { ok: true, messages: toMessages(rows, false) };
}

// ---- Admin side ----

/** Admin sends a message to a specific user (creates the thread if needed). */
export async function adminSendToUserAction(
  userId: string,
  content: string,
): Promise<AdminChatResult<{ threadId: string }>> {
  await requireRole("ADMIN");
  const text = content.trim();
  if (!text) return { ok: false, error: "Mesaj boşdur." };
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) return { ok: false, error: "İstifadəçi tapılmadı." };

  const threadId = await ensureThread(userId);
  const msg = await prisma.adminMessage.create({
    data: { threadId, fromAdmin: true, content: text },
    select: { createdAt: true },
  });
  await prisma.adminThread.update({
    where: { id: threadId },
    data: { lastMessageAt: msg.createdAt },
  });
  revalidatePath("/admin/sohbetler");
  return { ok: true, threadId };
}

/** Admin fetches a thread's messages; marks user messages as read. */
export async function adminFetchThreadMessagesAction(
  threadId: string,
): Promise<AdminChatResult<{ messages: ChatMessage[] }>> {
  await requireRole("ADMIN");
  const thread = await prisma.adminThread.findUnique({
    where: { id: threadId },
    select: { id: true },
  });
  if (!thread) return { ok: false, error: "Söhbət tapılmadı." };
  await prisma.adminThread
    .update({ where: { id: threadId }, data: { adminReadAt: new Date() } })
    .catch(() => {});
  const rows = await prisma.adminMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, fromAdmin: true, content: true, createdAt: true },
  });
  // Admin perspective: admin (fromAdmin=true) messages are "mine".
  return { ok: true, messages: toMessages(rows, true) };
}

/** Admin searches doctors/centers by name/phone to start a conversation. */
export async function adminSearchUsersAction(
  query: string,
): Promise<AdminChatResult<{ users: AdminSearchItem[] }>> {
  await requireRole("ADMIN");
  const users = await searchAdminUsers(query);
  return { ok: true, users };
}

/** Admin broadcast to a group. Writes into each target user's admin thread. */
export async function adminBroadcastAction(
  group: "ALL" | "DOCTORS" | "CENTERS",
  content: string,
): Promise<AdminChatResult<{ count: number }>> {
  await requireRole("ADMIN");
  const text = content.trim();
  if (!text) return { ok: false, error: "Mesaj boşdur." };

  const roles: ("DOCTOR" | "CENTER")[] =
    group === "DOCTORS" ? ["DOCTOR"] : group === "CENTERS" ? ["CENTER"] : ["DOCTOR", "CENTER"];

  // Registered users (have a profile) in the group.
  const users = await prisma.user.findMany({
    where: {
      role: { in: roles },
      isBlocked: false,
      OR: [{ doctorProfile: { isNot: null } }, { centerProfile: { isNot: null } }],
    },
    select: { id: true },
  });
  if (users.length === 0) return { ok: true, count: 0 };

  const now = new Date();
  await prisma.$transaction(
    users.flatMap((u) => [
      prisma.adminThread.upsert({
        where: { userId: u.id },
        create: { userId: u.id, lastMessageAt: now },
        update: { lastMessageAt: now },
      }),
    ]),
  );
  // Insert the message into each thread.
  const threads = await prisma.adminThread.findMany({
    where: { userId: { in: users.map((u) => u.id) } },
    select: { id: true },
  });
  await prisma.adminMessage.createMany({
    data: threads.map((t) => ({ threadId: t.id, fromAdmin: true, content: text })),
  });
  revalidatePath("/admin/sohbetler");
  return { ok: true, count: threads.length };
}
