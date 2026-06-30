import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, StatusBadge, Panel } from "@/components/dashboard/widgets";
import { ReferralStatusSelect } from "@/components/admin/controls";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { formatPhoneDisplay, phoneToInternational } from "@/lib/phone";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Həkim göndərişləri",
  path: "/admin/gonderisler",
  noIndex: true,
});

async function getReferrals() {
  try {
    return await prisma.referral.findMany({
      include: { center: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch {
    return [];
  }
}

export default async function AdminReferralsPage() {
  const admin = await requireRole("ADMIN", "/admin/gonderisler");
  const referrals = await getReferrals();

  return (
    <AdminShell title="Həkim göndərişləri" userName={admin.phone}>
      <Panel title="Həkim göndərişləri">
        {referrals.length > 0 ? (
          <div className="space-y-3">
            {referrals.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink-900">{r.doctorName}</p>
                    {r.examType && <Badge tone="cyan">{r.examType}</Badge>}
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {r.clinic ? `${r.clinic} · ` : ""}
                    <a
                      href={`tel:+${phoneToInternational(r.doctorPhone)}`}
                      className="hover:text-brand-600"
                    >
                      {formatPhoneDisplay(r.doctorPhone)}
                    </a>
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Pasiyent: {r.patientName}
                    {" · "}
                    {r.center?.slug ? (
                      <Link
                        href={`/rentgen-merkezleri/${r.center.slug}`}
                        className="hover:text-brand-600"
                      >
                        {r.center.name}
                      </Link>
                    ) : (
                      "Seçilməyib"
                    )}
                    {" · "}
                    {formatDateAz(r.createdAt)}
                  </p>
                  {r.note && (
                    <p className="mt-1 text-sm text-slate-600">{r.note}</p>
                  )}
                </div>
                <ReferralStatusSelect id={r.id} status={r.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Stethoscope />}
            title="Göndəriş tapılmadı"
            description="Hələ heç bir həkim göndərişi daxil olmayıb."
          />
        )}
      </Panel>
    </AdminShell>
  );
}
