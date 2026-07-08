import type { Metadata } from "next";
import Link from "next/link";
import { Inbox, User, Building2, Stethoscope, ScanLine, Clock } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, StatusBadge, Panel } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz, formatDateTimeAz, doctorName } from "@/lib/utils";
import { formatPhoneDisplay, phoneToInternational } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Müraciətlər",
  path: "/admin/muracietler",
  noIndex: true,
});

async function getRequests() {
  try {
    return await prisma.appointmentRequest.findMany({
      include: {
        center: { select: { name: true, slug: true } },
        doctor: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch {
    return [];
  }
}

export default async function AdminRequestsPage() {
  const admin = await requireRole("ADMIN", "/admin/muracietler");
  const requests = await getRequests();
  const newCount = requests.filter((r) => r.status === "NEW").length;

  // Resolve service slug → name from the DB catalog.
  const serviceNames = new Map<string, string>();
  try {
    const services = await prisma.service.findMany({ select: { slug: true, name: true } });
    for (const s of services) serviceNames.set(s.slug, s.name);
  } catch {
    /* fall back to raw slug */
  }

  return (
    <AdminShell title="Müraciətlər" userName={admin.phone}>
      <Panel
        title={`Pasiyent müraciətləri${newCount ? ` — ${newCount} yeni` : ""}`}
      >
        {requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((r) => {
              const serviceName = r.serviceSlug
                ? serviceNames.get(r.serviceSlug) ?? null
                : null;
              const refDoctor = r.doctor
                ? doctorName(r.doctor.firstName, r.doctor.lastName)
                : null;
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                        <User className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900">{r.name}</p>
                        <a
                          href={`tel:+${phoneToInternational(r.phone)}`}
                          className="text-sm text-slate-500 hover:text-brand-600"
                        >
                          {formatPhoneDisplay(r.phone)}
                        </a>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {r.patientId ? (
                        <Badge tone="green">Qeydiyyatlı</Badge>
                      ) : (
                        <Badge tone="slate">Qonaq</Badge>
                      )}
                      <StatusBadge status={r.status} />
                    </div>
                  </div>

                  <dl className="mt-3 grid gap-x-6 gap-y-2 border-t border-slate-100 pt-3 text-sm sm:grid-cols-2">
                    <Row icon={<Building2 />} label="Mərkəz">
                      {r.center?.slug ? (
                        <Link
                          href={`/rentgen-merkezleri/${r.center.slug}`}
                          className="font-medium text-ink-900 hover:text-brand-600"
                        >
                          {r.center.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Seçilməyib</span>
                      )}
                    </Row>
                    <Row icon={<ScanLine />} label="Xidmət">
                      {serviceName ?? r.serviceSlug ?? <span className="text-slate-400">—</span>}
                    </Row>
                    <Row icon={<Stethoscope />} label="Göndərən həkim">
                      {refDoctor || <span className="text-slate-400">—</span>}
                    </Row>
                    {r.preferredDate && (
                      <Row icon={<Clock />} label="Seçilmiş vaxt">
                        {formatDateTimeAz(r.preferredDate)}
                      </Row>
                    )}
                  </dl>

                  {r.note && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      {r.note}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    {formatDateAz(r.createdAt)}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Inbox />}
            title="Müraciət tapılmadı"
            description="Hələ heç bir müraciət daxil olmayıb."
          />
        )}
      </Panel>
    </AdminShell>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-slate-400 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <div className="min-w-0">
        <dt className="text-xs text-slate-400">{label}</dt>
        <dd className="text-ink-800">{children}</dd>
      </div>
    </div>
  );
}
