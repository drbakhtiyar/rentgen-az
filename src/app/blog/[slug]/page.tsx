import Image from "next/image";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { ArrowLeft, ArrowRight, Calendar, Tag } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { JsonLd } from "@/components/ui/json-ld";
import { buildMetadata, breadcrumbJsonLd, articleJsonLd } from "@/lib/seo";
import { getPostBySlug } from "@/lib/queries";
import { formatDateAz } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";

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

  const t = getDict(await getLocale()).blog;
  const html = await marked.parse(post.content);

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
          <article className="mx-auto max-w-3xl">
            {post.coverImage && (
              <div className="relative mb-10 aspect-[3/2] w-full overflow-hidden rounded-2xl bg-slate-100">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                />
              </div>
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
        </Container>
      </Section>
    </>
  );
}
