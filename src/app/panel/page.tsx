import type { Metadata } from "next";
import Link from "next/link";
import { Building2, MapPin, Search } from "lucide-react";
import { OperatorShell } from "@/components/operator/operator-shell";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { OPERATOR_NAME } from "@/lib/auth/operator";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Operator paneli",
  path: "/panel",
  noIndex: true,
});

const statusTone = { PENDING: "amber", APPROVED: "green", DEACTIVATED: "slate" } as const;
const statusLabel = { PENDING: "Gözləyir", APPROVED: "Təsdiqli", DEACTIVATED: "Deaktiv" } as const;

export default async function PanelHome({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireRole(["OPERATOR", "ADMIN"], "/panel");
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const centers = await prisma.centerProfile.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
            { address: { contains: query, mode: "insensitive" } },
            { phone: { contains: query } },
          ],
        }
      : {},
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, city: true, phone: true, status: true, logoUrl: true },
    take: 500,
  });

  const userName = user.role === "OPERATOR" ? OPERATOR_NAME : "Administrator";

  return (
    <OperatorShell title={`Mərkəzlər (${centers.length})`} userName={userName}>
      <form method="get" className="mb-5">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Ad, şəhər, ünvan və ya nömrə ilə axtar…"
            className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-400"
          />
        </div>
      </form>

      {centers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">
            {query ? "Axtarışa uyğun mərkəz tapılmadı." : "Hələ mərkəz yoxdur."}
          </p>
          <Link
            href="/panel/yeni"
            className="mt-4 inline-flex rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            İlk mərkəzi əlavə et
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {centers.map((c) => (
            <Link
              key={c.id}
              href={`/panel/${c.id}`}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition hover:border-brand-200 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                {c.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logoUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-5 w-5 text-slate-300" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-ink-900">{c.name}</p>
                  <Badge tone={statusTone[c.status]}>{statusLabel[c.status]}</Badge>
                </div>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                  <MapPin className="h-3 w-3" /> {c.city || "—"}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
              </div>
              <span className="text-sm font-medium text-brand-600">Redaktə →</span>
            </Link>
          ))}
        </div>
      )}
    </OperatorShell>
  );
}
