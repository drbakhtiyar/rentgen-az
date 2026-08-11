import Link from "next/link";
import Image from "next/image";
import { LogOut, Plus } from "lucide-react";

/**
 * Minimal chrome for the operator (data-entry) panel. Intentionally spartan:
 * the operator only ever works with centers, so the shell is just a header +
 * "new center" + logout. `userName` is the display name ("Nərmin").
 */
export function OperatorShell({
  title,
  userName,
  showNew = true,
  children,
}: {
  title: string;
  userName: string;
  showNew?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/panel" className="flex items-center gap-2">
            <Image
              src="/mark-square.png"
              alt="rentgen.az"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg"
            />
            <span className="font-display font-bold text-ink-900">Operator paneli</span>
          </Link>
          <div className="flex items-center gap-3">
            {showNew && (
              <Link
                href="/panel/yeni"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
              >
                <Plus className="h-4 w-4" /> Yeni mərkəz
              </Link>
            )}
            <span className="hidden text-sm text-slate-500 sm:inline">{userName}</span>
            <form action="/panel/cixis" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" /> Çıxış
              </button>
            </form>
          </div>
        </div>
        {/* Operator bölmələri (istifadəçi istəyi, 2026-08-12) */}
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {[
            ["Mərkəzlər", "/panel"],
            ["Söhbətlər", "/panel/sohbetler"],
            ["WhatsApp söhbətləri", "/panel/whatsapp-sohbetler"],
            ["WhatsApp dəvətləri", "/panel/whatsapp"],
            ["AI Yardımçı", "/panel/ai"],
            ["Bot beyni", "/panel/bot"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-ink-900"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="font-display mb-5 text-xl font-bold text-ink-900">{title}</h1>
        {children}
      </main>
    </div>
  );
}
