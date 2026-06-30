import { ArrowRight, Calendar, Tag } from "lucide-react";
import { Container, Section } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { JsonLd } from "@/components/ui/json-ld";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/queries";
import { formatDateAz } from "@/lib/utils";

export const revalidate = 300;

export const metadata = buildMetadata({
  title: "Blog — dental rentgen və tomoqrafiya məqalələri",
  description:
    "Dental rentgen, 3D tomoqrafiya, CBCT, panoramik və sefalometrik rentgen haqqında faydalı və etibarlı məqalələr.",
  path: "/blog",
  keywords: [
    "dental rentgen",
    "3D tomoqrafiya",
    "CBCT",
    "panoramik rentgen",
    "sefalometrik rentgen",
    "diş rentgeni",
    "blog",
  ],
});

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      <PageHeader
        eyebrow="Blog"
        title="Blog"
        description="Dental rentgen, 3D tomoqrafiya və diaqnostika haqqında faydalı və etibarlı məqalələr."
        breadcrumbs={[{ name: "Blog" }]}
      />

      <Section>
        <Container>
          {posts.length === 0 ? (
            <Card className="mx-auto max-w-xl p-8 text-center sm:p-10">
              <h2 className="font-display text-xl font-bold text-ink-900">
                Tezliklə məqalələr əlavə olunacaq
              </h2>
              <p className="mt-3 text-slate-600">
                Hazırda yeni məzmun üzərində işləyirik. Tezliklə dental rentgen və
                tomoqrafiya haqqında faydalı məqalələri burada paylaşacağıq.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="group flex flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
                >
                  {post.publishedAt && (
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDateAz(post.publishedAt)}</span>
                    </div>
                  )}
                  <h2 className="font-display mt-3 text-lg font-bold leading-snug text-ink-900">
                    <a href={`/blog/${post.slug}`} className="hover:text-brand-700">
                      {post.title}
                    </a>
                  </h2>
                  {post.excerpt && (
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {post.excerpt}
                    </p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} tone="slate">
                          <Tag className="h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <a
                    href={`/blog/${post.slug}`}
                    className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-brand-700 hover:text-brand-800"
                  >
                    Oxu
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
