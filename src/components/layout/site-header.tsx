import { getCurrentUser, dashboardPathForRole } from "@/lib/auth/rbac";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { HeaderClient } from "./header-client";

export async function SiteHeader() {
  const [user, locale] = await Promise.all([getCurrentUser(), getLocale()]);
  const d = getDict(locale);

  const nav = [
    { label: d.nav.centers, href: "/rentgen-merkezleri" },
    { label: d.nav.doctors, href: "/hekimler" },
    { label: d.nav.services, href: "/xidmetler" },
    { label: d.nav.blog, href: "/blog" },
    { label: d.nav.faq, href: "/faq" },
    { label: d.nav.contact, href: "/elaqe" },
  ];

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

  return <HeaderClient nav={nav} session={sessionInfo} locale={locale} cta={d.cta} />;
}
