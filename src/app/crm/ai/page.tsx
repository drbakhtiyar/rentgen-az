import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { AiChatPanel } from "@/components/ai/ai-chat-panel";
import { buildMetadata } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { requireCenter, crmNavFor } from "../_lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "CRM — AI Yardımçı", path: "/crm/ai", noIndex: true });

/** System Q&A helper — available to owners AND assistants (any plan). */
export default async function CrmAiPage() {
  const { center, isOwner } = await requireCenter("/crm/ai");
  const pd = getPanelDict(await getLocale());
  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNavFor(isOwner)} collapsible>
      <h1 className="mb-1 font-display text-2xl font-bold text-ink-900">{pd.nav.crmAi}</h1>
      <p className="mb-5 text-sm text-slate-500">{pd.chat.aiSub}</p>
      <AiChatPanel />
    </DashboardShell>
  );
}
