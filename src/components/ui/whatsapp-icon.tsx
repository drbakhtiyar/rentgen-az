/** WhatsApp loqosu KONTUR üslubunda (2026-08-21) — yaşıl brend rəngi yox,
 *  lucide ikonları kimi cari rənglə cızılır. Footer + Əlaqə kartlarında. */
export function WhatsAppOutline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Tabler Icons «brand-whatsapp» cızması (MIT) — simmetrik, təmiz kontur */}
      <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
      <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
    </svg>
  );
}
