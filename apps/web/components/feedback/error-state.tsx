import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export interface ErrorStateProps {
  title?: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "No pudimos cargar esta información",
  description,
  action,
  className = ""
}: ErrorStateProps) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] px-6 py-8 text-center ${className}`}
      role="alert"
    >
      <AlertCircle className="mx-auto h-10 w-10 text-[var(--color-danger)]" aria-hidden="true" />
      <h3 className="mt-4 text-base font-semibold text-[var(--color-text)]">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--color-text-secondary)]">
        {description}
      </p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
