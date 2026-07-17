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
import { CENTER_PLAN_PRICE, centerLimits, effectiveExtraTb, OVERAGE_PER_TB_MINOR } from "@/lib/plans";
import { formatDateAz } from "@/lib/utils";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
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
    select: { name: true, plan: true, planUntil: true, extraStorageTb: true, extraStorageUntil: true },
  });
  if (!center) redirect("/merkez/qeydiyyat");
  const [balance, history] = await Promise.all([
    getBalance(user.id),
    getWalletHistory(user.id),
  ]);
  const pd = getPanelDict(await getLocale());

  return (
    <DashboardShell
      title={pd.nav.paket}
      roleLabel={pd.center.roleLabel}
      userName={center.name}
      nav={centerNav}
    >
      <BillingPanel
        currentPlan={center.plan}
        planUntil={center.planUntil ? formatDateAz(center.planUntil) : null}
        daysLeft={daysUntil(center.planUntil)}
        balance={balance}
        prices={CENTER_PLAN_PRICE}
        extraStorage={
          centerLimits(center.plan).storageOverage
            ? {
                tb: effectiveExtraTb(center.extraStorageTb, center.extraStorageUntil),
                until:
                  center.extraStorageUntil && center.extraStorageUntil > new Date()
                    ? formatDateAz(center.extraStorageUntil)
                    : null,
                priceMinor: OVERAGE_PER_TB_MINOR,
              }
            : null
        }
      />
      <div className="mt-6">
        <Panel title={pd.center.historyTitle}>
          <WalletHistory entries={history} />
        </Panel>
      </div>
    </DashboardShell>
  );
}
