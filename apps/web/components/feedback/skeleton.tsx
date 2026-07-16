import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rounded?: "sm" | "md" | "lg" | "full";
}

const roundedClasses = {
  sm: "rounded",
  md: "rounded-md",
  lg: "rounded-xl",
  full: "rounded-full"
};

export function Skeleton({ rounded = "md", className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-[var(--color-surface-muted)] motion-reduce:animate-none ${roundedClasses[rounded]} ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonGroup({
  label = "Cargando contenido",
  children
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      {children}
      <span className="sr-only">{label}…</span>
    </div>
  );
}
