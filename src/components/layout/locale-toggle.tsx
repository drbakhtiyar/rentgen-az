"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { setLocaleAction } from "@/app/actions/locale";
import { cn } from "@/lib/utils";

export function LocaleToggle({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  function set(l: Locale) {
    if (l === locale) return;
    // Remember the choice (cookie + account) so links/logins stay in this language.
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    void setLocaleAction(l);
    // Navigate to the language's own URL (/ru prefix) so it's crawlable/shareable.
    const current = pathname || "/";
    const bare = current.startsWith("/ru/")
      ? current.slice(3)
      : current === "/ru"
        ? "/"
        : current;
    const target = l === "ru" ? (bare === "/" ? "/ru" : `/ru${bare}`) : bare;
    router.push(target);
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
