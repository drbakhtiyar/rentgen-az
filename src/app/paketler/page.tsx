import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Star,
  Crown,
  Gem,
  Building2,
  Stethoscope,
  Check,
  HardDrive,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { PageHeader } from "@/components/page-header";
import { PageHeroVisual, PAGE_HERO } from "@/components/services-hero-visual";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buildMetadata } from "@/lib/seo";
import { CENTER_FEATURES, DOCTOR_FEATURES } from "@/content/plan-features";
import { getLocale } from "@/lib/i18n-server";
import { getCurrentUser } from "@/lib/auth/rbac";
import { AnimatedPrice } from "@/components/animated-price";
import type { Locale } from "@/lib/i18n";

export const metadata: Metadata = buildMetadata({
  title: "İstifadə paketləri — mərkəz və həkim planları",
  description: "Rentgen mərkəzləri və həkimlər üçün abunə paketləri, qiymətlər və imkanlar.",
  path: "/paketler",
});

type Audience = "CENTER" | "DOCTOR";

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
    eyebrow: "Paketlər",
    title: "İstifadə paketləri",
    description:
      "Rentgen mərkəzləri və həkimlər üçün abunə paketləri — görünürlük, storage və alətlər. Balansınızı artırıb istənilən paketi seçə bilərsiniz.",
    crumb: "Paketlər",
    period: "AZN / ay",
    popular: "Ən populyar",
    ctaActive: "Aktiv paketiniz",
    ctaBuy: "Seç və ödə",
    ctaStart: "Qeydiyyatdan keç",
    ctaFree: "Pulsuz başla",
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
    eyebrow: "Пакеты",
    title: "Пакеты",
    description:
      "Подписки для рентген-центров и врачей — видимость, хранилище и инструменты. Пополните баланс и выберите любой пакет.",
    crumb: "Пакеты",
    period: "AZN / мес.",
    popular: "Самый популярный",
    ctaActive: "Ваш активный пакет",
    ctaBuy: "Выбрать и оплатить",
    ctaStart: "Регистрация",
    ctaFree: "Начать бесплатно",
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

type CtaCtx = {
  audience: Audience; // which section this card belongs to
  viewerRole: Audience | null; // logged-in role (or null)
  viewerPlan: string | null; // viewer's current plan enum
  billingPath: string | null; // where to buy
  labels: { active: string; buy: string; start: string; free: string };
};

