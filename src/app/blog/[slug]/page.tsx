import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { marked } from "marked";
import { ArrowLeft, ArrowRight, Calendar, Tag } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { JsonLd } from "@/components/ui/json-ld";
import { buildMetadata, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { getPostBySlug, getRelatedPosts, getBlogCategoryCounts } from "@/lib/queries";
import { BLOG_CATEGORIES, blogCategoryName } from "@/lib/blog-categories";
import { findMentionedServices } from "@/lib/blog-services";
import { PLATFORM_WHATSAPP_URL } from "@/lib/constants";
import { formatDateAz } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { blogSlugForLocale } from "@/content/blog-translations";

// The global header reads auth cookies, so all routes render dynamically (SSR).
// Forcing dynamic avoids a static-optimization conflict for this catch-all route.
export const dynamic = "force-dynamic";

marked.setOptions({ gfm: true, breaks: false });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return buildMetadata({ title: "Məqalə tapılmadı", noIndex: true });
  }
  return buildMetadata({
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || undefined,
    path: `/blog/${post.slug}`,
    keywords: post.tags,
    ogImage: post.coverImage || undefined,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const locale = await getLocale();

  // Bloq yazıları hər dil üçün AYRI sətirdir və slug-ları fərqlidir. Slug cari
  // dilə aid deyilsə (məs. /ru/blog/cbct-nedir) rus interfeysində azərbaycanca
  // mətn göstərilirdi — tərcüməsi varsa onun öz URL-inə yönləndiririk.
  // Tərcümə yoxdursa yönləndirmirik: `getLocale()` kuki ilə də təyin oluna
  // bildiyi üçün "öz dilinə qaytar" qaydası sonsuz döngə yarada bilər.
  if (post.locale !== locale) {
    const twin = blogSlugForLocale(post.slug, locale);
    if (twin) redirect(`${locale === "ru" ? "/ru" : ""}/blog/${twin}`);
  }

  const ru = locale === "ru";
  const prefix = ru ? "/ru" : "";
  const t = getDict(locale).blog;
  const html = await marked.parse(post.content);

  // Yan panel məlumatları (2026-08-17, analizler.az naxışı)
  const [related, counts, mentioned] = await Promise.all([
    getRelatedPosts({ slug: post.slug, locale: post.locale, category: post.category }),
    getBlogCategoryCounts(post.locale),
    findMentionedServices(post.content, post.title, ru ? "ru" : "az"),
  ]);
  const catChips = BLOG_CATEGORIES.filter((c) => (counts[c.slug] ?? 0) > 0);
  const sb = ru
    ? {
        related: "Похожие статьи",
        categories: "Категории",
        inArticle: "Обследования из этой статьи",
        ctaTitle: "Ищете это обследование?",
        ctaText: "Сравните центры, цены и адреса.",
        ctaAll: "Все центры",
        ctaAsk: "Спросить в WhatsApp",
      }
    : {
        related: "Oxşar yazılar",
        categories: "Kateqoriyalar",
        inArticle: "Bu yazıda keçən müayinələr",
        ctaTitle: "Bu müayinəni axtarırsınız?",
        ctaText: "Mərkəzləri, qiymətləri və ünvanları müqayisə edin.",
        ctaAll: "Bütün mərkəzlər",
        ctaAsk: "WhatsApp-dan soruş",
      };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Ana səhifə", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          articleJsonLd(post),
        ]}
      />

      <PageHeader
        title={post.title}
        breadcrumbs={[{ name: "Blog", href: "/blog" }, { name: post.title }]}
      >
        <div className="flex flex-wrap items-center gap-4">
          {blogCategoryName(post.category, ru ? "ru" : "az") && (
            <a
              href={`${prefix}/blog?kat=${post.category}`}
              className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-clinical ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              {blogCategoryName(post.category, ru ? "ru" : "az")}
            </a>
          )}
          {post.publishedAt && (
            <div className="flex items-center gap-1.5 text-sm text-slate-300">
              <Calendar className="h-4 w-4" />
              <span>{formatDateAz(post.publishedAt)}</span>
            </div>
          )}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Badge key={tag} tone="cyan">
                  <Tag className="h-3 w-3" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </PageHeader>

      <Section>
        <Container>
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0 max-w-3xl">
            {post.coverImage && (
              /* Örtük TAM göstərilir — sabit çərçivə + object-cover kənarları
                 kəsirdi (2026-08-13 istifadəçi düzəlişi). Şəkil öz nisbətində. */
              <Image
                src={post.coverImage}
                alt={post.title}
                width={1600}
                height={840}
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="mb-10 h-auto w-full rounded-2xl bg-slate-100"
              />
            )}
            <div
              className="prose-rx"
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <p className="mt-10 text-sm text-slate-500">
              {t.disclaimer}
            </p>

            <div className="mt-10">
              <ButtonLink href="/blog" variant="outline">
                <ArrowLeft className="h-4 w-4" />
                {t.allPosts}
              </ButtonLink>
            </div>

            <Card className="mt-10 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div>
                <h2 className="font-display text-lg font-bold text-ink-900">
                  {t.ctaTitle}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {t.ctaDesc}
                </p>
              </div>
              <ButtonLink
                href="/rentgen-merkezleri"
                variant="primary"
                className="shrink-0"
              >
                {t.ctaButton}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </Card>
          </article>

          {/* Yapışqan yan panel (2026-08-17, analizler.az naxışı) */}
          <aside className="mt-4 lg:mt-0">
            <div className="space-y-6 lg:sticky lg:top-24">
              {/* CTA — yazıda keçən müayinələr + kataloq + WhatsApp */}
              <div className="rounded-3xl bg-iris-canvas p-6 text-white ring-1 ring-iris-border">
                <h2 className="font-display text-base font-semibold">{sb.ctaTitle}</h2>
                <p className="mt-1.5 text-sm text-ash-2">{sb.ctaText}</p>
                {mentioned.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-clinical">
                      {sb.inArticle}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {mentioned.map((m) => (
                        <a
                          key={m.slug}
                          href={`${prefix}/xidmetler/${m.slug}`}
                          className="rounded-full border border-iris-veil/40 bg-iris-glow/20 px-2.5 py-1 text-xs font-medium text-pearl transition-colors hover:border-clinical/60 hover:text-white"
                        >
                          {m.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-5 flex flex-col gap-2">
                  <ButtonLink
                    href={
                      mentioned.length === 1
                        ? `${prefix}/xidmetler/${mentioned[0].slug}`
                        : `${prefix}/rentgen-merkezleri`
                    }
                    size="sm"
                    className="w-full justify-center"
                  >
                    {sb.ctaAll} <ArrowRight className="h-4 w-4" />
                  </ButtonLink>
                  <a
                    href={PLATFORM_WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
                  >
                    {sb.ctaAsk}
                  </a>
                </div>
              </div>

              {/* Oxşar yazılar */}
              {related.length > 0 && (
                <div className="rounded-3xl bg-[#e4e4eb] p-6">
                  <h2 className="font-display text-sm font-bold text-iris-canvas">{sb.related}</h2>
                  <div className="mt-4 space-y-4">
                    {related.map((p) => (
                      <a key={p.slug} href={`${prefix}/blog/${p.slug}`} className="group flex items-center gap-3">
                        {p.coverImage && (
                          <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                            <Image src={p.coverImage} alt="" fill sizes="64px" className="object-cover object-left" />
                          </span>
                        )}
                        <span className="text-[13px] font-medium leading-snug text-slate-700 transition-colors group-hover:text-iris-glow">
                          {p.title}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Kateqoriyalar */}
              {catChips.length > 1 && (
                <div className="rounded-3xl bg-[#e4e4eb] p-6">
                  <h2 className="font-display text-sm font-bold text-iris-canvas">{sb.categories}</h2>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {catChips.map((c) => (
                      <a
                        key={c.slug}
                        href={`${prefix}/blog?kat=${c.slug}`}
                        className={
                          c.slug === post.category
                            ? "rounded-full border border-iris-glow bg-iris-glow px-2.5 py-1 text-xs font-semibold text-white"
                            : "rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-iris-veil hover:text-iris-glow"
                        }
                      >
                        {ru ? c.ru : c.az}
                        <span className="ml-1 opacity-60">{counts[c.slug]}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
          </div>
        </Container>
      </Section>
    </>
  );
}
