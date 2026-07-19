import type { Metadata } from "next";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { requireRole } from "@/lib/auth/rbac";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "AI Yardımçı", path: "/admin/ai", noIndex: true });

export default async function AdminAiPage() {
  await requireRole("ADMIN", "/admin/ai");
  return (
    <AdminShell title="AI Yardımçı" userName="Admin">
      <p className="mb-5 text-sm text-slate-500">Sistem haqqında suallara qısa, konkret cavablar.</p>
      <AiChatPanel />
    </AdminShell>
  );
}
