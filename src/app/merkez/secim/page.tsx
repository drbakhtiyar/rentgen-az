import { redirect } from "next/navigation";
import { Building2, MapPin, ArrowRight } from "lucide-react";
import { requireRole } from "@/lib/auth/rbac";
import { centersManagedByPhone } from "@/lib/auth/acting";
import { pickNetworkCenterAction } from "./actions";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({ title: "Mərkəz seçimi", path: "/merkez/secim", noIndex: true });

/**
 * Şəbəkə super admininin mərkəz seçimi (2026-08-19): bu nömrəyə bağlı bütün
 * filialların siyahısı. Klik → seçim cookie-si → həmin mərkəzin paneli.
 * Paneldən «Şəbəkə siyahısı» linki ilə geri qayıdıb başqa filial seçilir.
 */
export default async function NetworkPickPage() {
  const me = await requireRole("CENTER");
  const centers = await centersManagedByPhone(me.phone);
  if (centers.length === 0) redirect("/merkez/qeydiyyat");
  if (centers.length === 1) redirect("/merkez");
  const superName = centers.find((c) => c.superAdminPhone === me.phone)?.superAdminName;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-iris-pulse">Şəbəkə idarəetməsi</p>
      <h1 className="font-display mt-2 text-2xl font-bold text-ink-900">
        {superName ? `${superName} — idarə etdiyiniz mərkəzlər` : "İdarə etdiyiniz mərkəzlər"}
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Dəyişiklik etmək istədiyiniz mərkəzi seçin. Paneldəki «Şəbəkə siyahısı» linki ilə istənilən vaxt bu səhifəyə qayıda bilərsiniz.
      </p>
      <div className="mt-8 space-y-3">
        {centers.map((c) => (
          <form key={c.id} action={pickNetworkCenterAction.bind(null, c.id)}>
            <button
              type="submit"
              className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-iris-veil hover:shadow-[var(--shadow-soft)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                {c.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.logoUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-6 w-6" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-ink-900">{c.name}</span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" /> {c.city ?? "—"}
                  {c.superAdminPhone === me.phone && c.adminPhone !== me.phone && (
                    <span className="ml-2 rounded-full bg-iris-glow/10 px-2 py-0.5 font-semibold text-iris-glow">super admin</span>
                  )}
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-iris-glow" />
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
