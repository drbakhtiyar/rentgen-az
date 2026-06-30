import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "whatsapp" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-[0_8px_24px_-10px_rgba(10,95,240,0.7)]",
  secondary: "bg-ink-900 text-white hover:bg-ink-800",
  outline:
    "border border-brand-200 bg-white text-ink-800 hover:border-brand-400 hover:bg-brand-50",
  ghost: "text-ink-700 hover:bg-brand-50",
  whatsapp: "bg-[#25D366] text-white hover:bg-[#1ebe5b]",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-13 px-7 text-base gap-2.5 py-3.5",
};

const base =
  "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: CommonProps = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  CommonProps;

export function Button({
  variant,
  size,
  className,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonClasses({ variant, size, className })} {...props} />
  );
}

export type ButtonLinkProps = React.ComponentProps<typeof Link> & CommonProps;

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, className })} {...props} />
  );
}
