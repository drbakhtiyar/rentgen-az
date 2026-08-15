import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWaTemplate, waConfigured } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Həftəlik WhatsApp statistika hesabatı (2026-08-13, istifadəçi qərarı:
 * oktyabr gözlənilmir — MİNİMAL AKTİVLİYİ OLAN mərkəzlərə dərhal başlanır).
 *
 * Kimə: APPROVED + mobil nömrəli mərkəzlər, son 7 gündə ən azı
 * WA_STATS_MIN_EVENTS (default 3) hadisə (baxış/zəng/WA/...) olanlar.
 * Sıfır-aktivlikli mərkəzə göndərilmir — mənasızdır.
 *
 * Şablon: heftelik_hesabat (UTILITY, az) — params: ad, baxış, zəng, WhatsApp.
 * Dedup: AdminActionLog `center:wa_weekly_stats` son 6 gündə varsa ötürülür.
 * Güzgü: göndəriş mərkəzin söhbətinə 🤖 qeydi ilə düşür.
 * Cədvəl: hər bazar ertəsi 09:00 Bakı (05:00 UTC) — vercel.json.
 */

const MIN_EVENTS = Math.max(1, parseInt(process.env.WA_STATS_MIN_EVENTS ?? "", 10) || 3);
const isMobile = (p: string | null | undefined) =>
  !!p && /^\+994(50|51|55|70|77|99|10|60)\d{7}$/.test(p.replace(/[\s-]/g, ""));

export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }
  if (!waConfigured()) return NextResponse.json({ ok: false, error: "wa-not-configured" });

  const since = new Date(Date.now() - 7 * 24 * 3600_000);
  const dedupSince = new Date(Date.now() - 6 * 24 * 3600_000);

  // Son 7 günün hadisələri mərkəz+tip üzrə
  const events = await prisma.centerEvent.groupBy({
    by: ["centerId", "type"],
    where: { createdAt: { gte: since } },
    _count: { type: true },
  });
  const byCenter = new Map<string, Record<string, number>>();
  for (const e of events) {
    const m = byCenter.get(e.centerId) ?? {};
    m[e.type] = e._count.type;
    byCenter.set(e.centerId, m);
  }

  // Minimal aktivlik həddi
  const activeIds = [...byCenter.entries()]
    .filter(([, m]) => Object.values(m).reduce((a, b) => a + b, 0) >= MIN_EVENTS)
    .map(([id]) => id);
  if (activeIds.length === 0) return NextResponse.json({ ok: true, sent: 0, note: "no-active" });

  const centers = await prisma.centerProfile.findMany({
    where: { id: { in: activeIds }, status: "APPROVED" },
    select: { id: true, userId: true, name: true, phone: true, whatsapp: true },
  });

  // Dedup: bu həftə artıq göndərilənlər
  const already = new Set(
    (
      await prisma.adminActionLog.findMany({
        where: {
          action: "center:wa_weekly_stats",
          targetId: { in: centers.map((c) => c.id) },
          createdAt: { gte: dedupSince },
        },
        select: { targetId: true },
      })
    ).map((r) => r.targetId),
  );

  let sent = 0;
  const errors: string[] = [];
  for (const c of centers) {
    if (already.has(c.id)) continue;
    const waPhone = isMobile(c.whatsapp) ? c.whatsapp! : isMobile(c.phone) ? c.phone : null;
    if (!waPhone) continue;

    const m = byCenter.get(c.id) ?? {};
    const views = m.view ?? 0;
    const calls = m.call ?? 0;
    const wa = m.whatsapp ?? 0;

    const res = await sendWaTemplate(waPhone, "heftelik_hesabat", [
      c.name,
      String(views),
      String(calls),
      String(wa),
    ]);
    if (!res.ok) {
      errors.push(`${c.name}: ${res.error ?? "?"}`);
      continue;
    }
    sent++;

    // Jurnal + söhbət güzgüsü — ən yaxşı halda işləyir
    try {
      await prisma.adminActionLog.create({
        data: {
          action: "center:wa_weekly_stats",
          targetType: "CenterProfile",
          targetId: c.id,
          meta: { views, calls, whatsapp: wa },
        },
      });
      const thread = await prisma.adminThread.upsert({
        where: { userId: c.userId },
        create: { userId: c.userId },
        update: { lastMessageAt: new Date() },
      });
      await prisma.adminMessage.create({
        data: {
          threadId: thread.id,
          fromAdmin: true,
          internal: true, // WhatsApp güzgüsü — sayt panelində göstərilmir
          content: `🤖 Salam, ${c.name}! 📊 rentgen.az həftəlik hesabatınız — son 7 gündə profiliniz ${views} dəfə baxılıb, ${calls} zəng kliki və ${wa} WhatsApp müraciəti olub. Ətraflı: https://rentgen.az/merkez/statistika [heftelik_hesabat şablonu]`,
        },
      });
    } catch {
      /* güzgüsüz davam */
    }
  }

  return NextResponse.json({ ok: true, sent, eligible: centers.length, errors: errors.slice(0, 10) });
}
