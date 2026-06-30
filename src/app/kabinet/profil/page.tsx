import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/shell";
import { patientNav } from "@/components/dashboard/role-navs";
import { Card } from "@/components/ui/card";
import { PatientProfileForm } from "@/components/forms/patient-profile-form";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { CITIES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Profil",
  path: "/kabinet/profil",
  noIndex: true,
});

const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));

export default async function PatientProfilePage() {
  const user = await requireRole("PATIENT", "/kabinet/profil");
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: user.id },
  });

  const name =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Pasiyent";

  return (
    <DashboardShell title="Profil" roleLabel="Pasiyent" userName={name} nav={patientNav}>
      <Card className="max-w-2xl p-6 sm:p-8">
        <PatientProfileForm
          cities={cityOptions}
          phone={user.phone}
          defaults={{
            firstName: profile?.firstName ?? "",
            lastName: profile?.lastName ?? "",
            city: profile?.city ?? "",
            district: profile?.district ?? "",
            birthDate: profile?.birthDate
              ? profile.birthDate.toISOString().slice(0, 10)
              : "",
          }}
        />
      </Card>
    </DashboardShell>
  );
}
