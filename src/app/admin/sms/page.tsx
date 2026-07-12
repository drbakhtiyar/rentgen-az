import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  MessageSquare,
  Wallet,
  CheckCircle2,
  XCircle,
  User,
  Building2,
  Stethoscope,
  Shield,
  HelpCircle,
} from "lucide-react";
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

type Role = "PATIENT" | "CENTER" | "DOCTOR" | "ADMIN";

const ROLE_META: Record<
  Role,
  { label: string; icon: ReactNode; className: string }
> = {
  PATIENT: {
    label: "Pasiyent",
    icon: <User className="h-3.5 w-3.5" />,
    className: "bg-cyan-50 text-cyan-700",
  },
  CENTER: {
    label: "Mərkəz",
    icon: <Building2 className="h-3.5 w-3.5" />,
    className: "bg-brand-50 text-brand-700",
  },
  DOCTOR: {
    label: "Həkim",
    icon: <Stethoscope className="h-3.5 w-3.5" />,
    className: "bg-emerald-50 text-emerald-700",
  },
  ADMIN: {
    label: "Admin",
    icon: <Shield className="h-3.5 w-3.5" />,
    className: "bg-amber-50 text-amber-700",
  },
};

function RoleTag({ role }: { role: Role | null }) {
  if (!role) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        <HelpCircle className="h-3.5 w-3.5" /> Naməlum
      </span>
    );
  }
  const m = ROLE_META[role];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${m.className}`}
    >
      {m.icon} {m.label}
    </span>
  );
}

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

  // Resolve recipient role: kind tells us for center/patient; OTP/other by phone lookup.
  const lookupPhones = [
    ...new Set(
      logs.filter((l) => l.kind === "otp" || l.kind === "other").map((l) => l.phone),
    ),
  ];
  let roleByPhone = new Map<string, Role>();
  if (lookupPhones.length) {
    try {
      const users = await prisma.user.findMany({
        where: { phone: { in: lookupPhones } },
        select: { phone: true, role: true },
      });
      roleByPhone = new Map(users.map((u) => [u.phone, u.role as Role]));
    } catch {
      /* ignore */
    }
  }
  const roleFor = (kind: string, phone: string): Role | null => {
    if (kind === "center_request") return "CENTER";
    if (kind === "patient_status") return "PATIENT";
    return roleByPhone.get(phone) ?? null;
  };

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
            <div className="grid gap-2 lg:grid-cols-2">
              {logs.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-100 p-2.5 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          s.ok ? "text-emerald-600" : "text-red-500",
                        )}
                        title={s.ok ? "Göndərildi" : "Uğursuz"}
                      >
                        {s.ok ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </span>
                      <span className="truncate font-semibold text-ink-900">
                        {formatPhoneDisplay(s.phone)}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {formatDateTimeAz(s.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <RoleTag role={roleFor(s.kind, s.phone)} />
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {KIND_LABEL[s.kind] ?? s.kind}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 break-words text-xs text-slate-600">{s.text}</p>
                  {s.error && (
                    <p className="mt-0.5 text-xs text-red-500">Xəta: {s.error}</p>
                  )}
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
