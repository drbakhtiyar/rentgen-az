"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Ban, Loader2, RotateCcw, ShieldOff, ShieldCheck } from "lucide-react";
import { Select } from "@/components/ui/field";
import {
  setCenterStatusAction,
  setDoctorStatusAction,
  setUserBlockedAction,
  setReferralStatusAction,
  setRequestStatusAdminAction,
} from "@/app/admin/actions";
import type {
  CenterStatus,
  ReferralStatus,
  RequestStatus,
} from "@/generated/prisma/enums";

function useAction() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const run = (fn: () => Promise<unknown>) =>
    startTransition(async () => {
      await fn();
      router.refresh();
    });
  return { pending, run };
}

const btn =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50";

export function CenterStatusControls({
  centerId,
  status,
}: {
  centerId: string;
  status: CenterStatus;
}) {
  const { pending, run } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      {status !== "APPROVED" && (
        <button
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
          disabled={pending}
          onClick={() => run(() => setCenterStatusAction(centerId, "APPROVED"))}
        >
          <Check className="h-3.5 w-3.5" /> Təsdiqlə
        </button>
      )}
      {status !== "DEACTIVATED" && (
        <button
          className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}
          disabled={pending}
          onClick={() => run(() => setCenterStatusAction(centerId, "DEACTIVATED"))}
        >
          <Ban className="h-3.5 w-3.5" /> Deaktiv et
        </button>
      )}
      {status === "DEACTIVATED" && (
        <button
          className={`${btn} bg-amber-100 text-amber-700 hover:bg-amber-200`}
          disabled={pending}
          onClick={() => run(() => setCenterStatusAction(centerId, "PENDING"))}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Gözləməyə qaytar
        </button>
      )}
    </div>
  );
}

export function DoctorStatusControls({
  doctorId,
  status,
}: {
  doctorId: string;
  status: CenterStatus;
}) {
  const { pending, run } = useAction();
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      {status !== "APPROVED" && (
        <button
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}
          disabled={pending}
          onClick={() => run(() => setDoctorStatusAction(doctorId, "APPROVED"))}
        >
          <Check className="h-3.5 w-3.5" /> Təsdiqlə
        </button>
      )}
      {status !== "DEACTIVATED" && (
        <button
          className={`${btn} bg-slate-100 text-slate-700 hover:bg-slate-200`}
          disabled={pending}
          onClick={() => run(() => setDoctorStatusAction(doctorId, "DEACTIVATED"))}
        >
          <Ban className="h-3.5 w-3.5" /> Deaktiv et
        </button>
      )}
      {status === "DEACTIVATED" && (
        <button
          className={`${btn} bg-amber-100 text-amber-700 hover:bg-amber-200`}
          disabled={pending}
          onClick={() => run(() => setDoctorStatusAction(doctorId, "PENDING"))}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Gözləməyə qaytar
        </button>
      )}
    </div>
  );
}

export function BlockToggle({
  userId,
  blocked,
}: {
  userId: string;
  blocked: boolean;
}) {
  const { pending, run } = useAction();
  return (
    <button
      className={`${btn} ${
        blocked
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-red-100 text-red-700 hover:bg-red-200"
      }`}
      disabled={pending}
      onClick={() => run(() => setUserBlockedAction(userId, !blocked))}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : blocked ? (
        <ShieldCheck className="h-3.5 w-3.5" />
      ) : (
        <ShieldOff className="h-3.5 w-3.5" />
      )}
      {blocked ? "Bloku götür" : "Blokla"}
    </button>
  );
}

export function ReferralStatusSelect({
  id,
  status,
}: {
  id: string;
  status: ReferralStatus;
}) {
  const { pending, run } = useAction();
  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      <Select
        defaultValue={status}
        onChange={(e) => run(() => setReferralStatusAction(id, e.target.value as ReferralStatus))}
        className="h-9 w-44 text-xs"
      >
        <option value="NEW">Yeni</option>
        <option value="CONTACTED">Əlaqə saxlanılıb</option>
        <option value="COMPLETED">Tamamlanıb</option>
      </Select>
    </div>
  );
}

export function RequestStatusSelectAdmin({
  id,
  status,
}: {
  id: string;
  status: RequestStatus;
}) {
  const { pending, run } = useAction();
  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      <Select
        defaultValue={status}
        onChange={(e) => run(() => setRequestStatusAdminAction(id, e.target.value as RequestStatus))}
        className="h-9 w-44 text-xs"
      >
        <option value="NEW">Yeni</option>
        <option value="CONTACTED">Əlaqə saxlanılıb</option>
        <option value="COMPLETED">Tamamlanıb</option>
        <option value="CANCELLED">Ləğv edilib</option>
      </Select>
    </div>
  );
}
