"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Select } from "@/components/ui/field";
import { updateRequestStatusAction } from "./actions";
import type { RequestStatus } from "@/generated/prisma/enums";

const OPTIONS: { value: RequestStatus; label: string }[] = [
  { value: "NEW", label: "Yeni" },
  { value: "CONTACTED", label: "Əlaqə saxlanılıb" },
  { value: "COMPLETED", label: "Tamamlanıb" },
  { value: "CANCELLED", label: "Ləğv edilib" },
];

export function RequestStatusControl({
  id,
  status,
}: {
  id: string;
  status: RequestStatus;
}) {
  const [value, setValue] = React.useState<RequestStatus>(status);
  const [pending, startTransition] = React.useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as RequestStatus;
    setValue(next);
    startTransition(async () => {
      await updateRequestStatusAction(id, next);
    });
  }

  return (
    <div className="flex items-center gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
      <Select value={value} onChange={onChange} className="h-9 w-44 text-xs">
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
