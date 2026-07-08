import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { ChatInterface } from "@/components/chat/chat-interface";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getChatContacts } from "@/lib/chat";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Söhbətlər",
  path: "/merkez/chat",
  noIndex: true,
});

export default async function CenterChatPage() {
  const user = await requireRole("CENTER", "/merkez/chat");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, name: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");

  const contacts = await getChatContacts("CENTER", center.id, user.id);

  return (
    <DashboardShell title="Söhbətlər" roleLabel="Rentgen mərkəzi" userName={center.name} nav={centerNav}>
      <ChatInterface contacts={contacts} meRole="CENTER" />
    </DashboardShell>
  );
}
