import type { ReactNode } from "react";

export interface FormFieldProps {
  htmlFor: string;
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function FormField({
  htmlFor,
  label,
  children,
  hint,
  error,
  required,
  className = ""
}: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-[var(--color-text)]">
        {label}
        {required ? (
          <span className="ml-1 text-[var(--color-danger)]" aria-hidden="true">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (obligatorio)</span> : null}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          className="text-sm font-medium text-[var(--color-danger)]"
          role="alert"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-sm text-[var(--color-text-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function getFormFieldDescriptionId(id: string, options: { error?: string; hint?: string }) {
  if (options.error) return `${id}-error`;
  if (options.hint) return `${id}-hint`;
  return undefined;
}
