import "server-only";
import { prisma } from "./db";
import { doctorName } from "./utils";
import { formatPhoneDisplay } from "./phone";

export type AdminThreadItem = {
  threadId: string;
  userId: string;
  name: string;
  sub: string | null;
  role: string;
  avatarUrl: string | null;
  lastMessageAt: string;
  preview: string | null;
  unread: number;
};

export type AdminSearchItem = {
  userId: string;
  name: string;
  sub: string | null;
  role: string;
  avatarUrl: string | null;
};

type UserRow = {
  role: string;
  phone: string;
  doctorProfile: { firstName: string | null; lastName: string | null; clinic: string | null; photoUrl: string | null } | null;
  centerProfile: { name: string; city: string | null; logoUrl: string | null } | null;
};

function labelUser(u: UserRow): { name: string; sub: string | null; avatarUrl: string | null } {
  if (u.doctorProfile) {
    return {
      name: doctorName(u.doctorProfile.firstName, u.doctorProfile.lastName),
      sub: u.doctorProfile.clinic,
      avatarUrl: u.doctorProfile.photoUrl,
    };
  }
  if (u.centerProfile) {
    return { name: u.centerProfile.name, sub: u.centerProfile.city, avatarUrl: u.centerProfile.logoUrl };
  }
  return { name: formatPhoneDisplay(u.phone), sub: null, avatarUrl: null };
}

const USER_SELECT = {
  role: true,
  phone: true,
  doctorProfile: { select: { firstName: true, lastName: true, clinic: true, photoUrl: true } },
  centerProfile: { select: { name: true, city: true, logoUrl: true } },
} as const;

/** All admin threads with last message + unread (admin perspective). */
export async function getAdminThreads(): Promise<AdminThreadItem[]> {
  const threads = await prisma.adminThread.findMany({
    orderBy: { lastMessageAt: "desc" },
    take: 300,
    select: {
      id: true,
      userId: true,
      adminReadAt: true,
      lastMessageAt: true,
      user: { select: USER_SELECT },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, fileUrl: true } },
    },
  });
  // Unread = incoming (fromAdmin=false) messages after adminReadAt.
  const incoming = await prisma.adminMessage.findMany({
    where: { threadId: { in: threads.map((t) => t.id) }, fromAdmin: false },
    select: { threadId: true, createdAt: true },
  });
  const unreadByThread: Record<string, number> = {};
  const readAt = new Map(threads.map((t) => [t.id, t.adminReadAt]));
  for (const m of incoming) {
    const cut = readAt.get(m.threadId);
    if (!cut || m.createdAt > cut) unreadByThread[m.threadId] = (unreadByThread[m.threadId] ?? 0) + 1;
  }
  return threads.map((t) => {
    const l = labelUser(t.user);
    return {
      threadId: t.id,
      userId: t.userId,
      name: l.name,
      sub: l.sub,
      role: t.user.role,
      avatarUrl: l.avatarUrl,
      lastMessageAt: t.lastMessageAt.toISOString(),
      preview: t.messages[0] ? (t.messages[0].content || (t.messages[0].fileUrl ? "📎 Fayl" : null)) : null,
      unread: unreadByThread[t.id] ?? 0,
    };
  });
}

/** Total unread across all threads (admin nav badge). */
export async function adminUnreadTotal(): Promise<number> {
  try {
    const threads = await prisma.adminThread.findMany({ select: { id: true, adminReadAt: true } });
    if (threads.length === 0) return 0;
    const incoming = await prisma.adminMessage.findMany({
      where: { threadId: { in: threads.map((t) => t.id) }, fromAdmin: false },
      select: { threadId: true, createdAt: true },
    });
    const readAt = new Map(threads.map((t) => [t.id, t.adminReadAt]));
    let n = 0;
    for (const m of incoming) {
      const cut = readAt.get(m.threadId);
      if (!cut || m.createdAt > cut) n++;
    }
    return n;
  } catch {
    return 0;
  }
}

