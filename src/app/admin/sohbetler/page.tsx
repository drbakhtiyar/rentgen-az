import type { Metadata } from "next";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { AdminChatInterface } from "@/components/chat/admin-chat-interface";
import { requireRole } from "@/lib/auth/rbac";
import { getAdminThreads } from "@/lib/admin-chat";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Söhbətlər",
  path: "/admin/sohbetler",
  noIndex: true,
});

export default async function AdminChatPage() {
  const admin = await requireRole("ADMIN", "/admin/sohbetler");
  const threads = await getAdminThreads();

  return (
    <AdminShell title="Söhbətlər" userName={admin.phone}>
      <AdminChatInterface threads={threads} />
    </AdminShell>
  );
}
