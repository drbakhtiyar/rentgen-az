import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Panel } from "@/components/dashboard/widgets";
import { DoctorProfileForm } from "@/components/forms/doctor-profile-form";
import { AdminMessageForm } from "@/components/admin/admin-message-form";
import { PlanSelector } from "@/components/admin/plan-selector";
import { WalletCredit } from "@/components/admin/wallet-credit";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { doctorName } from "@/lib/utils";
import {
  adminUpdateDoctorAction,
  adminSetDoctorPlanAction,
  adminCreditWalletAction,
} from "@/app/admin/actions";
import { CITIES } from "@/lib/constants";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Həkimi redaktə et",
  path: "/admin/hekimler",
  noIndex: true,
});

const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name }));

export default async function AdminEditDoctorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireRole("ADMIN", "/admin/hekimler");
  const { id } = await params;

  const doctor = await prisma.doctorProfile.findUnique({
    where: { id },
    include: { user: { select: { phone: true } } },
  });
  if (!doctor) notFound();

  const fullName =
    doctorName(doctor.firstName, doctor.lastName);
  const save = adminUpdateDoctorAction.bind(null, doctor.id);
  const setPlan = adminSetDoctorPlanAction.bind(null, doctor.id);
  const credit = adminCreditWalletAction.bind(null, doctor.userId);

  return (
    <AdminShell title="Həkimi redaktə et" userName={admin.phone}>
      <Link
        href="/admin/hekimler"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Həkimlərə qayıt
      </Link>

      <Panel title={fullName}>
        <DoctorProfileForm
          cities={cityOptions}
          phone={doctor.user.phone}
          mode="edit"
          onSave={save}
          defaults={{
            firstName: doctor.firstName ?? "",
            lastName: doctor.lastName ?? "",
            clinic: doctor.clinic ?? "",
            specializations: doctor.specializations ?? [],
            city: doctor.city ?? "",
            photoUrl: doctor.photoUrl ?? "",
            instagram: doctor.instagram ?? "",
            website: doctor.website ?? "",
            diplomaUrl: doctor.diplomaUrl ?? "",
            certificateUrl: doctor.certificateUrl ?? "",
            residencyUrl: doctor.residencyUrl ?? "",
            internshipUrl: doctor.internshipUrl ?? "",
            specialtyUrl: doctor.specialtyUrl ?? "",
          }}
        />
      </Panel>

      <div className="mt-5">
        <Panel title="Paket / Abunə">
          <PlanSelector current={doctor.plan} action={setPlan} />
          <WalletCredit action={credit} />
        </Panel>
      </div>

      <div className="mt-5">
        <Panel title="Həkimə bildiriş göndər">
          <AdminMessageForm userId={doctor.userId} />
        </Panel>
      </div>
    </AdminShell>
  );
}
