import type { Metadata } from "next";
import { OperatorShell } from "@/components/operator/operator-shell";
import { AdminChatInterface } from "@/components/chat/admin-chat-interface";
import { requireRole } from "@/lib/auth/rbac";
import { OPERATOR_NAME } from "@/lib/auth/operator";
import { getAdminThreads } from "@/lib/admin-chat";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({ title: "Söhbətlər", path: "/panel", noIndex: true });

/** Operator üçün panel-daxili söhbətlər (istifadəçi istəyi, 2026-08-12). */
export default async function PanelChatPage() {
  const user = await requireRole(["OPERATOR", "ADMIN"], "/panel");
  const threads = await getAdminThreads("system");
  return (
    <OperatorShell title="Söhbətlər" userName={user.role === "OPERATOR" ? OPERATOR_NAME : "Administrator"} showNew={false}>
      <AdminChatInterface threads={threads} />
    </OperatorShell>
  );
}
