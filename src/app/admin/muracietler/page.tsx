import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, StatusBadge, Panel } from "@/components/dashboard/widgets";
import { RequestStatusSelectAdmin } from "@/components/admin/controls";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
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
      include: { center: { select: { name: true, slug: true } } },
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

  return (
    <AdminShell title="Müraciətlər" userName={admin.phone}>
      <Panel title="Müraciətlər">
        {requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink-900">{r.name}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    <a
                      href={`tel:+${phoneToInternational(r.phone)}`}
                      className="hover:text-brand-600"
                    >
                      {formatPhoneDisplay(r.phone)}
                    </a>
                    {" · "}
                    {r.center?.slug ? (
                      <Link
                        href={`/rentgen-merkezleri/${r.center.slug}`}
                        className="hover:text-brand-600"
                      >
                        {r.center.name}
                      </Link>
                    ) : (
                      "Ümumi"
                    )}
                    {r.serviceSlug ? ` · ${r.serviceSlug}` : ""}
                    {" · "}
                    {formatDateAz(r.createdAt)}
                  </p>
                  {r.note && (
                    <p className="mt-1 text-sm text-slate-600">{r.note}</p>
                  )}
                </div>
                <RequestStatusSelectAdmin id={r.id} status={r.status} />
              </div>
            ))}
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
