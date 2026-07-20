import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { buildMetadata } from "@/lib/seo";
import { getActingCenter } from "@/lib/auth/acting";
import { CrmLoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "CRM girişi",
  path: "/crm/giris",
  noIndex: true,
});

/** Phone-only CRM login (no role tabs) for center owners and assistants. */
export default async function CrmLoginPage() {
  // Genuinely-active sessions skip the login (a stale assistant cookie resolves
  // to null here, so they correctly see the form instead of looping).
  if (await getActingCenter()) redirect("/teqvim");
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2.5">
          <Image src="/mark-square.png" alt="rentgen.az" width={36} height={36} className="h-9 w-9 rounded-lg" />
          <div>
            <p className="font-display text-lg font-bold text-ink-900">CRM girişi</p>
            <p className="text-xs text-slate-500">crm.rentgen.az</p>
          </div>
        </div>
        <CrmLoginForm />
      </div>
    </div>
  );
}
