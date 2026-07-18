"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X, UserCog, ShieldCheck } from "lucide-react";
import {
  startAddAssistantAction,
  confirmAddAssistantAction,
  setAssistantActiveAction,
  removeAssistantAction,
} from "./actions";
import { useLocale } from "@/components/locale-context";
import { getCrmDict } from "@/lib/i18n-crm";

type Assistant = { id: string; firstName: string; lastName: string; phone: string; active: boolean };

const field = "rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none";

/** Owner-only: add (with OTP confirmation), toggle and remove assistants. */
export function AssistantsManager({ initial }: { initial: Assistant[] }) {
  const router = useRouter();
  const t = getCrmDict(useLocale()).assistants;
  const [step, setStep] = React.useState<"list" | "form" | "otp">("list");
  const [first, setFirst] = React.useState("");
  const [last, setLast] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await startAddAssistantAction({ firstName: first, lastName: last, phone });
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Xəta");
    setDevCode(res.devCode ?? null);
    setStep("otp");
  }

  async function confirmAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await confirmAddAssistantAction({ firstName: first, lastName: last, phone, code });
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Xəta");
    setStep("list");
    setFirst("");
    setLast("");
    setPhone("");
    setCode("");
    router.refresh();
  }

  async function toggle(a: Assistant) {
    setBusy(true);
    await setAssistantActiveAction(a.id, !a.active);
    setBusy(false);
    router.refresh();
  }

  async function remove(a: Assistant) {
    if (!confirm(t.removeConfirm)) return;
    setBusy(true);
    await removeAssistantAction(a.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{t.desc}</p>
      <p className="text-xs text-slate-400">{t.loginHint}</p>

      {initial.length > 0 ? (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {initial.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
              <UserCog className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="font-semibold text-ink-900">
                {a.firstName} {a.lastName}
              </span>
              <span className="text-slate-500">{a.phone}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => toggle(a)}
                className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  a.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}
              >
                {a.active ? t.activeOn : t.activeOff}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(a)}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="✕"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">{t.empty}</p>
      )}

      {step === "list" &&
        (initial.length === 0 ? (
          <button
            type="button"
            onClick={() => setStep("form")}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> {t.addBtn}
          </button>
        ) : (
          <p className="text-xs text-slate-400">{t.limitNote}</p>
        ))}

      {step === "form" && (
        <form onSubmit={sendCode} className="space-y-3 rounded-xl border border-slate-200 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">{t.first} *</label>
              <input value={first} onChange={(e) => setFirst(e.target.value)} required className={`${field} w-full`} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">{t.last} *</label>
              <input value={last} onChange={(e) => setLast(e.target.value)} required className={`${field} w-full`} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">{t.phone} *</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                placeholder="050 123 45 67"
                required
                className={`${field} w-full`}
              />
            </div>
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {t.sendCode}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("list");
                setError(null);
              }}
              className="rounded-full px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              {t.back}
            </button>
          </div>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={confirmAdd} className="space-y-3 rounded-xl border border-slate-200 p-4">
          <p className="text-sm text-slate-600">
            {t.otpSentPre}
            <span className="font-semibold">{phone}</span>
            {t.otpSentPost}
          </p>
          {devCode && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Test: <span className="font-bold">{devCode}</span>
            </p>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">{t.codeLabel}</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoFocus
              className={`${field} w-40`}
            />
          </div>
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || code.trim().length < 4}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {t.confirmBtn}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError(null);
              }}
              className="rounded-full px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100"
            >
              {t.back}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
