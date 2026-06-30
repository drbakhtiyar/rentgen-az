"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Phone, KeyRound, ArrowLeft, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/field";
import { requestOtpAction, verifyOtpAction } from "./actions";

type Role = "PATIENT" | "CENTER";

export function LoginForm({
  initialRole,
  next,
}: {
  initialRole: Role;
  next?: string;
}) {
  const router = useRouter();
  const [role, setRole] = React.useState<Role>(initialRole);
  const [step, setStep] = React.useState<"phone" | "code">("phone");
  const [phone, setPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [cooldown, setCooldown] = React.useState(0);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await requestOtpAction({ phone, role });
      if (!res.ok) {
        setError(res.error ?? "Xəta baş verdi");
        return;
      }
      setDevCode(res.devCode ?? null);
      setStep("code");
      setCooldown(60);
    });
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await verifyOtpAction({ phone, code, role });
      if (!res.ok) {
        setError(res.error ?? "Kod yanlışdır");
        return;
      }
      router.push(next || res.redirectTo || "/");
      router.refresh();
    });
  }

  function resend() {
    if (cooldown > 0) return;
    setError(null);
    setCode("");
    startTransition(async () => {
      const res = await requestOtpAction({ phone, role });
      if (!res.ok) {
        setError(res.error ?? "Xəta baş verdi");
        return;
      }
      setDevCode(res.devCode ?? null);
      setCooldown(60);
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
      {step === "phone" ? (
        <>
          <h2 className="font-display text-2xl font-bold text-ink-900">
            Giriş / Qeydiyyat
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            Telefon nömrənizi daxil edin, sizə təsdiq kodu göndərəcəyik.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            {(
              [
                { k: "PATIENT", label: "Pasiyent" },
                { k: "CENTER", label: "Rentgen mərkəzi" },
              ] as { k: Role; label: string }[]
            ).map((opt) => (
              <button
                key={opt.k}
                type="button"
                onClick={() => setRole(opt.k)}
                className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                  role === opt.k
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-slate-500 hover:text-ink-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={submitPhone} className="mt-5 space-y-4">
            <Field label="Telefon nömrəsi" htmlFor="phone" error={error ?? undefined} required>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="050 123 45 67"
                  className="pl-9"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Kod göndər
            </Button>
          </form>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setError(null);
              setCode("");
            }}
            className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-ink-800"
          >
            <ArrowLeft className="h-4 w-4" /> Geri
          </button>
          <h2 className="font-display text-2xl font-bold text-ink-900">
            Təsdiq kodu
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            <span className="font-semibold text-ink-800">{phone}</span> nömrəsinə
            göndərilən 6 rəqəmli kodu daxil edin.
          </p>

          {devCode && (
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-100">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Test rejimi: kodunuz <strong className="font-mono">{devCode}</strong>{" "}
                (SMS provayderi qoşulduqda görünməyəcək).
              </span>
            </div>
          )}

          <form onSubmit={submitCode} className="mt-5 space-y-4">
            <Field label="OTP kod" htmlFor="code" error={error ?? undefined} required>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="______"
                  className="pl-9 text-center text-lg tracking-[0.5em] font-mono"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                />
              </div>
            </Field>
            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Təsdiqlə və daxil ol
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-500">
            {cooldown > 0 ? (
              <span>Yeni kod {cooldown} saniyədən sonra</span>
            ) : (
              <button
                type="button"
                onClick={resend}
                className="font-semibold text-brand-600 hover:text-brand-700"
                disabled={pending}
              >
                Kodu yenidən göndər
              </button>
            )}
          </div>
        </>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        Davam etməklə{" "}
        <a href="/istifade-shertleri" className="underline">
          İstifadə şərtləri
        </a>{" "}
        və{" "}
        <a href="/gizlilik-siyaseti" className="underline">
          Gizlilik siyasəti
        </a>
        ni qəbul edirsiniz.
      </p>
    </div>
  );
}
