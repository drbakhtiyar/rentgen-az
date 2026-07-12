import Link from "next/link";
import Image from "next/image";
import { Stethoscope, Pencil, Eye, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/widgets";
import { DoctorStatusControls, BlockToggle } from "@/components/admin/controls";
import { doctorName } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import { PLAN_LABEL } from "@/lib/plans";
import type { CenterStatus } from "@/generated/prisma/enums";
import type { Plan } from "@/generated/prisma/client";

type AdminDoctor = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  clinic: string | null;
  photoUrl: string | null;
  status: CenterStatus;
  plan: Plan;
  user: { id: string; isBlocked: boolean; phone: string };
  _count: { appointmentRequests: number };
};

const PLAN_TONE: Record<Plan, string> = {
  FREE: "bg-slate-100 text-slate-600 ring-slate-200",
  SILVER: "bg-slate-200 text-slate-700 ring-slate-300",
  GOLD: "bg-amber-50 text-amber-700 ring-amber-200",
  PLATINUM: "bg-cyan-50 text-cyan-700 ring-cyan-200",
};

/** Admin-side doctor card: name, clinic, phone + admin controls. City and
 *  specializations live on the public profile — kept off this compact card. */
export function AdminDoctorCard({ doctor }: { doctor: AdminDoctor }) {
  const name = doctorName(doctor.firstName, doctor.lastName);

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          {doctor.photoUrl ? (
            <Image src={doctor.photoUrl} alt={name} width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            <Stethoscope className="h-6 w-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/admin/hekimler/${doctor.id}`} className="group/link min-w-0">
              <h3 className="font-display text-base font-bold text-ink-900 transition-colors group-hover/link:text-brand-700">
                {name}
              </h3>
            </Link>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusBadge status={doctor.status} />
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${PLAN_TONE[doctor.plan]}`}
              >
                {PLAN_LABEL[doctor.plan]}
              </span>
            </div>
          </div>
          {doctor.clinic && <p className="mt-0.5 text-sm text-slate-500">{doctor.clinic}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
        <a href={`tel:${doctor.user.phone}`} className="whitespace-nowrap hover:text-brand-600">
          {formatPhoneDisplay(doctor.user.phone)}
        </a>
        <span className="flex items-center gap-1 text-slate-400">
          <Inbox className="h-3.5 w-3.5" /> {doctor._count.appointmentRequests} müraciət
        </span>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <Link
          href={`/admin/hekimler/${doctor.id}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
        >
          <Pencil className="h-3.5 w-3.5" /> Redaktə
        </Link>
        {doctor.status === "APPROVED" && (
          <Link
            href={`/hekimler/${doctor.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
          >
            <Eye className="h-3.5 w-3.5" /> Bax
          </Link>
        )}
        <DoctorStatusControls doctorId={doctor.id} status={doctor.status} />
        <BlockToggle userId={doctor.user.id} blocked={doctor.user.isBlocked} />
      </div>
    </Card>
  );
}
