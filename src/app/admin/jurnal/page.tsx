import type { Metadata } from "next";
import { History } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Panel, EmptyState } from "@/components/dashboard/widgets";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

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
  "user:block": "İstifadəçi bloklandı",
  "user:unblock": "İstifadəçi bloku götürüldü",
  "blog:create": "Məqalə yaradıldı",
  "blog:update": "Məqalə yeniləndi",
  "blog:delete": "Məqalə silindi",
};

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
                      log.admin?.phone ?? "—",
                      log.targetType,
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
