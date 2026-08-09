"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/rbac";
import { clearSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  saveCenterLoose,
  type CenterWriteInput,
  type CenterWriteResult,
} from "@/lib/center-write";

/**
 * Operator/admin redaktəsini `AdminActionLog`-a yazır.
 *
 * NƏ ÜÇÜN: bu panel əvvəllər HEÇ NƏ qeyd etmirdi, ona görə "bu mərkəzə
 * Nərmin toxunub, yoxsa toplu import belə yaradıb?" sualına cavab yox idi.
 * Toplu təmizləmə əməliyyatlarında (şablon xidmət siyahısının kəsilməsi və s.)
 * əl ilə redaktə olunmuş mərkəzləri kənarda saxlamaq üçün bu iz lazımdır.
 * Bax: `src/lib/center-editors.ts`.
 */
async function logCenterWrite(
  actorId: string,
  action: "center:edit" | "center:create",
  centerId: string,
  via: "panel" | "admin",
) {
  try {
    await prisma.adminActionLog.create({
      data: { adminId: actorId, action, targetType: "CenterProfile", targetId: centerId, meta: { via } },
    });
  } catch {
    /* jurnal ən yaxşı halda işləyir — əsas əməliyyatı bloklamır */
  }
}

/** Create a center (loose — missing fields are allowed). Operator or admin. */
export async function createCenterFlexAction(
  input: CenterWriteInput,
): Promise<CenterWriteResult> {
  const actor = await requireRole(["OPERATOR", "ADMIN"]);
  const res = await saveCenterLoose(null, input);
  if (res.ok && res.id) await logCenterWrite(actor.id, "center:create", res.id, "panel");
  return res;
}

/** Update a center (loose — missing fields are allowed). Operator or admin. */
export async function updateCenterFlexAction(
  centerId: string,
  input: CenterWriteInput,
): Promise<CenterWriteResult> {
  const actor = await requireRole(["OPERATOR", "ADMIN"]);
  const res = await saveCenterLoose(centerId, input);
  if (res.ok) await logCenterWrite(actor.id, "center:edit", centerId, "panel");
  return res;
}

export type ServicesSaveResult = { ok: boolean; error?: string; count?: number };

/**
 * Mərkəzin xidmət siyahısını və qiymətlərini operator/admin adından saxlayır.
 *
 * NƏ ÜÇÜN AYRICA ACTION: `merkez/actions.ts`-dəki `saveCenterServicesAction`
 * sərt şəkildə `requireRole("CENTER")`-ə bağlıdır və mərkəzi SESSİYADAN tapır —
 * ona görə nə operator, nə admin başqa mərkəzin xidmətlərini redaktə edə bilmirdi.
 *
 * FƏRQ: burada qiymət MƏCBURİ DEYİL. Mərkəzin öz panelində qiymət tələb olunur
 * (ki, /xidmetler həmişə qiymət göstərsin), operator isə məlumatı mərhələ-mərhələ
 * toplayır — əvvəlcə siyahını dəqiqləşdirir, qiyməti sonra zəngdə öyrənir.
 * `saveCenterLoose` ilə eyni "loose data-entry" məntiqi.
 */
export async function saveCenterServicesFlexAction(
  centerId: string,
  services: {
    serviceId: string;
    enabled: boolean;
    price?: number | null;
    priceTo?: number | null;
    durationMin?: number | null;
    note?: string;
  }[],
): Promise<ServicesSaveResult> {
  const actor = await requireRole(["OPERATOR", "ADMIN"]);
  try {
    const center = await prisma.centerProfile.findUnique({
      where: { id: centerId },
      select: { id: true },
    });
    if (!center) return { ok: false, error: "Mərkəz tapılmadı." };

    const enabled = services.filter((s) => s.enabled);
    const clean = enabled.map((s) => {
      const price =
        s.price != null && Number.isFinite(s.price) && s.price > 0 ? Math.round(s.price) : null;
      const priceTo =
        s.priceTo != null && Number.isFinite(s.priceTo) && s.priceTo > 0 && price != null && s.priceTo > price
          ? Math.round(s.priceTo)
          : null;
      return {
        centerId: center.id,
        serviceId: s.serviceId,
        price,
        priceTo,
        durationMin: Math.min(240, Math.max(5, Math.round(s.durationMin ?? 30))),
        note: s.note?.trim() ? s.note.trim().slice(0, 200) : null,
      };
    });

    await prisma.$transaction([
      prisma.centerService.deleteMany({ where: { centerId: center.id } }),
      ...(clean.length ? [prisma.centerService.createMany({ data: clean })] : []),
    ]);

    await logCenterWrite(actor.id, "center:edit", center.id, "panel");
    revalidatePath(`/panel/${center.id}/xidmetler`);
    revalidatePath("/rentgen-merkezleri");
    return { ok: true, count: clean.length };
  } catch {
    return { ok: false, error: "Texniki xəta. Yenidən cəhd edin." };
  }
}

/**
 * WhatsApp dəvəti göndərişini jurnala yazır (gündəlik ORTAQ kvota bu qeydlərlə
 * sayılır — bax src/lib/price-invite.ts). Düyməyə basılanda çağırılır.
 * kind: "price" (qiymət dəvəti) | "faq" (FAQ dəvəti).
 */
export async function markWaSentAction(
  centerId: string,
  kind: "price" | "faq" = "price",
): Promise<{ ok: boolean }> {
  const actor = await requireRole(["OPERATOR", "ADMIN"]);
  try {
    await prisma.adminActionLog.create({
      data: {
        adminId: actor.id,
        action: kind === "faq" ? "center:wa_faq_invite" : "center:wa_price_invite",
        targetType: "CenterProfile",
        targetId: centerId,
        meta: { via: "panel" },
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function operatorLogoutAction(): Promise<void> {
  await clearSessionCookie();
}
