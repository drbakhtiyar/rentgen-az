import type { Metadata } from "next";
import Link from "next/link";
import {
  Users,
  Building2,
  BadgeCheck,
  Inbox,
  Stethoscope,
  Clock,
  ArrowRight,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { adminNav } from "@/components/dashboard/role-navs";
import { StatCard, Panel, EmptyState, StatusBadge } from "@/components/dashboard/widgets";
import { CenterStatusControls } from "@/components/admin/controls";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Admin panel",
  path: "/admin",
  noIndex: true,
});

async function getAdminStats() {
  try {
    const [patients, centers, approved, pending, requests, referrals] =
      await Promise.all([
        prisma.user.count({ where: { role: "PATIENT" } }),
        prisma.centerProfile.count(),
        prisma.centerProfile.count({ where: { status: "APPROVED" } }),
        prisma.centerProfile.count({ where: { status: "PENDING" } }),
        prisma.appointmentRequest.count(),
        prisma.referral.count(),
      ]);
    return { patients, centers, approved, pending, requests, referrals };
  } catch {
    return { patients: 0, centers: 0, approved: 0, pending: 0, requests: 0, referrals: 0 };
  }
}

export default async function AdminDashboardPage() {
  const admin = await requireRole("ADMIN", "/admin");
  const stats = await getAdminStats();

  let pendingCenters: Awaited<ReturnType<typeof prisma.centerProfile.findMany>> = [];
  try {
    pendingCenters = await prisma.centerProfile.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
  } catch {
    pendingCenters = [];
  }

  return (
    <DashboardShell title="Admin panel" roleLabel="Administrator" userName={admin.phone} nav={adminNav}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Pasiyentlər" value={stats.patients} icon={<Users />} />
        <StatCard label="Mərkəzlər" value={stats.centers} icon={<Building2 />} tone="cyan" />
        <StatCard label="Təsdiqlənmiş" value={stats.approved} icon={<BadgeCheck />} tone="green" />
        <StatCard label="Gözləmədə" value={stats.pending} icon={<Clock />} tone="amber" />
        <StatCard label="Müraciətlər" value={stats.requests} icon={<Inbox />} />
        <StatCard label="Göndərişlər" value={stats.referrals} icon={<Stethoscope />} tone="slate" />
      </div>

      <div className="mt-5">
        <Panel
          title="Təsdiq gözləyən mərkəzlər"
          action={
            <Link
              href="/admin/merkezler"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Hamısı <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {pendingCenters.length > 0 ? (
            <div className="space-y-3">
              {pendingCenters.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink-900">{c.name}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-sm text-slate-500">
                      {[c.city, c.phone].filter(Boolean).join(" · ")} · {formatDateAz(c.createdAt)}
                    </p>
                  </div>
                  <CenterStatusControls centerId={c.id} status={c.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BadgeCheck />}
              title="Gözləyən mərkəz yoxdur"
              description="Bütün mərkəzlər nəzərdən keçirilib."
            />
          )}
        </Panel>
      </div>
    </DashboardShell>
  );
}
