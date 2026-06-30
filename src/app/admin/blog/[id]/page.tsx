import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { adminNav } from "@/components/dashboard/role-navs";
import { BlogEditor } from "@/components/admin/blog-editor";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Məqaləni redaktə et",
  path: "/admin/blog",
  noIndex: true,
});

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/blog");
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <DashboardShell title="Məqaləni redaktə et" roleLabel="Administrator" userName={admin.phone} nav={adminNav}>
      <BlogEditor
        defaults={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt ?? "",
          content: post.content,
          coverImage: post.coverImage ?? "",
          metaTitle: post.metaTitle ?? "",
          metaDescription: post.metaDescription ?? "",
          tags: post.tags.join(", "),
          published: post.published,
        }}
      />
    </DashboardShell>
  );
}
