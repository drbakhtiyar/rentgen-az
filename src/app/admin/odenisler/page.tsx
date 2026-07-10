import type { Metadata } from "next";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Panel, StatCard } from "@/components/dashboard/widgets";
import { requireRole } from "@/lib/auth/rbac";
import { getAdminPayments, getPaymentSummary, type PaymentFilters } from "@/lib/queries";
import { formatManat } from "@/lib/plans";
import { formatDateTimeAz, doctorName } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Ödənişlər",
  path: "/admin/odenisler",
  noIndex: true,
});

const PURPOSE_LABEL: Record<string, string> = {
  wallet_topup: "Balans artırma",
  test: "Test",
};

const STATUS_TONE: Record<string, string> = {
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-100",
  FAILED: "bg-red-50 text-red-700 ring-red-100",
  REFUNDED: "bg-slate-100 text-slate-600 ring-slate-200",
};

function parseDate(v?: string): Date | undefined {
  if (!v) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; purpose?: string; q?: string; from?: string; to?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/odenisler");
  const sp = await searchParams;
  const filters: PaymentFilters = {
    status: sp.status || undefined,
    purpose: sp.purpose || undefined,
    q: sp.q?.trim() || undefined,
    from: parseDate(sp.from),
    to: parseDate(sp.to),
  };

  const [payments, summary] = await Promise.all([
    getAdminPayments(filters),
    getPaymentSummary(),
  ]);

  const roleLabel = (r: string) =>
    r === "CENTER" ? "Mərkəz" : r === "DOCTOR" ? "Həkim" : r === "PATIENT" ? "Pasiyent" : r;

  return (
    <AdminShell title="Ödənişlər" userName={admin.phone}>
      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Bu ay gəlir" value={formatManat(summary.monthPaid)} />
        <StatCard label="Ümumi gəlir" value={formatManat(summary.totalPaid)} tone="green" />
        <StatCard label="Gözləyən" value={summary.pending} tone="amber" />
        <StatCard label="Uğursuz" value={summary.failed} tone="cyan" />
      </div>

      <div className="mt-5">
        <Panel title="Filtr">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Status</span>
              <select name="status" defaultValue={sp.status ?? ""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                <option value="">Hamısı</option>
                <option value="PAID">PAID</option>
                <option value="PENDING">PENDING</option>
                <option value="FAILED">FAILED</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Məqsəd</span>
              <select name="purpose" defaultValue={sp.purpose ?? ""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm">
                <option value="">Hamısı</option>
                <option value="wallet_topup">Balans artırma</option>
                <option value="test">Test</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Tarixdən</span>
              <input type="date" name="from" defaultValue={sp.from ?? ""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Tarixə</span>
              <input type="date" name="to" defaultValue={sp.to ?? ""} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-600">Axtarış (ad / telefon)</span>
              <input name="q" defaultValue={sp.q ?? ""} placeholder="Ad və ya telefon" className="h-10 rounded-xl border border-slate-200 px-3 text-sm" />
            </label>
            <button type="submit" className="h-10 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">
              Filtrlə
            </button>
          </form>
        </Panel>
      </div>

      <div className="mt-5">
        <Panel title={`Ödənişlər (${payments.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">Tarix</th>
                  <th className="py-2 pr-3">İstifadəçi</th>
                  <th className="py-2 pr-3">Rol</th>
                  <th className="py-2 pr-3">Məqsəd</th>
                  <th className="py-2 pr-3">Məbləğ</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Order ID</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nəticə tapılmadı.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const u = p.user;
                    const name = u
                      ? u.centerProfile?.name ||
                        doctorName(u.doctorProfile?.firstName, u.doctorProfile?.lastName) ||
                        u.phone
                      : "—";
                    return (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="py-2.5 pr-3 text-slate-500">{formatDateTimeAz(p.createdAt)}</td>
                        <td className="py-2.5 pr-3 font-medium text-ink-900">{name}</td>
                        <td className="py-2.5 pr-3 text-slate-500">{u ? roleLabel(u.role) : "—"}</td>
                        <td className="py-2.5 pr-3 text-slate-600">{PURPOSE_LABEL[p.purpose] ?? p.purpose}</td>
                        <td className="py-2.5 pr-3 font-semibold text-ink-900">{formatManat(p.amount)}</td>
                        <td className="py-2.5 pr-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_TONE[p.status] ?? "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 font-mono text-xs text-slate-400">{p.payriffOrderId ?? "—"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}
