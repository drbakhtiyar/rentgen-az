import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { Panel } from "@/components/dashboard/widgets";
import { NotificationList } from "@/components/dashboard/notification-list";
import { prisma } from "@/lib/db";
import { requireDoctor, doctorNavFor } from "../_lib";
import { doctorName } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Bildirişlər",
  path: "/hekim/bildirisler",
  noIndex: true,
});

export default async function DoctorNotificationsPage() {
  const { doctor, isOwner } = await requireDoctor("/hekim/bildirisler");

  // Assistants read the doctor's notification feed (keyed by the owner user).
  const items = await prisma.notification.findMany({
    where: { userId: doctor.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const pd = getPanelDict(await getLocale());

  return (
    <DashboardShell
      title={pd.nav.bildirisler}
      roleLabel={pd.shell.roleDoctor}
      userName={doctorName(doctor.firstName, doctor.lastName)}
      nav={doctorNavFor(isOwner)}
    >
      <Panel title={pd.nav.bildirisler}>
        <NotificationList items={items} />
      </Panel>
    </DashboardShell>
  );
}
