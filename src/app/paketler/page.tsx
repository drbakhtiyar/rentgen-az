import type { Metadata } from "next";
import {
  Sparkles,
  Star,
  Crown,
  Gem,
  Building2,
  Stethoscope,
  Check,
  HardDrive,
  Info,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo";
import { CENTER_FEATURES, DOCTOR_FEATURES } from "@/content/plan-features";
import { getLocale } from "@/lib/i18n-server";
import type { Locale } from "@/lib/i18n";

// Hidden internal draft — not linked in nav/footer, excluded from sitemap, noindex.
export const metadata: Metadata = buildMetadata({
  title: "İstifadə paketləri (daxili qaralama)",
  description: "Mərkəzlər və həkimlər üçün paket qiymətləri və imkanları — daxili baxış üçün.",
  path: "/paketler",
  noIndex: true,
});

type Tier = {
  name: string;
  price: string;
  period: string;
  tagline: string;
  icon: React.ReactNode;
  accent: string; // tailwind classes for the header band
  popular?: boolean;
  features: string[];
};

const PT = {
  az: {
    eyebrow: "Daxili qaralama",
    title: "İstifadə paketləri",
    description:
      "Mərkəzlər və həkimlər üçün paket qiymətləri və imkanları. Bu səhifə hələ saytda görünmür — yalnız daxili baxış üçündür.",
    crumb: "Paketlər",
    period: "AZN / ay",
    popular: "Ən populyar",
    noteLabel: "Qeyd:",
    note: "qiymətlər və imkanlar müzakirə mərhələsindədir (nümunə rəqəmlərdir). Ödəniş sistemi hələ aktiv deyil — Payriff müqaviləsi tamamlandıqdan sonra işə düşəcək. Əsas gəlir modeli: mərkəzlərə bulud storage satışı.",
    centersHeading: "Rentgen mərkəzləri üçün",
    centersStorage: "Storage dolduqca +blok alına və ya köhnə fayllar silinə bilər.",
    doctorsHeading: "Həkimlər üçün",
    doctorsStorage: "Həkim profili, yönləndirmə alətləri və pasiyent görüntüləri üçün storage.",
    centerTag: {
      FREE: "Başlamaq üçün — platformada görün",
      SILVER: "Aktiv mərkəzlər üçün",
      GOLD: "Ən çox seçilən — görünürlük + storage",
      PLATINUM: "Böyük mərkəzlər üçün maksimum",
    },
    doctorTag: {
      FREE: "Həkim profili və pasiyent yönləndirmə",
      SILVER: "Profilini gücləndir",
      GOLD: "Ən çox seçilən",
      PLATINUM: "Maksimum görünürlük",
    },
  },
  ru: {
    eyebrow: "Внутренний черновик",
    title: "Пакеты",
    description:
      "Цены и возможности пакетов для центров и врачей. Эта страница пока не видна на сайте — только для внутреннего просмотра.",
    crumb: "Пакеты",
    period: "AZN / мес.",
    popular: "Самый популярный",
    noteLabel: "Примечание:",
    note: "цены и возможности на стадии обсуждения (примерные цифры). Платёжная система пока не активна — заработает после заключения договора с Payriff. Основная модель дохода: продажа облачного хранилища центрам.",
    centersHeading: "Для рентген-центров",
    centersStorage: "По мере заполнения хранилища можно докупить блок или удалить старые файлы.",
    doctorsHeading: "Для врачей",
    doctorsStorage: "Профиль врача, инструменты направления и хранилище для снимков пациентов.",
    centerTag: {
      FREE: "Для старта — присутствие на платформе",
      SILVER: "Для активных центров",
      GOLD: "Самый популярный — видимость + хранилище",
      PLATINUM: "Максимум для крупных центров",
    },
    doctorTag: {
      FREE: "Профиль врача и направление пациентов",
      SILVER: "Усильте свой профиль",
      GOLD: "Самый популярный",
      PLATINUM: "Максимальная видимость",
    },
  },
} as const;

function buildCenterTiers(locale: Locale): Tier[] {
  const t = PT[locale];
  const f = CENTER_FEATURES[locale];
  return [
    { name: "Free", price: "0", period: t.period, tagline: t.centerTag.FREE, icon: <Sparkles className="h-5 w-5" />, accent: "text-slate-600 bg-slate-100", features: f.FREE },
    { name: "Silver", price: "39", period: t.period, tagline: t.centerTag.SILVER, icon: <Star className="h-5 w-5" />, accent: "text-slate-700 bg-gradient-to-br from-slate-200 to-slate-100", features: f.SILVER },
    { name: "Gold", price: "99", period: t.period, tagline: t.centerTag.GOLD, icon: <Crown className="h-5 w-5" />, accent: "text-amber-700 bg-gradient-to-br from-amber-200 to-amber-100", popular: true, features: f.GOLD },
    { name: "Platinum", price: "198", period: t.period, tagline: t.centerTag.PLATINUM, icon: <Gem className="h-5 w-5" />, accent: "text-cyan-700 bg-gradient-to-br from-cyan-200 to-cyan-100", features: f.PLATINUM },
  ];
}

function buildDoctorTiers(locale: Locale): Tier[] {
  const t = PT[locale];
  const f = DOCTOR_FEATURES[locale];
  return [
    { name: "Free", price: "0", period: t.period, tagline: t.doctorTag.FREE, icon: <Sparkles className="h-5 w-5" />, accent: "text-slate-600 bg-slate-100", features: f.FREE },
    { name: "Silver", price: "19", period: t.period, tagline: t.doctorTag.SILVER, icon: <Star className="h-5 w-5" />, accent: "text-slate-700 bg-gradient-to-br from-slate-200 to-slate-100", features: f.SILVER },
    { name: "Gold", price: "49", period: t.period, tagline: t.doctorTag.GOLD, icon: <Crown className="h-5 w-5" />, accent: "text-amber-700 bg-gradient-to-br from-amber-200 to-amber-100", popular: true, features: f.GOLD },
    { name: "Platinum", price: "99", period: t.period, tagline: t.doctorTag.PLATINUM, icon: <Gem className="h-5 w-5" />, accent: "text-cyan-700 bg-gradient-to-br from-cyan-200 to-cyan-100", features: f.PLATINUM },
  ];
}

function TierCard({ tier, popularLabel }: { tier: Tier; popularLabel: string }) {
  return (
    <Card
      className={
        tier.popular
          ? "relative flex flex-col ring-2 ring-amber-400"
          : "relative flex flex-col"
      }
    >
      {tier.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge tone="amber">{popularLabel}</Badge>
        </span>
      )}
      <div className="p-5 sm:p-6">
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tier.accent}`}
        >
          {tier.icon}
        </span>
        <h3 className="mt-3 text-lg font-bold text-ink-900">{tier.name}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{tier.tagline}</p>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="font-display text-4xl font-bold text-ink-900">{tier.price}</span>
          <span className="text-sm text-slate-500">{tier.period}</span>
        </div>
      </div>
      <div className="border-t border-slate-100 p-5 sm:p-6">
        <ul className="space-y-2.5">
          {tier.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export default async function PackagesPage() {
  const locale = await getLocale();
  const t = PT[locale];
  const centerTiers = buildCenterTiers(locale);
  const doctorTiers = buildDoctorTiers(locale);

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        breadcrumbs={[{ name: t.crumb }]}
      />

      <Section>
        <Container>
          <div className="mx-auto mb-10 flex max-w-3xl items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <Info className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <strong>{t.noteLabel}</strong> {t.note}
            </p>
          </div>

          {/* --------- Mərkəzlər üçün --------- */}
          <div className="mb-3 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-cyan-600" />
            <h2 className="font-display text-2xl font-bold text-ink-900">
              {t.centersHeading}
            </h2>
          </div>
          <p className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
            <HardDrive className="h-4 w-4" />
            {t.centersStorage}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {centerTiers.map((tier) => (
              <TierCard key={tier.name} tier={tier} popularLabel={t.popular} />
            ))}
          </div>

          {/* --------- Həkimlər üçün --------- */}
          <div className="mb-3 mt-16 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-cyan-600" />
            <h2 className="font-display text-2xl font-bold text-ink-900">{t.doctorsHeading}</h2>
          </div>
          <p className="mb-6 text-sm text-slate-500">
            {t.doctorsStorage}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {doctorTiers.map((tier) => (
              <TierCard key={tier.name} tier={tier} popularLabel={t.popular} />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
