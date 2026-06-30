"use client";

import * as React from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/field";
import { submitReferralAction } from "@/app/actions/public";
import { EXAM_TYPES } from "@/lib/constants";

type Option = { value: string; label: string };

export function ReferralForm({ centers }: { centers: Option[] }) {
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitReferralAction({
        doctorName: String(fd.get("doctorName") ?? ""),
        clinic: String(fd.get("clinic") ?? ""),
        doctorPhone: String(fd.get("doctorPhone") ?? ""),
        patientName: String(fd.get("patientName") ?? ""),
        examType: String(fd.get("examType") ?? ""),
        note: String(fd.get("note") ?? ""),
        centerId: String(fd.get("centerId") ?? ""),
      });
      if (!res.ok) {
        setError(res.error ?? "Xəta baş verdi");
        return;
      }
      setDone(res.message ?? "Göndəriş qeydə alındı.");
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <p className="mt-3 text-lg font-semibold text-emerald-800">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Həkimin adı" htmlFor="doctorName" required>
          <Input id="doctorName" name="doctorName" placeholder="Dr. Ad Soyad" required />
        </Field>
        <Field label="Klinika" htmlFor="clinic">
          <Input id="clinic" name="clinic" placeholder="Klinikanın adı" />
        </Field>
        <Field label="Telefon nömrəsi" htmlFor="doctorPhone" required>
          <Input
            id="doctorPhone"
            name="doctorPhone"
            type="tel"
            inputMode="tel"
            placeholder="050 123 45 67"
            required
          />
        </Field>
        <Field label="Pasiyentin adı" htmlFor="patientName" required>
          <Input id="patientName" name="patientName" placeholder="Pasiyentin adı" required />
        </Field>
        <Field label="Lazım olan müayinə" htmlFor="examType" required>
          <Select id="examType" name="examType" defaultValue="" required>
            <option value="" disabled>
              Müayinə növünü seçin
            </option>
            {EXAM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Seçilən rentgen mərkəzi" htmlFor="centerId">
          <Select id="centerId" name="centerId" defaultValue="">
            <option value="">Mərkəz seçin (istəyə bağlı)</option>
            {centers.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Qısa qeyd" htmlFor="note">
        <Textarea id="note" name="note" placeholder="Klinik qeyd (istəyə bağlı)" />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Göndərişi tamamla
      </Button>
    </form>
  );
}
