"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/rbac";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n";

/**
 * Set the active locale cookie and, if the visitor is logged in, remember the
 * choice on their account so future logins open in the same language.
 */
export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  const me = await getCurrentUser().catch(() => null);
  if (me) {
    await prisma.user
      .update({ where: { id: me.id }, data: { locale } })
      .catch(() => {});
  }
}
