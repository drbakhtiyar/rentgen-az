import type { Metadata } from "next";
import { OperatorShell } from "@/components/operator/operator-shell";
import { AdminChatInterface } from "@/components/chat/admin-chat-interface";
import { requireRole } from "@/lib/auth/rbac";
import { OPERATOR_NAME } from "@/lib/auth/operator";
import { getAdminThreads } from "@/lib/admin-chat";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({ title: "WhatsApp söhbətləri", path: "/panel", noIndex: true });

/** Operator üçün WhatsApp yazışmaları — cavab yazanda WhatsApp-a gedir (24s
 *  pəncərə) və bot 30 dəqiqə susur (insan müdaxiləsi rejimi). */
export default async function PanelWaChatPage() {
  const user = await requireRole(["OPERATOR", "ADMIN"], "/panel");
  const threads = await getAdminThreads("whatsapp");
  return (
    <OperatorShell title="WhatsApp söhbətləri" userName={user.role === "OPERATOR" ? OPERATOR_NAME : "Administrator"} showNew={false}>
      <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs leading-relaxed text-emerald-800 ring-1 ring-emerald-100">
        📲 gələn · 🤖 bot. Cavab yazsanız WhatsApp-a gedir (son mesajdan 24 saat
        ərzində) və bot 30 dəqiqə SUSUR — söhbəti siz aparırsınız.
      </p>
      <AdminChatInterface threads={threads} showBroadcast={false} />
    </OperatorShell>
  );
}
