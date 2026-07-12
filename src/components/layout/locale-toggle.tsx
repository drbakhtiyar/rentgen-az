"use client";

import { useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { setLocaleAction } from "@/app/actions/locale";
import { cn } from "@/lib/utils";

export function LocaleToggle({ locale }: { locale: Locale }) {
  const router = useRouter();

  function set(l: Locale) {
    if (l === locale) return;
    // Instant client-side switch…
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    // …and persist to the account (best-effort) so future logins remember it.
    void setLocaleAction(l);
    router.refresh();
  }

  return (
    <div className="inline-flex items-center rounded-full bg-slate-100 p-0.5 text-xs font-semibold">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => set(l)}
          className={cn(
            "rounded-full px-2.5 py-1 uppercase transition-colors",
            l === locale ? "bg-white text-ink-900 shadow-sm" : "text-slate-500 hover:text-ink-800",
          )}
          aria-pressed={l === locale}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
