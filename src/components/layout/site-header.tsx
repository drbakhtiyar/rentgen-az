import { headers } from "next/headers";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth/rbac";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { HeaderClient } from "./header-client";

export async function SiteHeader() {
  const [user, locale, hdrs] = await Promise.all([getCurrentUser(), getLocale(), headers()]);
  const d = getDict(locale);
  // Public site links are noise inside the CRM app (crm.rentgen.az).
  const isCrmHost = (hdrs.get("host") ?? "").toLowerCase().startsWith("crm.");

  const nav = [
    { label: d.nav.centers, href: "/rentgen-merkezleri" },
    { label: d.nav.doctors, href: "/hekimler" },
    { label: d.nav.services, href: "/xidmetler" },
    { label: d.nav.pricing, href: "/paketler" },
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

  return <HeaderClient nav={isCrmHost ? [] : nav} session={sessionInfo} locale={locale} cta={d.cta} />;
}
