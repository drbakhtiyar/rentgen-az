import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { adminNav } from "@/components/dashboard/role-navs";
import { BlogEditor } from "@/components/admin/blog-editor";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Yeni məqalə",
  path: "/admin/blog/yeni",
  noIndex: true,
});

export default async function NewBlogPostPage() {
  const admin = await requireRole("ADMIN", "/admin/blog/yeni");
  return (
    <DashboardShell title="Yeni məqalə" roleLabel="Administrator" userName={admin.phone} nav={adminNav}>
      <BlogEditor />
    </DashboardShell>
  );
}
