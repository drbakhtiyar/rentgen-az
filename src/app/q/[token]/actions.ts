"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { resolvePriceToken } from "@/lib/price-invite";

export type PriceSaveState = { ok: boolean; error?: string; saved?: number };

/**
 * Tokenli qiymət formu — girişsiz (token sahibliyi sübut edir; linki mərkəzin
 * öz WhatsApp nömrəsinə biz göndərmişik). Yalnız HƏMİN mərkəzin öz
 * CenterService sətirlərinin qiymətini yaza bilər.
 */
export async function savePricesAction(input: {
  token: string;
  prices: { centerServiceId: string; price: number | null }[];
}): Promise<PriceSaveState> {
  const target = await resolvePriceToken(input.token).catch(() => null);
  if (!target) return { ok: false, error: "Bu link artıq keçərli deyil." };

  const valid = new Set(target.rows.map((r) => r.centerServiceId));
  const updates = input.prices.filter(
    (p) =>
      valid.has(p.centerServiceId) &&
      p.price != null &&
      Number.isInteger(p.price) &&
      p.price >= 1 &&
      p.price <= 10000,
  );
  if (!updates.length) return { ok: false, error: "Ən azı bir xidmətə qiymət yazın." };

  try {
    await prisma.$transaction(
      updates.map((u) =>
        prisma.centerService.update({
          where: { id: u.centerServiceId },
          data: { price: u.price, priceTo: null },
        }),
      ),
    );
    // İz: mərkəz özü yazdı (adminId yoxdur).
    await prisma.adminActionLog
      .create({
        data: {
          action: "center:price_self",
          targetType: "CenterProfile",
          targetId: target.centerId,
          meta: { via: "q-link", count: updates.length },
        },
      })
      .catch(() => null);
    revalidatePath(`/rentgen-merkezleri/${target.slug}`);
    revalidatePath("/rentgen-merkezleri");
    return { ok: true, saved: updates.length };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}
