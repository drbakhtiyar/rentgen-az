import Link from "next/link";
import Image from "next/image";
import { Stethoscope, MapPin, Pencil, Eye, Inbox } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/widgets";
import { DoctorStatusControls, BlockToggle } from "@/components/admin/controls";
import { doctorName } from "@/lib/utils";
import { formatPhoneDisplay } from "@/lib/phone";
import type { CenterStatus } from "@/generated/prisma/enums";

type AdminDoctor = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  clinic: string | null;
  city: string | null;
  specializations: string[];
  photoUrl: string | null;
  status: CenterStatus;
  user: { id: string; isBlocked: boolean; phone: string };
  _count: { appointmentRequests: number };
};

/** Admin-side doctor card: same look as the public doctor card, with the real
 *  status and admin controls (edit / view / activate / block). */
export function AdminDoctorCard({ doctor }: { doctor: AdminDoctor }) {
  const name = doctorName(doctor.firstName, doctor.lastName);
  const specs = doctor.specializations.slice(0, 3);
  const extra = doctor.specializations.length - specs.length;

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
            {doctor.photoUrl ? (
              <Image src={doctor.photoUrl} alt={name} width={48} height={48} className="h-full w-full object-cover" />
            ) : (
              <Stethoscope className="h-6 w-6" />
            )}
          </span>
          <div className="min-w-0">
            <Link href={`/admin/hekimler/${doctor.id}`} className="group/link">
              <h3 className="font-display text-base font-bold text-ink-900 transition-colors group-hover/link:text-brand-700">
                {name}
              </h3>
            </Link>
            {doctor.clinic && <p className="mt-0.5 truncate text-sm text-slate-500">{doctor.clinic}</p>}
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
              {doctor.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {doctor.city}
                </span>
              )}
              <a href={`tel:${doctor.user.phone}`} className="hover:text-brand-600">
                {formatPhoneDisplay(doctor.user.phone)}
              </a>
              <span className="flex items-center gap-1">
                <Inbox className="h-3.5 w-3.5" /> {doctor._count.appointmentRequests}
              </span>
            </p>
          </div>
        </div>
        <StatusBadge status={doctor.status} />
      </div>

      {specs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {specs.map((s) => (
            <Badge key={s} tone="cyan">{s}</Badge>
          ))}
          {extra > 0 && <Badge tone="slate">+{extra}</Badge>}
        </div>
      )}

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
