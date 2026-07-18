import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Phone, Stethoscope, CheckCircle2, CalendarDays } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { crmNav } from "@/components/dashboard/role-navs";
import { Panel, StatusBadge } from "@/components/dashboard/widgets";
import { RentgenFilesPanel } from "@/components/rentgen/rentgen-files-panel";
import { RequestStatusControl } from "@/app/merkez/request-status-control";
import { getActiveServices } from "@/lib/queries";
import { getCrmPatientDetail } from "@/lib/crm";
import { getFileDownloadLabels } from "@/lib/rentgen-status";
import { trashRetentionDays } from "@/lib/plans";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatDateTimeAz, formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getCrmDict } from "@/lib/i18n-crm";
import { requireCenter } from "../../_lib";
import { CrmUpsell } from "../../crm-upsell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "CRM — Pasiyent",
  path: "/crm/pasiyentler",
  noIndex: true,
});

export default async function CrmPatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { center } = await requireCenter("/crm/pasiyentler");
  if (center.plan !== "PLATINUM") return <CrmUpsell centerName={center.name} />;
  const t = getCrmDict(await getLocale());
  const { patientId } = await params;

  const [detail, services] = await Promise.all([
    getCrmPatientDetail(center.id, patientId),
    getActiveServices(),
  ]);
  if (!detail) notFound();

  const { patient, appts } = detail;
  const svcName = new Map(services.map((s) => [s.slug, s.name]));
  const downloadLabels = await getFileDownloadLabels(appts.flatMap((a) => a.files.map((f) => f.id)));
  const trashDays = trashRetentionDays(center.plan);
  const fullName = `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim() || "Pasiyent";

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNav} collapsible>
      <Link
        href="/crm/pasiyentler"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-brand-600"
      >
        <ChevronLeft className="h-4 w-4" /> {t.patients.backToList}
      </Link>

      {/* Patient header */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-ink-900">{fullName}</h1>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> {t.common.inSystem}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
          <a href={`tel:${patient.user?.phone ?? ""}`} className="inline-flex items-center gap-1 hover:text-brand-600">
            <Phone className="h-3.5 w-3.5" /> {formatPhoneDisplay(patient.user?.phone ?? "")}
          </a>
          {patient.city && <span>{patient.city}</span>}
          <span>{appts.length} {t.patients.visitWord}</span>
        </div>
      </div>

      <div className="space-y-4">
        {appts.map((a) => (
          <Panel
            key={a.id}
            title={
              <span className="flex flex-wrap items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-500" />
                {a.preferredDate ? formatDateTimeAz(a.preferredDate) : formatDateAz(a.createdAt)}
                {a.serviceSlug && (
                  <span className="text-sm font-normal text-slate-500">
                    · {svcName.get(a.serviceSlug) ?? a.serviceSlug}
                  </span>
                )}
                <StatusBadge status={a.status} />
                <RequestStatusControl id={a.id} status={a.status} />
              </span>
            }
          >
            {a.doctorName && (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <Stethoscope className="h-4 w-4 text-cyan-600" />
                <span className="text-slate-500">{t.patients.referringDoctor}</span>
                <span className="font-semibold text-ink-900">Dr. {a.doctorName}</span>
                {a.doctorPhone && (
                  <a href={`tel:${a.doctorPhone}`} className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                    <Phone className="h-3 w-3" /> {formatPhoneDisplay(a.doctorPhone)}
                  </a>
                )}
              </div>
            )}
            {a.note && <p className="mb-3 text-sm text-slate-600">{a.note}</p>}
            {/* Files only after the visit is completed — same rule as the center
                panel. Same RentgenFile store (by requestId), so uploads sync. */}
            {a.status === "COMPLETED" ? (
              <RentgenFilesPanel
                requestId={a.id}
                trashDays={trashDays}
                files={a.files.map((f) => ({ ...f, downloadNote: downloadLabels[f.id] }))}
              />
            ) : (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">
                {t.patients.fileGate}
              </p>
            )}
          </Panel>
        ))}
      </div>
    </DashboardShell>
  );
}
