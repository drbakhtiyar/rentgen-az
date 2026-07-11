import type { Metadata } from "next";
import Link from "next/link";
import { Stethoscope, Search, ShieldCheck, Clock, Users, Send, ArrowRight } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
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
  const fd = getDict(locale).forDoctors;
  const ru = locale === "ru";

  const advantages = [
    { icon: <ShieldCheck />, h: fd.f1t, d: fd.f1d },
    { icon: <Clock />, h: fd.f2t, d: fd.f2d },
    { icon: <Users />, h: fd.f3t, d: fd.f3d },
  ];

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
      >
        <ButtonLink href="/giris?role=doctor" variant="primary">
          {fd.registerCta} <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </PageHeader>

      {/* For doctors — advantages + join CTA (merged from the old /hekimler-ucun) */}
      <Section className="py-10">
        <Container>
          <div className="rounded-2xl border border-slate-200 bg-surface p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{fd.eyebrow}</p>
                <h2 className="font-display mt-1 text-2xl font-bold text-ink-900">
                  {ru ? "Вы врач? Присоединяйтесь к платформе" : "Həkimsiniz? Platformamıza qoşulun"}
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {advantages.map((a) => (
                <Card key={a.h} className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 [&>svg]:h-5 [&>svg]:w-5">
                    {a.icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-ink-900">{a.h}</h3>
                    <p className="mt-0.5 text-xs text-slate-600">{a.d}</p>
                  </div>
                </Card>
              ))}
              {/* CTA card (replaces the old referral form) */}
              <Link
                href="/giris?role=doctor"
                className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-600 p-4 text-white transition-transform hover:-translate-y-0.5"
              >
                <Send className="h-5 w-5" />
                <div className="mt-3">
                  <h3 className="text-sm font-bold">
                    {ru ? "Отправьте первого пациента" : "İlk pasiyentinizi göndərin"}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-white/90">
                    {ru ? "Зарегистрируйтесь" : "Qeydiyyatdan keçin"} <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </div>
              </Link>
            </div>
          </div>

          <form method="get" className="mb-8 mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto]">
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
              <ButtonLink href="/giris?role=doctor" className="mt-6">
                {t.joinCta}
              </ButtonLink>
            </Card>
          )}
        </Container>
      </Section>
    </>
  );
}
