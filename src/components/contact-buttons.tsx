"use client";

import { Phone, MessageCircle } from "lucide-react";
import { phoneToInternational } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";
import { trackCenterEventAction } from "@/app/actions/track";

export function CallButton({
  phone,
  className,
  label,
  centerId,
  locale = DEFAULT_LOCALE,
}: {
  phone: string;
  className?: string;
  label?: string;
  /** when set, the click is logged as a "call" analytics event */
  centerId?: string;
  locale?: Locale;
}) {
  const text = label ?? getDict(locale).cta.call;
  return (
    <a
      href={`tel:${phoneToInternational(phone)}`}
      onClick={() => {
        if (centerId) void trackCenterEventAction(centerId, "call");
      }}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700",
        className,
      )}
    >
      <Phone className="h-4 w-4" />
      {text}
    </a>
  );
}

export function WhatsAppButton({
  phone,
  className,
  message,
  label = "WhatsApp",
  centerId,
}: {
  phone: string;
  className?: string;
  message?: string;
  label?: string;
  /** when set, the click is logged as a "whatsapp" analytics event */
  centerId?: string;
}) {
  const url = `https://wa.me/${phoneToInternational(phone)}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        if (centerId) void trackCenterEventAction(centerId, "whatsapp");
      }}
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
