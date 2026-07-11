import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { patientNav } from "@/components/dashboard/role-navs";
import { Panel } from "@/components/dashboard/widgets";
import { NotificationList } from "@/components/dashboard/notification-list";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Bildirişlər",
  path: "/kabinet/bildirisler",
  noIndex: true,
});

export default async function PatientNotificationsPage() {
  const user = await requireRole("PATIENT", "/kabinet/bildirisler");
  const name = [user.patientProfile?.firstName, user.patientProfile?.lastName]
    .filter(Boolean)
    .join(" ") || "Pasiyent";

  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <DashboardShell title="Bildirişlər" roleLabel="Pasiyent" userName={name} nav={patientNav}>
      <Panel title="Bildirişlər">
        <NotificationList items={items} />
      </Panel>
    </DashboardShell>
  );
}
