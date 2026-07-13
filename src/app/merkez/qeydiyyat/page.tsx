import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { CenterProfileForm } from "@/components/forms/center-profile-form";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { CITIES } from "@/lib/constants";
import { getLocale } from "@/lib/i18n-server";
import { getPanelDict } from "@/lib/i18n-panel";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Mərkəz qeydiyyatı",
  path: "/merkez/qeydiyyat",
  noIndex: true,
});

const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));

export default async function CenterOnboardingPage() {
  const user = await requireRole("CENTER", "/merkez/qeydiyyat");
  const existing = await prisma.centerProfile.findUnique({
    where: { userId: user.id },
  });
  if (existing) redirect("/merkez");
  const c = getPanelDict(await getLocale()).center;

  return (
    <div className="bg-surface py-10">
      <Container className="max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink-800"
        >
          <ArrowLeft className="h-4 w-4" /> {c.homeLink}
        </Link>
        <div className="mt-5 flex items-center gap-3">
          <Image src="/mark-square.png" alt="rentgen.az" width={44} height={44} className="h-11 w-11 rounded-xl" />
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">{c.regTitle}</h1>
            <p className="text-sm text-slate-500">{c.regSubtitle}</p>
          </div>
        </div>

        <div className="mt-8">
          <CenterProfileForm cities={cityOptions} mode="create" />
        </div>
      </Container>
    </div>
  );
}
