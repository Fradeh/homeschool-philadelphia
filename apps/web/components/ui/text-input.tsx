import type { InputHTMLAttributes } from "react";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function TextInput({ invalid = false, className = "", ...props }: TextInputProps) {
  return (
    <input
      className={`h-11 w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] transition-colors placeholder:text-[var(--color-text-muted)] hover:border-[var(--color-border-strong)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:opacity-70 ${
        invalid
          ? "border-[var(--color-danger)]"
          : "border-[var(--color-border)] focus:border-[var(--color-focus)]"
      } ${className}`}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
