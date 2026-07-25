import type { Metadata } from "next";
import {
  Users,
  LogIn,
  Building2,
  BadgeCheck,
  Clock,
  Eye,
  Phone,
  Inbox,
  Info,
} from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { StatCard, Panel } from "@/components/dashboard/widgets";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";
import {
  getAccessAnalytics,
  type WindowDays,
  type LoginFunnel,
  type DiscoveryFunnel,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Analitika — giriş axınları",
  path: "/admin/analitika",
  noIndex: true,
});

const WINDOWS: { key: string; days: WindowDays; label: string }[] = [
  { key: "d7", days: 7, label: "Son 7 gün" },
  { key: "d30", days: 30, label: "Son 30 gün" },
  { key: "all", days: null, label: "Bütün dövr" },
];

const nf = new Intl.NumberFormat("az-AZ");
const num = (n: number) => nf.format(n);
const pct = (v: number | null) => (v == null ? "—" : `${v.toFixed(1)}%`);
const hours = (v: number | null) => {
  if (v == null) return "—";
  if (v < 1) return `${Math.round(v * 60)} dəq`;
  if (v < 48) return `${v.toFixed(1)} saat`;
  return `${(v / 24).toFixed(1)} gün`;
};

const ROLE_LABELS: Record<string, string> = {
  PATIENT: "Pasiyent",
  DOCTOR: "Həkim",
  CENTER: "Mərkəz",
  ASSISTANT: "Assistent",
};

