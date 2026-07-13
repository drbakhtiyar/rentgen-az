import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { patientNav } from "@/components/dashboard/role-navs";
import { Panel } from "@/components/dashboard/widgets";
import { NotificationList } from "@/components/dashboard/notification-list";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Bildirişlər",
  path: "/kabinet/bildirisler",
  noIndex: true,
});

export default async function PatientNotificationsPage() {
  const user = await requireRole("PATIENT", "/kabinet/bildirisler");
  const pd = getPanelDict(await getLocale());
  const name = [user.patientProfile?.firstName, user.patientProfile?.lastName]
    .filter(Boolean)
    .join(" ") || pd.shell.rolePatient;

  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <DashboardShell title={pd.patient.notificationsTitle} roleLabel={pd.shell.rolePatient} userName={name} nav={patientNav}>
      <Panel title={pd.patient.notificationsTitle}>
        <NotificationList items={items} />
      </Panel>
    </DashboardShell>
  );
}
