import type { Metadata } from "next";
import Link from "next/link";
import { Handshake, Building2, Stethoscope, Users } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { StatCard, EmptyState, Panel } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/rbac";
import { getCenterDoctorPartnerships } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Əməkdaşlıqlar",
  path: "/admin/emekdashliq",
  noIndex: true,
});

export default async function AdminPartnershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/emekdashliq");
  const q = (await searchParams).q?.trim().toLowerCase() || "";
  const groups = await getCenterDoctorPartnerships();

  // Filter by center name or doctor name.
  const filtered = q
    ? groups
        .map((g) => {
          const centerMatch = g.centerName.toLowerCase().includes(q);
          const doctors = centerMatch
            ? g.doctors
            : g.doctors.filter((d) => d.name.toLowerCase().includes(q));
          return doctors.length ? { ...g, doctors } : null;
        })
        .filter((g): g is (typeof groups)[number] => g !== null)
    : groups;

  const acceptedPairs = groups.reduce(
    (n, g) => n + g.doctors.filter((d) => d.status === "ACCEPTED").length,
    0,
  );

  return (
    <AdminShell title="Əməkdaşlıqlar" userName={admin.phone}>
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard label="Əməkdaşlıq edən mərkəzlər" value={groups.length} icon={<Building2 />} />
        <StatCard label="Aktiv mərkəz–həkim əlaqəsi" value={acceptedPairs} icon={<Handshake />} tone="green" />
      </div>

      <form action="/admin/emekdashliq" className="mb-5 flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={q} placeholder="Mərkəz və ya həkim adı üzrə axtar" className="max-w-xs" />
        <Button type="submit">Axtar</Button>
      </form>

      {filtered.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((g) => (
            <div key={g.centerId} className="flex flex-col rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    href={`/admin/merkezler/${g.centerId}`}
                    className="flex items-center gap-1.5 truncate font-semibold text-ink-900 hover:text-brand-600"
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-brand-500" /> {g.centerName}
                  </Link>
                  {g.city && <p className="mt-0.5 text-xs text-slate-400">{g.city}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {g.doctors.length}
                </span>
              </div>

              <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
                {g.doctors.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <Link
                      href={`/admin/hekimler/${d.id}`}
                      className="flex min-w-0 items-center gap-1.5 text-ink-800 hover:text-brand-600"
                    >
                      <Stethoscope className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">
                        {d.name}
                        {d.clinic ? <span className="text-slate-400"> · {d.clinic}</span> : ""}
                      </span>
                    </Link>
                    {d.status === "ACCEPTED" ? (
                      <Badge tone="green">Partnyor</Badge>
                    ) : (
                      <Badge tone="amber">Gözləyir</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users />}
          title={q ? "Nəticə tapılmadı" : "Hələ əməkdaşlıq yoxdur"}
          description={
            q
              ? "Axtarışa uyğun mərkəz və ya həkim yoxdur."
              : "Mərkəz–həkim əməkdaşlıqları burada görünəcək."
          }
        />
      )}
    </AdminShell>
  );
}
