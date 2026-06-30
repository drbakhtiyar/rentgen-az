import * as React from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-ink-900 placeholder:text-slate-400 transition-colors focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input ref={ref} className={cn(inputBase, "h-11", className)} {...props} />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(inputBase, "min-h-[110px] py-3", className)}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(inputBase, "h-11 appearance-none bg-no-repeat pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 0.75rem center",
        backgroundSize: "1.1rem",
      }}
      {...props}
    >
      {children}
    </select>
  );
});

export function Label({
  className,
  children,
  htmlFor,
}: {
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-sm font-medium text-ink-800", className)}
    >
      {children}
    </label>
  );
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs font-medium text-red-600">{children}</p>;
}

export function Field({
  label,
  htmlFor,
  error,
  children,
  hint,
  required,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </Label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}
