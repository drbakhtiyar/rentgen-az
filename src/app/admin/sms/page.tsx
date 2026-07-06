import type { Metadata } from "next";
import { MessageSquare, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { StatCard, EmptyState, Panel } from "@/components/dashboard/widgets";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getSmsBalance } from "@/lib/sms";
import { formatDateTimeAz, cn } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "SMS",
  path: "/admin/sms",
  noIndex: true,
});

const KIND_LABEL: Record<string, string> = {
  otp: "OTP kodu",
  center_request: "Mərkəzə müraciət",
  patient_status: "Pasiyent statusu",
  other: "Digər",
};

export default async function AdminSmsPage() {
  const admin = await requireRole("ADMIN", "/admin/sms");

  let logs: Awaited<ReturnType<typeof prisma.smsLog.findMany>> = [];
  let sent24h = 0;
  try {
    [logs, sent24h] = await Promise.all([
      prisma.smsLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
      prisma.smsLog.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);
  } catch {
    /* keep empty */
  }
  const balance = await getSmsBalance();

  return (
    <AdminShell title="SMS" userName={admin.phone}>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="SMS balansı"
          value={balance == null ? "—" : `${balance}`}
          icon={<Wallet />}
          tone={balance != null && balance < 20 ? "amber" : undefined}
        />
        <StatCard label="Son 24 saat" value={sent24h} icon={<MessageSquare />} tone="cyan" />
        <StatCard label="Cəmi (son 200)" value={logs.length} icon={<MessageSquare />} tone="slate" />
      </div>

      {balance != null && balance < 20 && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Balans azdır ({balance} kredit). SMS-lərin dayanmaması üçün balansı artırın.
        </div>
      )}

      <div className="mt-5">
        <Panel title="Göndərilən SMS-lər">
          {logs.length > 0 ? (
            <div className="space-y-2">
              {logs.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-100 p-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                          s.ok
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-600",
                        )}
                      >
                        {s.ok ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        {s.ok ? "Göndərildi" : "Uğursuz"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {KIND_LABEL[s.kind] ?? s.kind}
                      </span>
                      <span className="text-sm font-semibold text-ink-900">
                        {formatPhoneDisplay(s.phone)}
                      </span>
                    </div>
                    <p className="mt-1 break-words text-sm text-slate-600">{s.text}</p>
                    {s.error && (
                      <p className="mt-0.5 text-xs text-red-500">Xəta: {s.error}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {formatDateTimeAz(s.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MessageSquare />}
              title="Hələ SMS göndərilməyib"
              description="Göndərilən bütün SMS-lər (OTP, bildirişlər) burada görünəcək."
            />
          )}
        </Panel>
      </div>
    </AdminShell>
  );
}
