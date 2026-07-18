import { Gem, CalendarDays, Users, Clock } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/shell";
import { crmNav } from "@/components/dashboard/role-navs";
import { Card } from "@/components/ui/card";
import { getLocale } from "@/lib/i18n-server";
import { getCrmDict } from "@/lib/i18n-crm";

/** Shown when a non-Platinum center opens the CRM — upgrade prompt. */
export async function CrmUpsell({ centerName }: { centerName: string }) {
  const t = getCrmDict(await getLocale());
  return (
    <DashboardShell title="CRM" roleLabel={centerName} userName={centerName} nav={crmNav} collapsible>
      <Card className="mx-auto max-w-2xl overflow-hidden p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-200 to-cyan-100 text-cyan-700">
          <Gem className="h-7 w-7" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-bold text-ink-900">
          {t.upsell.title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-slate-600">
          {t.upsell.desc}
        </p>

        <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
          {[
            { icon: <CalendarDays className="h-5 w-5" />, t: t.upsell.f1 },
            { icon: <Users className="h-5 w-5" />, t: t.upsell.f2 },
            { icon: <Clock className="h-5 w-5" />, t: t.upsell.f3 },
          ].map((f) => (
            <div key={f.t} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <span className="text-cyan-600">{f.icon}</span>
              {f.t}
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href="https://rentgen.az/merkez/paket"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <Gem className="h-4 w-4" /> {t.upsell.goPlatinum}
          </a>
          <a
            href="https://rentgen.az/paketler"
            className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            {t.upsell.viewPackages}
          </a>
        </div>
      </Card>
    </DashboardShell>
  );
}
