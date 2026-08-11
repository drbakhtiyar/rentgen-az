import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ExternalLink } from "lucide-react";
import { OperatorShell } from "@/components/operator/operator-shell";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { OPERATOR_NAME } from "@/lib/auth/operator";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Məlumat bildirişləri",
  path: "/panel",
  noIndex: true,
});

/** Məlumat bildirişləri — operator üçün YALNIZ BAXIŞ (həll etmə düyməsi yoxdur,
 *  status dəyişikliyi yalnız admin /admin/duzelisler-də). */
export default async function PanelContentReportsPage() {
  const user = await requireRole(["OPERATOR", "ADMIN"], "/panel");

  let reports: Array<{
    id: string;
    name: string | null;
    email: string | null;
    message: string;
    resolved: boolean;
    createdAt: Date;
    center: { name: string; slug: string } | null;
  }> = [];
  try {
    reports = await prisma.contentReport.findMany({
      orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
      take: 200,
      include: { center: { select: { name: true, slug: true } } },
    });
  } catch {
    reports = [];
  }

  const open = reports.filter((r) => !r.resolved);

  return (
    <OperatorShell
      title="Məlumat bildirişləri"
      userName={user.role === "OPERATOR" ? OPERATOR_NAME : "Administrator"}
      showNew={false}
    >
      <Panel title={`«Məlumat düzgün deyil?» bildirişləri (${open.length} açıq) — yalnız baxış`}>
        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((r) => (
              <div
                key={r.id}
                className={`rounded-xl border p-4 ${
                  r.resolved ? "border-slate-100 bg-slate-50/50" : "border-amber-200 bg-amber-50/40"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.center ? (
                        <Link
                          href={`/rentgen-merkezleri/${r.center.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 font-semibold text-ink-900 hover:text-brand-600"
                        >
                          {r.center.name} <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="font-semibold text-slate-500">(mərkəz silinib)</span>
                      )}
                      {r.resolved ? (
                        <Badge tone="green">Həll olunub</Badge>
                      ) : (
                        <Badge tone="amber">Açıq</Badge>
                      )}
                    </div>
                    <p className="mt-1.5 whitespace-pre-line text-sm text-ink-800">{r.message}</p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {[r.name, r.email].filter(Boolean).join(" · ") || "anonim"} ·{" "}
                      {formatDateAz(r.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<AlertCircle />}
            title="Bildiriş yoxdur"
            description="Pasiyentlər mərkəz FAQ-larında məlumat yanlışlığı bildirəndə burada görünəcək."
          />
        )}
      </Panel>
    </OperatorShell>
  );
}
