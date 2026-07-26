import type { Metadata } from "next";
import Link from "next/link";
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

const LOCALE_TABS = [
  { key: "", label: "Hamısı" },
  { key: "az", label: "Azərbaycanca" },
  { key: "ru", label: "Русский" },
];

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ dil?: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/blog");
  const { dil } = await searchParams;
  const activeLocale = dil === "az" || dil === "ru" ? dil : "";

  let posts: Awaited<ReturnType<typeof prisma.blogPost.findMany>> = [];
  try {
    posts = await prisma.blogPost.findMany({
      where: activeLocale ? { locale: activeLocale } : {},
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    posts = [];
  }

  return (
    <AdminShell title="Blog" userName={admin.phone}>
      {/* Dil keçidi — admin RU versiyalarını ayrıca görüb redaktə edə bilir. */}
      <div className="mb-4 flex flex-wrap gap-2">
        {LOCALE_TABS.map((tab) => {
          const isActive = activeLocale === tab.key;
          return (
            <Link
              key={tab.key}
              href={tab.key ? `/admin/blog?dil=${tab.key}` : "/admin/blog"}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <Panel
        title={`Məqalələr (${posts.length})`}
        action={
          <ButtonLink
            href={activeLocale === "ru" ? "/admin/blog/yeni?dil=ru" : "/admin/blog/yeni"}
            size="sm"
          >
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
                    <Badge tone={p.locale === "ru" ? "brand" : "slate"}>
                      {p.locale === "ru" ? "RU" : "AZ"}
                    </Badge>
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
