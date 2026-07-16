import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className = "" }: EmptyStateProps) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-10 text-center ${className}`}
    >
      {icon ? (
        <span
          className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <h3 className={`${icon ? "mt-4" : ""} text-base font-semibold text-[var(--color-text)]`}>
        {title}
      </h3>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}
