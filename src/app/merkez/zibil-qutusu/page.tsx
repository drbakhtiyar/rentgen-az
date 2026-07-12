import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Trash2, ShieldCheck, ArrowUpRight } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { Panel } from "@/components/dashboard/widgets";
import { TrashList, type TrashItem } from "@/components/rentgen/trash-list";
import { prisma } from "@/lib/db";
import { getCenterTrash } from "@/lib/queries";
import { requireRole } from "@/lib/auth/rbac";
import { trashRetentionDays, PLAN_LABEL } from "@/lib/plans";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Zibil qutusu",
  path: "/merkez/zibil-qutusu",
  noIndex: true,
});

function retentionText(days: number): string {
  const months = Math.round(days / 30);
  return months <= 1 ? "1 ay" : `${months} ay`;
}

export default async function CenterTrashPage() {
  const user = await requireRole("CENTER", "/merkez/zibil-qutusu");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true, plan: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const days = trashRetentionDays(center.plan);

  // Plans without a trash bin (Free / Silver): show what the feature offers + upsell.
  if (days <= 0) {
    return (
      <DashboardShell
        title="Zibil qutusu"
        roleLabel="Rentgen mərkəzi"
        userName={center.name}
        nav={centerNav}
      >
        <Panel title="Zibil qutusu — Gold və Platinum imkanı">
          <div className="flex flex-col items-start gap-4">
            <p className="text-sm leading-relaxed text-slate-600">
              Hazırda <span className="font-semibold">{PLAN_LABEL[center.plan]}</span> paketindəsiniz.
              Bu paketdə silinən rentgen faylı <span className="font-semibold text-red-600">dərhal həmişəlik silinir</span> və
              bərpa oluna bilməz.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <p className="flex items-center gap-2 font-semibold text-amber-800">
                  <ShieldCheck className="h-4 w-4" /> Gold
                </p>
                <p className="mt-1 text-sm text-slate-600">Silinən fayllar <b>1 ay</b> zibil qutusunda saxlanılır və bərpa oluna bilər.</p>
              </div>
              <div className="rounded-xl border border-cyan-200 bg-cyan-50/50 p-4">
                <p className="flex items-center gap-2 font-semibold text-cyan-800">
                  <ShieldCheck className="h-4 w-4" /> Platinum
                </p>
                <p className="mt-1 text-sm text-slate-600">Silinən fayllar <b>3 ay</b> zibil qutusunda saxlanılır və bərpa oluna bilər.</p>
              </div>
            </div>
            <Link
              href="/merkez/paket"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Paketi yüksəlt <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </Panel>
      </DashboardShell>
    );
  }

  const trash = await getCenterTrash(center.id);
  const now = Date.now();
  const items: TrashItem[] = trash.map((f) => ({
    id: f.id,
    fileName: f.fileName,
    size: f.size,
    patientName: f.patientName,
    deletedAtLabel: formatDateAz(f.deletedAt),
    daysLeft: f.purgeAt
      ? Math.max(0, Math.ceil((f.purgeAt.getTime() - now) / 86_400_000))
      : null,
  }));

  return (
    <DashboardShell
      title="Zibil qutusu"
      roleLabel="Rentgen mərkəzi"
      userName={center.name}
      nav={centerNav}
    >
      <Panel
        title={
          <span className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-slate-400" /> Silinmiş fayllar
          </span>
        }
      >
        <p className="mb-3 text-sm text-slate-500">
          {PLAN_LABEL[center.plan]} paketində silinən fayllar{" "}
          <span className="font-semibold text-ink-800">{retentionText(days)}</span> zibil qutusunda saxlanılır.
          Bu müddət ərzində istənilən faylı bərpa edə bilərsiniz; müddət bitəndə fayl avtomatik həmişəlik silinir.
        </p>
        <TrashList items={items} />
      </Panel>
    </DashboardShell>
  );
}
