import type { Metadata } from "next";
import {
  Search,
  Phone,
  Stethoscope,
  HardDrive,
  Star,
  BarChart3,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Globe,
  Building2,
  Users,
  MapPin,
  Rocket,
} from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FaqAccordion } from "@/components/faq-accordion";
import { CountUp } from "@/components/join/count-up";
import { getPlatformStats } from "@/lib/queries";
import { getLocale } from "@/lib/i18n-server";
import { CENTER_PLAN_PRICE, formatManat } from "@/lib/plans";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Bizə qoşulun — rentgen mərkəzləri üçün",
  description: "Rentgen mərkəzinizi Rentgen.az platformasına əlavə edin — pulsuz başlayın.",
  path: "/bize-qoshul",
  noIndex: true,
});

const REGISTER = "/giris?role=center";

type L = "az" | "ru";

const t = {
  eyebrow: { az: "Rentgen mərkəzləri üçün", ru: "Для рентген-центров" },
  title: { az: "Azərbaycanın rentgen platformasına qoşulun", ru: "Присоединяйтесь к рентген-платформе Азербайджана" },
  subtitle: {
    az: "Pasiyentlər sizi tapsın, birbaşa zəng və WhatsApp ilə əlaqə saxlasın, rəy yazsın. Pulsuz başlayın — heç bir ilkin ödəniş yoxdur, komissiya almırıq.",
    ru: "Пациенты находят вас, связываются напрямую по звонку и WhatsApp, оставляют отзывы. Начните бесплатно — без первоначальных платежей и комиссий.",
  },
  ctaPrimary: { az: "Pulsuz qeydiyyatdan keç", ru: "Зарегистрироваться бесплатно" },
  ctaSecondary: { az: "Necə işləyir?", ru: "Как это работает?" },
  trust: {
    az: ["Pulsuz qoşulma", "Təsdiqlənmiş mərkəz nişanı", "Azərbaycan + rus dilində"],
    ru: ["Бесплатное подключение", "Значок проверенного центра", "На азербайджанском + русском"],
  },
  statsLabel: {
    az: ["Təsdiqlənmiş mərkəz", "Həkim", "Şəhər/rayon", "Xidmət növü"],
    ru: ["Проверенных центров", "Врачей", "Городов/районов", "Видов услуг"],
  },
  whyTitle: { az: "Nə üçün Rentgen.az?", ru: "Почему Rentgen.az?" },
  why: {
    az: [
      { icon: "seo", h: "Google-da tapılın", d: "«rentgen.az» dəqiq uyğun domendir — pasiyentlər Google-da axtaranda reklama pul vermədən görünürsünüz." },
      { icon: "phone", h: "Birbaşa pasiyent axını", d: "Pasiyent kartınızdan birbaşa zəng və ya WhatsApp yazır — arada vasitəçi yoxdur." },
      { icon: "doctor", h: "Həkim yönləndirmələri", d: "Partnyor həkimlər pasiyentlərini birbaşa sizə yönləndirir." },
      { icon: "storage", h: "Bulud fayl saxlama", d: "Rentgen nəticələrini bulud yaddaşında saxlayın və pasiyent/həkimlə təhlükəsiz paylaşın." },
      { icon: "star", h: "Rəylər və reputasiya", d: "Real pasiyent rəyləri ilə etibar qazanın, yeni pasiyentlər cəlb edin." },
      { icon: "chart", h: "Analitika", d: "Profil baxışları, zənglər və WhatsApp kliklərini görün — biznesinizi ölçün." },
    ],
    ru: [
      { icon: "seo", h: "Вас находят в Google", d: "«rentgen.az» — точное доменное совпадение: вы видны в поиске без затрат на рекламу." },
      { icon: "phone", h: "Прямой поток пациентов", d: "Пациент звонит или пишет в WhatsApp прямо с вашей карточки — без посредников." },
      { icon: "doctor", h: "Направления от врачей", d: "Партнёрские врачи направляют своих пациентов напрямую к вам." },
      { icon: "storage", h: "Облачное хранилище", d: "Храните рентген-снимки в облаке и безопасно делитесь с пациентом и врачом." },
      { icon: "star", h: "Отзывы и репутация", d: "Завоёвывайте доверие реальными отзывами и привлекайте новых пациентов." },
      { icon: "chart", h: "Аналитика", d: "Просмотры профиля, звонки и клики WhatsApp — измеряйте свой бизнес." },
    ],
  },
  seoTitle: { az: "«Rentgen.az» adı Google-da qızıl dəyərindədir", ru: "Название «Rentgen.az» — на вес золота в Google" },
  seoBody: {
    az: "İnsanlar Google-da «rentgen», «rentgen mərkəzi», «dental rentgen Bakı», «CBCT» axtaranda dəqiq uyğun domen (exact-match) daha yuxarı sıralanır. Bizim platformada olduqda siz bu axtarışlarda təbii şəkildə — bir manat reklam vermədən — görünürsünüz. Öz saytınızı sıfırdan Google-da yuxarı çıxarmaq aylar çəkir; biz bunu sizin üçün etmişik.",
    ru: "Когда люди ищут в Google «рентген», «рентген-центр», «дентальный рентген Баку», «КЛКТ» — точное доменное совпадение ранжируется выше. На нашей платформе вы появляетесь в этих запросах органически, не платя за рекламу. Вывести собственный сайт в топ Google — это месяцы; мы уже сделали это за вас.",
  },
  seoPoints: {
    az: ["Exact-match .az domen", "Hazır SEO strukturu (sitemap, JSON-LD)", "Hər mərkəz üçün ayrıca səhifə", "Xidmət və rayon üzrə axtarış"],
    ru: ["Точный .az домен", "Готовая SEO-структура (sitemap, JSON-LD)", "Отдельная страница для каждого центра", "Поиск по услуге и району"],
  },
  stepsTitle: { az: "4 addımda qoşulun", ru: "Подключитесь за 4 шага" },
  steps: {
    az: [
      { h: "Qeydiyyatdan keçin", d: "Telefon nömrəsi və OTP ilə — parol yoxdur." },
      { h: "Profili doldurun", d: "Xidmətlər, qiymətlər, iş saatları və rentgenologiya lisenziyası." },
      { h: "Təsdiq alın", d: "Admin yoxlamasından sonra saytda «təsdiqlənmiş» statusu ilə görünün." },
      { h: "Pasiyent qəbul edin", d: "Pasiyentlər sizi tapıб birbaşa əlaqə saxlayır." },
    ],
    ru: [
      { h: "Зарегистрируйтесь", d: "По номеру телефона и OTP — без пароля." },
      { h: "Заполните профиль", d: "Услуги, цены, часы работы и лицензия на рентгенологию." },
      { h: "Пройдите проверку", d: "После проверки админом вы появляетесь со статусом «проверено»." },
      { h: "Принимайте пациентов", d: "Пациенты находят вас и связываются напрямую." },
    ],
  },
  plansTitle: { az: "Sizə uyğun paket", ru: "Подходящий вам пакет" },
  plansSub: { az: "Pulsuz başlayın, biznesiniz böyüdükcə yüksəldin.", ru: "Начните бесплатно, растите вместе с бизнесом." },
  perMonth: { az: "/ay", ru: "/мес" },
  popular: { az: "Ən populyar", ru: "Популярный" },
  tierFeatures: {
    az: {
      FREE: ["Baza profil + xidmətlər", "30 GB bulud storage", "Pasiyent müraciətləri", "Zəng / WhatsApp düymələri"],
      SILVER: ["Free-dəki hər şey +", "150 GB storage", "Axtarışda prioritet", "Analitika paneli"],
      GOLD: ["Silver +", "1 TB storage", "«Tövsiyə olunan» nişanı", "Rəylər + həkim yönləndirmələri"],
      PLATINUM: ["Gold +", "3 TB storage", "TOP #1 yerləşdirmə", "Brendinq + export/API"],
    },
    ru: {
      FREE: ["Базовый профиль + услуги", "30 ГБ облака", "Заявки пациентов", "Кнопки звонок / WhatsApp"],
      SILVER: ["Всё из Free +", "150 ГБ хранилища", "Приоритет в поиске", "Панель аналитики"],
      GOLD: ["Silver +", "1 ТБ хранилища", "Значок «Рекомендуем»", "Отзывы + направления врачей"],
      PLATINUM: ["Gold +", "3 ТБ хранилища", "ТОП #1 размещение", "Брендинг + экспорт/API"],
    },
  },
  finalTitle: { az: "Bu gün pulsuz qoşulun", ru: "Присоединяйтесь бесплатно уже сегодня" },
  finalSub: { az: "Bir neçə dəqiqədə qeydiyyat. İlkin ödəniş yoxdur.", ru: "Регистрация за несколько минут. Без первоначальных платежей." },
  faqTitle: { az: "Tez-tez verilən suallar", ru: "Частые вопросы" },
  faq: {
    az: [
      { question: "Qoşulmaq pulludurmu?", answer: "Xeyr. Pulsuz (Free) paketlə başlaya bilərsiniz — heç bir ilkin ödəniş yoxdur. İstəsəniz sonradan daha çox imkan üçün paketi yüksəldərsiniz." },
      { question: "Platforma komissiya alırmı?", answer: "Xeyr. Pasiyent birbaşa sizinlə əlaqə saxlayır, ödəniş və müayinə birbaşa mərkəzinizdə olur — biz araya girmirik." },
      { question: "Necə qeydiyyatdan keçirəm?", answer: "Telefon nömrənizi daxil edirsiniz, OTP kod gəlir, təsdiqləyirsiniz — parol lazım deyil. Sonra profili doldurursunuz." },
      { question: "Nə vaxt saytda görünəcəyəm?", answer: "Profili doldurduqdan və admin yoxlamasından sonra «təsdiqlənmiş mərkəz» statusu ilə dərhal görünürsünüz." },
      { question: "Hansı sənəd lazımdır?", answer: "Rentgenologiya üzrə fəaliyyət lisenziyası. Bu, pasiyentlərin etibarını təmin edir." },
    ],
    ru: [
      { question: "Подключение платное?", answer: "Нет. Можно начать с бесплатного (Free) пакета — без первоначальных платежей. При желании позже повысите пакет ради больших возможностей." },
      { question: "Платформа берёт комиссию?", answer: "Нет. Пациент связывается с вами напрямую, оплата и обследование — в вашем центре. Мы не вмешиваемся." },
      { question: "Как зарегистрироваться?", answer: "Вводите номер телефона, приходит OTP-код, подтверждаете — пароль не нужен. Затем заполняете профиль." },
      { question: "Когда я появлюсь на сайте?", answer: "После заполнения профиля и проверки админом вы сразу видны со статусом «проверенный центр»." },
      { question: "Какие документы нужны?", answer: "Лицензия на рентгенологическую деятельность. Это обеспечивает доверие пациентов." },
    ],
  },
};

const WHY_ICON: Record<string, React.ReactNode> = {
  seo: <Globe className="h-5 w-5" />,
  phone: <Phone className="h-5 w-5" />,
  doctor: <Stethoscope className="h-5 w-5" />,
  storage: <HardDrive className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  chart: <BarChart3 className="h-5 w-5" />,
};

const TIERS = ["FREE", "SILVER", "GOLD", "PLATINUM"] as const;

export default async function JoinPage() {
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
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
              {t.subtitle[locale]}
            </p>
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
                      {CENTER_PLAN_PRICE[tier] === 0 ? (locale === "ru" ? "0 ₼" : "0 ₼") : formatManat(CENTER_PLAN_PRICE[tier])}
                    </span>
                    <span className="text-sm text-slate-400">{t.perMonth[locale]}</span>
                  </div>
                  <ul className="mt-4 flex-1 space-y-2">
                    {t.tierFeatures[locale][tier].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink href={REGISTER} variant={popular ? "primary" : "outline"} className="mt-5 w-full justify-center">
                    {tier === "FREE" ? t.ctaPrimary[locale] : t.ctaPrimary[locale]}
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
