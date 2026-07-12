import type { Metadata } from "next";
import Link from "next/link";
import { UserPlus, Building2, Stethoscope, User, MessageSquare, Phone } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { getIncompleteSignups } from "@/lib/queries";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateTimeAz } from "@/lib/utils";
import { formatPhoneDisplay, phoneToInternational } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Yarımçıq qeydiyyatlar",
  path: "/admin/yarimciq-qeydiyyat",
  noIndex: true,
});

const ROLE_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  CENTER: { label: "Mərkəz", icon: <Building2 className="h-3.5 w-3.5" />, cls: "bg-brand-50 text-brand-700" },
  DOCTOR: { label: "Həkim", icon: <Stethoscope className="h-3.5 w-3.5" />, cls: "bg-emerald-50 text-emerald-700" },
  PATIENT: { label: "Pasiyent", icon: <User className="h-3.5 w-3.5" />, cls: "bg-cyan-50 text-cyan-700" },
};

export default async function AdminIncompleteSignupsPage() {
  const admin = await requireRole("ADMIN", "/admin/yarimciq-qeydiyyat");
  const items = await getIncompleteSignups();

  return (
    <AdminShell title="Yarımçıq qeydiyyatlar" userName={admin.phone}>
      <Panel title={`Tamamlanmamış qeydiyyatlar (${items.length})`}>
        <p className="mb-4 text-sm text-slate-500">
          Bu nömrələr qeydiyyata başlayıb (OTP kodu istəyib), amma prosesi bitirməyib.
          Hansı tip profil yaratmaq istədikləri görünür — əlaqə saxlayıb kömək edə bilərsiniz.
        </p>

        {items.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {items.map((s) => {
              const rm = ROLE_META[s.role] ?? ROLE_META.PATIENT;
              return (
                <div
                  key={`${s.phone}-${s.role}`}
                  className="flex flex-col rounded-xl border border-slate-200 p-3.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <a
                        href={`tel:+${phoneToInternational(s.phone)}`}
                        className="font-semibold text-ink-900 hover:text-brand-600"
                      >
                        {formatPhoneDisplay(s.phone)}
                      </a>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDateTimeAz(s.at)}</p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${rm.cls}`}
                    >
                      {rm.icon} {rm.label}
                    </span>
                  </div>

                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.stage === "otp"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {s.stage === "otp" ? "Kod təsdiqlənməyib" : "Profil yarımçıq qalıb"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <a
                      href={`tel:+${phoneToInternational(s.phone)}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      <Phone className="h-3.5 w-3.5" /> Zəng et
                    </a>
                    <Link
                      href={`/admin/sms?to=${encodeURIComponent(s.phone)}`}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> SMS yaz
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<UserPlus />}
            title="Yarımçıq qeydiyyat yoxdur"
            description="Qeydiyyata başlayıb bitirməyən istifadəçilər burada görünəcək."
          />
        )}
      </Panel>
    </AdminShell>
  );
}
