import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { answerWaMessage } from "@/lib/wa-bot";
import type { AiMsg } from "@/lib/ai-assistant";
import { sendWaText, waConfigured } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Meta Cloud API webhook — WhatsApp botu.
 *
 * GET  → Meta-nın birdəfəlik doğrulaması (hub.verify_token).
 * POST → gələn mesajlar: imza yoxlanır → bot cavabı → geri göndərilir.
 *
 * Söhbət tarixçəsi yazan nömrənin mərkəz sahibinin AdminThread-inə güzgülənir —
 * admin panelin Söhbətlər bölməsində hər şeyi görür və lazım olsa müdaxilə edir
 * (bot mesajları 🤖 prefiksi ilə). ENV qurulana qədər webhook passivdir.
 */

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ ok: false }, { status: 403 });
}

function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return false;
  if (!header?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const got = header.slice(7);
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(got, "hex"));
  } catch {
    return false;
  }
}

/**
 * Söhbəti AdminThread-ə güzgülə — /admin/whatsapp-sohbetler bölməsi üçün.
 * 2026-08-12: NAMƏLUM nömrələr də qeydə alınır (əvvəl yalnız mərkəzlər idi —
 * istifadəçinin şəxsi test mesajı heç yerdə görünmürdü). Nömrə mərkəzə
 * uyğundursa mərkəzin sahib istifadəçisi, deyilsə telefonla User upsert olunur.
 */
/** Nömrə → thread istifadəçisi (mirror ilə eyni həlletmə, oxu üçün). */
async function threadUserId(phone: string): Promise<string | null> {
  const digits = phone.replace(/\D/g, "").slice(-9);
  const center = await prisma.centerProfile
    .findFirst({
      where: { OR: [{ phone: { endsWith: digits } }, { whatsapp: { endsWith: digits } }] },
      select: { userId: true },
    })
    .catch(() => null);
  if (center) return center.userId;
  const user = await prisma.user
    .findUnique({ where: { phone: `+994${digits}` }, select: { id: true } })
    .catch(() => null);
  return user?.id ?? null;
}

/**
 * Çoxdövrəli dialoq üçün tarixçə — güzgülənmiş 📲/🤖 mesajlarından qurulur
 * (bunsuz bot hər mesajı sıfırdan görürdü: menyudan "2" seçimi, ad təsdiqi
 * kimi axınlar işləməzdi). Pəncərə 7 gün / 20 dövr (istifadəçi istəyi) —
 * operator CAVABININ WhatsApp-a getmə pəncərəsi isə Meta qaydasıdır, 24s qalır.
 */
async function waHistory(phone: string): Promise<AiMsg[]> {
  try {
    const userId = await threadUserId(phone);
    if (!userId) return [];
    const rows = await prisma.adminMessage.findMany({
      where: {
        thread: { userId },
        OR: [{ content: { startsWith: "📲" } }, { content: { startsWith: "🤖" } }],
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600_000) },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { content: true, fromAdmin: true },
    });
    return rows.reverse().map((r) => ({
      role: r.fromAdmin ? ("assistant" as const) : ("user" as const),
      content: r.content.replace(/^📲 WhatsApp: /, "").replace(/^🤖 /, "").slice(0, 1500),
    }));
  } catch {
    return [];
  }
}

async function mirror(phone: string, inbound: string, outbound: string | null) {
  try {
    const digits = phone.replace(/\D/g, "").slice(-9);
    const center = await prisma.centerProfile.findFirst({
      where: { OR: [{ phone: { endsWith: digits } }, { whatsapp: { endsWith: digits } }] },
      select: { userId: true },
    });
    let userId = center?.userId;
    if (!userId) {
      const normalized = `+994${digits}`;
      const user = await prisma.user.upsert({
        where: { phone: normalized },
        create: { phone: normalized, role: "PATIENT" },
        update: {},
        select: { id: true },
      });
      userId = user.id;
    }
    const thread = await prisma.adminThread.upsert({
      where: { userId },
      create: { userId },
      update: { lastMessageAt: new Date() },
    });
    await prisma.adminMessage.create({
      data: { threadId: thread.id, fromAdmin: false, content: `📲 WhatsApp: ${inbound.slice(0, 1500)}` },
    });
    if (outbound) {
      await prisma.adminMessage.create({
        data: { threadId: thread.id, fromAdmin: true, content: `🤖 ${outbound.slice(0, 1500)}` },
      });
    }
  } catch {
    /* güzgü ən yaxşı halda işləyir */
  }
}

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  // Meta 200-ü tez istəyir; emalı cavabdan əvvəl edirik amma qısa saxlanır.
  try {
    const body = JSON.parse(raw) as {
      entry?: { changes?: { value?: { messages?: { from: string; type: string; text?: { body: string } }[] } }[] }[];
    };
    const msgs =
      body.entry?.flatMap((e) => e.changes ?? []).flatMap((c) => c.value?.messages ?? []) ?? [];
    for (const m of msgs.slice(0, 3)) {
      if (!waConfigured()) continue;

      // Mətn olmayan mesajlara SABİT cavablar — AI-a getmir, bot beynindən
      // asılı deyil (istifadəçi qərarı, 2026-08-11). Səs oxunmur; şəkil isə
      // arzuolunandır (loqo/foto kampaniyası) — təşəkkür + komanda emalı.
      if (m.type === "audio" || m.type === "video") {
        const canned =
          "Bağışlayın, səsli və video mesajları oxuya bilmirəm 🙏 Zəhmət olmasa fikrinizi yazı ilə göndərin — dərhal cavablandırım.";
        await sendWaText(m.from, canned);
        await mirror(m.from, m.type === "audio" ? "[səsli mesaj]" : "[video]", canned);
        continue;
      }
      if (m.type === "image" || m.type === "document") {
        const canned =
          "Faylınızı aldıq, təşəkkürlər! 🙏 Komandamız baxıb kartınıza yerləşdirəcək. Əlavə sualınız olsa, yazın.";
        await sendWaText(m.from, canned);
        await mirror(m.from, m.type === "image" ? "[şəkil göndərildi]" : "[sənəd göndərildi]", canned);
        continue;
      }
      if (m.type !== "text" || !m.text?.body) continue;

      const history = await waHistory(m.from);
      const res = await answerWaMessage(m.from, m.text.body, history);
      if (res.ok && res.answer) {
        await sendWaText(m.from, res.answer);
        await mirror(m.from, m.text.body, res.answer);
      } else {
        await mirror(m.from, m.text.body, null);
      }
    }
  } catch (e) {
    console.error("[whatsapp webhook]", (e as Error).message);
  }
  return NextResponse.json({ ok: true });
}
