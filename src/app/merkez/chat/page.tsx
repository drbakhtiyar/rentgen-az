import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { ChatInterface } from "@/components/chat/chat-interface";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getChatContacts } from "@/lib/chat";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Söhbətlər",
  path: "/merkez/chat",
  noIndex: true,
});

export default async function CenterChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const user = await requireRole("CENTER", "/merkez/chat");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const { with: initialWith } = await searchParams;
  const contacts = await getChatContacts("CENTER", center.id, user.id);
  const pd = getPanelDict(await getLocale());

  return (
    <DashboardShell title={pd.nav.chat} roleLabel={pd.center.roleLabel} userName={center.name} nav={centerNav}>
      <ChatInterface contacts={contacts} meRole="CENTER" initialWith={initialWith} />
    </DashboardShell>
  );
}
