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
  let pending = 0;
  try {
    pending = await prisma.centerProfile.count({ where: { status: "PENDING" } });
  } catch {
    pending = 0;
  }

  return (
    <DashboardShell
      title={title}
      roleLabel="Administrator"
      userName={userName}
      nav={adminNav}
      navBadges={{ "/admin/merkezler": pending }}
    >
      {children}
    </DashboardShell>
  );
}
