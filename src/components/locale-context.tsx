"use client";

import * as React from "react";
import type { Locale } from "@/lib/i18n";

const LocaleContext = React.createContext<Locale>("az");

/** Provides the active locale to client components inside the dashboard. */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** Read the active locale in a client component (defaults to "az"). */
export function useLocale(): Locale {
  return React.useContext(LocaleContext);
}
