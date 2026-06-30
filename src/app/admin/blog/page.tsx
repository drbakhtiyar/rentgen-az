import type { Metadata } from "next";
import { FileText, Plus } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { EmptyState, Panel } from "@/components/dashboard/widgets";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { BlogRowControls } from "@/components/admin/blog-row-controls";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Blog idarəetməsi",
  path: "/admin/blog",
  noIndex: true,
});

export default async function AdminBlogPage() {
  const admin = await requireRole("ADMIN", "/admin/blog");

  let posts: Awaited<ReturnType<typeof prisma.blogPost.findMany>> = [];
  try {
    posts = await prisma.blogPost.findMany({ orderBy: { updatedAt: "desc" } });
  } catch {
    posts = [];
  }

  return (
    <AdminShell title="Blog" userName={admin.phone}>
      <Panel
        title={`Məqalələr (${posts.length})`}
        action={
          <ButtonLink href="/admin/blog/yeni" size="sm">
            <Plus className="h-4 w-4" /> Yeni məqalə
          </ButtonLink>
        }
      >
        {posts.length > 0 ? (
          <div className="space-y-3">
            {posts.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink-900">{p.title}</p>
                    {p.published ? (
                      <Badge tone="green">Dərc olunub</Badge>
                    ) : (
                      <Badge tone="amber">Qaralama</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    /blog/{p.slug} · {formatDateAz(p.updatedAt)}
                  </p>
                </div>
                <BlogRowControls id={p.id} slug={p.slug} published={p.published} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText />}
            title="Hələ məqalə yoxdur"
            description="İlk məqaləni əlavə edin və ya seed skriptini işə salın."
          >
            <ButtonLink href="/admin/blog/yeni">
              <Plus className="h-4 w-4" /> Yeni məqalə
            </ButtonLink>
          </EmptyState>
        )}
      </Panel>
    </AdminShell>
  );
}
