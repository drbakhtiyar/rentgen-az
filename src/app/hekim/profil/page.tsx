import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/shell";
import { doctorNav } from "@/components/dashboard/role-navs";
import { Card } from "@/components/ui/card";
import { DoctorProfileForm } from "@/components/forms/doctor-profile-form";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { doctorName } from "@/lib/utils";
import { doctorLimits } from "@/lib/plans";
import { CITIES } from "@/lib/constants";
import { getLocale } from "@/lib/i18n-server";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Profil",
  path: "/hekim/profil",
  noIndex: true,
});

const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));

export default async function DoctorProfilePage() {
  const user = await requireRole("DOCTOR", "/hekim/profil");
  const locale = await getLocale();

  let profile = null;
  try {
    profile = await prisma.doctorProfile.findUnique({
      where: { userId: user.id },
    });
  } catch {
    profile = null;
  }
  if (!profile) redirect("/hekim/qeydiyyat");

  const centerOptions = (
    await prisma.centerProfile
      .findMany({
        where: { status: "APPROVED" },
        select: { id: true, name: true, city: true },
        orderBy: { name: "asc" },
      })
      .catch(() => [])
  ).map((c) => ({ value: c.id, label: `${c.name}${c.city ? ` — ${c.city}` : ""}` }));

  const fullName =
    doctorName(profile.firstName, profile.lastName);

  return (
    <DashboardShell
      title="Profil"
      roleLabel="Həkim"
      userName={fullName}
      nav={doctorNav}
    >
      <Card className="max-w-2xl p-6 sm:p-8">
        <DoctorProfileForm
          mode="edit"
          locale={locale}
          cities={cityOptions}
          centers={centerOptions}
          phone={user.phone}
          allowPortfolio={doctorLimits(profile.plan).portfolio}
          defaults={{
            firstName: profile.firstName ?? "",
            lastName: profile.lastName ?? "",
            clinic: profile.clinic ?? "",
            specializations: profile.specializations ?? [],
            portfolio: profile.portfolio ?? [],
            city: profile.city ?? "",
            photoUrl: profile.photoUrl ?? "",
            instagram: profile.instagram ?? "",
            website: profile.website ?? "",
            diplomaUrl: profile.diplomaUrl ?? "",
            certificateUrl: profile.certificateUrl ?? "",
            residencyUrl: profile.residencyUrl ?? "",
            internshipUrl: profile.internshipUrl ?? "",
            specialtyUrl: profile.specialtyUrl ?? "",
            workplaceCenterId: profile.workplaceCenterId ?? "",
            workplaceStatus: profile.workplaceStatus ?? "",
          }}
        />
      </Card>
    </DashboardShell>
  );
}
