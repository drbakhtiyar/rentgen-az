import Link from "next/link";
import Image from "next/image";
import { Building2, MapPin } from "lucide-react";
import { CallButton, WhatsAppButton } from "@/components/contact-buttons";
import { formatPrice } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

/**
 * Xidmət səhifəsində mərkəzlərin KOMPAKT sıra-siyahısı (2026-08-18) —
 * analizler.az nümunəsi: hər mərkəz bir sətir — loqo · ad · şəhər | qiymət |
 * Zəng / WhatsApp. Kart şəbəkəsi 12 mərkəzlə məhdud idi və qiymətlilər
 * kəsilirdi; siyahı formatı müqayisə/axtarış üçün qat-qat rahatdır.
 */

export type ServiceCenterRow = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  phone: string;
  whatsapp: string | null;
  price: number | null;
  priceTo: number | null;
  googleRating: number | null;
};

export function ServiceCenterRows({
  rows,
  locale,
}: {
  rows: ServiceCenterRow[];
  locale: Locale;
}) {
  const ru = locale === "ru";
  return (
    <div className="mt-6 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
      {rows.map((c, i) => (
        <div
          key={c.id}
          className={
            "flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5 " +
            (i > 0 ? "border-t border-slate-100" : "")
          }
        >
          {/* Loqo + ad + şəhər */}
          <Link
            href={`/rentgen-merkezleri/${c.slug}`}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400 ring-1 ring-slate-200">
              {c.logoUrl ? (
                <Image src={c.logoUrl} alt="" width={40} height={40} className="h-full w-full object-contain" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-ink-900 hover:text-iris-glow">
                {c.name}
              </span>
              <span className="flex items-center gap-2 text-xs text-slate-500">
                {c.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {c.city}
                  </span>
                )}
                {c.googleRating != null && (
                  <span className="text-amber-600">★ {c.googleRating.toFixed(1)}</span>
                )}
              </span>
            </span>
          </Link>

          {/* Qiymət */}
          <span className="shrink-0 text-right">
            {c.price != null ? (
              <span className="font-display text-base font-bold tabular-nums text-iris-canvas">
                {formatPrice(c.price, c.priceTo)}
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                {ru ? "Цену уточняйте" : "Qiymət üçün soruşun"}
              </span>
            )}
          </span>

          {/* Əlaqə */}
          <span className="flex shrink-0 items-center gap-2">
            <CallButton
              phone={c.phone}
              centerId={c.id}
              locale={locale}
              className="h-9 px-4 text-xs"
            />
            {c.whatsapp && (
              <WhatsAppButton
                phone={c.whatsapp}
                centerId={c.id}
                className="h-9 px-4 text-xs"
              />
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
