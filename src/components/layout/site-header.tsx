import { getCurrentUser, dashboardPathForRole } from "@/lib/auth/rbac";
import { MAIN_NAV } from "@/lib/constants";
import { HeaderClient } from "./header-client";

export async function SiteHeader() {
  const user = await getCurrentUser();

  const sessionInfo = user
    ? {
        role: user.role,
        dashboard: dashboardPathForRole(user.role),
        name:
          user.centerProfile?.name ||
          [user.patientProfile?.firstName, user.patientProfile?.lastName]
            .filter(Boolean)
            .join(" ") ||
          "Hesabım",
      }
    : null;

  return <HeaderClient nav={MAIN_NAV} session={sessionInfo} />;
}
