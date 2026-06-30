"use client";

import * as React from "react";
import { track } from "@vercel/analytics";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/field";
import { submitWaitlistAction } from "@/app/actions/public";
import type { WaitlistCopy, WaitlistLocale } from "@/content/waitlist-copy";
import { cn } from "@/lib/utils";

export function WaitlistForm({
  copy,
  locale,
}: {
  copy: WaitlistCopy;
  locale: WaitlistLocale;
}) {
  const [pending, startTransition] = React.useTransition();
  const [audience, setAudience] = React.useState<"patient" | "doctor" | "center">("patient");
  const [done, setDone] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await submitWaitlistAction({
        name: String(fd.get("name") ?? ""),
        phone: String(fd.get("phone") ?? ""),
        email: String(fd.get("email") ?? ""),
        city: String(fd.get("city") ?? ""),
        audience,
        locale,
        note: String(fd.get("note") ?? ""),
      });
      if (!res.ok) {
        setError(res.error ?? "Error");
        return;
      }
      track("waitlist_signup", { locale, audience });
      setDone(res.message ?? "OK");
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
        <p className="mt-3 font-semibold text-emerald-800">{done}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-800">
          {copy.audienceLabel}
        </span>
        <div className="flex flex-wrap gap-2">
          {copy.audienceOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setAudience(opt.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                audience === opt.value
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-200 bg-white text-ink-700 hover:border-brand-300",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.nameLabel} htmlFor="wl-name" required>
          <Input id="wl-name" name="name" placeholder={copy.namePlaceholder} required />
        </Field>
        <Field label={copy.cityLabel} htmlFor="wl-city">
          <Input id="wl-city" name="city" placeholder={copy.cityPlaceholder} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={copy.phoneLabel} htmlFor="wl-phone">
          <Input
            id="wl-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder={copy.phonePlaceholder}
          />
        </Field>
        <Field label={copy.emailLabel} htmlFor="wl-email">
          <Input id="wl-email" name="email" type="email" placeholder={copy.emailPlaceholder} />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-slate-500">{copy.contactHint}</p>

      <Field label={copy.noteLabel} htmlFor="wl-note">
        <Input id="wl-note" name="note" placeholder={copy.notePlaceholder} />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {pending ? copy.submitting : copy.submit}
      </Button>
      <p className="text-center text-xs text-slate-400">{copy.privacyNote}</p>
    </form>
  );
}
