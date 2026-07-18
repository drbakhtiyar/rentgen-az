import type { Metadata } from "next";
import { Clock, ListChecks, ExternalLink, CalendarOff } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { crmNav } from "@/components/dashboard/role-navs";
import { Panel } from "@/components/dashboard/widgets";
import { parseHours, formatHoursSummary, DAY_KEYS } from "@/lib/hours";
import { getCenterHolidays } from "@/lib/crm";
import { buildMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getCrmDict } from "@/lib/i18n-crm";
import { requireCenter } from "../_lib";
import { CrmUpsell } from "../crm-upsell";
import { SlotSettingsForm } from "../slot-settings-form";
import { HolidaysManager } from "../holidays-manager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "CRM — Ayarlar", path: "/crm/ayarlar", noIndex: true });

export default async function CrmSettingsPage() {
  const { center } = await requireCenter("/crm/ayarlar");
  if (center.plan !== "PLATINUM") return <CrmUpsell centerName={center.name} />;
  const t = getCrmDict(await getLocale());
  const week = parseHours(center.hours);
  const hoursSummary = formatHoursSummary(week);
  const openDays = DAY_KEYS.filter((k) => week?.[k]); // only working weekdays
  const holidays = await getCenterHolidays(center.id);

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNav} collapsible>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">{t.settings.title}</h1>

      <div className="space-y-6">
        <Panel title={t.settings.slotTitle}>
          <SlotSettingsForm
            enabled={center.slotBookingEnabled}
            slotMinutes={center.slotMinutes}
            slotCapacity={center.slotCapacity}
            lunchStart={center.lunchStart}
            lunchEnd={center.lunchEnd}
            lunchDays={center.lunchDays}
            openDays={openDays}
            remindersEnabled={center.remindersEnabled}
            reminderHours={center.reminderHours}
          />
        </Panel>

        <Panel title={t.settings.holidaysTitle}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <CalendarOff className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <HolidaysManager initial={holidays} />
            </div>
          </div>
        </Panel>

        <Panel title={t.settings.hoursTitle}>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Clock className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="text-slate-600">
                {t.settings.hoursBody}
              </p>
              <p className="mt-1 font-semibold text-ink-900">
                {hoursSummary || t.settings.hoursNone}
              </p>
              <a
                href="https://rentgen.az/merkez/profil"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
              >
                {t.settings.hoursEdit} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </Panel>

        <Panel title={t.settings.durTitle}>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
              <ListChecks className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="text-slate-600">
                {t.settings.durBody}
              </p>
              <a
                href="https://rentgen.az/merkez/xidmetler"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline"
              >
                {t.settings.durEdit} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  );
}