/** The action button for a tier, based on the logged-in viewer. */
function TierCta({ tier, ctx }: { tier: Tier; ctx: CtaCtx }) {
  const plan = tier.name.toUpperCase(); // Free → FREE …
  const forViewer = ctx.viewerRole === ctx.audience;
  const btnBase =
    "mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold";

  // Logged-in, relevant section.
  if (forViewer) {
    if (ctx.viewerPlan === plan) {
      return (
        <span className={`${btnBase} bg-emerald-50 text-emerald-700`}>
          <CheckCircle2 className="h-4 w-4" /> {ctx.labels.active}
        </span>
      );
    }
    if (plan === "FREE") return null; // can't "buy" the free tier
    return (
      <Link href={`${ctx.billingPath}?plan=${plan}`} className={`${btnBase} bg-iris-pulse text-white hover:bg-iris-glow`}>
        {ctx.labels.buy} <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  // Logged out → register (buy after signup). Other role's section → no button.
  if (ctx.viewerRole === null) {
    const role = ctx.audience === "CENTER" ? "CENTER" : "DOCTOR";
    return (
      <Link
        href={`/giris?role=${role}`}
        className={`${btnBase} ${plan === "FREE" ? "bg-pearl text-iris-canvas ring-1 ring-ash-2 hover:bg-white" : "bg-iris-pulse text-white hover:bg-iris-glow"}`}
      >
        {plan === "FREE" ? ctx.labels.free : ctx.labels.start} <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }
  return null;
}

/* Hər paketin metal kimliyi (2026-08-13 redizayn): Silver gümüşü, Gold qızılı
 * (parıltı zolağı ilə), Platinum buz-platin (nəfəs alan daş). İkonlar hover-də
 * yellənir, qiymət ekrana girəndə 0-dan sayılır. */
const TIER_THEME: Record<
  string,
  { chip: string; iconExtra: string; ring: string; hover: string; name: string; sheen: boolean }
> = {
  Free: {
    chip: "bg-iris-glow/10 text-iris-pulse ring-1 ring-iris-veil/25",
    iconExtra: "",
    ring: "ring-1 ring-ash-2",
    hover: "hover:shadow-[0_24px_60px_-24px_rgba(64,60,213,0.35)] hover:ring-iris-veil/50",
    name: "text-iris-canvas",
    sheen: false,
  },
  Silver: {
    chip: "bg-gradient-to-br from-slate-300 via-slate-100 to-slate-400 text-slate-700 ring-1 ring-slate-300",
    iconExtra: "",
    ring: "ring-1 ring-slate-300",
    hover: "hover:shadow-[0_24px_60px_-24px_rgba(100,116,139,0.55)] hover:ring-slate-400",
    name: "bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 bg-clip-text text-transparent",
    sheen: true,
  },
  Gold: {
    chip: "bg-gradient-to-br from-amber-400 via-yellow-200 to-amber-500 text-amber-900 ring-1 ring-amber-300",
    iconExtra: "",
    ring: "ring-2 ring-amber-300",
    hover: "hover:shadow-[0_24px_60px_-24px_rgba(245,158,11,0.55)] hover:ring-amber-400",
    name: "bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 bg-clip-text text-transparent",
    sheen: true,
  },
  Platinum: {
    chip: "bg-gradient-to-br from-slate-200 via-white to-cyan-200 text-cyan-700 ring-1 ring-cyan-200",
    iconExtra: "gem-breathe",
    ring: "ring-1 ring-cyan-200",
    hover: "hover:shadow-[0_24px_60px_-24px_rgba(34,211,238,0.5)] hover:ring-cyan-300",
    name: "bg-gradient-to-r from-cyan-700 via-slate-500 to-cyan-700 bg-clip-text text-transparent",
    sheen: true,
  },
};

function TierCard({ tier, popularLabel, ctx }: { tier: Tier; popularLabel: string; ctx: CtaCtx }) {
  const isActive = ctx.viewerRole === ctx.audience && ctx.viewerPlan === tier.name.toUpperCase();
  const th = TIER_THEME[tier.name] ?? TIER_THEME.Free;
  return (
    <Card
      className={`group relative flex flex-col rounded-3xl border-0 transition-all duration-300 hover:-translate-y-1.5 ${
        isActive ? "ring-2 ring-emerald-400" : th.ring
      } ${th.hover}`}
    >
      {isActive ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge tone="green">{ctx.labels.active}</Badge>
        </span>
      ) : tier.popular ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge tone="amber" className="shadow-[0_0_16px_rgba(245,158,11,0.45)]">{popularLabel}</Badge>
        </span>
      ) : null}
      <div className="p-5 sm:p-6">
        <span
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${th.chip} ${th.sheen ? "chip-sheen" : ""}`}
        >
          <span className={`icon-wiggle inline-flex ${th.iconExtra}`}>{tier.icon}</span>
        </span>
        <h3 className={`font-display mt-3 text-lg font-semibold tracking-tight ${th.name}`}>{tier.name}</h3>
        <p className="mt-0.5 text-sm text-slate-500">{tier.tagline}</p>
        <div className="mt-4 flex items-baseline gap-1">
          <AnimatedPrice
            value={parseInt(tier.price, 10) || 0}
            className="font-display text-4xl font-semibold tracking-tight text-iris-canvas"
          />
          <span className="text-sm text-slate-500">{tier.period}</span>
        </div>
        <TierCta tier={tier} ctx={ctx} />
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
  const [locale, me] = await Promise.all([getLocale(), getCurrentUser()]);
  const t = PT[locale];
  const centerTiers = buildCenterTiers(locale);
  const doctorTiers = buildDoctorTiers(locale);

  const viewerRole: Audience | null =
    me?.role === "CENTER" ? "CENTER" : me?.role === "DOCTOR" ? "DOCTOR" : null;
  const viewerPlan =
    viewerRole === "CENTER"
      ? me?.centerProfile?.plan ?? null
      : viewerRole === "DOCTOR"
        ? me?.doctorProfile?.plan ?? null
        : null;
  const labels = { active: t.ctaActive, buy: t.ctaBuy, start: t.ctaStart, free: t.ctaFree };
  const centerCtx: CtaCtx = { audience: "CENTER", viewerRole, viewerPlan, billingPath: "/merkez/paket", labels };
  const doctorCtx: CtaCtx = { audience: "DOCTOR", viewerRole, viewerPlan, billingPath: "/hekim/paket", labels };

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.description}
        breadcrumbs={[{ name: t.crumb }]}
        visual={<PageHeroVisual src={PAGE_HERO.pricing} alt={t.title} />}
      />

      <Section>
        <Container>
          {/* Center packages — shown to everyone except a logged-in doctor. */}
          {viewerRole !== "DOCTOR" && (
            <>
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-cyan-600" />
                <h2 className="font-display text-2xl font-bold text-ink-900">{t.centersHeading}</h2>
              </div>
              <p className="mb-6 flex items-center gap-1.5 text-sm text-slate-500">
                <HardDrive className="h-4 w-4" />
                {t.centersStorage}
              </p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {centerTiers.map((tier) => (
                  <TierCard key={tier.name} tier={tier} popularLabel={t.popular} ctx={centerCtx} />
                ))}
              </div>
            </>
          )}

          {/* Doctor packages — shown to everyone except a logged-in center. */}
          {viewerRole !== "CENTER" && (
            <>
              <div className={`mb-3 flex items-center gap-2 ${viewerRole !== "DOCTOR" ? "mt-16" : ""}`}>
                <Stethoscope className="h-6 w-6 text-cyan-600" />
                <h2 className="font-display text-2xl font-bold text-ink-900">{t.doctorsHeading}</h2>
              </div>
              <p className="mb-6 text-sm text-slate-500">{t.doctorsStorage}</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {doctorTiers.map((tier) => (
                  <TierCard key={tier.name} tier={tier} popularLabel={t.popular} ctx={doctorCtx} />
                ))}
              </div>
            </>
          )}
        </Container>
      </Section>
    </>
  );
}
