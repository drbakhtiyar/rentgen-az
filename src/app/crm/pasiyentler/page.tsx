import type { Metadata } from "next";
import Link from "next/link";
import { Users, Phone, CheckCircle2, Clock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { Panel, EmptyState } from "@/components/dashboard/widgets";
import { getActiveServices } from "@/lib/queries";
import { getCenterPatients } from "@/lib/crm";
import { bakuTodayYmd } from "@/lib/hours";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getCrmDict } from "@/lib/i18n-crm";
import { requireCenter, crmNavFor } from "../_lib";
import { CrmUpsell } from "../crm-upsell";
import { ManualAppointmentForm } from "../manual-appointment-form";
import { RecallButton } from "../recall-button";
import { InviteButton } from "../invite-button";

const LAPSED_DAYS = 90; // no visit for 3 months → suggest a re-call

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "CRM — Pasiyentlər",
  path: "/crm/pasiyentler",
  noIndex: true,
});

export default async function CrmPatientsPage() {
  const { center, isOwner } = await requireCenter("/crm/pasiyentler");
  if (center.plan !== "PLATINUM") return <CrmUpsell centerName={center.name} />;
  const t = getCrmDict(await getLocale());
  const [patients, services] = await Promise.all([
    getCenterPatients(center.id),
    getActiveServices(),
  ]);

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNavFor(isOwner)} collapsible>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900">{t.patients.title}</h1>
          <p className="text-sm text-slate-500">{patients.length} {t.patients.countWord}</p>
        </div>
        <ManualAppointmentForm
          services={services.map((s) => ({ slug: s.slug, name: s.name }))}
          defaultYmd={bakuTodayYmd()}
        />
      </div>

      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        {t.patients.note}
      </div>

      <Panel title={t.patients.baseTitle}>
        {patients.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title={t.patients.emptyTitle}
            description={t.patients.emptyDesc}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400">
                  <th className="pb-2 pr-3">{t.patients.thName}</th>
                  <th className="pb-2 pr-3">{t.patients.thPhone}</th>
                  <th className="pb-2 pr-3">{t.patients.thVisits}</th>
                  <th className="pb-2 pr-3">{t.patients.thLast}</th>
                  <th className="pb-2 pr-3">{t.patients.thNext}</th>
                  <th className="pb-2 pr-3">{t.patients.thStatus}</th>
                  <th className="pb-2">{t.patients.thSms}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {patients.map((p) => (
                  <tr key={p.key}>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        {p.patientId ? (
                          <Link
                            href={`/crm/pasiyentler/${p.patientId}`}
                            className="font-semibold text-ink-900 hover:text-brand-600 hover:underline"
                          >
                            {p.name}
                          </Link>
                        ) : (
                          <span className="font-semibold text-ink-900">{p.name}</span>
                        )}
                        {p.patientId ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <CheckCircle2 className="h-2.5 w-2.5" /> {t.common.inSystem}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                            {t.common.notInSystem}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">
                      <a href={`tel:${p.phone}`} className="inline-flex items-center gap-1 hover:text-brand-600">
                        <Phone className="h-3 w-3" /> {formatPhoneDisplay(p.phone)}
                      </a>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-600">{p.visits}</td>
                    <td className="py-2.5 pr-3 text-slate-500">
                      {p.lastVisit ? formatDateAz(p.lastVisit) : "—"}
                      {p.lastVisit &&
                        !p.nextVisit &&
                        Date.now() - p.lastVisit.getTime() > LAPSED_DAYS * 86400000 && (
                          <span className="ml-1.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                            {t.patients.lapsed}
                          </span>
                        )}
                    </td>
                    <td className="py-2.5 pr-3">
                      {p.nextVisit ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-cyan-700">
                          <Clock className="h-3 w-3" /> {formatDateAz(p.nextVisit)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-slate-500">{p.lastStatus}</td>
                    <td className="py-2.5">
                      {p.patientId ? (
                        <RecallButton phone={p.phone} name={p.name} />
                      ) : (
                        <InviteButton phone={p.phone} name={p.name} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </DashboardShell>
  );
}
