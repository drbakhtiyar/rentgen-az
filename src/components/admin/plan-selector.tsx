import { ALL_PLANS, PLAN_LABEL } from "@/lib/plans";
import type { Plan } from "@/generated/prisma/client";

/**
 * Admin-only plan (subscription tier) selector. Renders a plain server-action
 * form — no client JS. `action` is a server action already bound to the target id.
 */
export function PlanSelector({
  current,
  action,
}: {
  current: Plan;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block font-medium text-slate-600">Paket</span>
        <select
          name="plan"
          defaultValue={current}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-ink-900"
        >
          {ALL_PLANS.map((p) => (
            <option key={p} value={p}>
              {PLAN_LABEL[p]}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="h-11 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
      >
        Yadda saxla
      </button>
      <span className="self-center text-xs text-slate-400">
        Cari: <span className="font-semibold text-slate-600">{PLAN_LABEL[current]}</span>
      </span>
    </form>
  );
}
