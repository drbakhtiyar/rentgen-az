import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  PhoneCall,
  ShieldCheck,
  Building2,
  Stethoscope,
  ScanLine,
  MapPin,
  ArrowRight,
  HeartPulse,
  MessageCircle,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { JsonLd } from "@/components/ui/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";
import { getPlatformStats, getActiveServices } from "@/lib/queries";
import { getLocale } from "@/lib/i18n-server";

/**
 * Haqqımızda (2026-08-16, istifadəçi istəyi) — layihə haqqında animasiyalı
 * təqdimat səhifəsi. Impilo dilində: tünd iris hero, pearl bölmələr, mövcud
 * CSS animasiya köməkçiləri (fade-up, beam-ring, chip-sheen, card-lift,
 * marquee). Rəqəmlər CANLI bazadan gəlir — heç nə uydurulmur.
 */

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const ru = (await getLocale()) === "ru";
  return {
    title: ru ? "О нас — rentgen.az" : "Haqqımızda — rentgen.az",
    description: ru
      ? "rentgen.az — платформа медицинской визуализации Азербайджана: проверенные центры, реальные цены, прямая связь."
      : "rentgen.az — Azərbaycanın tibbi görüntüləmə platforması: təsdiqlənmiş mərkəzlər, real qiymətlər, birbaşa əlaqə.",
    alternates: { canonical: "/haqqimizda" },
  };
}

