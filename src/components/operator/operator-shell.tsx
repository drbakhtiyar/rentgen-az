import { DashboardShell } from "@/components/dashboard/shell";
import { operatorNav } from "@/components/dashboard/role-navs";
import { adminUnreadTotal } from "@/lib/admin-chat";

/**
 * Operator paneli qabığı — 2026-08-12-dən admin ilə EYNİ vizual (sol sütun
 * naviqasiya, DashboardShell). Əvvəlki üfüqi sıra istifadəçiyə qarışıq
 * göründü. `showNew` artıq nav bəndidir ("Yeni mərkəz").
 */
export async function OperatorShell({
  title,
  userName,
  children,
}: {
  title: string;
  userName: string;
  /** Köhnə imza ilə uyğunluq üçün saxlanılıb — nav-da həmişə var. */
  showNew?: boolean;
  children: React.ReactNode;
}) {
  // Oxunmamış nişanlar — admin shell ilə eyni mənbədən
  let unread = { system: 0, whatsapp: 0 };
  try {
    unread = await adminUnreadTotal();
  } catch {
    /* nişansız davam */
  }

  return (
    <DashboardShell
      title={title}
      roleLabel="Operator"
      userName={userName}
      nav={operatorNav}
      navBadges={{
        "/panel/sohbetler": unread.system,
        "/panel/whatsapp-sohbetler": unread.whatsapp,
      }}
    >
      {children}
    </DashboardShell>
  );
}
