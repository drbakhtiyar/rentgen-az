"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Link2, CheckCircle2, ExternalLink } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { setRequestResultAction, setRequestDoctorAction } from "./actions";
import { RentgenFilesPanel, type RentgenFileItem } from "@/components/rentgen/rentgen-files-panel";

type Option = { value: string; label: string };

/**
 * Shown under a COMPLETED request in the center dashboard: paste the rentgen
 * result link, and (if none) assign the referring doctor.
 */
export function RequestResultForm({
  requestId,
  defaultUrl,
  doctorId,
  doctors,
  files = [],
}: {
  requestId: string;
  defaultUrl: string | null;
  doctorId: string | null;
  doctors: Option[];
  files?: RentgenFileItem[];
}) {
  const router = useRouter();
  const [url, setUrl] = React.useState(defaultUrl ?? "");
  const [doctor, setDoctor] = React.useState(doctorId ?? "");
  const [pending, startTransition] = React.useTransition();
  const [msg, setMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function saveUrl() {
    setError(null);
    setMsg(null);
    startTransition(async () => {
      const res = await setRequestResultAction(requestId, url.trim());
      if (!res.ok) return setError(res.error ?? "Xəta");
      setMsg(res.message ?? "Saxlanıldı");
      router.refresh();
    });
  }

  function changeDoctor(next: string) {
    setDoctor(next);
    startTransition(async () => {
      await setRequestDoctorAction(requestId, next);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      {/* Assign referring doctor if none */}
      {!doctorId && doctors.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">
            Yönləndirən həkim (pasiyent seçməyibsə)
          </p>
          <Select
            value={doctor}
            onChange={(e) => changeDoctor(e.target.value)}
            className="h-9 text-sm"
          >
            <option value="">Həkim seçin</option>
            {doctors.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Upload rentgen files directly (B2) */}
      <RentgenFilesPanel requestId={requestId} files={files} />

      {/* Result link (optional / legacy external link) */}
      <div className="border-t border-slate-100 pt-3">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Link2 className="h-3.5 w-3.5" /> Xarici link (istəyə bağlı)
        </p>
        <p className="mb-1.5 text-xs text-slate-400">
          Faylı birbaşa yükləmək əvəzinə xarici bulud linki də əlavə edə bilərsiniz.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="h-9 min-w-0 flex-1 text-sm"
          />
          <Button type="button" size="sm" onClick={saveUrl} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yadda saxla"}
          </Button>
          {defaultUrl && (
            <a
              href={defaultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-white"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Aç
            </a>
          )}
        </div>
        {msg && (
          <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> {msg}
          </p>
        )}
        {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}
