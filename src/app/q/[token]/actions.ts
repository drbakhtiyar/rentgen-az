"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { logTokenSave } from "@/lib/link-visit";
import { resolvePriceToken } from "@/lib/price-invite";
import { headers } from "next/headers";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export type PriceSaveState = { ok: boolean; error?: string; saved?: number };

/**
 * Tokenli qiymət formu — girişsiz (token sahibliyi sübut edir; linki mərkəzin
 * öz WhatsApp nömrəsinə biz göndərmişik). Yalnız HƏMİN mərkəzin öz
 * CenterService sətirlərinin qiymətini yaza bilər.
 */
export async function savePricesAction(input: {
  token: string;
  prices: { centerServiceId: string; price: number | null }[];
  /** "+" ilə kataloqdan seçilmiş YENİ xidmətlər (qiymət istəyə bağlıdır). */
  additions?: { serviceId: string; price: number | null }[];
}): Promise<PriceSaveState> {
  // Yazma spamının qarşısı (2026-08-14 auditi)
  const rl = await rateLimit("token:save", clientIp({ headers: await headers() }), 30, 3600);
  if (!rl.allowed) return { ok: false, error: "Çox sayda cəhd. Bir azdan yenidən yoxlayın." };
  const target = await resolvePriceToken(input.token).catch(() => null);
  if (!target) return { ok: false, error: "Bu link artıq keçərli deyil." };

  const okPrice = (p: number | null) =>
    p != null && Number.isInteger(p) && p >= 1 && p <= 10000;

  const valid = new Set(target.rows.map((r) => r.centerServiceId));
  const updates = input.prices.filter((p) => valid.has(p.centerServiceId) && okPrice(p.price));

  // Yeni xidmətlər: yalnız kataloqda mövcud + mərkəzdə hələ olmayan.
  const addableIds = new Set(target.addable.map((a) => a.serviceId));
  const seen = new Set<string>();
  const additions = (input.additions ?? []).filter((a) => {
    if (!addableIds.has(a.serviceId) || seen.has(a.serviceId)) return false;
    seen.add(a.serviceId);
    return true;
  });

  if (!updates.length && !additions.length)
    return { ok: false, error: "Ən azı bir xidmətə qiymət yazın və ya xidmət əlavə edin." };

  try {
    await prisma.$transaction([
      ...updates.map((u) =>
        prisma.centerService.update({
          where: { id: u.centerServiceId },
          data: { price: u.price, priceTo: null },
        }),
      ),
      ...(additions.length
        ? [
            prisma.centerService.createMany({
              data: additions.map((a) => ({
                centerId: target.centerId,
                serviceId: a.serviceId,
                price: okPrice(a.price) ? a.price : null,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);
    // İz: mərkəz özü yazdı (adminId yoxdur).
    await prisma.adminActionLog
      .create({
        data: {
          action: "center:price_self",
          targetType: "CenterProfile",
          targetId: target.centerId,
          meta: { via: "q-link", count: updates.length, added: additions.length },
        },
      })
      .catch(() => null);
    await logTokenSave(target.centerId, "q");
    revalidatePath(`/rentgen-merkezleri/${target.slug}`);
    revalidatePath("/rentgen-merkezleri");
    return { ok: true, saved: updates.length + additions.length };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}
