import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { doctorNav } from "@/components/dashboard/role-navs";
import { ChatInterface } from "@/components/chat/chat-interface";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getChatContacts } from "@/lib/chat";
import { doctorName } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Söhbətlər",
  path: "/hekim/chat",
  noIndex: true,
});

export default async function DoctorChatPage() {
  const user = await requireRole("DOCTOR", "/hekim/chat");
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!doctor) redirect("/hekim/qeydiyyat");

  const contacts = await getChatContacts("DOCTOR", doctor.id, user.id);

  return (
    <DashboardShell
      title="Söhbətlər"
      roleLabel="Həkim"
      userName={doctorName(doctor.firstName, doctor.lastName)}
      nav={doctorNav}
    >
      <ChatInterface contacts={contacts} meRole="DOCTOR" />
    </DashboardShell>
  );
}
