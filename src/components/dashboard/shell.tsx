import Link from "next/link";
import Image from "next/image";
import { LogoutButton } from "@/components/logout-button";
import { getCurrentUser } from "@/lib/auth/rbac";
import { unreadNotificationCount } from "@/lib/notifications";
import { unreadMessageCount } from "@/lib/chat";
import { getUserAdminContact } from "@/lib/admin-chat";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { LocaleProvider } from "@/components/locale-context";
import { DashboardNav, type NavItem } from "./nav";
import { RoleSwitcher } from "./role-switcher";

export async function DashboardShell({
  title,
  roleLabel,
  userName,
  nav,
  navBadges,
  children,
  collapsible = false,
}: {
  title: string;
  roleLabel: string;
  userName: string;
  nav: NavItem[];
  navBadges?: Record<string, number>;
  children: React.ReactNode;
  /** Icon-only sidebar that expands as an overlay on hover (used by the CRM
   * so the calendar gets full width). */
  collapsible?: boolean;
}) {
  const me = await getCurrentUser();
  const locale = await getLocale();
  const pd = getPanelDict(locale);
  // Localize nav labels by their stable key (falls back to the AZ label).
  const navItems: NavItem[] = nav.map((item) =>
    item.navKey && item.navKey in pd.nav
      ? { ...item, label: pd.nav[item.navKey as keyof typeof pd.nav] }
      : item,
  );
  // Use the entity's own logo/photo as the sidebar avatar; fall back to the site mark.
  const avatarUrl =
    me?.role === "CENTER"
      ? me.centerProfile?.logoUrl ?? null
      : me?.role === "DOCTOR"
        ? me.doctorProfile?.photoUrl ?? null
        : null;
  // Merge the unread-notification count into the nav badges (keyed by href).
  const unread = me ? await unreadNotificationCount(me.id) : 0;
  const mergedBadges: Record<string, number> = { ...navBadges };
  if (unread > 0) {
    mergedBadges["/merkez/bildirisler"] = unread;
    mergedBadges["/hekim/bildirisler"] = unread;
    mergedBadges["/kabinet/bildirisler"] = unread;
  }
  // Unread chat messages badge.
  let unreadChat = 0;
  if (me?.role === "CENTER" && me.centerProfile) {
    unreadChat = await unreadMessageCount(me.id, "CENTER", me.centerProfile.id);
  } else if (me?.role === "DOCTOR" && me.doctorProfile) {
    unreadChat = await unreadMessageCount(me.id, "DOCTOR", me.doctorProfile.id);
  }
  // Include unread messages from admin (pinned support conversation).
  if (me && (me.role === "CENTER" || me.role === "DOCTOR")) {
    unreadChat += (await getUserAdminContact(me.id)).unread;
  }
  if (unreadChat > 0) {
    mergedBadges["/merkez/chat"] = unreadChat;
    mergedBadges["/hekim/chat"] = unreadChat;
  }
  const availableRoles = (
    [
      me?.patientProfile ? "PATIENT" : null,
      me?.doctorProfile ? "DOCTOR" : null,
      me?.centerProfile ? "CENTER" : null,
    ] as ("PATIENT" | "CENTER" | "DOCTOR" | null)[]
  ).filter((r): r is "PATIENT" | "CENTER" | "DOCTOR" => r !== null);

  return (
    <LocaleProvider locale={locale}>
    <div className="min-h-[calc(100vh-4rem)] bg-surface">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sidebar (desktop) */}
        <aside className={collapsible ? "hidden w-16 shrink-0 lg:block" : "hidden w-64 shrink-0 lg:block"}>
          <div
            className={
              collapsible
                ? "group sticky top-20 z-40 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 transition-[width] duration-200 hover:w-64 hover:shadow-xl"
                : "sticky top-20 rounded-2xl border border-slate-200 bg-white p-4"
            }
          >
            <div className="flex items-center gap-2 px-2 pb-3">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={userName}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg object-cover"
                />
              ) : (
                <Image src="/mark-square.png" alt="rentgen.az" width={32} height={32} className="h-8 w-8 rounded-lg" />
              )}
              <div className={collapsible ? "hidden whitespace-nowrap group-hover:block" : ""}>
                <p className="text-xs font-semibold text-ink-900">{roleLabel}</p>
                <p className="max-w-[150px] truncate text-xs text-slate-500">{userName}</p>
              </div>
            </div>
            {me && availableRoles.length > 1 && (
              <div className={collapsible ? "hidden group-hover:block" : ""}>
                <RoleSwitcher roles={availableRoles} current={me.role} locale={locale} />
              </div>
            )}
            <DashboardNav items={navItems} badges={mergedBadges} collapsible={collapsible} />
            <div className="mt-3 border-t border-slate-100 pt-3">
              <Link
                href="/"
                className={`rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 ${collapsible ? "hidden group-hover:block" : "block"}`}
              >
                {pd.shell.backToSite}
              </Link>
              <LogoutButton
                label={pd.shell.logout}
                collapsible={collapsible}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              />
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* CRM pages render their own heading; skip the shell title to save space. */}
          {!collapsible && (
            <div className="mb-5 flex items-center justify-between">
              <h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>
            </div>
          )}

          {/* Mobile nav (+ logout — the sidebar with it is desktop-only) */}
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            <DashboardNav items={navItems} mobile badges={mergedBadges} />
            <LogoutButton
              label={pd.shell.logout}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-red-600 ring-1 ring-inset ring-red-200"
            />
          </div>

          {children}
        </div>
      </div>
    </div>
    </LocaleProvider>
  );
}
