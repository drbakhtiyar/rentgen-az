import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OperatorShell } from "@/components/operator/operator-shell";
import { CenterProfileForm } from "@/components/forms/center-profile-form";
import { createCenterFlexAction } from "@/app/panel/actions";
import { requireRole } from "@/lib/auth/rbac";
import { OPERATOR_NAME } from "@/lib/auth/operator";
import { CITIES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Yeni mərkəz",
  path: "/panel/yeni",
  noIndex: true,
});

const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));

export default async function OperatorNewCenterPage() {
  const user = await requireRole(["OPERATOR", "ADMIN"], "/panel/yeni");
  const userName = user.role === "OPERATOR" ? OPERATOR_NAME : "Administrator";

  return (
    <OperatorShell title="Yeni mərkəz" userName={userName} showNew={false}>
      <Link
        href="/panel"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Mərkəzlərə qayıt
      </Link>
      <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
        Bütün sahələr məcburi deyil — bildiyin qədərini doldur, boş sahələr saxlanıla bilər.
        Mərkəz təsdiq gözləyən (PENDING) vəziyyətdə yaradılır.
      </p>
      <div className="rounded-2xl border border-slate-100 bg-white p-5 sm:p-6">
        <CenterProfileForm
          cities={cityOptions}
          mode="create"
          loose
          onSave={createCenterFlexAction}
          maxImages={999}
        />
      </div>
    </OperatorShell>
  );
}
