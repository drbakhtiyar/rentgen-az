import type { Metadata } from "next";
import { History } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Panel, EmptyState } from "@/components/dashboard/widgets";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import { OPERATOR_NAME, OPERATOR_PHONE } from "@/lib/auth/operator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Jurnal",
  path: "/admin/jurnal",
  noIndex: true,
});

const ACTION_LABELS: Record<string, string> = {
  "center:APPROVED": "Mərkəz təsdiqləndi",
  "center:DEACTIVATED": "Mərkəz deaktiv edildi",
  "center:PENDING": "Mərkəz gözləməyə qaytarıldı",
  "center:create": "Mərkəz yaradıldı",
  "center:edit": "Mərkəz redaktə edildi",
  "center:delete": "Mərkəz silindi",
  "user:block": "İstifadəçi bloklandı",
  "user:unblock": "İstifadəçi bloku götürüldü",
  "blog:create": "Məqalə yaradıldı",
  "blog:update": "Məqalə yeniləndi",
  "blog:delete": "Məqalə silindi",
  "center:wa_price_invite": "WhatsApp qiymət dəvəti göndərildi",
  "center:wa_faq_invite": "WhatsApp FAQ dəvəti göndərildi",
  "center:wa_card_invite": "WhatsApp kart dəvəti göndərildi",
  "center:wa_cabinet_invite": "WhatsApp kabinet dəvəti göndərildi",
  "center:price_self": "Mərkəz öz qiymətlərini yazdı",
  "center:faq_self": "Mərkəz öz FAQ cavablarını yazdı",
  "center:card_self": "Mərkəz kartını özü yenilədi",
};

/** Admin hesabı placeholder nömrə ilə yaradılıb (ADMIN_PHONE env yox idi;
 *  real nömrə pasiyent hesabı ilə toqquşardı) — jurnalda ad göstəririk. */
const ADMIN_PLACEHOLDER_PHONE = "+994500000000";

/** Operator sentinel nömrəsi jurnalda oxunaqlı ad kimi görünsün. */
function actorLabel(phone: string | null | undefined): string {
  if (!phone) return "mərkəz özü (linklə)";
  if (phone === OPERATOR_PHONE) return `${OPERATOR_NAME} (operator)`;
  if (phone === ADMIN_PLACEHOLDER_PHONE) return "Administrator";
  return phone;
}

async function getLogs() {
  try {
    return await prisma.adminActionLog.findMany({
      include: { admin: { select: { phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch {
    return [];
  }
}

export default async function AdminJurnalPage() {
  const admin = await requireRole("ADMIN", "/admin/jurnal");
  const logs = await getLogs();

  // Hədəf mərkəzlərin adları — "CenterProfile" əvəzinə oxunaqlı ad göstərmək üçün
  const centerIds = [
    ...new Set(
      logs
        .filter((l) => l.targetType === "CenterProfile" && l.targetId)
        .map((l) => l.targetId as string),
    ),
  ];
  const centers = centerIds.length
    ? await prisma.centerProfile
        .findMany({ where: { id: { in: centerIds } }, select: { id: true, name: true } })
        .catch(() => [])
    : [];
  const centerName = new Map(centers.map((c) => [c.id, c.name]));

  return (
    <AdminShell title="Jurnal" userName={admin.phone}>
      <Panel title="Əməliyyat jurnalı">
        {logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[
                      actorLabel(log.admin?.phone),
                      (log.targetId && centerName.get(log.targetId)) || log.targetType,
                      formatDateAz(log.createdAt),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<History />}
            title="Hələ qeyd yoxdur"
            description="Admin əməliyyatları (təsdiq, blok və s.) burada görünəcək."
          />
        )}
      </Panel>
    </AdminShell>
  );
}
