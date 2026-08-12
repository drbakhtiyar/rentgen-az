import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Search,
  MessageCircle,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Building2,
  Users,
  Sparkles,
  Radiation,
  ScanLine,
  MapPin,
} from "lucide-react";
import { Container, Section, SectionHeading } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceIcon } from "@/components/ui/service-icon";
import { SmartSearch } from "@/components/smart-search";
import { HeroVisual } from "@/components/hero-visual";
import { CenterCard } from "@/components/centers/center-card";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/ui/json-ld";
import {
  getActiveServices,
  getFeaturedCenters,
  getPublishedPosts,
  getPlatformStats,
  countApprovedCentersByService,
  getServiceRequestCounts,
  getRatingsForCenters,
  getCoveredCities,
} from "@/lib/queries";
import { faqJsonLd } from "@/lib/seo";
import { getHomeFaq } from "@/content/faq";
import { formatDateAz } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { pickCrossCategoryRandom } from "@/lib/random-services";

export const revalidate = 300;

/* Dizayn v2 — "canlı və cəsarətli": rəngli bento kartlar, spektr qradiyentləri,
 * mesh fonlar, marquee xidmət lenti. Məlumat məntiqi v1 ilə eynidir. */

// Xidmət kartları və stat çipləri üçün növbələnən rəng paletləri
const SERVICE_TINTS = [
  { chip: "from-brand-500 to-cyan-400", bg: "bg-brand-50/60", ring: "ring-brand-100", hover: "hover:ring-brand-300" },
  { chip: "from-violet-500 to-fuchsia-400", bg: "bg-violet-50/60", ring: "ring-violet-100", hover: "hover:ring-violet-300" },
  { chip: "from-cyan-500 to-teal-400", bg: "bg-cyan-50/60", ring: "ring-cyan-100", hover: "hover:ring-cyan-300" },
  { chip: "from-fuchsia-500 to-pink-400", bg: "bg-fuchsia-50/60", ring: "ring-fuchsia-100", hover: "hover:ring-fuchsia-300" },
];

const STAT_TINTS = [
  "from-brand-500 to-cyan-400",
  "from-violet-500 to-fuchsia-400",
  "from-cyan-500 to-teal-400",
  "from-fuchsia-500 to-pink-400",
  "from-amber-500 to-orange-400",
];

