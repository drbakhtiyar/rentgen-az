import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./i18n";

/**
 * Active locale for server components.
 * Precedence: the URL (/ru/* → the proxy sets `x-locale`) wins — this is what
 * search engines see at a stable, crawlable URL. Otherwise the saved cookie
 * preference, then the default (az).
 */
export async function getLocale(): Promise<Locale> {
  const h = await headers();
  const fromUrl = h.get("x-locale");
  if (isLocale(fromUrl)) return fromUrl;
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}
