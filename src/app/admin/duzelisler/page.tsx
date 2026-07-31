import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Check, RotateCcw, ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { resolveContentReportAction } from "@/app/admin/actions";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Məlumat bildirişləri",
  path: "/admin/duzelisler",
  noIndex: true,
});

export default async function AdminContentReportsPage() {
  const admin = await requireRole("ADMIN", "/admin/duzelisler");

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
    <AdminShell title="Məlumat bildirişləri" userName={admin.phone}>
      <Panel title={`«Məlumat düzgün deyil?» bildirişləri (${open.length} açıq)`}>
        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.map((r) => {
              async function toggle() {
                "use server";
                await resolveContentReportAction(r.id, !r.resolved);
              }
              return (
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
                    <form action={toggle}>
                      <button
                        type="submit"
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
                          r.resolved
                            ? "border border-slate-200 text-slate-600 hover:bg-slate-100"
                            : "bg-brand-600 text-white hover:bg-brand-700"
                        }`}
                      >
                        {r.resolved ? (
                          <>
                            <RotateCcw className="h-4 w-4" /> Yenidən aç
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" /> Həll olundu
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<AlertCircle />}
            title="Bildiriş yoxdur"
            description="Pasiyentlər mərkəz FAQ-larında məlumat yanlışlığı bildirəndə burada görünəcək."
          />
        )}
      </Panel>
    </AdminShell>
  );
}
