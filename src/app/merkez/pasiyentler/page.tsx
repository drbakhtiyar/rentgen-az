import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Users, Search, Clock, Stethoscope } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz, formatDateTimeAz, doctorName } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";
import { RequestStatusControl } from "../request-status-control";
import { RequestResultForm } from "../request-result-form";
import type { Prisma } from "@/generated/prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Pasiyentlər",
  path: "/merkez/pasiyentler",
  noIndex: true,
});

export default async function CenterPatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireRole("CENTER", "/merkez/pasiyentler");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const where: Prisma.AppointmentRequestWhereInput = { centerId: center.id };
  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { phone: { contains: query } },
    ];
  }

  const requests = await prisma.appointmentRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      doctor: { select: { firstName: true, lastName: true } },
      files: {
        select: { id: true, fileName: true, size: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // Approved doctors for manual referring-doctor assignment.
  const doctorOptions = (
    await prisma.doctorProfile.findMany({
      where: { status: "APPROVED" },
      select: { id: true, firstName: true, lastName: true, clinic: true },
      orderBy: { firstName: "asc" },
    })
  ).map((d) => ({
    value: d.id,
    label:
      doctorName(d.firstName, d.lastName) +
      (d.clinic ? ` — ${d.clinic}` : ""),
  }));

  // Group by patient phone.
  const groups: { phone: string; name: string; items: typeof requests }[] = [];
  const index = new Map<string, number>();
  for (const r of requests) {
    let i = index.get(r.phone);
    if (i === undefined) {
      i = groups.length;
      index.set(r.phone, i);
      groups.push({ phone: r.phone, name: r.name, items: [] });
    }
    groups[i].items.push(r);
  }

  return (
    <DashboardShell title="Pasiyentlər" roleLabel="Rentgen mərkəzi" userName={center.name} nav={centerNav}>
      <form className="mb-5 flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder="Ad və ya telefon üzrə axtar"
          className="max-w-xs"
        />
        <Button type="submit">
          <Search className="h-4 w-4" /> Axtar
        </Button>
      </form>

      <Panel title={`Pasiyentlər (${groups.length})`}>
        {groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map((g) => (
              <div key={g.phone} className="rounded-xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-900">{g.name}</span>
                  <a href={`tel:${g.phone}`} className="text-sm text-slate-500 hover:text-brand-600">
                    {formatPhoneDisplay(g.phone)}
                  </a>
                  <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
                    {g.items.length} müraciət
                  </span>
                </div>

                <div className="mt-3 space-y-3">
                  {g.items.map((r) => {
                    const refDoctor = r.doctor
                      ? doctorName(r.doctor.firstName, r.doctor.lastName)
                      : null;
                    return (
                      <div key={r.id} className="rounded-lg border border-slate-100 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0 text-sm">
                            <span className="font-medium text-ink-900">
                              {r.serviceSlug || "Ümumi müraciət"}
                            </span>
                            {r.preferredDate && (
                              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                                <Clock className="h-3 w-3" /> {formatDateTimeAz(r.preferredDate)}
                              </span>
                            )}
                            <span className="ml-2 text-xs text-slate-400">
                              {formatDateAz(r.createdAt)}
                            </span>
                            {refDoctor && (
                              <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                                <Stethoscope className="h-3.5 w-3.5" /> Göndərən: {refDoctor}
                              </span>
                            )}
                            {r.note && <p className="mt-1 text-sm text-slate-600">{r.note}</p>}
                          </div>
                          <RequestStatusControl id={r.id} status={r.status} patientUpdated={r.patientUpdated} />
                        </div>
                        {r.status === "COMPLETED" && (
                          <RequestResultForm
                            requestId={r.id}
                            defaultUrl={r.resultUrl}
                            doctorId={r.doctorId}
                            doctors={doctorOptions}
                            files={r.files}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users />}
            title={query ? "Nəticə tapılmadı" : "Hələ pasiyent yoxdur"}
            description={
              query
                ? "Axtarışa uyğun pasiyent yoxdur."
                : "Pasiyentlər müraciət etdikcə burada görünəcək."
            }
          />
        )}
      </Panel>
    </DashboardShell>
  );
}
