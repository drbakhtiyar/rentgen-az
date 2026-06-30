import { Phone, MessageCircle } from "lucide-react";
import { phoneToInternational } from "@/lib/phone";
import { cn } from "@/lib/utils";

export function CallButton({
  phone,
  className,
  label = "Zəng et",
}: {
  phone: string;
  className?: string;
  label?: string;
}) {
  return (
    <a
      href={`tel:${phoneToInternational(phone)}`}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700",
        className,
      )}
    >
      <Phone className="h-4 w-4" />
      {label}
    </a>
  );
}

export function WhatsAppButton({
  phone,
  className,
  message,
  label = "WhatsApp",
}: {
  phone: string;
  className?: string;
  message?: string;
  label?: string;
}) {
  const url = `https://wa.me/${phoneToInternational(phone)}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5b]",
        className,
      )}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </a>
  );
}
