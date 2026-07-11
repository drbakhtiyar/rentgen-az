import type { Metadata } from "next";
import {
  Search,
  Send,
  FileDown,
  MessageSquare,
  ImageIcon,
  Star,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Globe,
  Building2,
  Stethoscope,
  MapPin,
  Users,
  Rocket,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FaqAccordion } from "@/components/faq-accordion";
import { CountUp } from "@/components/join/count-up";
import { getPlatformStats } from "@/lib/queries";
import { getLocale } from "@/lib/i18n-server";
import { DOCTOR_PLAN_PRICE, formatManat } from "@/lib/plans";
import { DOCTOR_FEATURES } from "@/content/plan-features";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Bizə qoşulun — həkimlər üçün",
  description: "Həkim profilinizi Rentgen.az platformasına əlavə edin — pulsuz başlayın.",
  path: "/hekim-qoshul",
  noIndex: true,
});

const REGISTER = "/giris?role=doctor";

type L = "az" | "ru";

const t = {
  eyebrow: { az: "Həkimlər üçün", ru: "Для врачей" },
  title: { az: "Rentgen.az platformasına həkim kimi qoşulun", ru: "Присоединяйтесь как врач к платформе Rentgen.az" },
  subtitle: {
    az: "Pasiyentlər sizi tapsın, pasiyentlərinizi güvəndiyiniz mərkəzlərə yönləndirin, rentgen nəticələrini birbaşa platformadan izləyin. Pulsuz başlayın.",
    ru: "Пациенты находят вас, вы направляете своих пациентов в доверенные центры и отслеживаете рентген-результаты прямо на платформе. Начните бесплатно.",
  },
  ctaPrimary: { az: "Pulsuz qeydiyyatdan keç", ru: "Зарегистрироваться бесплатно" },
  ctaSecondary: { az: "Necə işləyir?", ru: "Как это работает?" },
  trust: {
    az: ["Pulsuz qoşulma", "Təsdiqlənmiş həkim nişanı", "Azərbaycan + rus dilində"],
    ru: ["Бесплатное подключение", "Значок проверенного врача", "На азербайджанском + русском"],
  },
  statsLabel: {
    az: ["Təsdiqlənmiş mərkəz", "Həkim", "Şəhər/rayon", "Xidmət növü"],
    ru: ["Проверенных центров", "Врачей", "Городов/районов", "Видов услуг"],
  },
  whyTitle: { az: "Nə üçün Rentgen.az?", ru: "Почему Rentgen.az?" },
  why: {
    az: [
      { icon: "seo", h: "Google-da tapılın", d: "«rentgen.az» dəqiq uyğun domendir — pasiyentlər sizi axtaranda reklama pul vermədən görünürsünüz." },
      { icon: "send", h: "Pasiyent yönləndirin", d: "Pasiyentinizi partnyor mərkəzə bir kliklə göndərin — pasiyentə OTP təsdiqi gedir, hər şey qeydə alınır." },
      { icon: "file", h: "Nəticələri izləyin", d: "Yönləndirdiyiniz pasiyentin rentgen nəticəsini birbaşa platformadan görün və endirin." },
      { icon: "chat", h: "Mərkəzlərlə çat", d: "Partnyor mərkəzlərlə birbaşa mesajlaşın — telefon nömrəsi paylaşmadan." },
      { icon: "portfolio", h: "Portfolio + reputasiya", d: "İş nümunələrinizi göstərin, təsdiqlənmiş nişanla etibar qazanın." },
      { icon: "star", h: "Statistika", d: "Profil baxışlarını, göndərdiyiniz pasiyentləri və partnyorları izləyin." },
    ],
    ru: [
      { icon: "seo", h: "Вас находят в Google", d: "«rentgen.az» — точное доменное совпадение: вы видны в поиске без затрат на рекламу." },
      { icon: "send", h: "Направляйте пациентов", d: "Отправьте пациента в партнёрский центр в один клик — пациенту идёт OTP-подтверждение, всё фиксируется." },
      { icon: "file", h: "Отслеживайте результаты", d: "Смотрите и скачивайте рентген-результат направленного пациента прямо на платформе." },
      { icon: "chat", h: "Чат с центрами", d: "Общайтесь с партнёрскими центрами напрямую — без обмена номерами телефонов." },
      { icon: "portfolio", h: "Портфолио + репутация", d: "Показывайте примеры работ, завоёвывайте доверие значком проверенного врача." },
      { icon: "star", h: "Статистика", d: "Отслеживайте просмотры профиля, направленных пациентов и партнёров." },
    ],
  },
  seoTitle: { az: "«Rentgen.az» adı Google-da qızıl dəyərindədir", ru: "Название «Rentgen.az» — на вес золота в Google" },
  seoBody: {
    az: "İnsanlar Google-da «rentgen həkimi», «dental həkim Bakı», «implantoloq», «ortodont» axtaranda dəqiq uyğun domen (exact-match) daha yuxarı sıralanır. Bizim platformada profiliniz olduqda bu axtarışlarda təbii şəkildə — bir manat reklam vermədən — görünürsünüz.",
    ru: "Когда люди ищут в Google «рентген-врач», «дентальный врач Баку», «имплантолог», «ортодонт» — точное доменное совпадение ранжируется выше. С профилем на нашей платформе вы появляетесь в этих запросах органически, не платя за рекламу.",
  },
  seoPoints: {
    az: ["Exact-match .az domen", "Hər həkim üçün ayrıca profil səhifəsi", "İxtisas və şəhər üzrə axtarış", "Hazır SEO strukturu"],
    ru: ["Точный .az домен", "Отдельная страница профиля для каждого врача", "Поиск по специализации и городу", "Готовая SEO-структура"],
  },
  stepsTitle: { az: "4 addımda qoşulun", ru: "Подключитесь за 4 шага" },
  steps: {
    az: [
      { h: "Qeydiyyatdan keçin", d: "Telefon nömrəsi və OTP ilə — parol yoxdur." },
      { h: "Profili doldurun", d: "İxtisaslar, klinika, diplom və sertifikatlar." },
      { h: "Təsdiq alın", d: "Admin yoxlamasından sonra «təsdiqlənmiş həkim» kimi görünün." },
      { h: "İşə başlayın", d: "Pasiyentlər sizi tapır, siz mərkəzlərə pasiyent yönləndirirsiniz." },
    ],
    ru: [
      { h: "Зарегистрируйтесь", d: "По номеру телефона и OTP — без пароля." },
      { h: "Заполните профиль", d: "Специализации, клиника, диплом и сертификаты." },
      { h: "Пройдите проверку", d: "После проверки админом вы видны как «проверенный врач»." },
      { h: "Начните работать", d: "Пациенты находят вас, вы направляете пациентов в центры." },
    ],
  },
  plansTitle: { az: "Sizə uyğun paket", ru: "Подходящий вам пакет" },
  plansSub: { az: "Pulsuz başlayın, praktikanız böyüdükcə yüksəldin.", ru: "Начните бесплатно, растите вместе с практикой." },
  perMonth: { az: "/ay", ru: "/мес" },
  popular: { az: "Ən populyar", ru: "Популярный" },
  finalTitle: { az: "Bu gün pulsuz qoşulun", ru: "Присоединяйтесь бесплатно уже сегодня" },
  finalSub: { az: "Bir neçə dəqiqədə qeydiyyat. İlkin ödəniş yoxdur.", ru: "Регистрация за несколько минут. Без первоначальных платежей." },
  faqTitle: { az: "Tez-tez verilən suallar", ru: "Частые вопросы" },
  faq: {
    az: [
      { question: "Qoşulmaq pulludurmu?", answer: "Xeyr. Pulsuz (Free) paketlə başlaya bilərsiniz — heç bir ilkin ödəniş yoxdur. Sonradan istəsəniz paketi yüksəldərsiniz." },
      { question: "Pasiyenti necə yönləndirim?", answer: "Partnyor mərkəzi seçib pasiyentin ad və nömrəsini daxil edirsiniz. Pasiyentə OTP təsdiqi gedir, göndəriş qeydə alınır və nəticə hazır olanda sizə bildiriş gəlir." },
      { question: "Nəticələri görə bilərəmmi?", answer: "Bəli. Yönləndirdiyiniz pasiyentin rentgen nəticəsi hazır olduqda onu birbaşa profilinizdən görə və endirə bilərsiniz (partnyor mərkəzlə əməkdaşlıq təsdiqlənəndə)." },
      { question: "Necə qeydiyyatdan keçirəm?", answer: "Telefon nömrənizi daxil edirsiniz, OTP kod gəlir, təsdiqləyirsiniz — parol lazım deyil. Sonra profili doldurursunuz." },
      { question: "Hansı sənəd lazımdır?", answer: "Diplom və müvafiq sertifikatlar (rezidentura/internatura/uzmanlıq). Bu, pasiyentlərin etibarını təmin edir." },
    ],
    ru: [
      { question: "Подключение платное?", answer: "Нет. Можно начать с бесплатного (Free) пакета — без первоначальных платежей. Позже при желании повысите пакет." },
      { question: "Как направить пациента?", answer: "Выбираете партнёрский центр, вводите имя и номер пациента. Пациенту идёт OTP-подтверждение, направление фиксируется, а когда результат готов — вам приходит уведомление." },
      { question: "Смогу ли я видеть результаты?", answer: "Да. Когда рентген-результат направленного пациента готов, вы можете видеть и скачивать его прямо из профиля (при подтверждённом сотрудничестве с центром)." },
      { question: "Как зарегистрироваться?", answer: "Вводите номер телефона, приходит OTP-код, подтверждаете — пароль не нужен. Затем заполняете профиль." },
      { question: "Какие документы нужны?", answer: "Диплом и соответствующие сертификаты (резидентура/интернатура/специализация). Это обеспечивает доверие пациентов." },
    ],
  },
};

