import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Download, Lock, ArrowUpRight } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { Panel } from "@/components/dashboard/widgets";
import { ApiKeyPanel } from "@/components/dashboard/api-key-panel";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { centerLimits } from "@/lib/plans";
import { SITE_URL } from "@/lib/env";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Export / API",
  path: "/merkez/export",
  noIndex: true,
});

export default async function CenterExportPage() {
  const user = await requireRole("CENTER", "/merkez/export");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { name: true, plan: true, apiKey: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const allowed = centerLimits(center.plan).apiExport;
  const pd = getPanelDict(await getLocale());

  return (
    <DashboardShell title={pd.nav.export} roleLabel={pd.center.roleLabel} userName={center.name} nav={centerNav}>
      {!allowed ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">{pd.center.expLockTitle}</p>
              <p className="text-xs text-slate-500">{pd.center.expLockBody}</p>
            </div>
          </div>
          <Link href="/merkez/paket" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            {pd.center.toPlatinum} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          <Panel title={pd.center.expCsvTitle}>
            <p className="mb-4 text-sm text-slate-600">
              {pd.center.expCsvBody}
            </p>
            <a
              href="/api/merkez/export"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-900 px-5 text-sm font-semibold text-white hover:bg-ink-800"
            >
              <Download className="h-4 w-4" /> {pd.center.expCsvBtn}
            </a>
          </Panel>

          <Panel title={pd.center.expApiTitle}>
            <p className="mb-4 text-sm text-slate-600">
              {pd.center.expApiBody}
            </p>
            <code className="mb-4 block overflow-x-auto rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-700">
              GET {SITE_URL}/api/v1/requests — header: Authorization: Bearer &lt;açar&gt;
            </code>
            <ApiKeyPanel initialKey={center.apiKey} />
          </Panel>
        </div>
      )}
    </DashboardShell>
  );
}
