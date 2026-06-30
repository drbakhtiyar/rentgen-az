import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { DoctorProfileForm } from "@/components/forms/doctor-profile-form";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { CITIES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Həkim qeydiyyatı",
  path: "/hekim/qeydiyyat",
  noIndex: true,
});

const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));

export default async function DoctorOnboardingPage() {
  const user = await requireRole("DOCTOR", "/hekim/qeydiyyat");

  let existing = null;
  try {
    existing = await prisma.doctorProfile.findUnique({
      where: { userId: user.id },
    });
  } catch {
    existing = null;
  }
  if (existing) redirect("/hekim");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-surface py-12">
      <Container className="max-w-2xl">
        <h1 className="font-display text-2xl font-bold text-ink-900">
          Həkim profilini yaradın
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Admin təsdiqindən sonra pasiyentlərin siyahısında görünəcəksiniz.
        </p>
        <Card className="mt-6 p-6 sm:p-8">
          <DoctorProfileForm
            cities={cityOptions}
            phone={user.phone}
            mode="create"
          />
        </Card>
      </Container>
    </div>
  );
}
