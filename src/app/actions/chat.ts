"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/rbac";
import { notifyUser } from "@/lib/notifications";
import { doctorName } from "@/lib/utils";

export type ChatResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

export type ChatMessage = {
  id: string;
  senderId: string;
  senderRole: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  mine: boolean;
};

/** Resolve the caller's profile id + role (CENTER/DOCTOR only). */
async function meParticipant() {
  const me = await getCurrentUser();
  if (!me) return null;
  if (me.role === "CENTER" && me.centerProfile) {
    return { userId: me.id, role: "CENTER" as const, profileId: me.centerProfile.id };
  }
  if (me.role === "DOCTOR" && me.doctorProfile) {
    return { userId: me.id, role: "DOCTOR" as const, profileId: me.doctorProfile.id };
  }
  return null;
}

/** Verify the caller is a participant of the conversation. */
async function assertParticipant(conversationId: string) {
  const me = await meParticipant();
  if (!me) return null;
  const conv = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, centerId: true, doctorId: true },
  });
  if (!conv) return null;
  const ok =
    (me.role === "CENTER" && conv.centerId === me.profileId) ||
    (me.role === "DOCTOR" && conv.doctorId === me.profileId);
  return ok ? { me, conv } : null;
}

/** Notify the message recipient (one unread chat notice at a time — anti-spam). */
async function notifyRecipient(
  senderRole: "CENTER" | "DOCTOR",
  conv: { centerId: string; doctorId: string },
): Promise<void> {
  if (senderRole === "CENTER") {
    const [dr, center] = await Promise.all([
      prisma.doctorProfile.findUnique({ where: { id: conv.doctorId }, select: { userId: true } }),
      prisma.centerProfile.findUnique({ where: { id: conv.centerId }, select: { name: true } }),
    ]);
    if (!dr?.userId) return;
    const unread = await prisma.notification.findFirst({
      where: { userId: dr.userId, type: "NEW_MESSAGE", read: false },
      select: { id: true },
    });
    if (unread) return;
    await notifyUser(dr.userId, "NEW_MESSAGE", "Yeni mesaj", `${center?.name ?? "Mərkəz"} sizə yazdı.`, "/hekim/chat");
  } else {
    const [center, dr] = await Promise.all([
      prisma.centerProfile.findUnique({ where: { id: conv.centerId }, select: { userId: true } }),
      prisma.doctorProfile.findUnique({ where: { id: conv.doctorId }, select: { firstName: true, lastName: true } }),
    ]);
    if (!center?.userId) return;
    const unread = await prisma.notification.findFirst({
      where: { userId: center.userId, type: "NEW_MESSAGE", read: false },
      select: { id: true },
    });
    if (unread) return;
    await notifyUser(
      center.userId,
      "NEW_MESSAGE",
      "Yeni mesaj",
      `${doctorName(dr?.firstName, dr?.lastName) || "Həkim"} sizə yazdı.`,
      "/merkez/chat",
    );
  }
}

/**
 * Open (or create) the conversation between the caller and the other party.
 * Only allowed between ACCEPTED partners.
 */
export async function openConversationAction(
  otherProfileId: string,
): Promise<ChatResult<{ conversationId: string }>> {
  const me = await meParticipant();
  if (!me) return { ok: false, error: "Giriş tələb olunur." };

  const centerId = me.role === "CENTER" ? me.profileId : otherProfileId;
  const doctorId = me.role === "DOCTOR" ? me.profileId : otherProfileId;

  const partner = await prisma.centerDoctor.findUnique({
    where: { centerId_doctorId: { centerId, doctorId } },
    select: { status: true },
  });
  if (partner?.status !== "ACCEPTED") {
    return { ok: false, error: "Yalnız partnyorlarla yazışa bilərsiniz." };
  }

  const conv = await prisma.conversation.upsert({
    where: { centerId_doctorId: { centerId, doctorId } },
    create: { centerId, doctorId },
    update: {},
    select: { id: true },
  });
  return { ok: true, conversationId: conv.id };
}

/** Send a message in a conversation. */
export async function sendMessageAction(
  conversationId: string,
  content: string,
): Promise<ChatResult<{ id: string }>> {
  const ctx = await assertParticipant(conversationId);
  if (!ctx) return { ok: false, error: "İcazə yoxdur." };
  const text = content.trim();
  if (!text) return { ok: false, error: "Mesaj boşdur." };
  if (text.length > 4000) return { ok: false, error: "Mesaj çox uzundur." };

  try {
    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderId: ctx.me.userId,
        senderRole: ctx.me.role,
        content: text,
      },
      select: { id: true, createdAt: true },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: msg.createdAt },
    });
    // Notify the recipient (dedupe: skip if they already have an unread chat notice).
    await notifyRecipient(ctx.me.role, ctx.conv).catch(() => {});
    revalidatePath("/merkez/chat");
    revalidatePath("/hekim/chat");
    return { ok: true, id: msg.id };
  } catch {
    return { ok: false, error: "Mesaj göndərilmədi." };
  }
}

/**
 * Poll: return the recent messages of a conversation and mark the other
 * party's messages as read (read receipt).
 */
export async function fetchMessagesAction(
  conversationId: string,
): Promise<ChatResult<{ messages: ChatMessage[] }>> {
  const ctx = await assertParticipant(conversationId);
  if (!ctx) return { ok: false, error: "İcazə yoxdur." };

  // Mark incoming (other party's) unread messages as read.
  await prisma.message
    .updateMany({
      where: { conversationId, senderId: { not: ctx.me.userId }, readAt: null },
      data: { readAt: new Date() },
    })
    .catch(() => {});

  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, senderId: true, senderRole: true, content: true, readAt: true, createdAt: true },
  });

  const messages: ChatMessage[] = rows.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderRole: m.senderRole,
    content: m.content,
    readAt: m.readAt ? m.readAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    mine: m.senderId === ctx.me.userId,
  }));
  return { ok: true, messages };
}
