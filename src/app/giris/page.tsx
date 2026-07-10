import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { ShieldCheck, Zap, Lock } from "lucide-react";
import { Container } from "@/components/ui/container";
import { JsonLd } from "@/components/ui/json-ld";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth/rbac";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { getLocale } from "@/lib/i18n-server";
import { getDict } from "@/lib/i18n";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Giriş / Qeydiyyat",
  description:
    "Rentgen.az platformasına telefon nömrəsi və birdəfəlik OTP kod ilə parolsuz giriş edin.",
  path: "/giris",
  noIndex: true,
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; next?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  if (user) redirect(sp.next || dashboardPathForRole(user.role));

  const locale = await getLocale();
  const t = getDict(locale).auth;

  const role =
    sp.role === "center" ? "CENTER" : sp.role === "doctor" ? "DOCTOR" : "PATIENT";

  return (
    <div className="relative overflow-hidden bg-ink-950">
      <div className="absolute inset-0 bg-grid-dark opacity-40" />
      <div className="glow absolute -left-20 top-0 h-96 w-96 opacity-40" />
      <div className="glow-cyan absolute bottom-0 right-0 h-80 w-80 opacity-40" />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Ana səhifə", path: "/" },
          { name: "Giriş", path: "/giris" },
        ])}
      />
      <Container className="relative grid min-h-[calc(100vh-4rem)] items-center gap-12 py-16 lg:grid-cols-2">
        <div className="hidden text-white lg:block">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-cyan-300">
            <Image src="/mark-square.png" alt="" width={16} height={16} className="h-4 w-4 rounded" />
            rentgen.az
          </span>
          <h1 className="font-display mt-5 text-4xl font-bold leading-tight">
            {t.heroTitle}
          </h1>
          <p className="mt-4 max-w-md text-slate-300">
            {t.heroDesc}
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: <Zap className="h-5 w-5" />, t: t.f1t, d: t.f1d },
              { icon: <Lock className="h-5 w-5" />, t: t.f2t, d: t.f2d },
              { icon: <ShieldCheck className="h-5 w-5" />, t: t.f3t, d: t.f3d },
            ].map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600/20 text-cyan-300">
                  {f.icon}
                </span>
                <div>
                  <p className="font-semibold text-white">{f.t}</p>
                  <p className="text-sm text-slate-400">{f.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-md">
          <LoginForm initialRole={role} next={sp.next} locale={locale} />
        </div>
      </Container>
    </div>
  );
}
