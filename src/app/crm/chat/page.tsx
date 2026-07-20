import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { ChatInterface } from "@/components/chat/chat-interface";
import { getChatContacts } from "@/lib/chat";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { buildMetadata } from "@/lib/seo";
import { requireCenter, crmNavFor } from "../_lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({ title: "CRM — Söhbətlər", path: "/crm/chat", noIndex: true });

/**
 * CRM chat — same interface as the center panel's Söhbətlər (partner doctors +
 * admin support), with the AI helper pinned inside. Owners get the full thread
 * list; assistants get only the AI helper (partner/admin business threads stay
 * owner-level, like SMS/settings).
 */
export default async function CrmChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const { center, isOwner, userId } = await requireCenter("/crm/chat");
  const pd = getPanelDict(await getLocale());
  const { with: initialWith } = await searchParams;
  const contacts = isOwner ? await getChatContacts("CENTER", center.id, userId) : [];

  return (
    <DashboardShell title="CRM" roleLabel={center.name} userName={center.name} nav={crmNavFor(isOwner)} collapsible>
      <h1 className="mb-5 font-display text-2xl font-bold text-ink-900">{pd.nav.chat}</h1>
      <ChatInterface contacts={contacts} meRole="CENTER" initialWith={initialWith} />
    </DashboardShell>
  );
}
