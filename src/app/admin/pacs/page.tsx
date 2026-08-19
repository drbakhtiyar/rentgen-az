import type { Metadata } from "next";
import Link from "next/link";
import { ScanLine, Layers, HardDrive, ExternalLink, Archive, Clock } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { StatCard, EmptyState, Panel } from "@/components/dashboard/widgets";
import { requireRole } from "@/lib/auth/rbac";
import { pacsConfigured, pacsOrthancConfigured, listPacsStudies, pacsStats, type PacsStudy } from "@/lib/pacs";
import { env } from "@/lib/env";
import { formatDateTimeAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "PACS",
  path: "/admin/pacs",
  noIndex: true,
});

const TTL_DAYS = 7;

function dicomDate(d: string | null): string {
  if (!d || d.length < 8) return "—";
  return `${d.slice(6, 8)}.${d.slice(4, 6)}.${d.slice(0, 4)}`;
}

function daysLeft(s: PacsStudy): number | null {
  if (!s.lastUpdate) return null;
  const ms = s.lastUpdate.getTime() + TTL_DAYS * 86400_000 - Date.now();
  return Math.max(0, Math.ceil(ms / 86400_000));
}

export default async function AdminPacsPage() {
  const admin = await requireRole("ADMIN", "/admin/pacs");

  let studies: PacsStudy[] = [];
  let stats: Awaited<ReturnType<typeof pacsStats>> = null;
  let error: string | null = null;
  if (pacsOrthancConfigured()) {
    try {
      [studies, stats] = await Promise.all([listPacsStudies(), pacsStats()]);
    } catch (e) {
      error = e instanceof Error ? e.message : "PACS əlçatmazdır";
    }
  }

  return (
    <AdminShell title="PACS" userName={admin.phone}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tədqiqatlar (keşdə)" value={stats ? stats.studies : "—"} icon={<ScanLine />} />
        <StatCard label="DICOM instansları" value={stats ? stats.instances : "—"} icon={<Layers />} tone="cyan" />
        <StatCard
          label="Disk"
          value={stats ? `${(stats.diskMb / 1024).toFixed(2)} GB` : "—"}
          icon={<HardDrive />}
          tone="slate"
        />
      </div>

      <Panel
        title="Görüntü arxivi — pacs.rentgen.az"
        className="mt-6"
        action={
          pacsConfigured() ? (
            <div className="flex gap-2">
              <Link
                href="/admin/pacs/ac?study=*"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                OHIF siyahısı <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <a
                href={`${env.pacs.url}/orthanc/ui/app/`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-semibold text-ink-900 hover:bg-slate-50"
              >
                Orthanc Explorer
              </a>
            </div>
          ) : null
        }
      >
        {!pacsConfigured() ? (
          <EmptyState
            icon={<ScanLine />}
            title="PACS qoşulmayıb"
            description="Vercel env-də PACS_SHARED_SECRET (və siyahı üçün PACS_ORTHANC_USER/PASS) təyin edilməlidir."
          />
        ) : !pacsOrthancConfigured() ? (
          <EmptyState
            icon={<ScanLine />}
            title="Siyahı üçün Orthanc açarı yoxdur"
            description="PACS_ORTHANC_USER / PACS_ORTHANC_PASS env-i əlavə edin. Açılış linkləri onsuz da işləyir."
          />
        ) : error ? (
          <EmptyState icon={<ScanLine />} title="PACS cavab vermir" description={error} />
        ) : studies.length === 0 ? (
          <EmptyState
            icon={<ScanLine />}
            title="Keşdə tədqiqat yoxdur"
            description={`Klinika gateway-indən gələn tədqiqatlar burada ${TTL_DAYS} gün qalır; «archive» etiketlilər daimidir.`}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Pasiyent</th>
                  <th className="py-2 pr-3">Tədqiqat</th>
                  <th className="py-2 pr-3">Tarix</th>
                  <th className="py-2 pr-3">Modallıq</th>
                  <th className="py-2 pr-3">Seriya / kadr</th>
                  <th className="py-2 pr-3">Gəlib</th>
                  <th className="py-2 pr-3">Saxlanma</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {studies.map((s) => {
                  const archived = s.labels.includes("archive");
                  const left = daysLeft(s);
                  return (
                    <tr key={s.id} className="border-b border-slate-50 align-top">
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold text-ink-900">{s.patientName}</div>
                        <div className="text-xs text-slate-500">
                          {s.patientId || "ID —"}
                          {s.birthDate ? ` · ${dicomDate(s.birthDate)}` : ""}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div>{s.description || "—"}</div>
                        <div className="max-w-[220px] truncate font-mono text-[11px] text-slate-400" title={s.studyUid}>
                          {s.studyUid}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">{dicomDate(s.studyDate)}</td>
                      <td className="py-2.5 pr-3">{s.modalities.join(", ") || "—"}</td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {s.seriesCount} / {s.instancesCount}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap text-slate-600">
                        {s.lastUpdate ? formatDateTimeAz(s.lastUpdate) : "—"}
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        {archived ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <Archive className="h-3 w-3" /> Arxiv
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <Clock className="h-3 w-3" /> {left == null ? "keş" : `${left} gün`}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          href={`/admin/pacs/ac?study=${encodeURIComponent(s.studyUid)}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                        >
                          Aç <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 text-xs text-slate-500">
        Model: klinika gateway-i → pacs.rentgen.az (Hetzner) → OHIF. Tədqiqatlar {TTL_DAYS} gün keşdə qalır
        (cron 04:00), «archive» etiketlilər silinmir. Açılış linkləri 5 dəqiqəlik imzalı tokendir; hər açılış
        jurnala yazılır (<code>pacs:open</code>).
      </p>
    </AdminShell>
  );
}
