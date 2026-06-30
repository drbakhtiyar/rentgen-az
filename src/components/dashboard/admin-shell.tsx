import { prisma } from "@/lib/db";
import { DashboardShell } from "./shell";
import { adminNav } from "./role-navs";

/** Admin dashboard shell — adds a live "pending centers" badge to the nav. */
export async function AdminShell({
  title,
  userName,
  children,
}: {
  title: string;
  userName: string;
  children: React.ReactNode;
}) {
  let pendingCenters = 0;
  let pendingDoctors = 0;
  try {
    [pendingCenters, pendingDoctors] = await Promise.all([
      prisma.centerProfile.count({ where: { status: "PENDING" } }),
      prisma.doctorProfile.count({ where: { status: "PENDING" } }),
    ]);
  } catch {
    /* keep zeros */
  }

  return (
    <DashboardShell
      title={title}
      roleLabel="Administrator"
      userName={userName}
      nav={adminNav}
      navBadges={{
        "/admin/merkezler": pendingCenters,
        "/admin/hekimler": pendingDoctors,
      }}
    >
      {children}
    </DashboardShell>
  );
}
