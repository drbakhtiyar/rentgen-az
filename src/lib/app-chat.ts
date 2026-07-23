import "server-only";
import { prisma } from "./db";
import { normalizePhone } from "./phone";
import { nationalDigits, absoluteAssetUrl } from "./app-api";
import { notifyUser } from "./notifications";
import { doctorName } from "./utils";
import { getChatContacts } from "./chat";

/**
 * Phone-authed chat for the mobile app. The site's chat lives in server
 * *actions* that read the logged-in session (getCurrentUser); the app is
 * stateless, so these helpers re-implement the same logic keyed on the phone
 * number (resolved to the caller's CENTER/DOCTOR profile), reusing the shared
 * `getChatContacts` / `askAssistant` libraries. Text only — attachments are
 * deliberately deferred (see TODO). Partner rule is unchanged: you may only
 * chat with ACCEPTED partners.
 */

export type AppRole = "CENTER" | "DOCTOR";
export type AppParticipant = { userId: string; role: AppRole; profileId: string };

/** Message shape returned to the app (no raw file keys). */
export type AppChatMessage = {
  id: string;
  mine: boolean;
  content: string;
  hasFile: boolean;
  fileName: string | null;
  readAt: string | null;
  createdAt: string;
};

/**
 * Resolve the caller's chat participant (center/doctor, incl. active
 * assistants acting on behalf of their owner) from a phone number. `wantRole`
 * mirrors the app's login tab; without it, doctor is preferred over center.
 */
export async function resolveAppParticipant(
  phone: string,
  wantRole?: AppRole,
): Promise<AppParticipant | null> {
  const norm = normalizePhone(phone);
  const nat = nationalDigits(phone);
  const select = {
    id: true,
    phone: true,
    isBlocked: true,
    centerProfile: { select: { id: true } },
    doctorProfile: { select: { id: true } },
    assistantOf: { select: { active: true, centerId: true } },
    doctorAssistantOf: { select: { active: true, doctorId: true } },
  } as const;

  let user = norm ? await prisma.user.findUnique({ where: { phone: norm }, select }) : null;
  if (!user && nat.length >= 7) {
    const rows = await prisma.user.findMany({ where: { phone: { endsWith: nat } }, select });
    user = rows.find((r) => nationalDigits(r.phone) === nat) ?? null;
  }
  if (!user || user.isBlocked) return null;

  const centerId = user.centerProfile?.id ?? (user.assistantOf?.active ? user.assistantOf.centerId : null);
  const doctorId = user.doctorProfile?.id ?? (user.doctorAssistantOf?.active ? user.doctorAssistantOf.doctorId : null);

  if (wantRole === "CENTER" && centerId) return { userId: user.id, role: "CENTER", profileId: centerId };
  if (wantRole === "DOCTOR" && doctorId) return { userId: user.id, role: "DOCTOR", profileId: doctorId };
  if (!wantRole) {
    if (doctorId) return { userId: user.id, role: "DOCTOR", profileId: doctorId };
    if (centerId) return { userId: user.id, role: "CENTER", profileId: centerId };
  }
  return null;
}

/** Contact list: AI (pinned) + Dəstək (pinned) + ACCEPTED partners. */
export async function appGetContacts(p: AppParticipant) {
  const contacts = await getChatContacts(p.role, p.profileId, p.userId);
  const mapped = contacts.map((c) => ({
    id: c.profileId,
    conversationId: c.conversationId,
    name: c.name,
    sub: c.sub,
    avatar: absoluteAssetUrl(c.avatarUrl), // key is `avatar` — the app decodes that
    preview: c.preview,
    unread: c.unread,
    kind: c.kind as "partner" | "admin",
  }));
  // Synthetic AI helper contact, pinned above everything.
  const ai = {
    id: "ai",
    conversationId: null as string | null,
    name: "AI Yardımçı",
    sub: "Rentgen.az köməkçisi",
    avatar: null as string | null,
    preview: null as string | null,
    unread: 0,
    kind: "ai" as const,
  };
  return [ai, ...mapped];
}

/** Assert `p` is a participant of `conversationId`; return its two sides. */
async function convForParticipant(
  p: AppParticipant,
  conversationId: string,
): Promise<{ centerId: string; doctorId: string } | null> {
  const c = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { centerId: true, doctorId: true },
  });
  if (!c) return null;
  const ok =
    (p.role === "CENTER" && c.centerId === p.profileId) ||
    (p.role === "DOCTOR" && c.doctorId === p.profileId);
  return ok ? c : null;
}

/** Poll: recent messages of a conversation; marks the other party's as read. */
export async function appFetchMessages(
  p: AppParticipant,
  conversationId: string,
): Promise<{ ok: true; messages: AppChatMessage[] } | { ok: false; error: string }> {
  const conv = await convForParticipant(p, conversationId);
  if (!conv) return { ok: false, error: "İcazə yoxdur." };

  await prisma.message
    .updateMany({
      where: { conversationId, senderId: { not: p.userId }, readAt: null },
      data: { readAt: new Date() },
    })
    .catch(() => {});

  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, senderId: true, content: true, fileUrl: true, fileName: true, readAt: true, createdAt: true },
  });
  const messages: AppChatMessage[] = rows.map((m) => ({
    id: m.id,
    mine: m.senderId === p.userId,
    content: m.content,
    hasFile: !!m.fileUrl,
    fileName: m.fileName,
    readAt: m.readAt ? m.readAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
  }));
  return { ok: true, messages };
}

