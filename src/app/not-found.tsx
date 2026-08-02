import type { Metadata } from "next";
import Link from "next/link";
import { Compass, MapPin, Building2, Stethoscope, ListChecks, Mail } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { getCityPages } from "@/lib/city-pages";
import { buildMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";

/**
 * Qlobal 404.
 *
 * NƏ ÜÇÜN: sayt indiyə qədər Next-in defolt ingiliscə 404-ünü verirdi
 * ("404: This page could not be found") — nə brend, nə naviqasiya, nə də
 * Azərbaycan dili. Halbuki 404 burada NORMAL haldır və tez-tez baş verir:
 * PENDING mərkəzlərin səhifələri (117), az mərkəzli şəhərlər, təxirə salınmış
 * şəhər×xidmət kombinasiyaları (`DEFERRED_SERVICES`) və köhnə/səhv linklər.
 *
 * Ona görə bu səhifə çıxılmaz nöqtə deyil, davam yoludur: axtarışa, şəhər
 * səhifələrinə və əsas kataloqlara keçid verir.
 */
// `not-found.tsx` yalnız STATİK `metadata` dəstəkləyir (generateMetadata yoxdur),
// yəni başlıq dilə uyğunlaşa bilmir. Ona görə dildən asılı olmayan başlıq —
// əks halda RU istifadəçi rusca səhifədə azərbaycanca tab adı görürdü.
export const metadata: Metadata = buildMetadata({
  title: "404",
  noIndex: true,
});

export default async function NotFound() {
  const locale = await getLocale();
  const t = getDict(locale).notFoundPage;
  // Şəhər siyahısı DB-dən gəlir; xəta olsa blok sadəcə göstərilmir
  // (getCityPages xətanı udur — burada bu təhlükəsizdir).
  const cities = (await getCityPages()).slice(0, 12);

  const links = [
    { href: "/rentgen-merkezleri", label: t.allCenters, icon: <Building2 /> },
    { href: "/xidmetler", label: t.allServices, icon: <ListChecks /> },
    { href: "/hekimler", label: t.allDoctors, icon: <Stethoscope /> },
    { href: "/elaqe", label: t.contact, icon: <Mail /> },
  ];

  return (
    <Section className="py-16 sm:py-24">
      <Container className="max-w-3xl">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            <Compass className="h-7 w-7" />
          </span>
          <p className="font-display mt-6 text-5xl font-bold tracking-tight text-slate-300">
            {t.eyebrow}
          </p>
          <h1 className="font-display mt-2 text-2xl font-bold text-ink-900 sm:text-3xl">
            {t.title}
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
            {t.description}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/rentgen-merkezleri">{t.searchCta}</ButtonLink>
            <ButtonLink href="/" variant="outline">
              {t.homeCta}
            </ButtonLink>
          </div>
        </div>

        <Card className="mt-10 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t.linksTitle}
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-brand-600 [&>svg]:h-4 [&>svg]:w-4">
                    {l.icon}
                  </span>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {cities.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <MapPin className="h-3.5 w-3.5 text-brand-600" />
                {t.citiesTitle}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {cities.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/rentgen-merkezleri/sheher/${c.slug}`}
                    className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {c.name} <span className="text-slate-400">· {c.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Card>
      </Container>
    </Section>
  );
}
