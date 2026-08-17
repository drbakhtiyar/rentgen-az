import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { inviteData, WA_TEMPLATE, type WaKind } from "@/lib/price-invite";
import { sendWaTemplate, waConfigured } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * MÜVƏQQƏTİ birdəfəlik inzibati endpoint (2026-08-17): mərkəzə şablon dəvətini
 * YENİDƏN göndərmək (nömrə dəyişəndən sonra). ADMIN_ACCESS_KEY ilə qorunur.
 * İş bitən kimi SİLİNƏCƏK — daimi API deyil.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const auth = request.headers.get("authorization");
  const key = process.env.ADMIN_TASK_KEY;
  if (!key || auth !== `Bearer ${key}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!waConfigured()) return NextResponse.json({ ok: false, error: "wa-not-configured" });
  const body = (await request.json().catch(() => null)) as { centerId?: string; kind?: WaKind } | null;
  if (!body?.centerId || !body.kind || !(body.kind in WA_TEMPLATE)) {
    return NextResponse.json({ ok: false, error: "bad-input" }, { status: 400 });
  }
  const data = await inviteData(body.centerId, body.kind);
  if (!data) return NextResponse.json({ ok: false, error: "no-mobile" }, { status: 422 });
  const res = await sendWaTemplate(data.waPhone, WA_TEMPLATE[body.kind], [data.centerName, data.url]);
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error });
  try {
    await prisma.adminActionLog.create({
      data: {
        action:
          body.kind === "faq" ? "center:wa_faq_invite"
          : body.kind === "card" ? "center:wa_card_invite"
          : body.kind === "cabinet" ? "center:wa_cabinet_invite"
          : "center:wa_price_invite",
        targetType: "CenterProfile",
        targetId: body.centerId,
        meta: { via: "template", resend: true },
      },
    });
    const center = await prisma.centerProfile.findUnique({ where: { id: body.centerId }, select: { userId: true } });
    if (center) {
      const thread = await prisma.adminThread.upsert({
        where: { userId: center.userId },
        create: { userId: center.userId },
        update: { lastMessageAt: new Date() },
      });
      await prisma.adminMessage.create({
        data: { threadId: thread.id, fromAdmin: true, content: `🤖 ${data.mirrorText.slice(0, 1500)}`, internal: true },
      });
    }
  } catch {
    /* jurnal ən yaxşı halda */
  }
  return NextResponse.json({ ok: true, to: data.waPhone });
}
