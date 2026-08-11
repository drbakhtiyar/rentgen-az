import type { Metadata } from "next";
import { OperatorShell } from "@/components/operator/operator-shell";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { requireRole } from "@/lib/auth/rbac";
import { OPERATOR_NAME } from "@/lib/auth/operator";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({ title: "AI Yardımçı", path: "/panel", noIndex: true });

export default async function PanelAiPage() {
  const user = await requireRole(["OPERATOR", "ADMIN"], "/panel");
  return (
    <OperatorShell title="AI Yardımçı" userName={user.role === "OPERATOR" ? OPERATOR_NAME : "Administrator"} showNew={false}>
      <p className="mb-5 text-sm text-slate-500">Sistem haqqında suallara qısa, konkret cavablar.</p>
      <AiChatPanel />
    </OperatorShell>
  );
}
