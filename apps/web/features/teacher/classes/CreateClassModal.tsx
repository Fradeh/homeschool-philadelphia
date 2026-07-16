"use client";

import { X } from "lucide-react";
import type { ClassColor } from "./mock-teacher-classes";

const colorOptions: Array<{ value: ClassColor; label: string; className: string }> = [
  { value: "navy", label: "Azul institucional", className: "bg-[#191970]" },
  { value: "blue", label: "Azul claro", className: "bg-[#078cc5]" },
  { value: "indigo", label: "Índigo", className: "bg-[#3949ab]" },
  { value: "teal", label: "Verde sobrio", className: "bg-[#168579]" },
  { value: "slate", label: "Gris azulado", className: "bg-slate-600" }
];

export type CreateClassForm = {
  name: string;
  code: string;
  description: string;
  color: ClassColor;
};

export function CreateClassModal({
  open,
  onClose,
  onCreate
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (form: CreateClassForm) => void;
}) {
  if (!open) return null;

  function handleSubmit(formData: FormData) {
    onCreate({
      name: String(formData.get("name") ?? ""),
      code: String(formData.get("code") ?? ""),
      description: String(formData.get("description") ?? ""),
      color: String(formData.get("color") ?? "navy") as ClassColor
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <section className="w-full max-w-xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#edf0f6] px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f75a8]">Nueva clase</p>
            <h2 className="mt-1 text-xl font-semibold text-[#191970]">Crear clase</h2>
          </div>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Nombre de la clase</span>
            <input
              name="name"
              required
              placeholder="Ej. English 9th Grade"
              className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 text-sm outline-none focus:border-[#191970]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Código o grado</span>
            <input
              name="code"
              required
              placeholder="Ej. ENG-9"
              className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 text-sm outline-none focus:border-[#191970]"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Descripción</span>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Describe el propósito de la clase."
              className="mt-2 w-full resize-none rounded-md border border-[#d8deeb] px-3 py-3 text-sm outline-none focus:border-[#191970]"
            />
          </label>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-700">Identificador visual</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {colorOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-[#edf0f6] px-3 py-2 text-sm text-slate-700 hover:bg-[#f6f8fc]"
                >
                  <input type="radio" name="color" value={option.value} defaultChecked={option.value === "navy"} />
                  <span className={`h-4 w-4 rounded-full ${option.className}`} />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 border-t border-[#edf0f6] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#d8deeb] px-4 py-2 text-sm font-semibold text-[#191970] hover:bg-[#eef2ff]"
            >
              Cancelar
            </button>
            <button type="submit" className="rounded-md bg-[#191970] px-4 py-2 text-sm font-semibold text-white">
              Crear
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
