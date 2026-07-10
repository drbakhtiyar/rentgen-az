import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { doctorNav } from "@/components/dashboard/role-navs";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { WalletHistory } from "@/components/dashboard/wallet-history";
import { Panel } from "@/components/dashboard/widgets";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getBalance } from "@/lib/wallet";
import { getWalletHistory } from "@/lib/queries";
import { DOCTOR_PLAN_PRICE } from "@/lib/plans";
import { formatDateAz, doctorName } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

function daysUntil(d: Date | null): number | null {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

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
  const [balance, history] = await Promise.all([
    getBalance(user.id),
    getWalletHistory(user.id),
  ]);

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
        daysLeft={daysUntil(doctor.planUntil)}
        balance={balance}
        prices={DOCTOR_PLAN_PRICE}
      />
      <div className="mt-6">
        <Panel title="Ödəniş və balans tarixçəsi">
          <WalletHistory entries={history} />
        </Panel>
      </div>
    </DashboardShell>
  );
}
