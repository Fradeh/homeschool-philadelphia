import type { HTMLAttributes, ReactNode } from "react";

export type StatusBadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export interface StatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusBadgeTone;
  icon?: ReactNode;
}

const toneClasses: Record<StatusBadgeTone, string> = {
  neutral:
    "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
  success:
    "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]",
  warning:
    "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
  danger:
    "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]"
};

export function StatusBadge({
  tone = "neutral",
  icon,
  className = "",
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true">{icon}</span>
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
