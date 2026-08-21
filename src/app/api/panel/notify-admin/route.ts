import { NextResponse } from "next/server";
import { sendWaText, waConfigured } from "@/lib/whatsapp";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Axiora səhər xülasəsi: paneldən gələn mətni admin WhatsApp-ına göndərir.
 * Meta açarları bu serverdən kənara çıxmır. 24s pəncərə tələbi: admin öz
 * botu ilə yazışdığı üçün pəncərə demək olar həmişə açıqdır; bağlıdırsa
 * sabahkı mesaj yenə cəhd edəcək (kritik deyil).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const secret = process.env.PANEL_SHARED_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!waConfigured() || !env.adminPhone) {
    return NextResponse.json({ ok: false, error: "whatsapp qurulmayıb" }, { status: 503 });
  }
  let body: { text?: string } = {};
  try {
    body = await request.json();
  } catch {}
  const text = (body.text ?? "").slice(0, 3500).trim();
  if (!text) return NextResponse.json({ ok: false, error: "text yoxdur" }, { status: 400 });
  const r = await sendWaText(env.adminPhone, text);
  return NextResponse.json({ ok: r.ok, error: r.error });
}
