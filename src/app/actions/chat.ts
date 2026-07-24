"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/rbac";
import { notifyUser } from "@/lib/notifications";
import { doctorName } from "@/lib/utils";
import { b2Configured, presignUpload, presignDownload } from "@/lib/b2";
import { CHAT_ALLOWED_TYPES, CHAT_MAX_SIZE, chatSafeName, isLegacyPublicUrl } from "@/lib/chat-files";

export type ChatResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

export type ChatMessage = {
  id: string;
  senderId: string;
  senderRole: string;
  content: string;
  // The raw file reference (B2 key) is NEVER sent to the client. The client only
  // learns a file exists (hasFile) + its name, and fetches a short-lived signed
  // download URL via a gated action on demand.
  hasFile: boolean;
  fileName: string | null;
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
  if (me.role === "ASSISTANT") {
    // An active assistant chats on behalf of their center/doctor.
    const [c, d] = await Promise.all([
      prisma.centerAssistant.findUnique({ where: { userId: me.id }, select: { centerId: true, active: true } }),
      prisma.doctorAssistant.findUnique({ where: { userId: me.id }, select: { doctorId: true, active: true } }),
    ]);
    if (c?.active) return { userId: me.id, role: "CENTER" as const, profileId: c.centerId };
    if (d?.active) return { userId: me.id, role: "DOCTOR" as const, profileId: d.doctorId };
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
  conv: { id: string; centerId: string; doctorId: string },
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
    await notifyUser(dr.userId, "NEW_MESSAGE", "Yeni mesaj", `${center?.name ?? "Mərkəz"} sizə yazdı.`, "/hekim/chat", { conversationId: conv.id });
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
      { conversationId: conv.id },
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
  file?: { key: string; name: string } | null,
): Promise<ChatResult<{ id: string }>> {
  const ctx = await assertParticipant(conversationId);
  if (!ctx) return { ok: false, error: "İcazə yoxdur." };
  const text = content.trim();
  if (!text && !file) return { ok: false, error: "Mesaj boşdur." };
  if (text.length > 4000) return { ok: false, error: "Mesaj çox uzundur." };
  // The key must belong to this conversation (prevents cross-chat spoofing).
  if (file && !file.key.startsWith(`chat/${conversationId}/`)) {
    return { ok: false, error: "Yanlış fayl açarı." };
  }

  try {
    const msg = await prisma.message.create({
      data: {
        conversationId,
        senderId: ctx.me.userId,
        senderRole: ctx.me.role,
        content: text,
        fileUrl: file?.key ?? null, // stores the private B2 object key
        fileName: file?.name ?? null,
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
    select: { id: true, senderId: true, senderRole: true, content: true, fileUrl: true, fileName: true, readAt: true, createdAt: true },
  });

  const messages: ChatMessage[] = rows.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderRole: m.senderRole,
    content: m.content,
    hasFile: !!m.fileUrl,
    fileName: m.fileName,
    readAt: m.readAt ? m.readAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    mine: m.senderId === ctx.me.userId,
  }));
  return { ok: true, messages };
}

/**
 * Step 1: get a presigned PUT URL to upload a chat attachment to B2 (private).
 * Only a participant of the conversation may upload; returns the object key to
 * pass back with sendMessageAction.
 */
export async function requestChatUploadUrlAction(input: {
  conversationId: string;
  fileName: string;
  contentType: string;
  size: number;
}): Promise<ChatResult<{ url: string; key: string }>> {
  const ctx = await assertParticipant(input.conversationId);
  if (!ctx) return { ok: false, error: "İcazə yoxdur." };
  if (!b2Configured()) return { ok: false, error: "Fayl saxlama konfiqurasiya olunmayıb." };
  if (!CHAT_ALLOWED_TYPES.has(input.contentType)) {
    return { ok: false, error: "Bu fayl tipi qəbul edilmir (şəkil və ya PDF)." };
  }
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > CHAT_MAX_SIZE) {
    return { ok: false, error: "Fayl ölçüsü 8 MB-dan çox olmamalıdır." };
  }
  const key = `chat/${input.conversationId}/${randomUUID()}-${chatSafeName(input.fileName)}`;
  try {
    const url = await presignUpload(key, input.contentType);
    return { ok: true, url, key };
  } catch {
    return { ok: false, error: "Yükləmə linki yaradıla bilmədi." };
  }
}

/** Short-lived signed download URL for a chat attachment — participants only. */
export async function getChatFileUrlAction(
  messageId: string,
): Promise<ChatResult<{ url: string }>> {
  const me = await meParticipant();
  if (!me) return { ok: false, error: "İcazə yoxdur." };
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    select: {
      fileUrl: true,
      fileName: true,
      conversation: { select: { centerId: true, doctorId: true } },
    },
  });
  if (!msg?.fileUrl) return { ok: false, error: "Fayl tapılmadı." };
  const c = msg.conversation;
  const allowed =
    (me.role === "CENTER" && c.centerId === me.profileId) ||
    (me.role === "DOCTOR" && c.doctorId === me.profileId);
  if (!allowed) return { ok: false, error: "Bu fayla girişiniz yoxdur." };

  try {
    // Legacy public-URL attachments (pre-B2) open directly.
    if (isLegacyPublicUrl(msg.fileUrl)) return { ok: true, url: msg.fileUrl };
    const url = await presignDownload(msg.fileUrl, msg.fileName ?? "fayl");
    return { ok: true, url };
  } catch {
    return { ok: false, error: "Endirmə linki yaradıla bilmədi." };
  }
}
