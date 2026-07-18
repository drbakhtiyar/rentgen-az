import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { ChatInterface } from "@/components/chat/chat-interface";
import { prisma } from "@/lib/db";
import { requireDoctor, doctorNavFor } from "../_lib";
import { getChatContacts } from "@/lib/chat";
import { doctorName } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Söhbətlər",
  path: "/hekim/chat",
  noIndex: true,
});

export default async function DoctorChatPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const { doctor, isOwner } = await requireDoctor("/hekim/chat");

  const { with: initialWith } = await searchParams;
  const contacts = await getChatContacts("DOCTOR", doctor.id, doctor.userId);
  const pd = getPanelDict(await getLocale());

  return (
    <DashboardShell
      title={pd.nav.chat}
      roleLabel={pd.shell.roleDoctor}
      userName={doctorName(doctor.firstName, doctor.lastName)}
      nav={doctorNavFor(isOwner)}
    >
      <ChatInterface contacts={contacts} meRole="DOCTOR" initialWith={initialWith} />
    </DashboardShell>
  );
}
