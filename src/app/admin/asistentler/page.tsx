import type { Metadata } from "next";
import Link from "next/link";
import { UserCog, Building2, Stethoscope, Phone, MessageSquare } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { getAdminAssistants } from "@/lib/queries";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { formatPhoneDisplay, phoneToInternational } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Asistentlər",
  path: "/admin/asistentler",
  noIndex: true,
});

const TYPE_META = {
  center: { label: "Mərkəz", icon: <Building2 className="h-3.5 w-3.5" />, cls: "bg-brand-50 text-brand-700" },
  doctor: { label: "Həkim", icon: <Stethoscope className="h-3.5 w-3.5" />, cls: "bg-emerald-50 text-emerald-700" },
} as const;

export default async function AdminAssistantsPage() {
  const admin = await requireRole("ADMIN", "/admin/asistentler");
  const items = await getAdminAssistants();

  return (
    <AdminShell title="Asistentlər" userName={admin.phone}>
      <Panel title={`Asistentlər (${items.length})`}>
        <p className="mb-4 text-sm text-slate-500">
          Mərkəzlərin və həkimlərin asistentləri. Hər asistentin yalnız adı, soyadı və nömrəsi
          olur — kimin asistenti olduğu (mərkəz / həkim) yanında göstərilir.
        </p>

        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                  <th className="py-2 pr-3">Asistent</th>
                  <th className="py-2 pr-3">Nömrə</th>
                  <th className="py-2 pr-3">Kimin asistenti</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Tarix</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((a) => {
                  const tm = TYPE_META[a.type];
                  return (
                    <tr key={`${a.type}-${a.id}`} className="align-middle">
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-2 font-semibold text-ink-900">
                          <UserCog className="h-4 w-4 shrink-0 text-slate-400" />
                          {a.firstName} {a.lastName}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <a
                          href={`tel:+${phoneToInternational(a.phone)}`}
                          className="text-slate-600 hover:text-brand-600"
                        >
                          {formatPhoneDisplay(a.phone)}
                        </a>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${tm.cls}`}
                          >
                            {tm.icon} {tm.label}
                          </span>
                          <span className="font-medium text-ink-900">{a.ownerName}</span>
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            a.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {a.active ? "Aktiv" : "Deaktiv"}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-slate-400">{formatDateAz(a.createdAt)}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:+${phoneToInternational(a.phone)}`}
                            title="Zəng et"
                            className="rounded-full bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </a>
                          <Link
                            href={`/admin/sms?to=${encodeURIComponent(a.phone)}`}
                            title="SMS yaz"
                            className="rounded-full bg-brand-50 p-1.5 text-brand-700 hover:bg-brand-100"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<UserCog />}
            title="Asistent yoxdur"
            description="Mərkəzlər və həkimlər asistent əlavə etdikcə burada görünəcək."
          />
        )}
      </Panel>
    </AdminShell>
  );
}
