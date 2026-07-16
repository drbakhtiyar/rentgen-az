import type { Metadata } from "next";
import { Clock, ListChecks, ExternalLink } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { crmNav } from "@/components/dashboard/role-navs";
import { Panel } from "@/components/dashboard/widgets";
import { parseHours, formatHoursSummary } from "@/lib/hours";
import { buildMetadata } from "@/lib/seo";
import { requireCenter } from "../_lib";
import { SlotSettingsForm } from "../slot-settings-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "CRM — Ayarlar", path: "/crm/ayarlar", noIndex: true });

export default async function CrmSettingsPage() {
  const { center } = await requireCenter("/crm/ayarlar");
  const hoursSummary = formatHoursSummary(parseHours(center.hours));

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNav}>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">Ayarlar</h1>

      <div className="space-y-6">
        <Panel title="Slot rezervasiyası">
          <SlotSettingsForm
            enabled={center.slotBookingEnabled}
            slotMinutes={center.slotMinutes}
            slotCapacity={center.slotCapacity}
          />
        </Panel>

        <Panel title="İş saatları">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Clock className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="text-slate-600">
                Cədvəl mərkəzin profilindəki iş günləri və saatlarına əsaslanır.
              </p>
              <p className="mt-1 font-semibold text-ink-900">
                {hoursSummary || "İş saatları təyin edilməyib"}
              </p>
              <a
                href="https://rentgen.az/merkez/profil"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
              >
                Profildə iş saatlarını dəyiş <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </Panel>

        <Panel title="Xidmət müddətləri">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
              <ListChecks className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="text-slate-600">
                Hər xidmətin göstərilmə müddəti randevunun cədvəldə nə qədər vaxt tutacağını təyin
                edir. Müddətləri xidmətlərin qiymətləri ilə birlikdə mərkəz panelində təyin edin.
              </p>
              <a
                href="https://rentgen.az/merkez/xidmetler"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
              >
                Xidmət və müddətləri idarə et <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
