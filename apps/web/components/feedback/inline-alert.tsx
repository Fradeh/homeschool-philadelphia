import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";

export type InlineAlertTone = "success" | "warning" | "danger" | "info";

export interface InlineAlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: InlineAlertTone;
  title?: string;
  action?: ReactNode;
}

const toneClasses: Record<InlineAlertTone, string> = {
  success:
    "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]",
  warning:
    "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]",
  danger:
    "border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
  info: "border-[var(--color-info-border)] bg-[var(--color-info-bg)] text-[var(--color-info)]"
};

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info
};

export function InlineAlert({
  tone = "info",
  title,
  action,
  className = "",
  children,
  ...props
}: InlineAlertProps) {
  const Icon = icons[tone];
  return (
    <div
      className={`flex items-start gap-3 rounded-[var(--radius-control)] border px-4 py-3 ${toneClasses[tone]} ${className}`}
      role={tone === "danger" ? "alert" : "status"}
      aria-live={tone === "danger" ? "assertive" : "polite"}
      {...props}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={`${title ? "mt-1" : ""} text-sm leading-5`}>{children}</div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