const WHY_ICON: Record<string, React.ReactNode> = {
  seo: <Globe className="h-5 w-5" />,
  send: <Send className="h-5 w-5" />,
  file: <FileDown className="h-5 w-5" />,
  chat: <MessageSquare className="h-5 w-5" />,
  portfolio: <ImageIcon className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
};

const TIERS = ["FREE", "SILVER", "GOLD", "PLATINUM"] as const;

export default async function DoctorJoinPage() {
  const locale = (await getLocale()) as L;
  const stats = await getPlatformStats();

  const statCards = [
    { icon: <Building2 className="h-5 w-5" />, value: stats.approvedCenters, label: t.statsLabel[locale][0] },
    { icon: <Stethoscope className="h-5 w-5" />, value: stats.doctors, label: t.statsLabel[locale][1] },
    { icon: <MapPin className="h-5 w-5" />, value: stats.cities, label: t.statsLabel[locale][2] },
    { icon: <Sparkles className="h-5 w-5" />, value: 8, label: t.statsLabel[locale][3] },
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="glow absolute -left-24 top-0 h-96 w-96 opacity-50" />
        <div className="glow-cyan absolute right-0 top-40 h-96 w-96 opacity-40" />
        <Container className="relative py-20 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-300 backdrop-blur-sm">
              <Rocket className="h-3.5 w-3.5" /> {t.eyebrow[locale]}
            </span>
            <h1 className="font-display mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              {t.title[locale]}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">{t.subtitle[locale]}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href={REGISTER} variant="primary" size="lg">
                {t.ctaPrimary[locale]} <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="#addimlar" variant="outline" size="lg" className="border-white/25 bg-white/5 text-white hover:bg-white/10">
                {t.ctaSecondary[locale]}
              </ButtonLink>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
              {t.trust[locale].map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" /> {s}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* STATS */}
      <Section className="py-10">
        <Container>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  {s.icon}
                </span>
                <p className="font-display mt-3 text-3xl font-bold text-ink-900">
                  <CountUp value={s.value} suffix="+" />
                </p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* WHY */}
      <Section className="bg-surface py-16">
        <Container>
          <h2 className="font-display text-center text-3xl font-bold text-ink-900">{t.whyTitle[locale]}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.why[locale].map((w) => (
              <Card key={w.h} className="p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  {WHY_ICON[w.icon]}
                </span>
                <h3 className="font-display mt-4 text-lg font-bold text-ink-900">{w.h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{w.d}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* SEO SPOTLIGHT */}
      <Section className="py-16">
        <Container>
          <Card className="relative overflow-hidden bg-ink-950 p-8 text-white sm:p-12">
            <div className="absolute inset-0 bg-grid-dark opacity-30" />
            <div className="glow-cyan absolute -right-16 -top-16 h-72 w-72 opacity-40" />
            <div className="relative grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  <Search className="h-3.5 w-3.5" /> SEO
                </span>
                <h2 className="font-display mt-4 text-2xl font-bold sm:text-3xl">{t.seoTitle[locale]}</h2>
                <p className="mt-4 leading-relaxed text-slate-300">{t.seoBody[locale]}</p>
                <div className="mt-6">
                  <ButtonLink href={REGISTER} variant="primary">
                    {t.ctaPrimary[locale]} <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                </div>
              </div>
              <ul className="space-y-3">
                {t.seoPoints[locale].map((p) => (
                  <li key={p} className="flex items-start gap-2.5 rounded-xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </Container>
      </Section>

      {/* STEPS */}
      <Section id="addimlar" className="bg-surface py-16">
        <Container>
          <h2 className="font-display text-center text-3xl font-bold text-ink-900">{t.stepsTitle[locale]}</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.steps[locale].map((s, i) => (
              <div key={s.h} className="relative rounded-2xl border border-slate-200 bg-white p-6">
                <span className="font-display flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="font-display mt-4 text-base font-bold text-ink-900">{s.h}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* PLANS */}
      <Section className="py-16">
        <Container>
          <h2 className="font-display text-center text-3xl font-bold text-ink-900">{t.plansTitle[locale]}</h2>
          <p className="mt-2 text-center text-slate-500">{t.plansSub[locale]}</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => {
              const popular = tier === "GOLD";
              return (
                <div
                  key={tier}
                  className={`relative flex flex-col rounded-2xl border p-6 ${popular ? "border-amber-300 shadow-lg" : "border-slate-200"}`}
                >
                  {popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-ink-900">
                      {t.popular[locale]}
                    </span>
                  )}
                  <p className="font-display text-lg font-bold text-ink-900">
                    {tier === "FREE" ? "Free" : tier[0] + tier.slice(1).toLowerCase()}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-ink-900">
                      {formatManat(DOCTOR_PLAN_PRICE[tier])}
                    </span>
                    <span className="text-sm text-slate-400">{t.perMonth[locale]}</span>
                  </div>
                  <ul className="mt-4 flex-1 space-y-2">
                    {DOCTOR_FEATURES[locale][tier].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink href={REGISTER} variant={popular ? "primary" : "outline"} className="mt-5 w-full justify-center">
                    {t.ctaPrimary[locale]}
                  </ButtonLink>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>

      {/* FAQ */}
      <Section className="bg-surface py-16">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-center text-3xl font-bold text-ink-900">{t.faqTitle[locale]}</h2>
            <div className="mt-8">
              <FaqAccordion items={t.faq[locale]} />
            </div>
          </div>
        </Container>
      </Section>

      {/* FINAL CTA */}
      <Section className="pb-20 pt-4">
        <Container>
          <Card className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-cyan-600 p-10 text-center text-white sm:p-14">
            <div className="absolute inset-0 bg-grid-dark opacity-20" />
            <div className="relative mx-auto max-w-xl">
              <ShieldCheck className="mx-auto h-9 w-9" />
              <h2 className="font-display mt-4 text-3xl font-bold">{t.finalTitle[locale]}</h2>
              <p className="mt-3 text-white/90">{t.finalSub[locale]}</p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <ButtonLink href={REGISTER} size="lg" className="bg-white text-brand-700 hover:bg-slate-100">
                  {t.ctaPrimary[locale]} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-white/80">
                <Users className="h-4 w-4" /> {t.trust[locale][0]}
              </p>
            </div>
          </Card>
        </Container>
      </Section>
    </>
  );
}
