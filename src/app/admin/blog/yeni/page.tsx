import type { Metadata } from "next";
import { AdminShell } from "@/components/dashboard/admin-shell";
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
    <AdminShell title="Yeni məqalə" userName={admin.phone}>
      <BlogEditor />
    </AdminShell>
  );
}
