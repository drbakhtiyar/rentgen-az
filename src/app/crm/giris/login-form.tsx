"use client";

import * as React from "react";
import { Loader2, Phone, ShieldCheck, ArrowRight } from "lucide-react";
import { requestCrmOtpAction, verifyCrmOtpAction } from "./actions";

/** Phone-only CRM login: number → OTP → the server decides owner/assistant. */
export function CrmLoginForm() {
  const [step, setStep] = React.useState<"phone" | "otp">("phone");
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await requestCrmOtpAction({ phone });
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Xəta");
    setDevCode(res.devCode ?? null);
    setStep("otp");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await verifyCrmOtpAction({ phone, code });
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "Xəta");
    // On the crm host the app lives at "/", locally under /crm.
    const onCrmHost = window.location.hostname.startsWith("crm.");
    window.location.href = onCrmHost ? "/teqvim" : "/crm/teqvim";
  }

  const field =
    "h-12 w-full rounded-xl border border-slate-200 px-4 text-base focus:border-brand-400 focus:outline-none";

  if (step === "otp") {
    return (
      <form onSubmit={verify} className="space-y-4">
        <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4 text-sm text-brand-800">
          <ShieldCheck className="mb-1 h-5 w-5 text-brand-600" />
          Təsdiq kodu <span className="font-semibold">{phone}</span> nömrəsinə göndərildi.
        </div>
        {devCode && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Test rejimi — kod: <span className="font-bold">{devCode}</span>
          </p>
        )}
        <input
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Təsdiq kodu"
          className={field}
          autoFocus
        />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || code.trim().length < 4}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Daxil ol
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("phone");
            setError(null);
          }}
          className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Geri
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} className="space-y-4">
      <div className="relative">
        <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="050 123 45 67"
          className={`${field} pl-11`}
          autoFocus
          required
        />
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        Kod göndər
      </button>
      <p className="text-center text-xs text-slate-400">
        Mərkəz sahibləri və asistentlər üçün giriş. Sistem nömrənizdən kim olduğunuzu tanıyır.
      </p>
    </form>
  );
}
