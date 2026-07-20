import type { Metadata } from "next";
import { UserCog, Building2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { getRecentActivity } from "@/lib/crm-activity";
import { formatDateAz } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { getCrmDict } from "@/lib/i18n-crm";
import { buildMetadata } from "@/lib/seo";
import { requireCenter, crmNavFor } from "../_lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "CRM — Jurnal", path: "/crm/jurnal", noIndex: true });

const ACTION_AZ: Record<string, string> = {
  create: "Yeni qəbul yaratdı",
  update: "Randevunu redaktə etdi",
  reschedule: "Vaxtı dəyişdi",
  delete: "Randevunu sildi",
  status: "Statusu dəyişdi",
  recall: "Təkrar çağırış göndərdi",
  invite: "Sistemə dəvət göndərdi",
};
const ACTION_RU: Record<string, string> = {
  create: "Создал(а) запись",
  update: "Отредактировал(а) запись",
  reschedule: "Изменил(а) время",
  delete: "Удалил(а) запись",
  status: "Изменил(а) статус",
  recall: "Отправил(а) повторный вызов",
  invite: "Отправил(а) приглашение",
};

/** Owner-only CRM activity log — who (owner/assistant) did what, when. */
export default async function CrmActivityPage() {
  const { center, isOwner } = await requireCenter("/crm/jurnal");
  const locale = await getLocale();
  const pd = getPanelDict(locale);
  const t = getCrmDict(locale);
  const ru = locale === "ru";
  const actionLabel = ru ? ACTION_RU : ACTION_AZ;
  const ownerWord = ru ? "Владелец" : "Sahib";

  if (!isOwner) {
    return (
      <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNavFor(false)} collapsible>
        <h1 className="mb-6 font-display text-2xl font-bold text-ink-900">{pd.nav.crmActivity}</h1>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          {t.assistants.ownerOnly}
        </div>
      </DashboardShell>
    );
  }

  const rows = await getRecentActivity(center.id, 150);

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNavFor(true)} collapsible>
      <h1 className="mb-1 font-display text-2xl font-bold text-ink-900">{pd.nav.crmActivity}</h1>
      <p className="mb-5 text-sm text-slate-500">
        {ru
          ? "Кто из сотрудников что изменил в CRM."
          : "CRM-də hansı əməkdaşın nə etdiyi — sahib və asistentlərin fəaliyyəti."}
      </p>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          {ru ? "Пока нет активности." : "Hələ fəaliyyət yoxdur."}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {rows.map((r) => (
            <li key={r.id} className="flex items-start gap-3 px-4 py-3">
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  r.isAssistant ? "bg-violet-50 text-violet-600" : "bg-brand-50 text-brand-600"
                }`}
              >
                {r.isAssistant ? <UserCog className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink-900">
                  <span className="font-semibold">{r.isAssistant ? r.actorName || t.assistants.title : ownerWord}</span>
                  {r.isAssistant && (
                    <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                      {pd.shell.assistantWord}
                    </span>
                  )}{" "}
                  <span className="text-slate-600">— {actionLabel[r.action] ?? r.action}</span>
                </p>
                {r.detail && <p className="truncate text-xs text-slate-500">{r.detail}</p>}
              </div>
              <span className="shrink-0 text-xs text-slate-400">{formatDateAz(r.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
