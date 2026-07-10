import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { centerNav } from "@/components/dashboard/role-navs";
import { BillingPanel } from "@/components/dashboard/billing-panel";
import { WalletHistory } from "@/components/dashboard/wallet-history";
import { Panel } from "@/components/dashboard/widgets";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getBalance } from "@/lib/wallet";
import { getWalletHistory } from "@/lib/queries";
import { CENTER_PLAN_PRICE } from "@/lib/plans";
import { formatDateAz } from "@/lib/utils";
import { buildMetadata } from "@/lib/seo";

function daysUntil(d: Date | null): number | null {
  if (!d) return null;
  return Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

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
  const [balance, history] = await Promise.all([
    getBalance(user.id),
    getWalletHistory(user.id),
  ]);

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
        daysLeft={daysUntil(center.planUntil)}
        balance={balance}
        prices={CENTER_PLAN_PRICE}
      />
      <div className="mt-6">
        <Panel title="Ödəniş və balans tarixçəsi">
          <WalletHistory entries={history} />
        </Panel>
      </div>
    </DashboardShell>
  );
}
