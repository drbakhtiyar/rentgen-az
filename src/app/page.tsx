import Link from "next/link";
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
import { SearchPanel } from "@/components/search-panel";
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
  getRatingsForCenters,
  getCitiesWithCenters,
} from "@/lib/queries";
import { faqJsonLd } from "@/lib/seo";
import { HOME_FAQ } from "@/content/faq";
import { formatDateAz } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";

export const revalidate = 300;

export default async function HomePage() {
  const [centers, posts, stats, counts, searchCities, allServices] = await Promise.all([
    getFeaturedCenters(6),
    getPublishedPosts(3),
    getPlatformStats(),
    countApprovedCentersByService(),
    getCitiesWithCenters(),
    getActiveServices(),
  ]);
  const cityOptions = searchCities.map((c) => ({ value: c, label: c }));
  const serviceOptions = allServices.map((s) => ({ value: s.slug, label: s.name }));

  const locale = await getLocale();
  const d = getDict(locale);
  const searchLabels = { ...d.search, search: d.cta.search };

  const ratings = await getRatingsForCenters(centers.map((c) => c.id));

  const featuredServices = allServices.filter((s) => s.featured).slice(0, 8);

  return (
    <>
      <JsonLd data={faqJsonLd(HOME_FAQ.map((f) => ({ question: f.question, answer: f.answer })))} />

      {/* ---------------- HERO ---------------- */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-grid-dark opacity-50" />
        <div className="glow absolute -left-20 top-0 h-96 w-96 opacity-50" />
        <div className="glow-cyan absolute right-0 top-40 h-96 w-96 opacity-40" />
        <Container className="relative pt-20 pb-16 lg:pt-28 lg:pb-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-300 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                {d.hero.badge}
              </span>
              <h1 className="font-display mt-5 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                {d.hero.titleA}
                <span className="text-gradient">{d.hero.titleHighlight}</span>
                {d.hero.titleB}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
                {d.hero.subtitle}
              </p>

              <div className="mt-7">
                <SearchPanel
                  services={serviceOptions}
                  cities={cityOptions}
                  variant="hero"
                  labels={searchLabels}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" /> {d.hero.f1}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" /> {d.hero.f2}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-cyan-400" /> {d.hero.f3}
                </span>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <HeroVisual />
            </div>
          </div>
        </Container>
      </section>

      {/* ---------------- STATS STRIP ---------------- */}
      <div className="border-b border-slate-200 bg-white">
        <Container>
          <div className="grid grid-cols-2 gap-y-6 divide-slate-200 py-8 sm:grid-cols-3 lg:grid-cols-5">
            <Stat value={`${stats.approvedCenters}`} label={d.home.statCenters} icon={<Building2 className="h-5 w-5" />} />
            <Stat value={`${stats.doctors}`} label={d.home.statDoctors} icon={<Stethoscope className="h-5 w-5" />} />
            <Stat value={`${stats.patients}`} label={d.home.statPatients} icon={<Users className="h-5 w-5" />} />
            <Stat value={`${allServices.length}`} label={d.home.statServices} icon={<ScanLine className="h-5 w-5" />} />
            <Stat value={`${stats.cities}`} label={d.home.statDistricts} icon={<MapPin className="h-5 w-5" />} />
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
            {featuredServices.map((s) => (
              <Link key={s.slug} href={`/xidmetler/${s.slug}`}>
                <Card className="group h-full p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[var(--shadow-glow)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <ServiceIcon name={s.icon} url={s.iconUrl} className="h-6 w-6" />
                  </div>
                  <h3 className="font-display mt-4 text-base font-bold text-ink-900">
                    {s.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {s.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    {counts[s.slug] ? (
                      <Badge tone="cyan">{counts[s.slug]} {d.home.centerCount}</Badge>
                    ) : (
                      <span />
                    )}
                    <span className="flex items-center gap-1 text-sm font-semibold text-brand-600">
                      {d.home.more} <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
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
      <Section id="nece-ishleyir" className="bg-ink-950 text-white">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge tone="cyan">{d.home.hiwBadge}</Badge>
              <h2 className="font-display mt-4 text-3xl font-bold sm:text-4xl">
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
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{step.t}</h3>
                      <p className="text-sm text-slate-400">{step.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <ButtonLink href="/rentgen-merkezleri" className="mt-8">
                {d.home.findCenter} <Search className="h-4 w-4" />
              </ButtonLink>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureTile icon={<Search />} title={d.home.tile1t} text={d.home.tile1d} />
              <FeatureTile icon={<MessageCircle />} title={d.home.tile2t} text={d.home.tile2d} />
              <FeatureTile icon={<ShieldCheck />} title={d.home.tile3t} text={d.home.tile3d} />
              <FeatureTile icon={<Users />} title={d.home.tile4t} text={d.home.tile4d} />
            </div>
          </div>
        </Container>
      </Section>

      {/* ---------------- DOCTORS + CENTERS CTA ---------------- */}
      <Section className="bg-surface">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="relative overflow-hidden p-8">
              <Stethoscope className="absolute -right-4 -top-4 h-28 w-28 text-brand-50" />
              <div className="relative">
                <Badge tone="brand">{d.home.forDoctorsBadge}</Badge>
                <h3 className="font-display mt-4 text-2xl font-bold text-ink-900">
                  {d.home.forDoctorsTitle}
                </h3>
                <p className="mt-3 text-slate-600">
                  {d.home.forDoctorsDesc}
                </p>
                <ButtonLink href="/hekimler-ucun" className="mt-6">
                  {d.home.openReferral} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </Card>

            <Card className="relative overflow-hidden bg-ink-950 p-8 text-white">
              <div className="absolute inset-0 bg-grid-dark opacity-40" />
              <Building2 className="absolute -right-4 -top-4 h-28 w-28 text-white/5" />
              <div className="relative">
                <Badge tone="cyan">{d.home.forCentersBadge}</Badge>
                <h3 className="font-display mt-4 text-2xl font-bold">
                  {d.home.forCentersTitle}
                </h3>
                <p className="mt-3 text-slate-300">
                  {d.home.forCentersDesc}
                </p>
                <ButtonLink href="/merkezler-ucun" variant="primary" className="mt-6">
                  {d.home.addCenter} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
            </Card>
          </div>
        </Container>
      </Section>

      {/* ---------------- SAFETY ---------------- */}
      <Section>
        <Container>
          <Card className="overflow-hidden">
            <div className="grid gap-8 p-8 lg:grid-cols-[auto_1fr] lg:items-center lg:p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Radiation className="h-8 w-8" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-ink-900">
                  {d.home.safetyTitle}
                </h2>
                <p className="mt-3 max-w-3xl text-slate-600">
                  {d.home.safetyText}
                </p>
                <Link
                  href="/blog/dental-rentgen-tehlukelidirmi"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  {d.home.readMore} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      {/* ---------------- FAQ ---------------- */}
      <Section className="bg-surface">
        <Container>
          <SectionHeading eyebrow={d.home.faqEyebrow} title={d.home.faqTitle} />
          <div className="mt-10">
            <FaqAccordion items={HOME_FAQ} />
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
                  <Card className="group h-full p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
                    <p className="text-xs font-medium text-brand-600">
                      {formatDateAz(p.publishedAt)}
                    </p>
                    <h3 className="font-display mt-2 text-lg font-bold text-ink-900 group-hover:text-brand-700">
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                        {p.excerpt}
                      </p>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                      {d.home.read} <ArrowRight className="h-4 w-4" />
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}

      {/* ---------------- FINAL CTA ---------------- */}
      <Section className="pb-24">
        <Container>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-ink-950 px-6 py-14 text-center text-white sm:px-12">
            <div className="absolute inset-0 bg-grid-dark opacity-30" />
            <div className="glow-cyan absolute -right-10 -top-10 h-64 w-64 opacity-50" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                {d.home.finalTitle}
              </h2>
              <p className="mt-4 text-slate-200">
                {d.home.finalDesc}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink href="/rentgen-merkezleri" size="lg" variant="primary">
                  {d.home.findCenter}
                </ButtonLink>
                <ButtonLink href="/giris" size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10">
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
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div>
        <div className="font-display text-2xl font-bold text-ink-900">{value}</div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20 text-cyan-300 [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{text}</p>
    </div>
  );
}
