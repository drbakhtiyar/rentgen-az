import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Panel } from "@/components/dashboard/widgets";
import { CenterProfileForm } from "@/components/forms/center-profile-form";
import { adminCreateCenterAction } from "@/app/admin/actions";
import { requireRole } from "@/lib/auth/rbac";
import { CITIES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Yeni mərkəz",
  path: "/admin/merkezler/yeni",
  noIndex: true,
});

const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));

export default async function AdminNewCenterPage() {
  const admin = await requireRole("ADMIN", "/admin/merkezler/yeni");

  return (
    <AdminShell title="Yeni mərkəz" userName={admin.phone}>
      <Link
        href="/admin/merkezler"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Mərkəzlərə qayıt
      </Link>
      <Panel title="Yeni mərkəz">
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
          Bütün sahələr məcburi deyil — bildiyin qədərini doldur. Mərkəz təsdiq
          gözləyən (PENDING) vəziyyətdə yaradılır.
        </p>
        <CenterProfileForm
          superEditable
          cities={cityOptions}
          mode="create"
          loose
          onSave={adminCreateCenterAction}
          maxImages={999}
        />
      </Panel>
    </AdminShell>
  );
}
