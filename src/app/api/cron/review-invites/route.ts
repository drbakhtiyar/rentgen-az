import { NextResponse } from "next/server";
import { runReviewInvites } from "@/lib/review-invite";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Saatlıq cron: tamamlanmış müayinələr üçün rəy dəvəti SMS-i.
 *
 * Statusu HANSI yoldan dəyişməsindən asılı olmayaraq işləyir (mərkəz paneli,
 * CRM, admin, mobil app) — ona görə hər çağırış yerinə qarmaq taxmaq əvəzinə
 * cron seçildi. `reviewInviteSentAt` dedup edir, `completedAt` gecikməni verir.
 * CRON_SECRET ilə qorunur.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }
  try {
    const res = await runReviewInvites();
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "failed" },
      { status: 500 },
    );
  }
}
