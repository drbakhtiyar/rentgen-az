import { Stars } from "./stars";

type Scores = {
  scoreService: number | null;
  scoreStaff: number | null;
  scoreClean: number | null;
  scoreWait: number | null;
  scorePrice: number | null;
};

const ROWS: { key: keyof Scores; label: string }[] = [
  { key: "scoreService", label: "Xidmət keyfiyyəti" },
  { key: "scoreStaff", label: "Personalın münasibəti" },
  { key: "scoreClean", label: "Təmizlik və rahatlıq" },
  { key: "scoreWait", label: "Gözləmə vaxtı" },
  { key: "scorePrice", label: "Qiymət / dəyər" },
];

/** Per-question star breakdown for a review (renders nothing if no sub-scores). */
export function ScoreBreakdown({ review }: { review: Scores }) {
  const rows = ROWS.filter((r) => review[r.key] != null);
  if (rows.length === 0) return null;
  return (
    <div className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500">{r.label}</span>
          <Stars value={review[r.key] as number} size="sm" />
        </div>
      ))}
    </div>
  );
}