/** Search registered doctors/centers by name or phone (to start a thread). */
export async function searchAdminUsers(query: string): Promise<AdminSearchItem[]> {
  const q = query.trim();
  if (!q) return [];
  const [doctors, centers] = await Promise.all([
    prisma.doctorProfile.findMany({
      where: {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { user: { phone: { contains: q } } },
        ],
      },
      select: { userId: true, firstName: true, lastName: true, clinic: true, photoUrl: true },
      take: 20,
    }),
    prisma.centerProfile.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { user: { phone: { contains: q } } },
        ],
      },
      select: { userId: true, name: true, city: true, logoUrl: true },
      take: 20,
    }),
  ]);
  return [
    ...doctors.map((d) => ({
      userId: d.userId,
      name: doctorName(d.firstName, d.lastName),
      sub: d.clinic,
      role: "DOCTOR",
      avatarUrl: d.photoUrl,
    })),
    ...centers.map((c) => ({
      userId: c.userId,
      name: c.name,
      sub: c.city,
      role: "CENTER",
      avatarUrl: c.logoUrl,
    })),
  ];
}

const DOCTOR_WELCOME =
  "Salam, hörmətli həkim! 👋 Rentgen.az ailəsinə xoş gəlmisiniz. Profiliniz təsdiqləndi və artıq aktivdir.\n\nPanelinizdən pasiyentlərinizi etibarlı mərkəzlərə yönləndirə, partnyor mərkəzlərlə əlaqə qura və göndərdiyiniz pasiyentlərin rentgen nəticələrini izləyə bilərsiniz.";

const CENTER_WELCOME =
  "Salam! 👋 Rentgen.az ailəsinə xoş gəlmisiniz. Mərkəzinizin profili təsdiqləndi və artıq axtarış nəticələrində görünür.\n\nPanelinizdən xidmət və qiymətləri idarə edə, pasiyent müraciətlərini qəbul edə və rentgen nəticələrini pasiyent və həkimlərlə paylaşa bilərsiniz.";

const FEEDBACK_MESSAGE =
  "Sistemlə bağlı hər hansı sualınız, çətinliyiniz və ya təklifiniz olarsa, çəkinmədən buradan bizə yazın. Platformanı məhz sizin istəkləriniz əsasında davamlı təkmilləşdiririk — təklifləriniz ən qısa zamanda nəzərə alınacaq. Fikirləriniz bizim üçün dəyərlidir! 🙏";

/**
 * Send the one-time welcome + feedback-invitation messages from admin to a
 * newly approved doctor/center. Idempotent: skips if admin has already
 * messaged this user (so re-approval doesn't resend).
 */
export async function sendAdminWelcome(
  userId: string,
  role: "DOCTOR" | "CENTER",
): Promise<void> {
  try {
    const already = await prisma.adminMessage.count({
      where: { thread: { userId }, fromAdmin: true },
    });
    if (already > 0) return;
    const thread = await prisma.adminThread.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });
    // Sequential creates keep the welcome before the feedback message.
    await prisma.adminMessage.create({
      data: { threadId: thread.id, fromAdmin: true, content: role === "DOCTOR" ? DOCTOR_WELCOME : CENTER_WELCOME },
    });
    await prisma.adminMessage.create({
      data: { threadId: thread.id, fromAdmin: true, content: FEEDBACK_MESSAGE },
    });
    await prisma.adminThread.update({
      where: { id: thread.id },
      data: { lastMessageAt: new Date() },
    });
  } catch {
    /* best-effort */
  }
}

/** The pinned "Admin" contact for a doctor/center user's own chat list. */
export async function getUserAdminContact(
  userId: string,
): Promise<{ threadId: string | null; preview: string | null; unread: number }> {
  const thread = await prisma.adminThread.findUnique({
    where: { userId },
    select: {
      id: true,
      userReadAt: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true, fileUrl: true } },
    },
  });
  if (!thread) return { threadId: null, preview: null, unread: 0 };
  const unread = await prisma.adminMessage.count({
    where: {
      threadId: thread.id,
      fromAdmin: true,
      ...(thread.userReadAt ? { createdAt: { gt: thread.userReadAt } } : {}),
    },
  });
  return { threadId: thread.id, preview: thread.messages[0] ? (thread.messages[0].content || (thread.messages[0].fileUrl ? "📎 Fayl" : null)) : null, unread };
}