export default async function HomePage() {
  const locale = await getLocale();
  const [centers, posts, stats, counts, , allServices, coveredCities] = await Promise.all([
    getFeaturedCenters(6),
    getPublishedPosts(3, locale),
    getPlatformStats(),
    countApprovedCentersByService(),
    getServiceRequestCounts(),
    getActiveServices(),
    getCoveredCities(),
  ]);
  const d = getDict(locale);
  const homeFaq = getHomeFaq(locale);

  const ratings = await getRatingsForCenters(centers.map((c) => c.id));

  // Hər ziyarətdə TƏSADÜFİ 4 xidmət — hər biri FƏRQLİ kateqoriyadan
  // (istifadəçi qərarı). Yalnız ən azı 1 təsdiqlənmiş mərkəzin təklif etdiyi
  // xidmətlər iştirak edir. Ortaq məntiq: src/lib/random-services.ts.
  const offeredServices = allServices.filter((s) => (counts[s.slug] ?? 0) > 0);
  const featuredServices = pickCrossCategoryRandom(offeredServices, 4);
  // Marquee lenti üçün 14 xidmət (təklif olunanlardan)
  const marqueeServices = offeredServices.slice(0, 14);

  return (
    <>
      <JsonLd data={faqJsonLd(homeFaq.map((f) => ({ question: f.question, answer: f.answer })))} />

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden bg-mesh-dark text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        <div className="blob blob-violet absolute -left-24 -top-24 h-[26rem] w-[26rem]" />
        <div className="blob blob-cyan absolute right-[-6rem] top-24 h-96 w-96" />
        <div className="blob blob-magenta absolute bottom-[-8rem] left-1/3 h-80 w-80 opacity-70" />
        <Container className="relative pt-20 pb-14 lg:pt-28 lg:pb-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-cyan-300 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                {d.hero.badge}
              </span>
              <h1 className="font-display animate-fade-up delay-100 mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[4.2rem]">
                {d.hero.titleA}
                <span className="text-spectrum">{d.hero.titleHighlight}</span>
                {d.hero.titleB}
              </h1>
              <p className="animate-fade-up delay-200 mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
                {d.hero.subtitle}
              </p>

              <div className="animate-fade-up delay-300 mt-7">
                <SmartSearch labels={d.smartSearch} />
              </div>

              <div className="animate-fade-up delay-300 mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" /> {d.hero.f1}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-violet-400" /> {d.hero.f2}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-fuchsia-400" /> {d.hero.f3}
                </span>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroVisual activeCities={coveredCities} />
            </div>
          </div>
        </Container>

        {/* Xidmət lenti — sonsuz marquee */}
        {marqueeServices.length > 5 && (
          <div className="relative border-t border-white/10 bg-white/5 py-3 backdrop-blur-sm">
            <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
              <div className="animate-marquee flex shrink-0 items-center gap-3 pr-3">
                {[...marqueeServices, ...marqueeServices].map((s, i) => (
                  <Link
                    key={`${s.slug}-${i}`}
                    href={`/xidmetler/${s.slug}`}
                    className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:border-cyan-400/40 hover:text-white"
                  >
                    <ServiceIcon name={s.icon} url={s.iconUrl} className="h-4 w-4 text-cyan-300" />
                    {s.shortName ?? s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ---------------- STATS BENTO ---------------- */}
      <div className="bg-mesh-light">
        <Container>
          <div className="grid grid-cols-2 gap-3 py-10 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            <Stat value={`${stats.approvedCenters}`} label={d.home.statCenters} icon={<Building2 />} tint={STAT_TINTS[0]} />
            <Stat value={`${stats.doctors}`} label={d.home.statDoctors} icon={<Stethoscope />} tint={STAT_TINTS[1]} />
            <Stat value={`${stats.patients}`} label={d.home.statPatients} icon={<Users />} tint={STAT_TINTS[2]} />
            <Stat value={`${allServices.length}`} label={d.home.statServices} icon={<ScanLine />} tint={STAT_TINTS[3]} />
            <Stat value={`${stats.cities}`} label={d.home.statDistricts} icon={<MapPin />} tint={STAT_TINTS[4]} />
          </div>
        </Container>
      </div>

      {/* ---------------- SERVICES ---------------- */}
      <Section className="bg-surface">
        <Container>
          <SectionHeading
            eyebrow={d.home.servicesEyebrow}
            title={d.home.servicesTitle}
            description={d.home.servicesDesc}
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredServices.map((s, i) => {
              const t = SERVICE_TINTS[i % SERVICE_TINTS.length];
              return (
                <Link key={s.slug} href={`/xidmetler/${s.slug}`}>
                  <div
                    className={`card-lift group h-full rounded-3xl ${t.bg} p-6 ring-1 ${t.ring} ${t.hover}`}
                  >
                    <div
                      className={`flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-br ${t.chip} p-3 text-white shadow-lg`}
                    >
                      <ServiceIcon name={s.icon} url={s.iconUrl} className="h-6 w-6" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-extrabold tracking-tight text-ink-900">
                      {s.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {s.description}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      {counts[s.slug] ? (
                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-ink-800 ring-1 ring-slate-200">
                          {counts[s.slug]} {d.home.centerCount}
                        </span>
                      ) : (
                        <span />
                      )}
                      <span className="flex items-center gap-1 text-sm font-bold text-brand-600 transition-transform group-hover:translate-x-1">
                        {d.home.more} <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/xidmetler" variant="outline">
              {d.home.allServices} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </Container>
      </Section>

      {/* ---------------- VERIFIED CENTERS ---------------- */}
      <Section>
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              align="left"
              eyebrow={d.home.centersEyebrow}
              title={d.home.centersTitle}
              description={d.home.centersDesc}
            />
            <ButtonLink href="/rentgen-merkezleri" variant="outline" className="shrink-0">
              {d.home.viewAll} <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>

          {centers.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {centers.map((c) => (
                <CenterCard key={c.id} center={c} rating={ratings[c.id]} />
              ))}
            </div>
          ) : (
            <Card className="mt-12 p-10 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="font-display mt-4 text-lg font-bold text-ink-900">
                {d.home.centersEmptyTitle}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {d.home.centersEmptyDesc}
              </p>
              <ButtonLink href="/merkezler-ucun" className="mt-5">
                {d.home.addCenter}
              </ButtonLink>
            </Card>
          )}
        </Container>
      </Section>

      {/* ---------------- HOW IT WORKS (PATIENTS) ---------------- */}
      <Section id="nece-ishleyir" className="relative overflow-hidden bg-mesh-dark text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-30" />
        <div className="blob blob-cyan absolute -right-20 top-0 h-80 w-80 opacity-60" />
        <div className="blob blob-violet absolute -left-24 bottom-0 h-80 w-80 opacity-60" />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge tone="cyan">{d.home.hiwBadge}</Badge>
              <h2 className="font-display mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
                {d.home.hiwTitle}
              </h2>
              <p className="mt-4 text-slate-300">
                {d.home.hiwDesc}
              </p>
              <ol className="mt-8 space-y-5">
                {[
                  { t: d.home.step1t, d: d.home.step1d },
                  { t: d.home.step2t, d: d.home.step2d },
                  { t: d.home.step3t, d: d.home.step3d },
                ].map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${STAT_TINTS[i]} font-display text-sm font-extrabold text-white shadow-lg`}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{step.t}</h3>
                      <p className="text-sm text-slate-400">{step.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <ButtonLink
                href="/rentgen-merkezleri"
                className="bg-spectrum mt-8 border-0 text-white shadow-[0_14px_36px_-12px_rgba(124,58,237,0.8)] hover:opacity-95"
              >
                {d.home.findCenter} <Search className="h-4 w-4" />
              </ButtonLink>
            </div>

            {/* Mobil: 2 sütun + kiçik kartlar (skrol azalır — istifadəçi istəyi) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <FeatureTile icon={<Search />} title={d.home.tile1t} text={d.home.tile1d} tint="from-brand-500/30 to-cyan-400/20" />
              <FeatureTile icon={<MessageCircle />} title={d.home.tile2t} text={d.home.tile2d} tint="from-violet-500/30 to-fuchsia-400/20" />
              <FeatureTile icon={<ShieldCheck />} title={d.home.tile3t} text={d.home.tile3d} tint="from-cyan-500/30 to-teal-400/20" />
              <FeatureTile icon={<Users />} title={d.home.tile4t} text={d.home.tile4d} tint="from-fuchsia-500/30 to-pink-400/20" />
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------- DOCTORS + CENTERS CTA ---------------- */}
      <Section className="bg-mesh-light">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card-lift relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-50 to-brand-50 p-8 ring-1 ring-violet-100">
              <Stethoscope className="absolute -right-4 -top-4 h-28 w-28 text-violet-100" />
              <div className="relative">
                <Badge tone="brand">{d.home.forDoctorsBadge}</Badge>
                <h3 className="font-display mt-4 text-2xl font-extrabold tracking-tight text-ink-900">
                  {d.home.forDoctorsTitle}
                </h3>
                <p className="mt-3 text-slate-600">
                  {d.home.forDoctorsDesc}
                </p>
                <ButtonLink href="/hekimler" className="mt-6">
                  {d.home.openReferral} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>

            <div className="card-lift relative overflow-hidden rounded-3xl bg-mesh-dark p-8 text-white">
              <div className="absolute inset-0 bg-grid-dark opacity-40" />
              <div className="blob blob-cyan absolute -right-10 -top-10 h-48 w-48 opacity-50" />
              <Building2 className="absolute -right-4 -top-4 h-28 w-28 text-white/5" />
              <div className="relative">
                <Badge tone="cyan">{d.home.forCentersBadge}</Badge>
                <h3 className="font-display mt-4 text-2xl font-extrabold tracking-tight">
                  {d.home.forCentersTitle}
                </h3>
                <p className="mt-3 text-slate-300">
                  {d.home.forCentersDesc}
                </p>
                <ButtonLink
                  href="/merkezler-ucun"
                  className="bg-spectrum mt-6 border-0 text-white shadow-[0_14px_36px_-12px_rgba(124,58,237,0.8)] hover:opacity-95"
                >
                  {d.home.addCenter} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------- SAFETY ---------------- */}
      <Section>
        <Container>
          <div className="card-lift overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 ring-1 ring-amber-100">
            <div className="grid gap-8 p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 text-white shadow-lg">
                <Radiation className="h-8 w-8" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink-900">
                  {d.home.safetyTitle}
                </h2>
                <p className="mt-3 max-w-3xl text-slate-600">
                  {d.home.safetyText}
                </p>
                <Link
                  href="/blog/dental-rentgen-tehlukelidirmi"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-amber-700 hover:text-amber-800"
                >
                  {d.home.readMore} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------- FAQ ---------------- */}
      <Section className="bg-mesh-light">
        <Container>
          <SectionHeading eyebrow={d.home.faqEyebrow} title={d.home.faqTitle} />
          <div className="mt-10">
            <FaqAccordion items={homeFaq} />
          </div>
        </Container>
      </Section>

      {/* ---------------- BLOG ---------------- */}
      {posts.length > 0 && (
        <Section>
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SectionHeading align="left" eyebrow={d.home.blogEyebrow} title={d.home.blogTitle} />
              <ButtonLink href="/blog" variant="outline" className="shrink-0">
                {d.home.allPosts} <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {posts.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`}>
                  <article className="card-lift group h-full overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
                    {p.coverImage && (
                      <div className="relative aspect-[1200/630] overflow-hidden">
                        <Image
                          src={p.coverImage}
                          alt={p.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
                        {formatDateAz(p.publishedAt)}
                      </p>
                      <h3 className="font-display mt-2 text-lg font-extrabold tracking-tight text-ink-900 group-hover:text-brand-700">
                        {p.title}
                      </h3>
                      {p.excerpt && (
                        <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                          {p.excerpt}
                        </p>
                      )}
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-600 transition-transform group-hover:translate-x-1">
                        {d.home.read} <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ---------------- FINAL CTA ---------------- */}
      <Section className="pb-24">
        <Container>
          <div className="bg-spectrum relative overflow-hidden rounded-[2.5rem] px-6 py-16 text-center text-white sm:px-12">
            <div className="absolute inset-0 bg-grid-dark opacity-20" />
            <div className="blob blob-cyan absolute -right-10 -top-10 h-64 w-64 opacity-40" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-[2.75rem] sm:leading-[1.1]">
                {d.home.finalTitle}
              </h2>
              <p className="mt-4 text-white/85">
                {d.home.finalDesc}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink
                  href="/rentgen-merkezleri"
                  size="lg"
                  className="bg-white text-ink-900 shadow-xl hover:bg-slate-100"
                >
                  {d.home.findCenter}
                </ButtonLink>
                <ButtonLink
                  href="/giris"
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                >
                  {d.home.registerLogin}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Stat({
  value,
  label,
  icon,
  tint,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
  tint: string;
}) {
  return (
    <div className="card-lift flex items-center gap-3.5 rounded-3xl bg-white p-4 ring-1 ring-slate-200/80">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${tint} text-white shadow-md [&>svg]:h-5 [&>svg]:w-5`}
      >
        {icon}
      </div>
      <div>
        <div className="font-display text-2xl font-extrabold tracking-tight text-ink-900">{value}</div>
        <div className="text-xs font-medium text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  text,
  tint,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  tint: string;
}) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${tint} p-3.5 backdrop-blur-sm sm:p-5`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-white sm:h-10 sm:w-10 sm:rounded-xl [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5">
        {icon}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-white sm:mt-3 sm:text-base">{title}</h3>
      <p className="mt-1 text-xs text-slate-300 sm:text-sm">{text}</p>
    </div>
  );
}
