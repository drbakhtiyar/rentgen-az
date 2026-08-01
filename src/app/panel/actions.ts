"use server";

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

export async function operatorLogoutAction(): Promise<void> {
  await clearSessionCookie();
}
