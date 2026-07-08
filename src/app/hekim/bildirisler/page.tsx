import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { doctorNav } from "@/components/dashboard/role-navs";
import { Panel } from "@/components/dashboard/widgets";
import { NotificationList } from "@/components/dashboard/notification-list";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { doctorName } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Bildirişlər",
  path: "/hekim/bildirisler",
  noIndex: true,
});

export default async function DoctorNotificationsPage() {
  const user = await requireRole("DOCTOR", "/hekim/bildirisler");
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: user.id },
    select: { firstName: true, lastName: true },
  });
  if (!doctor) redirect("/hekim/qeydiyyat");

  const items = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <DashboardShell
      title="Bildirişlər"
      roleLabel="Həkim"
      userName={doctorName(doctor.firstName, doctor.lastName)}
      nav={doctorNav}
    >
      <Panel title="Bildirişlər">
        <NotificationList items={items} />
      </Panel>
    </DashboardShell>
  );
}
