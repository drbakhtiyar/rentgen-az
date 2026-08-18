import type { Metadata } from "next";

/**
 * pacs.rentgen.az — BOŞ səhifə (istifadəçi qərarı, 2026-08-19).
 * Subdomen rezerv edilib; PACS sistemi hazır olanda məzmun buraya gələcək.
 * noindex — axtarışa düşməsin, ana saytın dublikatı olmasın.
 */
export const metadata: Metadata = {
  title: "pacs.rentgen.az",
  robots: { index: false, follow: false },
};

export default function PacsHomePage() {
  return <div className="min-h-screen bg-white" />;
}
