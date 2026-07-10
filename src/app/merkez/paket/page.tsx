import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getBalance } from "@/lib/wallet";
import { CENTER_PLAN_PRICE } from "@/lib/plans";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Paket / Balans",
  path: "/merkez/paket",
  noIndex: true,
});

export default async function CenterBillingPage() {
  const user = await requireRole("CENTER", "/merkez/paket");
  const center = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
    select: { name: true, plan: true, planUntil: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");
  const balance = await getBalance(user.id);

  return (
    <DashboardShell
      title="Paket / Balans"
      roleLabel="Rentgen mərkəzi"
      userName={center.name}
      nav={centerNav}
    >
      <BillingPanel
        currentPlan={center.plan}
        planUntil={center.planUntil ? formatDateAz(center.planUntil) : null}
        balance={balance}
        prices={CENTER_PLAN_PRICE}
      />
    </DashboardShell>
  );
}
