import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { doctorNav } from "@/components/dashboard/role-navs";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getBalance } from "@/lib/wallet";
import { DOCTOR_PLAN_PRICE } from "@/lib/plans";
import { formatDateAz, doctorName } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Paket / Balans",
  path: "/hekim/paket",
  noIndex: true,
});

export default async function DoctorBillingPage() {
  const user = await requireRole("DOCTOR", "/hekim/paket");
  const doctor = await prisma.doctorProfile.findUnique({
    where: { userId: user.id },
    select: { firstName: true, lastName: true, plan: true, planUntil: true },
  });
  if (!doctor) redirect("/hekim/qeydiyyat");
  const balance = await getBalance(user.id);

  return (
    <DashboardShell
      title="Paket / Balans"
      roleLabel="Həkim"
      userName={doctorName(doctor.firstName, doctor.lastName)}
      nav={doctorNav}
    >
      <BillingPanel
        currentPlan={doctor.plan}
        planUntil={doctor.planUntil ? formatDateAz(doctor.planUntil) : null}
        balance={balance}
        prices={DOCTOR_PLAN_PRICE}
      />
    </DashboardShell>
  );
}
