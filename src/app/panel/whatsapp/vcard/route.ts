import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/rbac";
import { WA_LOG_ACTION, WA_FAQ_LOG_ACTION, WA_CARD_LOG_ACTION, WA_CABINET_LOG_ACTION } from "@/lib/price-invite";
import { AZ_MOBILE_PREFIXES } from "@/lib/center-filters";

export const dynamic = "force-dynamic";

/**
 * Dəvət göndərilmiş mərkəzlərin vCard (.vcf) faylı — telefona bir kliklə
 * import üçün. NİYƏ: WhatsApp şəxsi hesabların adını göstərmir (yalnız nömrə);
 * kontaktda ad olanda söhbət siyahısı oxunaqlı olur. Tam avtomatik yazmaq
 * mümkün deyil (OS kontakt kitabçasına sayt girişi vermir) — bu, mümkün olan
 * ən qısa yoldur: yüklə → aç → hamısı adla kontaktlara düşür.
 * Adların sonuna "· rentgen.az" əlavə olunur ki, şəxsi kontaktlarla qarışmasın.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["OPERATOR", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
  }

  const logs = await prisma.adminActionLog.findMany({
    where: {
      action: { in: [WA_LOG_ACTION, WA_FAQ_LOG_ACTION, WA_CARD_LOG_ACTION, WA_CABINET_LOG_ACTION] },
    },
    select: { targetId: true },
  });
  const ids = [...new Set(logs.map((l) => l.targetId).filter((x): x is string => !!x))];
  if (!ids.length) {
    return NextResponse.json({ error: "Hələ göndəriş yoxdur" }, { status: 404 });
  }

  const centers = await prisma.centerProfile.findMany({
    where: { id: { in: ids } },
    select: { name: true, city: true, phone: true, whatsapp: true },
    orderBy: { name: "asc" },
  });

  const isMobile = (p: string | null) => !!p && AZ_MOBILE_PREFIXES.some((x) => p.startsWith(x));
  // vCard mətn qaydası: vergül/nöqtəli vergül escape, sətir sonu yok
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/[,;]/g, (m) => `\\${m}`).replace(/\n/g, " ");

  const cards = centers
    .map((c) => {
      const tel = isMobile(c.whatsapp) ? c.whatsapp! : c.phone;
      if (!tel) return null;
      const fn = `${c.name} · rentgen.az`;
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${esc(fn)}`,
        `N:${esc(fn)};;;;`,
        "ORG:rentgen.az",
        c.city ? `ADR;TYPE=WORK:;;${esc(c.city)};;;;Azerbaijan` : null,
        `TEL;TYPE=CELL:${tel}`,
        "END:VCARD",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .filter(Boolean)
    .join("\r\n");

  return new NextResponse(cards + "\r\n", {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="rentgen-merkezler.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
