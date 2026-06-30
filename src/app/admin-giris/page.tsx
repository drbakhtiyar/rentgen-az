import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import {
  verifyAdminChallengeToken,
  ADMIN_CHALLENGE_COOKIE,
} from "@/lib/auth/jwt";
import { env } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { Admin2faForm } from "./challenge-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Admin təsdiq",
  path: "/admin-giris",
  noIndex: true,
});

export default async function Admin2faPage() {
  // Only reachable mid-flow (valid challenge cookie set by the secret link).
  const store = await cookies();
  const challenge = store.get(ADMIN_CHALLENGE_COOKIE)?.value;
  if (!challenge || !(await verifyAdminChallengeToken(challenge))) {
    redirect("/");
  }

  const devHint = env.emailProvider === "console";

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark opacity-40" />
      <div className="glow absolute -left-20 top-0 h-96 w-96 opacity-40" />
      <Container className="relative">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="font-display mt-4 text-2xl font-bold text-ink-900">
            Admin təsdiqi
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Email ünvanınıza göndərilən 6 rəqəmli kodu daxil edin. Kod 5 dəqiqə
            etibarlıdır.
          </p>
          {devHint && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">
              Test rejimi: email göndərilmir — kodu server loglarında görə bilərsiniz.
            </p>
          )}
          <div className="mt-5">
            <Admin2faForm />
          </div>
        </div>
      </Container>
    </div>
  );
}
