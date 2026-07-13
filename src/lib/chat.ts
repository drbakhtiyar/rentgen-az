import "server-only";
import { prisma } from "./db";
import { doctorName } from "./utils";
import { getUserAdminContact } from "./admin-chat";

export type ChatContact = {
  profileId: string; // the OTHER party's profile id (doctorId for center, centerId for doctor)
  name: string;
  sub: string | null;
  avatarUrl: string | null; // doctor photo (for center) / center logo (for doctor)
  conversationId: string | null;
  lastMessageAt: string | null;
  preview: string | null;
  unread: number;
  kind: "partner" | "admin"; // "admin" = pinned support conversation
};

/**
 * Contact list for the chat: all ACCEPTED partners, merged with any existing
 * conversation (last message + unread). Conversations without messages sort
 * after active ones.
 */
export async function getChatContacts(
  role: "CENTER" | "DOCTOR",
  profileId: string,
  userId: string,
): Promise<ChatContact[]> {
  if (role === "CENTER") {
    const [partners, convs] = await Promise.all([
      prisma.centerDoctor.findMany({
        where: { centerId: profileId, status: "ACCEPTED" },
        select: {
          doctor: { select: { id: true, firstName: true, lastName: true, clinic: true, photoUrl: true } },
        },
      }),
      prisma.conversation.findMany({
        where: { centerId: profileId },
        select: {
          id: true,
          doctorId: true,
          lastMessageAt: true,
          messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, fileUrl: true } },
        },
      }),
    ]);
    const unread = await unreadByConversation(convs.map((c) => c.id), userId);
    const byDoctor = new Map(convs.map((c) => [c.doctorId, c]));
    const list = partners.map((p) => {
      const c = byDoctor.get(p.doctor.id);
      return {
        profileId: p.doctor.id,
        name: doctorName(p.doctor.firstName, p.doctor.lastName),
        sub: p.doctor.clinic,
        avatarUrl: p.doctor.photoUrl,
        conversationId: c?.id ?? null,
        lastMessageAt: c?.lastMessageAt ? c.lastMessageAt.toISOString() : null,
        preview: c?.messages[0] ? (c.messages[0].content || (c.messages[0].fileUrl ? "📎 Fayl" : null)) : null,
        unread: c ? unread[c.id] ?? 0 : 0,
        kind: "partner" as const,
      };
    });
    return withAdminContact(userId, sortContacts(list));
  }

  const [partners, convs] = await Promise.all([
    prisma.centerDoctor.findMany({
      where: { doctorId: profileId, status: "ACCEPTED" },
      select: { center: { select: { id: true, name: true, city: true, logoUrl: true } } },
    }),
    prisma.conversation.findMany({
      where: { doctorId: profileId },
      select: {
        id: true,
        centerId: true,
        lastMessageAt: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, fileUrl: true } },
      },
    }),
  ]);
  const unread = await unreadByConversation(convs.map((c) => c.id), userId);
  const byCenter = new Map(convs.map((c) => [c.centerId, c]));
  const list = partners.map((p) => {
    const c = byCenter.get(p.center.id);
    return {
      profileId: p.center.id,
      name: p.center.name,
      sub: p.center.city,
      avatarUrl: p.center.logoUrl,
      conversationId: c?.id ?? null,
      lastMessageAt: c?.lastMessageAt ? c.lastMessageAt.toISOString() : null,
      preview: c?.messages[0] ? (c.messages[0].content || (c.messages[0].fileUrl ? "📎 Fayl" : null)) : null,
      unread: c ? unread[c.id] ?? 0 : 0,
      kind: "partner" as const,
    };
  });
  return withAdminContact(userId, sortContacts(list));
}

async function unreadByConversation(
  convIds: string[],
  userId: string,
): Promise<Record<string, number>> {
  if (convIds.length === 0) return {};
  const groups = await prisma.message.groupBy({
    by: ["conversationId"],
    where: { conversationId: { in: convIds }, senderId: { not: userId }, readAt: null },
    _count: { _all: true },
  });
  const out: Record<string, number> = {};
  for (const g of groups) out[g.conversationId] = g._count._all;
  return out;
}

/** Prepend the pinned "Admin" support contact to a user's chat list. */
async function withAdminContact(userId: string, list: ChatContact[]): Promise<ChatContact[]> {
  const a = await getUserAdminContact(userId);
  const admin: ChatContact = {
    profileId: "admin",
    name: "Rentgen.az — Dəstək",
    sub: "Admin",
    avatarUrl: "/mark-square.png", // sayt logosu
    conversationId: a.threadId,
    lastMessageAt: null,
    preview: a.preview,
    unread: a.unread,
    kind: "admin",
  };
  return [admin, ...list];
}

function sortContacts(list: ChatContact[]): ChatContact[] {
  return list.sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) return a.lastMessageAt < b.lastMessageAt ? 1 : -1;
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.name.localeCompare(b.name);
  });
}

/** Count unread incoming messages across a user's conversations (nav badge). */
export async function unreadMessageCount(
  userId: string,
  role: "CENTER" | "DOCTOR",
  profileId: string,
): Promise<number> {
  try {
    return await prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        conversation:
          role === "CENTER" ? { centerId: profileId } : { doctorId: profileId },
      },
    });
  } catch {
    return 0;
  }
}
