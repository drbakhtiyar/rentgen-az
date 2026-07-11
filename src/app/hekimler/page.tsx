import type { Metadata } from "next";
import { Stethoscope } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { Search } from "lucide-react";
import { DoctorCard } from "@/components/doctors/doctor-card";
import { getApprovedDoctors } from "@/lib/queries";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { CITIES, DENTAL_SPECIALIZATIONS } from "@/lib/constants";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Həkimlər — dental həkim kataloqu",
  description:
    "Azərbaycanda dental həkimlər: ixtisas, klinika və şəhərə görə tapın. Təsdiqlənmiş həkim profilləri — Rentgen.az.",
  path: "/hekimler",
  keywords: ["dental həkim", "diş həkimi", "ortodont", "implantoloq", "Bakı həkim"],
});

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; spec?: string; city?: string }>;
}) {
  const sp = await searchParams;
  const filters = {
    q: sp.q?.trim() || undefined,
    spec: sp.spec || undefined,
    city: sp.city || undefined,
  };
  const [doctors, locale] = await Promise.all([getApprovedDoctors(filters), getLocale()]);
  const t = getDict(locale).doctors;
  const ru = locale === "ru";

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: t.title, path: "/hekimler" },
        ])}
      />
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        breadcrumbs={[{ name: t.title }]}
      />

      <Section className="py-12">
        <Container>
          <form method="get" className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto]">
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder={ru ? "Ad, soyad və ya klinika" : "Ad, soyad və ya klinika"}
              className="h-11 rounded-xl border border-slate-200 px-3 text-sm"
            />
            <select name="spec" defaultValue={sp.spec ?? ""} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="">{ru ? "Все специализации" : "Bütün ixtisaslar"}</option>
              {DENTAL_SPECIALIZATIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select name="city" defaultValue={sp.city ?? ""} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
              <option value="">{ru ? "Все города" : "Bütün şəhərlər"}</option>
              {CITIES.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
            <button type="submit" className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">
              <Search className="h-4 w-4" /> {ru ? "Поиск" : "Axtar"}
            </button>
          </form>

          {doctors.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {doctors.map((doc) => (
                <DoctorCard key={doc.id} doctor={doc} locale={locale} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Stethoscope className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="font-display mt-4 text-xl font-bold text-ink-900">
                {t.empty}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                {t.emptyDesc}
              </p>
              <ButtonLink href="/hekimler-ucun" className="mt-6">
                {t.joinCta}
              </ButtonLink>
            </Card>
          )}
        </Container>
      </Section>
    </>
  );
}