/** Üç pəncərəli metrik cədvəli. */
function MetricTable({
  rows,
}: {
  rows: { label: string; hint?: string; values: string[]; strong?: boolean }[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500">
            <th className="pb-3 font-medium">Metrik</th>
            {WINDOWS.map((w) => (
              <th key={w.key} className="pb-3 pl-4 text-right font-medium tabular-nums">
                {w.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-slate-100">
              <td className="py-3 pr-4">
                <span className={r.strong ? "font-semibold text-ink-900" : "text-slate-700"}>
                  {r.label}
                </span>
                {r.hint && <p className="text-xs text-slate-400">{r.hint}</p>}
              </td>
              {r.values.map((v, i) => (
                <td
                  key={i}
                  className={`py-3 pl-4 text-right tabular-nums ${
                    r.strong ? "font-bold text-ink-900" : "text-ink-900"
                  }`}
                >
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AnalyticsPage() {
  const admin = await requireRole("ADMIN", "/admin/analitika");

  // Üç pəncərəni paralel yığ.
  const [w7, w30, wAll] = await Promise.all(WINDOWS.map((w) => getAccessAnalytics(w.days)));
  const byWindow = [w7, w30, wAll];

  const loginRows = (pick: (l: LoginFunnel) => string) => byWindow.map((b) => pick(b.login));
  const discRows = (pick: (d: DiscoveryFunnel) => string) => byWindow.map((b) => pick(b.discovery));

  // 30 günlük snapshot (kart başlıqları üçün)
  const s = w30;

  return (
    <AdminShell title="Analitika — giriş axınları" userName={admin.phone}>
      <p className="-mt-1 mb-5 max-w-3xl text-sm text-slate-500">
        rentgen.az giriş axınlarının ölçülməsi. Bütün rəqəmlər yalnız aqreqatdır — heç bir
        şəxsi (PII) və ya tibbi məlumat göstərilmir. Mövcud verilənlərdən hesablanır.
      </p>

      {/* Sürətli baxış — son 30 gün */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Giriş (30g)" value={num(s.login.logins)} icon={<LogIn />} />
        <StatCard
          label="Sorğu→giriş (30g)"
          value={pct(s.login.requestToLoginPct)}
          icon={<Users />}
          tone="cyan"
        />
        <StatCard
          label="Təsdiqlənmiş mərkəz"
          value={num(s.approval.approved)}
          icon={<BadgeCheck />}
          tone="green"
        />
        <StatCard
          label="Orta təsdiq"
          value={hours(s.approval.avgHours)}
          icon={<Clock />}
          tone="amber"
        />
        <StatCard label="Baxış (30g)" value={num(s.discovery.views)} icon={<Eye />} tone="slate" />
        <StatCard
          label="Müraciət (30g)"
          value={num(s.discovery.requests)}
          icon={<Inbox />}
          tone="cyan"
        />
      </div>

      {/* 1. Pasiyent OTP giriş funnel */}
      <div className="mt-6">
        <Panel title="1. Pasiyent OTP giriş funnel">
          <MetricTable
            rows={[
              {
                label: "OTP sorğusu (unikal nömrə)",
                hint: "OTP kodu istəmiş fərqli telefon nömrələri",
                values: loginRows((l) => num(l.otpPhones)),
              },
              {
                label: "OTP göndərildi",
                hint: "göndərilmiş kodların ümumi sayı (təkrarlar daxil)",
                values: loginRows((l) => num(l.otpSends)),
              },
              {
                label: "Uğurlu giriş (unikal istifadəçi)",
                hint: "ADMIN xaric — admin ayrı gizli link ilə girir",
                values: loginRows((l) => num(l.logins)),
              },
              {
                label: "Sorğu → giriş konversiyası",
                values: loginRows((l) => pct(l.requestToLoginPct)),
                strong: true,
              },
              {
                label: "Yeni pasiyent profili",
                values: loginRows((l) => num(l.newPatients)),
              },
            ]}
          />
        </Panel>
      </div>

      {/* Giriş — rol üzrə (son 30 gün) */}
      <div className="mt-5">
        <Panel title="Giriş edən istifadəçilər — rol üzrə (son 30 gün)">
          {s.loginsByRole.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {s.loginsByRole.map((r) => (
                <div
                  key={r.role}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3"
                >
                  <span className="text-sm text-slate-500">{ROLE_LABELS[r.role] ?? r.role}</span>
                  <span className="font-display text-xl font-bold text-ink-900">{num(r.count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">Bu dövrdə giriş yoxdur.</p>
          )}
        </Panel>
      </div>

      {/* 2. Mərkəz qeydiyyat → təsdiq */}
      <div className="mt-6">
        <Panel title="2. Mərkəz: qeydiyyat → təsdiq">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MiniStat icon={<Building2 />} label="Ümumi mərkəz" value={num(s.approval.total)} />
            <MiniStat
              icon={<BadgeCheck />}
              label="Təsdiqlənmiş"
              value={num(s.approval.approved)}
              tone="green"
            />
            <MiniStat
              icon={<Clock />}
              label="Gözləmədə"
              value={num(s.approval.pending)}
              tone="amber"
            />
            <MiniStat
              icon={<Building2 />}
              label="Deaktiv"
              value={num(s.approval.deactivated)}
              tone="slate"
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <MiniStat
              label="Təsdiqlənmə nisbəti"
              value={pct(s.approval.approvalRatePct)}
              hint="təsdiqlənmiş / ümumi"
            />
            <MiniStat
              label="Orta təsdiq müddəti"
              value={hours(s.approval.avgHours)}
              hint="qeydiyyat → ilk təsdiq"
            />
            <MiniStat
              label="Median təsdiq müddəti"
              value={hours(s.approval.medianHours)}
              hint="qeydiyyat → ilk təsdiq"
            />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Təsdiq müddəti admin jurnalındakı (AdminActionLog) ilk{" "}
            <code>center:APPROVED</code> hadisəsi ilə mərkəzin qeydiyyat tarixi arasında hesablanır.
          </p>
        </Panel>
      </div>

      {/* 3. Kəşf → əlaqə / booking */}
      <div className="mt-6">
        <Panel title="3. Mərkəz kəşfi → əlaqə / müraciət konversiyası">
          <MetricTable
            rows={[
              {
                label: "Mərkəz baxışı",
                hint: "mərkəz səhifəsi baxışları (CenterEvent: view)",
                values: discRows((d) => num(d.views)),
              },
              {
                label: "Əlaqə (zəng + WhatsApp)",
                values: discRows((d) => num(d.contacts)),
              },
              {
                label: "Baxış → əlaqə konversiyası",
                values: discRows((d) => pct(d.viewToContactPct)),
                strong: true,
              },
              {
                label: "Müraciət (booking)",
                values: discRows((d) => num(d.requests)),
              },
              {
                label: "Baxış → müraciət konversiyası",
                values: discRows((d) => pct(d.viewToRequestPct)),
                strong: true,
              },
              {
                label: "Tamamlanmış müraciət",
                hint: "status = COMPLETED",
                values: discRows((d) => num(d.completed)),
              },
            ]}
          />
        </Panel>
      </div>

      {/* Tərif və qeydlər */}
      <div className="mt-6">
        <Panel
          title={
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-400" /> Metrik tərifləri və qeydlər
            </span>
          }
        >
          <ul className="space-y-2 text-sm text-slate-600">
            <li>
              <b>Uğurlu giriş</b> — pəncərədə <code>lastLoginAt</code> yenilənən fərqli
              istifadəçilər. Dəyər üzərinə yazıldığı üçün bu "pəncərədə aktiv giriş edən" deməkdir,
              cəmi giriş sayı yox.
            </li>
            <li>
              <b>Aktiv mərkəz</b> = status <code>APPROVED</code>. <b>Müraciət (booking)</b> ={" "}
              istənilən statuslu <code>AppointmentRequest</code> sətri.
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <span>
                <b>Bilinən boşluq:</b> pasiyent <b>axtarış</b> addımı hələ event kimi yazılmır, ona
                görə funnel mərkəz <b>baxışından</b> başlayır. Tam "axtarış → mərkəz" konversiyası
                üçün axtarış instrumentləşdirilməlidir (Platforma mühəndisinə alt-tapşırıq açılıb).
              </span>
            </li>
            <li>
              Bütün rəqəmlər xam bazadan (Supabase Postgres) SQL ilə çarpaz yoxlanılıb. Sorğular{" "}
              <code>src/lib/analytics.ts</code> faylında versiyalanıb.
            </li>
          </ul>
        </Panel>
      </div>
    </AdminShell>
  );
}

function MiniStat({
  icon,
  label,
  value,
  hint,
  tone = "brand",
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "brand" | "green" | "amber" | "slate";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-50 text-brand-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        {icon && (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg [&>svg]:h-4 [&>svg]:w-4 ${tones[tone]}`}
          >
            {icon}
          </span>
        )}
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <p className="font-display mt-2 text-2xl font-bold text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </Card>
  );
}
