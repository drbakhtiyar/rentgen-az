import "server-only";
import { prisma } from "@/lib/db";
import { OPERATOR_PHONE } from "@/lib/auth/operator";

/**
 * "Bu mərkəzə kim toxunub?" siqnalı.
 *
 * NƏ ÜÇÜN: mərkəz məlumatı üç mənbədən gəlir — (1) toplu Google importu,
 * (2) admin/operator əl ilə redaktəsi, (3) mərkəzin ÖZ sahibinin paneldən
 * etdiyi dəyişiklik. Toplu təmizləmə əməliyyatlarında (məs. şablon xidmət
 * siyahısının kəsilməsi) 2-ci və 3-cü qrupa toxunmamaq lazımdır — orada real
 * insan əməyi var.
 *
 * `AdminActionLog` bu üçlüyü ayırd etməyə imkan verir: admin və operator
 * redaktələri `center:edit`/`center:create` kimi yazılır, aktyor `adminId`
 * ilə seçilir. (Sahibin öz redaktəsi bura düşmür — onu `User.lastLoginAt`,
 * qoyulmuş qiymət, plan və s. göstərir.)
 */

export const CENTER_WRITE_ACTIONS = ["center:edit", "center:create"] as const;

/** Operator ("Nərmin") istifadəçisinin id-si — yoxdursa null. */
export async function getOperatorUserId(): Promise<string | null> {
  const u = await prisma.user
    .findUnique({ where: { phone: OPERATOR_PHONE }, select: { id: true } })
    .catch(() => null);
  return u?.id ?? null;
}

export type CenterEditInfo = {
  /** neçə dəfə redaktə olunub */ count: number;
  /** son redaktə vaxtı */ lastAt: Date;
  /** redaktə edənlərin telefonları (operator sentineli daxil) */ editors: string[];
};

/**
 * Verilmiş aktyorun (adminId) toxunduğu mərkəz id-ləri.
 * `actorId` null olarsa boş dəst qaytarır.
 */
export async function centerIdsEditedBy(actorId: string | null): Promise<Set<string>> {
  if (!actorId) return new Set();
  const rows = await prisma.adminActionLog
    .findMany({
      where: { adminId: actorId, action: { in: [...CENTER_WRITE_ACTIONS] }, targetType: "CenterProfile" },
      select: { targetId: true },
      distinct: ["targetId"],
    })
    .catch(() => []);
  return new Set(rows.map((r) => r.targetId).filter((id): id is string => !!id));
}

/** Nərmin-in (operator) redaktə etdiyi mərkəz id-ləri. */
export async function centerIdsEditedByOperator(): Promise<Set<string>> {
  return centerIdsEditedBy(await getOperatorUserId());
}

/** Bütün mərkəzlər üzrə "kim, neçə dəfə, nə vaxt redaktə etdi" xəritəsi. */
export async function centerEditMap(): Promise<Map<string, CenterEditInfo>> {
  const rows = await prisma.adminActionLog
    .findMany({
      where: { action: { in: [...CENTER_WRITE_ACTIONS] }, targetType: "CenterProfile" },
      select: { targetId: true, createdAt: true, admin: { select: { phone: true } } },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const map = new Map<string, CenterEditInfo>();
  for (const r of rows) {
    if (!r.targetId) continue;
    const cur = map.get(r.targetId);
    const phone = r.admin?.phone ?? "—";
    if (!cur) {
      map.set(r.targetId, { count: 1, lastAt: r.createdAt, editors: [phone] });
    } else {
      cur.count++;
      if (!cur.editors.includes(phone)) cur.editors.push(phone);
    }
  }
  return map;
}
