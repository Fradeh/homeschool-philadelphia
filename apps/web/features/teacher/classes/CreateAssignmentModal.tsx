"use client";

import { Upload, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { InlineAlert } from "@/components/feedback/inline-alert";

export type CreateAssignmentForm = {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  points: number;
  submissionType: "Archivo" | "Texto" | "Enlace" | "Sin entrega";
  files: File[];
  status: "Borrador" | "Publicada";
  classId?: string;
};

export function CreateAssignmentModal({
  open,
  onClose,
  onCreate,
  classes,
  selectedClassId
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (form: CreateAssignmentForm) => void | Promise<void>;
  classes?: Array<{ id: string; name: string; code: string }>;
  selectedClassId?: string;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;

  async function handleSubmit(formData: FormData) {
    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && Boolean(entry.name));
    if (files.some((file) => file.size === 0)) {
      setError("Uno de los archivos está vacío. Selecciona otro archivo.");
      return;
    }
    if (files.length > 5) {
      setError("Puedes adjuntar un máximo de 5 archivos.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onCreate({
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        dueDate: String(formData.get("dueDate") ?? ""),
        dueTime: String(formData.get("dueTime") ?? "23:59"),
        points: Number(formData.get("points") ?? 100),
        submissionType: String(
          formData.get("submissionType") ?? "Archivo"
        ) as CreateAssignmentForm["submissionType"],
        status: String(formData.get("intent") ?? "Publicada") as CreateAssignmentForm["status"],
        classId: String(formData.get("classId") ?? selectedClassId ?? "") || undefined,
        files
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos crear la tarea.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 h-11 w-full rounded-md border border-[#d8deeb] bg-white px-3 text-sm outline-none focus:border-[#191970]";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#edf0f6] px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f75a8]">
              Nueva tarea
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#191970]">Crear tarea</h2>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>
        <form action={handleSubmit} className="space-y-4 px-6 py-5">
          {classes ? (
            <Field label="Clase">
              <select
                name="classId"
                defaultValue={selectedClassId ?? ""}
                required
                className={inputClass}
              >
                <option value="" disabled>
                  Selecciona una clase
                </option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.code}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="Título">
            <input
              name="title"
              required
              placeholder="Ej. Ensayo final: narrativa personal"
              className={inputClass}
            />
          </Field>
          <Field label="Instrucciones">
            <textarea
              name="description"
              required
              rows={4}
              placeholder="Explica el objetivo, los pasos y los criterios de entrega..."
              className="mt-2 w-full resize-none rounded-md border border-[#d8deeb] px-3 py-3 text-sm outline-none focus:border-[#191970]"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha de entrega">
              <input name="dueDate" type="date" required className={inputClass} />
            </Field>
            <Field label="Hora límite">
              <input
                name="dueTime"
                type="time"
                defaultValue="23:59"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Puntaje">
              <input
                name="points"
                type="number"
                min="0"
                defaultValue="100"
                required
                className={inputClass}
              />
            </Field>
            <Field label="Tipo de entrega">
              <select name="submissionType" defaultValue="Archivo" className={inputClass}>
                <option>Archivo</option>
                <option>Texto</option>
                <option>Enlace</option>
                <option>Sin entrega</option>
              </select>
            </Field>
          </div>
          <Field label="Archivos de apoyo (opcional)">
            <label className="mt-2 flex min-h-14 cursor-pointer items-center gap-3 rounded-md border border-dashed border-[#d8deeb] px-4 text-sm font-semibold text-[#191970] hover:bg-[#f6f8fc]">
              <Upload size={17} aria-hidden="true" />
              Adjuntar archivos
              <input name="files" type="file" multiple className="ml-auto max-w-[65%] text-xs" />
            </label>
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Hasta 5 archivos. Se compartirán con los estudiantes de la clase.
            </span>
          </Field>
          {error ? (
            <InlineAlert tone="danger" title="No se creó la tarea">
              {error}
            </InlineAlert>
          ) : null}
          <div className="flex flex-wrap justify-end gap-3 border-t border-[#edf0f6] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#d8deeb] px-4 py-2 text-sm font-semibold text-[#191970]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              name="intent"
              value="Borrador"
              className="rounded-md border border-[#191970] px-4 py-2 text-sm font-semibold text-[#191970]"
              disabled={submitting}
            >
              Guardar borrador
            </button>
            <button
              type="submit"
              name="intent"
              value="Publicada"
              className="rounded-md bg-[#191970] px-4 py-2 text-sm font-semibold text-white"
              disabled={submitting}
            >
              Publicar tarea
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
