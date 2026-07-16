import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";

export function DashboardHero({
  eyebrow,
  title,
  description,
  actions,
  aside
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-panel)] bg-[linear-gradient(120deg,var(--color-brand-950),var(--color-brand-700))] text-white shadow-sm">
      <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-8 lg:py-7">
        <div className="max-w-3xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-pretty text-2xl font-semibold tracking-tight sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">{description}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">{actions}</div>
        </div>
        {aside ? <div className="lg:min-w-52">{aside}</div> : null}
      </div>
    </section>
  );
}

export function DashboardHeroLink({
  href,
  children,
  tone = "light"
}: {
  href: string;
  children: ReactNode;
  tone?: "light" | "outline";
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 py-2 text-sm font-semibold transition-colors ${
        tone === "light"
          ? "bg-white text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)]"
          : "border border-white/25 bg-white/5 text-white hover:bg-white/10"
      }`}
    >
      {children}
      <ArrowRight size={15} aria-hidden="true" />
    </Link>
  );
}

export function DashboardMetricCard({
  href,
  icon,
  value,
  label,
  helper
}: {
  href: string;
  icon: ReactNode;
  value: number;
  label: string;
  helper?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-24 items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-[var(--color-border-strong)] hover:shadow-md"
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-900)] [&>svg]:h-5 [&>svg]:w-5"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <strong className="block text-2xl font-semibold tabular-nums text-[var(--color-brand-950)]">
          {value}
        </strong>
        <span className="block truncate text-sm font-semibold text-[var(--color-text-secondary)]">
          {label}
        </span>
        {helper ? (
          <span className="mt-0.5 block truncate text-xs text-[var(--color-text-muted)]">
            {helper}
          </span>
        ) : null}
      </div>
      <ArrowRight
        size={16}
        className="ml-auto shrink-0 text-[var(--color-border-strong)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-brand-900)]"
        aria-hidden="true"
      />
    </Link>
  );
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className = ""
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] ${className}`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border-soft)] px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-brand-950)]">{title}</h3>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function DashboardPanelLink({
  href,
  children = "Ver todo"
}: {
  href: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-9 items-center rounded-md px-2 text-xs font-semibold text-[var(--color-accent-700)] hover:bg-[var(--color-accent-100)] hover:text-[var(--color-brand-900)]"
    >
      {children}
    </Link>
  );
}

export function DashboardLoading() {
  return (
    <SkeletonGroup label="Cargando panel">
      <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-48 w-full" rounded="lg" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24" rounded="lg" />
          ))}
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <Skeleton className="h-80" rounded="lg" />
          <Skeleton className="h-80" rounded="lg" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
