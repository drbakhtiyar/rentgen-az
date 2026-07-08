import { prisma } from "@/lib/db";
import { DashboardShell } from "./shell";
import { adminNav } from "./role-navs";
import { adminUnreadTotal } from "@/lib/admin-chat";

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
  let newRequests = 0;
  let newReferrals = 0;
  let unreadChat = 0;
  try {
    [pendingCenters, pendingDoctors, newRequests, newReferrals, unreadChat] = await Promise.all([
      prisma.centerProfile.count({ where: { status: "PENDING" } }),
      prisma.doctorProfile.count({ where: { status: "PENDING" } }),
      prisma.appointmentRequest.count({ where: { status: "NEW" } }),
      prisma.referral.count({ where: { status: "NEW" } }),
      adminUnreadTotal(),
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
        "/admin/sohbetler": unreadChat,
        "/admin/merkezler": pendingCenters,
        "/admin/hekimler": pendingDoctors,
        "/admin/muracietler": newRequests,
        "/admin/gonderisler": newReferrals,
      }}
    >
      {children}
    </DashboardShell>
  );
}
