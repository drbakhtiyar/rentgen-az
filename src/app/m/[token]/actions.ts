"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { resolveCardToken } from "@/lib/price-invite";
import { formatHoursSummary, parseHours, type WeeklyHours } from "@/lib/hours";
import type { Prisma } from "@/generated/prisma/client";

export type CardSaveState = { ok: boolean; error?: string; summary?: string };

/**
 * Tokenli KART formu — girişsiz (/q ilə eyni token məntiq). Mərkəz özü:
 *   - toplu importdan gələn artıq xidmətləri SİLİR (checkbox),
 *   - kataloqdan çatışmayanları ƏLAVƏ EDİR,
 *   - saxladıqlarına qiymət yazır,
 *   - iş saatlarını qeyd edir.
 * Silinən xidmətlərin adları jurnalın meta-sında saxlanılır (audit üçün) —
 * mərkəzin öz kartı barədə qərarıdır, amma iz itmir.
 */
export async function saveCardAction(input: {
  token: string;
  /** Saxlanılan mövcud sətirlər + qiymətləri. Siyahıda OLMAYAN mövcud sətir = silinir. */
  keep: { centerServiceId: string; price: number | null }[];
  additions: { serviceId: string; price: number | null }[];
  /** null = qrafikə toxunulmadı. */
  hours: WeeklyHours | null;
}): Promise<CardSaveState> {
  const target = await resolveCardToken(input.token).catch(() => null);
  if (!target) return { ok: false, error: "Bu link artıq keçərli deyil." };

  const okPrice = (p: number | null) =>
    p != null && Number.isInteger(p) && p >= 1 && p <= 10000;

  const existing = new Map(target.rows.map((r) => [r.centerServiceId, r]));
  const keep = input.keep.filter((k) => existing.has(k.centerServiceId));
  const keepIds = new Set(keep.map((k) => k.centerServiceId));
  const removed = target.rows.filter((r) => !keepIds.has(r.centerServiceId));

  // Qoruyucu: hamısını silib boş kart qoymaq olmaz.
  if (keep.length === 0 && (input.additions?.length ?? 0) === 0)
    return { ok: false, error: "Ən azı bir xidmət saxlanılmalıdır." };

  const addableIds = new Set(target.addable.map((a) => a.serviceId));
  const seen = new Set<string>();
  const additions = (input.additions ?? []).filter((a) => {
    if (!addableIds.has(a.serviceId) || seen.has(a.serviceId)) return false;
    seen.add(a.serviceId);
    return true;
  });

  const priceUpdates = keep.filter((k) => okPrice(k.price));
  const week = input.hours ? parseHours(input.hours) : null;
  const hasHours = !!week && Object.values(week).some((d) => d != null);

  try {
    await prisma.$transaction([
      ...(removed.length
        ? [
            prisma.centerService.deleteMany({
              where: { id: { in: removed.map((r) => r.centerServiceId) }, centerId: target.centerId },
            }),
          ]
        : []),
      ...priceUpdates.map((u) =>
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
      ...(hasHours
        ? [
            prisma.centerProfile.update({
              where: { id: target.centerId },
              data: {
                hours: week as unknown as Prisma.InputJsonValue,
                workingHours: formatHoursSummary(week),
              },
            }),
          ]
        : []),
    ]);
    // İz: mərkəz özü etdi (adminId yoxdur); silinənlərin adları meta-da qalır.
    await prisma.adminActionLog
      .create({
        data: {
          action: "center:card_self",
          targetType: "CenterProfile",
          targetId: target.centerId,
          meta: {
            via: "m-link",
            removed: removed.map((r) => r.serviceName),
            added: additions.length,
            priced: priceUpdates.length,
            hours: hasHours,
          },
        },
      })
      .catch(() => null);
    revalidatePath(`/rentgen-merkezleri/${target.slug}`);
    revalidatePath("/rentgen-merkezleri");
    const parts = [
      removed.length ? `${removed.length} xidmət silindi` : null,
      additions.length ? `${additions.length} xidmət əlavə olundu` : null,
      priceUpdates.length ? `${priceUpdates.length} qiymət yazıldı` : null,
      hasHours ? "iş saatları yeniləndi" : null,
    ].filter(Boolean);
    return { ok: true, summary: parts.join(", ") || "Dəyişiklik yoxdur" };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}
