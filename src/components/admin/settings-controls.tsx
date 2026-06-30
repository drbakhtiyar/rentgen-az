"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/field";
import {
  toggleServiceActiveAction,
  toggleCityActiveAction,
  saveSeoSettingAction,
} from "@/app/admin/actions";

export function ActiveToggle({
  id,
  kind,
  active,
}: {
  id: string;
  kind: "service" | "city";
  active: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [on, setOn] = React.useState(active);

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      if (kind === "service") await toggleServiceActiveAction(id, next);
      else await toggleCityActiveAction(id, next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        on ? "bg-brand-600" : "bg-slate-300"
      }`}
      aria-pressed={on}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
      {pending && (
        <Loader2 className="absolute -right-6 h-4 w-4 animate-spin text-slate-400" />
      )}
    </button>
  );
}

export function SeoSettingForm() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    startTransition(async () => {
      const res = await saveSeoSettingAction({
        path: get("path"),
        title: get("title"),
        description: get("description"),
        ogImage: get("ogImage"),
      });
      if (!res.ok) {
        setError(res.error ?? "Xəta");
        return;
      }
      setDone(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Səhifə yolu (path)" htmlFor="path" hint="Məs: / və ya /rentgen-merkezleri" required>
        <Input id="path" name="path" placeholder="/" required />
      </Field>
      <Field label="Meta title" htmlFor="title">
        <Input id="title" name="title" />
      </Field>
      <Field label="Meta description" htmlFor="description">
        <Textarea id="description" name="description" className="min-h-[70px]" />
      </Field>
      <Field label="OG image URL" htmlFor="ogImage">
        <Input id="ogImage" name="ogImage" type="url" />
      </Field>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Yadda saxla
        </Button>
        {done && (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Yadda saxlanıldı
          </span>
        )}
      </div>
    </form>
  );
}
