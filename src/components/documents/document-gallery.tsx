"use client";

import * as React from "react";
import { FileText, X, ZoomIn } from "lucide-react";

type Doc = { label: string; url: string };

const isPdf = (url: string) => /\.pdf($|\?)/i.test(url);

/** Credential/official documents as thumbnails; click to enlarge (images) or
 *  open (PDF). Used on doctor and center public profiles. */
export function DocumentGallery({
  docs,
  title = "Sənədlər",
}: {
  docs: Doc[];
  title?: string;
}) {
  const [active, setActive] = React.useState<Doc | null>(null);

  if (docs.length === 0) return null;

  return (
    <div className="mt-5">
      <h2 className="text-sm font-semibold text-ink-800">{title}</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {docs.map((d) => (
          <div key={d.url} className="group">
            {isPdf(d.url) ? (
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:border-brand-300 hover:bg-brand-50"
              >
                <FileText className="h-8 w-8" />
                <span className="px-2 text-center text-xs font-medium">{d.label}</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setActive(d)}
                className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 ring-brand-300 hover:ring-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.url} alt={d.label} loading="lazy" className="h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                  <ZoomIn className="h-6 w-6" />
                </span>
                <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-left text-xs font-medium text-white">
                  {d.label}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Bağla"
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={active.label}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