export default async function AboutPage() {
  const locale = await getLocale();
  const ru = locale === "ru";
  const [stats, services] = await Promise.all([getPlatformStats(), getActiveServices()]);

  const t = ru
    ? {
        eyebrow: "О ПРОЕКТЕ",
        title: "Медицинская визуализация — прозрачно и в одном месте",
        lead: "rentgen.az объединяет центры рентгена, КТ, МРТ, УЗИ, маммографии и дентальной томографии Азербайджана на одной платформе — с реальными ценами и прямой связью.",
        misTitle: "Наша миссия",
        mis1: "Пациенту, которому назначено обследование, обычно приходится обзванивать центры, сравнивать цены и искать адреса вслепую. Мы собрали всё это в одном месте.",
        mis2: "Каждый центр на платформе проходит проверку: название, адрес, услуги и контакты подтверждаются до публикации. Цены публикуют сами центры.",
        mis3: "Платформа бесплатна для пациентов. Звонок или сообщение в WhatsApp идёт напрямую в центр — без посредников и наценок.",
        numTitle: "Платформа в цифрах",
        numDesc: "Данные обновляются в реальном времени.",
        nCenters: "проверенных центров",
        nServices: "видов услуг",
        nCities: "городов и районов",
        nDoctors: "врачей",
        howTitle: "Как это работает",
        how: [
          ["Найдите", "Выберите услугу и район — сравните центры, цены и рейтинги."],
          ["Свяжитесь", "Позвоните или напишите в WhatsApp прямо со страницы центра."],
          ["Пройдите обследование", "Придите в выбранный центр — без переплат и посредников."],
        ],
        whoTitle: "Для кого платформа",
        who: [
          ["Пациентам", "Быстрый поиск ближайшего центра с нужной услугой и понятной ценой.", Search],
          ["Центрам", "Страница центра, приём заявок, статистика и CRM для записи пациентов.", Building2],
          ["Врачам", "Направление пациентов в партнёрские центры и отслеживание результатов.", Stethoscope],
        ],
        trustTitle: "Почему нам доверяют",
        trust: [
          ["Проверенные данные", "Центры публикуются только после проверки — случайных записей нет.", ShieldCheck],
          ["Реальные цены", "Цены указывают сами центры и обновляют их.", ScanLine],
          ["Прямая связь", "Никаких колл-центров: вы общаетесь с центром напрямую.", PhoneCall],
          ["Вся страна", "От Баку до регионов — карта покрытия постоянно растёт.", MapPin],
        ],
        ctaTitle: "Найдите свой центр прямо сейчас",
        ctaDesc: "Поиск по услуге, городу и цене — бесплатно.",
        ctaBtn: "Все центры",
        ctaBtn2: "Связаться с нами",
        company: "Проект компании Axiora.",
      }
    : {
        eyebrow: "LAYİHƏ HAQQINDA",
        title: "Tibbi görüntüləmə — şəffaf və bir yerdə",
        lead: "rentgen.az Azərbaycanın rentgen, KT, MRT, USM, mammoqrafiya və dental tomoqrafiya mərkəzlərini bir platformada birləşdirir — real qiymətlər və birbaşa əlaqə ilə.",
        misTitle: "Missiyamız",
        mis1: "Müayinə təyin olunan pasiyent adətən mərkəzləri bir-bir zəngləyir, qiymətləri soruşur, ünvanları kor-koranə axtarır. Biz bunların hamısını bir yerə yığdıq.",
        mis2: "Platformadakı hər mərkəz yoxlamadan keçir: ad, ünvan, xidmətlər və əlaqə məlumatları dərc olunmazdan əvvəl təsdiqlənir. Qiymətləri mərkəzlər özləri yazır.",
        mis3: "Platforma pasiyentlər üçün pulsuzdur. Zəng və ya WhatsApp mesajı birbaşa mərkəzə gedir — vasitəçisiz və əlavə haqqsız.",
        numTitle: "Platforma rəqəmlərlə",
        numDesc: "Məlumatlar canlı bazadan gəlir və daim yenilənir.",
        nCenters: "təsdiqlənmiş mərkəz",
        nServices: "xidmət növü",
        nCities: "şəhər və rayon",
        nDoctors: "həkim",
        howTitle: "Necə işləyir",
        how: [
          ["Tapın", "Xidməti və rayonu seçin — mərkəzləri, qiymətləri və reytinqləri müqayisə edin."],
          ["Əlaqə saxlayın", "Mərkəzin səhifəsindən birbaşa zəng edin və ya WhatsApp yazın."],
          ["Müayinədən keçin", "Seçdiyiniz mərkəzə gedin — artıq ödənişsiz, vasitəçisiz."],
        ],
        whoTitle: "Platforma kimlər üçündür",
        who: [
          ["Pasiyentlər", "Lazımi xidməti göstərən ən yaxın mərkəzi aydın qiymətlə tez tapmaq.", Search],
          ["Mərkəzlər", "Mərkəz səhifəsi, müraciət qəbulu, statistika və randevu üçün CRM.", Building2],
          ["Həkimlər", "Pasiyentləri tərəfdaş mərkəzlərə göndərmək və nəticələri izləmək.", Stethoscope],
        ],
        trustTitle: "Niyə bizə etibar edirlər",
        trust: [
          ["Yoxlanılmış məlumat", "Mərkəzlər yalnız yoxlamadan sonra dərc olunur — təsadüfi qeyd yoxdur.", ShieldCheck],
          ["Real qiymətlər", "Qiymətləri mərkəzlər özləri yazır və yeniləyir.", ScanLine],
          ["Birbaşa əlaqə", "Heç bir çağrı mərkəzi yoxdur: mərkəzlə birbaşa danışırsınız.", PhoneCall],
          ["Bütün ölkə", "Bakıdan bölgələrə — əhatə xəritəsi daim genişlənir.", MapPin],
        ],
        ctaTitle: "Mərkəzinizi indi tapın",
        ctaDesc: "Xidmətə, şəhərə və qiymətə görə axtarış — pulsuz.",
        ctaBtn: "Bütün mərkəzlər",
        ctaBtn2: "Bizimlə əlaqə",
        company: "Axiora şirkətinin layihəsidir.",
      };

  const prefix = ru ? "/ru" : "";
  const metrics: [string, string, typeof Building2][] = [
    [`${stats.approvedCenters}`, t.nCenters, Building2],
    [`${services.length}`, t.nServices, ScanLine],
    [`${stats.cities}`, t.nCities, MapPin],
    [`${stats.doctors}`, t.nDoctors, Stethoscope],
  ];
  const marquee = services.slice(0, 16).map((s) => s.shortName ?? s.name);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: ru ? "Главная" : "Ana səhifə", path: "/" },
          { name: ru ? "О нас" : "Haqqımızda", path: "/haqqimizda" },
        ])}
      />

      {/* ============ HERO — tünd iris, nəbz vuran nişan ============ */}
      <section className="relative overflow-hidden bg-observatory text-white">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-20" />
        <div className="pointer-events-none absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-iris-glow/40 blur-[80px]" />
        <Container className="relative py-20 sm:py-28 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
          <div>
            <span className="animate-fade-up inline-flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.16em] text-clinical">
              <HeartPulse className="h-4 w-4" /> {t.eyebrow}
            </span>
            <h1 className="animate-fade-up delay-100 font-display mt-4 max-w-2xl text-4xl font-semibold leading-[1.08] tracking-[-0.02em] sm:text-5xl">
              {t.title}
            </h1>
            <p className="animate-fade-up delay-200 mt-6 max-w-xl text-lg leading-relaxed text-ash-2">
              {t.lead}
            </p>
            <p className="animate-fade-up delay-300 mt-4 text-sm text-pearl/60">{t.company}</p>
          </div>

          {/* Nəbz vuran loqo emblemi — hero ikonlarının dili ilə */}
          <div className="animate-fade-up delay-300 mt-12 hidden lg:mt-0 lg:block">
            <div className="relative h-64 w-64">
              <div className="absolute inset-4 rounded-full bg-clinical/15 blur-3xl motion-safe:animate-[halo-breathe_5s_ease-in-out_infinite]" />
              <div className="absolute inset-0 rounded-full border border-clinical/25 motion-safe:animate-[spin_26s_linear_infinite]">
                <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-clinical shadow-[0_0_14px_3px_rgba(0,177,255,0.8)]" />
              </div>
              <div className="absolute inset-4 rounded-full border border-dashed border-iris-veil/40 motion-safe:animate-[spin_38s_linear_infinite_reverse]" />
              <div className="absolute inset-9 rounded-full border-2 border-transparent border-t-mint-vital/50 motion-safe:animate-[spin_16s_linear_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/mark-square.png"
                  alt="rentgen.az"
                  width={112}
                  height={112}
                  className="h-28 w-28 rounded-3xl shadow-[0_0_40px_rgba(0,177,255,0.35)] motion-safe:animate-floaty"
                />
              </div>
            </div>
          </div>
        </Container>

        {/* Xidmət lenti — sonsuz axan marquee */}
        <div className="relative border-t border-white/10 py-4">
          <div className="flex overflow-hidden">
            <div className="animate-marquee flex shrink-0 items-center gap-8 pr-8">
              {[...marquee, ...marquee].map((name, i) => (
                <span key={i} className="flex items-center gap-2 whitespace-nowrap text-sm text-pearl/50">
                  <span className="h-1 w-1 rounded-full bg-clinical/60" /> {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ MİSSİYA — pearl, üç abzas ============ */}
      <section className="bg-pearl py-16 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-16">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-ink-900 sm:text-4xl">
              {t.misTitle}
            </h2>
            <div className="max-w-2xl space-y-5 text-[17px] leading-relaxed text-slate-600">
              <p>{t.mis1}</p>
              <p>{t.mis2}</p>
              <p>{t.mis3}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* ============ RƏQƏMLƏR — tünd iris metrik lenti ============ */}
      <section className="bg-iris-canvas py-16 text-white sm:py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                {t.numTitle}
              </h2>
              <p className="mt-3 text-ash-2">{t.numDesc}</p>
            </div>
            <span className="flex items-center gap-2 rounded-full border border-mint-vital/40 px-3 py-1 text-xs font-medium text-mint-vital">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint-vital" /> LIVE
            </span>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {metrics.map(([value, label, Icon]) => (
              <div
                key={label}
                className="card-lift rounded-3xl bg-iris-shadow p-6 ring-1 ring-iris-border"
              >
                <Icon className="h-6 w-6 text-clinical" />
                <div className="font-display mt-4 text-4xl font-semibold tabular-nums text-white sm:text-5xl">
                  {value}
                </div>
                <div className="mt-1 text-sm text-ash-2">{label}</div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ NECƏ İŞLƏYİR — 3 addım ============ */}
      <section className="bg-pearl py-16 sm:py-20">
        <Container>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-ink-900 sm:text-4xl">
            {t.howTitle}
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {t.how.map(([step, desc], i) => (
              <div key={step} className="card-lift relative rounded-3xl bg-white p-7 ring-1 ring-slate-200">
                <span className="font-display absolute -top-5 left-7 flex h-10 w-10 items-center justify-center rounded-full bg-iris-glow text-lg font-semibold text-white shadow-[0_10px_24px_-8px_rgba(64,60,213,0.6)]">
                  {i + 1}
                </span>
                <h3 className="font-display mt-3 text-lg font-semibold text-ink-900">{step}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ KİMLƏR ÜÇÜN — tünd kartlar ============ */}
      <section className="bg-iris-canvas py-16 text-white sm:py-20">
        <Container>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            {t.whoTitle}
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {t.who.map(([title, desc, Icon]) => (
              <div
                key={title as string}
                className="group card-lift rounded-3xl bg-iris-shadow p-7 ring-1 ring-iris-border transition-colors hover:ring-iris-veil"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-clinical ring-1 ring-iris-border transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display mt-5 text-lg font-semibold">{title as string}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ash-2">{desc as string}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ ETİBAR — pearl, 4 sütun ============ */}
      <section className="bg-pearl py-16 sm:py-20">
        <Container>
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-ink-900 sm:text-4xl">
            {t.trustTitle}
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.trust.map(([title, desc, Icon]) => (
              <div key={title as string} className="card-lift rounded-3xl bg-white p-6 ring-1 ring-slate-200">
                <Icon className="h-6 w-6 text-iris-glow" />
                <h3 className="font-display mt-4 font-semibold text-ink-900">{title as string}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc as string}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ============ CTA — tünd iris ============ */}
      <section className="relative overflow-hidden bg-observatory py-16 text-white sm:py-20">
        <div className="pointer-events-none absolute left-1/3 top-0 h-64 w-64 rounded-full bg-clinical/15 blur-[70px]" />
        <Container className="relative text-center">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            {t.ctaTitle}
          </h2>
          <p className="mt-3 text-ash-2">{t.ctaDesc}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <ButtonLink href={`${prefix}/rentgen-merkezleri`} className="chip-sheen">
              {t.ctaBtn} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <Link
              href={`${prefix}/elaqe`}
              className="flex items-center gap-2 rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <MessageCircle className="h-4 w-4" /> {t.ctaBtn2}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
