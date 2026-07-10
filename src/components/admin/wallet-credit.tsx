/**
 * Admin-only wallet top-up form — lets an admin add balance to a user manually
 * (testing / manual payments before Payriff is live). `action` is bound to the
 * target user id.
 */
export function WalletCredit({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
      <label className="text-sm">
        <span className="mb-1 block font-medium text-slate-600">Balans artır (₼)</span>
        <input
          type="number"
          name="manat"
          min={1}
          step="1"
          placeholder="məs. 59"
          className="h-11 w-32 rounded-xl border border-slate-200 px-3 text-sm"
        />
      </label>
      <button
        type="submit"
        className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        Balansa əlavə et
      </button>
    </form>
  );
}
