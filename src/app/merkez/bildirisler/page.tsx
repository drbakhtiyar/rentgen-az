import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
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
  path: "/merkez/bildirisler",
  noIndex: true,
});

export default async function CenterNotificationsPage() {
  const user = await requireRole("CENTER", "/merkez/bildirisler");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { name: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const pd = getPanelDict(await getLocale());

  return (
    <DashboardShell title={pd.nav.bildirisler} roleLabel={pd.center.roleLabel} userName={center.name} nav={centerNav}>
      <Panel title={pd.center.notificationsTitle}>
        <NotificationList items={items} />
      </Panel>
    </DashboardShell>
  );
}
