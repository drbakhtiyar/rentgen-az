import type { Metadata } from "next";
import { MessageSquare, Send, TrendingUp, AlertCircle, Gift, ShoppingCart } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { crmNav } from "@/components/dashboard/role-navs";
import { StatCard, Panel } from "@/components/dashboard/widgets";
import { getCenterSmsStats, SMS_PACKAGES, ADMIN_SMS_RESERVE, CENTER_SMS_WARN_AT } from "@/lib/center-sms";
import { getSmsBalance } from "@/lib/sms";
import { getBalance } from "@/lib/wallet";
import { getCenterPatients } from "@/lib/crm";
import { formatPhoneDisplay } from "@/lib/phone";
import { formatDateTimeAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";
import { requireCenter } from "../_lib";
import { CrmUpsell } from "../crm-upsell";
import { SmsOrderPanel } from "../sms-order-panel";
import { CampaignPanel } from "../campaign-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "CRM — SMS-lər", path: "/crm/sms", noIndex: true });

const KIND_LABELS: Record<string, string> = {
  reminder: "Xatırlatma / Çağırış",
  campaign: "Kampaniya",
  other: "Dəvət / Digər",
  center_request: "Randevu bildirişi",
  patient_status: "Status bildirişi",
};

const LAPSED_DAYS = 90;

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Gözləyir", cls: "bg-amber-50 text-amber-700" },
  PAID: { label: "Ödənilib", cls: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Ləğv edilib", cls: "bg-slate-100 text-slate-500" },
};

export default async function CrmSmsPage() {
  const { center } = await requireCenter("/crm/sms");
  if (center.plan !== "PLATINUM") return <CrmUpsell centerName={center.name} />;
  const [stats, patients, walletBalance, pool] = await Promise.all([
    getCenterSmsStats(center.id),
    getCenterPatients(center.id),
    getBalance(center.userId),
    getSmsBalance(),
  ]);
  const maxBuyable = pool != null ? Math.max(0, pool - ADMIN_SMS_RESERVE) : null;
  const now = Date.now();
  const audienceCounts = {
    all: patients.length,
    lapsed: patients.filter(
      (p) => p.lastVisit && !p.nextVisit && now - p.lastVisit.getTime() > LAPSED_DAYS * 86400000,
    ).length,
    insystem: patients.filter((p) => p.patientId).length,
  };

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNav} collapsible>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900">SMS-lər</h1>
        <p className="text-sm text-slate-500">
          Xatırlatma, çağırış və dəvət SMS-ləri balansınızdan gedir · göndərən adı:{" "}
          <span className="font-semibold text-ink-900">rentgen.az</span>
        </p>
      </div>

      {stats.balance <= CENTER_SMS_WARN_AT && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {stats.balance === 0
              ? "SMS balansınız bitib — xatırlatma və çağırış SMS-ləri göndərilmir. Paket alın."
              : `SMS balansınız azalır (${stats.balance} qalıb). Fasiləsiz işləmək üçün yeni paket alın.`}
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Qalıq balans" value={stats.balance} icon={<MessageSquare />} tone={stats.balance <= CENTER_SMS_WARN_AT ? "amber" : "brand"} />
        <StatCard label="Bu ay göndərilən" value={stats.sentMonth} icon={<Send />} tone="cyan" />
        <StatCard label="Ümumi göndərilən" value={stats.sentTotal} icon={<TrendingUp />} tone="green" />
      </div>

      <div className="mt-6">
        <Panel title="Kampaniya (toplu SMS)">
          <CampaignPanel counts={audienceCounts} balance={stats.balance} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="SMS paketi al">
          <SmsOrderPanel packages={SMS_PACKAGES} walletBalanceMinor={walletBalance} maxBuyable={maxBuyable} />
          <p className="mt-3 text-xs text-slate-400">
            Ödəniş balansınızdan çıxılır və SMS-lər dərhal yüklənir. Balansı Paket / Balans
            səhifəsindən (Payriff ilə) artıra bilərsiniz.
          </p>
        </Panel>

        <Panel title="Balans tarixçəsi">
          {stats.credits.length === 0 && stats.orders.length === 0 ? (
            <p className="text-sm text-slate-400">Hələ əməliyyat yoxdur.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {stats.orders
                .filter((o) => o.status !== "PAID") // paid orders show as credits below
                .map((o) => (
                  <li key={o.id} className="flex items-center gap-2 py-2">
                    <ShoppingCart className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="text-ink-900">{o.qty} SMS paketi · {o.price} ₼</span>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${ORDER_STATUS[o.status]?.cls ?? ""}`}>
                      {ORDER_STATUS[o.status]?.label ?? o.status}
                    </span>
                  </li>
                ))}
              {stats.credits.map((c) => (
                <li key={c.id} className="flex items-center gap-2 py-2">
                  {c.kind === "GRANT" ? (
                    <Gift className="h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 shrink-0 text-brand-500" />
                  )}
                  <span className="text-ink-900">
                    +{c.amount} SMS {c.kind === "GRANT" ? "· hədiyyə" : "· alış"}
                    {c.note ? <span className="text-slate-400"> — {c.note}</span> : null}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">{formatDateTimeAz(c.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Göndərilən SMS-lər (son 50)">
          {stats.recent.length === 0 ? (
            <p className="text-sm text-slate-400">Hələ SMS göndərilməyib.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-400">
                    <th className="pb-2 pr-3">Tarix</th>
                    <th className="pb-2 pr-3">Nömrə</th>
                    <th className="pb-2 pr-3">Növ</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.recent.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 pr-3 text-slate-500">{formatDateTimeAz(m.createdAt)}</td>
                      <td className="py-2 pr-3 text-ink-900">{formatPhoneDisplay(m.phone)}</td>
                      <td className="py-2 pr-3 text-slate-600">{KIND_LABELS[m.kind] ?? m.kind}</td>
                      <td className="py-2">
                        {m.ok ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            Göndərildi
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            Alınmadı
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}
