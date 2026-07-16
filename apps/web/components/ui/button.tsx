import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[var(--color-brand-900)] text-white hover:bg-[var(--color-brand-800)]",
  secondary:
    "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brand-900)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-soft)]",
  ghost:
    "border-transparent bg-transparent text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)]",
  danger: "border-transparent bg-[var(--color-danger)] text-white hover:bg-[#8f1d14]"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-2 text-xs",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-base"
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  loadingLabel = "Procesando…",
  leadingIcon,
  trailingIcon,
  className = "",
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <ButtonSpinner /> : leadingIcon}
      <span>{loading ? loadingLabel : children}</span>
      {!loading ? trailingIcon : null}
    </button>
  );
}

function ButtonSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin motion-reduce:animate-none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-80"
        fill="currentColor"
        d="M21 12a9 9 0 0 0-9-9v3a6 6 0 0 1 6 6h3Z"
      />
    </svg>
  );
}