/**
 * Fetch a partner thread by `conversationId` OR by `peerId` (the other party's
 * profile id — used before the first message, when the app has no
 * conversationId yet). Resolves the conversation without creating it; returns
 * an empty thread when none exists yet. Always echoes back the resolved
 * `conversationId` so the app can lock onto it and stop sending `peerId`.
 */
export async function appFetchThread(
  p: AppParticipant,
  opts: { conversationId?: string; peerId?: string },
): Promise<
  | { ok: true; messages: AppChatMessage[]; conversationId: string | null }
  | { ok: false; error: string }
> {
  let conversationId = opts.conversationId?.trim() || "";
  if (!conversationId && opts.peerId) {
    const centerId = p.role === "CENTER" ? p.profileId : opts.peerId;
    const doctorId = p.role === "DOCTOR" ? p.profileId : opts.peerId;
    const conv = await prisma.conversation.findUnique({
      where: { centerId_doctorId: { centerId, doctorId } },
      select: { id: true },
    });
    if (!conv) return { ok: true, messages: [], conversationId: null }; // not started yet
    conversationId = conv.id;
  }
  if (!conversationId) return { ok: false, error: "conversationId və ya peerId tələb olunur" };

  const result = await appFetchMessages(p, conversationId);
  if (!result.ok) return result;
  return { ok: true, messages: result.messages, conversationId };
}

/**
 * Send a text message. Accepts an existing `conversationId`, or a partner
 * `peerId` (the other party's profile id) to open the conversation on first
 * send. Enforces ACCEPTED partnership. Notifies the recipient (which also
 * fires a push via notifyUser).
 */
export async function appSendMessage(
  p: AppParticipant,
  opts: { conversationId?: string; peerId?: string; content: string },
): Promise<{ ok: true; id: string; conversationId: string } | { ok: false; error: string }> {
  const text = (opts.content ?? "").trim();
  if (!text) return { ok: false, error: "Mesaj boşdur." };
  if (text.length > 4000) return { ok: false, error: "Mesaj çox uzundur." };

  let conversationId = opts.conversationId?.trim() || "";
  let conv: { centerId: string; doctorId: string } | null = null;

  if (conversationId) {
    conv = await convForParticipant(p, conversationId);
    if (!conv) return { ok: false, error: "İcazə yoxdur." };
  } else if (opts.peerId) {
    const centerId = p.role === "CENTER" ? p.profileId : opts.peerId;
    const doctorId = p.role === "DOCTOR" ? p.profileId : opts.peerId;
    const partner = await prisma.centerDoctor.findUnique({
      where: { centerId_doctorId: { centerId, doctorId } },
      select: { status: true },
    });
    if (partner?.status !== "ACCEPTED") {
      return { ok: false, error: "Yalnız partnyorlarla yazışa bilərsiniz." };
    }
    const created = await prisma.conversation.upsert({
      where: { centerId_doctorId: { centerId, doctorId } },
      create: { centerId, doctorId },
      update: {},
      select: { id: true },
    });
    conversationId = created.id;
    conv = { centerId, doctorId };
  } else {
    return { ok: false, error: "conversationId və ya peerId tələb olunur." };
  }

  try {
    const msg = await prisma.message.create({
      data: { conversationId, senderId: p.userId, senderRole: p.role, content: text },
      select: { id: true, createdAt: true },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: msg.createdAt },
    });
    await notifyChatRecipient(p.role, conv).catch(() => {});
    return { ok: true, id: msg.id, conversationId };
  } catch {
    return { ok: false, error: "Mesaj göndərilmədi." };
  }
}

/** Notify the recipient (one unread chat notice at a time — anti-spam). */
async function notifyChatRecipient(
  senderRole: AppRole,
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

// ---------------------------------------------------------------------------
// Support (admin) thread — user side, keyed on userId
// ---------------------------------------------------------------------------

async function ensureAdminThread(userId: string): Promise<string> {
  const t = await prisma.adminThread.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
  return t.id;
}

/** The user's support-thread messages; marks admin messages as read. */
export async function appFetchSupport(userId: string): Promise<AppChatMessage[]> {
  const threadId = await ensureAdminThread(userId);
  await prisma.adminThread.update({ where: { id: threadId }, data: { userReadAt: new Date() } }).catch(() => {});
  const rows = await prisma.adminMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { id: true, fromAdmin: true, content: true, fileUrl: true, fileName: true, createdAt: true },
  });
  return rows.map((m) => ({
    id: m.id,
    mine: !m.fromAdmin, // the user's own messages are "mine"
    content: m.content,
    hasFile: !!m.fileUrl,
    fileName: m.fileName,
    readAt: null,
    createdAt: m.createdAt.toISOString(),
  }));
}

/** User sends a message to rentgen.az support. */
export async function appSendSupport(
  userId: string,
  content: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const text = (content ?? "").trim();
  if (!text) return { ok: false, error: "Mesaj boşdur." };
  if (text.length > 4000) return { ok: false, error: "Mesaj çox uzundur." };
  try {
    const threadId = await ensureAdminThread(userId);
    const msg = await prisma.adminMessage.create({
      data: { threadId, fromAdmin: false, content: text },
      select: { id: true, createdAt: true },
    });
    await prisma.adminThread.update({ where: { id: threadId }, data: { lastMessageAt: msg.createdAt } });
    return { ok: true, id: msg.id };
  } catch {
    return { ok: false, error: "Mesaj göndərilmədi." };
  }
}
