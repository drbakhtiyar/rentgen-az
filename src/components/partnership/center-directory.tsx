"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, MapPin, Search } from "lucide-react";
import { RequestPartnerButton } from "@/components/partnership/partnership-buttons";

/**
 * «Yeni əməkdaşlıq» kataloqu (2026-08-17): 292 mərkəzlik siyahı partnyorları
 * udurdu — asistent «böyük siyahı çıxdı» deyə çaşırdı. İndi partnyorlar ayrıca
 * yuxarı paneldədir (server tərəfdə), bu komponent isə QALAN mərkəzləri
 * axtarışla göstərir. Axtarış klient tərəfindədir — siyahı onsuz da yüklənib.
 */

export type DirectoryCenter = {
  id: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  slug: string;
  status: "PENDING" | "REJECTED" | null;
};

const norm = (s: string) => s.toLowerCase().replace(/i̇/g, "i");

export function CenterDirectory({
  centers,
  searchPlaceholder,
  emptyText,
}: {
  centers: DirectoryCenter[];
  searchPlaceholder: string;
  emptyText: string;
}) {
  const [q, setQ] = React.useState("");
  const needle = norm(q.trim());
  const shown = needle
    ? centers.filter(
        (c) => norm(c.name).includes(needle) || (c.city && norm(c.city).includes(needle)),
      )
    : centers;

  return (
    <div>
      <label className="relative mb-3 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand-400"
        />
      </label>
      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">{emptyText}</p>
      ) : (
        <div className="grid max-h-[560px] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
          {shown.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
                  {c.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logoUrl} alt="" className="h-full w-full object-contain" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                </span>
                <span className="min-w-0">
                  <Link
                    href={`/rentgen-merkezleri/${c.slug}`}
                    className="block truncate font-semibold text-ink-900 hover:text-brand-600"
                  >
                    {c.name}
                  </Link>
                  {c.city && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <MapPin className="h-3 w-3" /> {c.city}
                    </span>
                  )}
                </span>
              </span>
              <RequestPartnerButton centerId={c.id} status={c.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
