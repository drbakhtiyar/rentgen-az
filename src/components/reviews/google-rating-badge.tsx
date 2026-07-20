import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Four-colour Google "G" for attribution. */
function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-4 w-4", className)} aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

/**
 * Google rating pill (attributed, links to the Google listing). Shown on the
 * center page when the center has connected its Google Place.
 */
export function GoogleRatingBadge({
  placeId,
  rating,
  reviewCount,
  className,
}: {
  placeId: string | null;
  rating: number;
  reviewCount: number | null;
  className?: string;
}) {
  const href = placeId
    ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`
    : undefined;
  const inner = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-sm shadow-sm ring-1 ring-white/30",
        className,
      )}
    >
      <GoogleG />
      <span className="font-bold text-ink-900">{rating.toFixed(1)}</span>
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {reviewCount ? <span className="text-slate-500">({reviewCount})</span> : null}
    </span>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" title="Google" className="hover:opacity-90">
      {inner}
    </a>
  ) : (
    inner
  );
}
