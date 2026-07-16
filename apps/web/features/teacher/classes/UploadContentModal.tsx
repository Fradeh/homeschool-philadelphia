"use client";

import { X } from "lucide-react";
import type { TeacherMaterial } from "./mock-teacher-classes";

export type UploadContentForm = {
  name: string;
  type: TeacherMaterial["type"];
  file?: File;
  url?: string;
};

export function UploadContentModal({
  open,
  onClose,
  onUpload
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (form: UploadContentForm) => void;
}) {
  if (!open) return null;

  function handleSubmit(formData: FormData) {
    const file = formData.get("file");
    onUpload({
      name: String(formData.get("name") ?? ""),
      type: String(formData.get("type") ?? "Documento") as TeacherMaterial["type"],
      file: file instanceof File && file.size ? file : undefined,
      url: String(formData.get("url") ?? "") || undefined
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <section className="w-full max-w-xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#edf0f6] px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f75a8]">Nuevo contenido</p>
            <h2 className="mt-1 text-xl font-semibold text-[#191970]">Subir contenido</h2>
          </div>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <form action={handleSubmit} className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Nombre del material</span>
            <input
              name="name"
              required
              placeholder="Ej. Guía de lectura unidad 2"
              className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 text-sm outline-none focus:border-[#191970]"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Tipo</span>
            <select
              name="type"
              className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 text-sm outline-none focus:border-[#191970]"
            >
              <option>PDF</option>
              <option>Documento</option>
              <option>Enlace</option>
              <option>Presentación</option>
            </select>
          </label>
          <label className="block"><span className="text-sm font-semibold text-slate-700">Archivo</span><input name="file" type="file" className="mt-2 block w-full rounded-md border border-dashed border-[#cbd3e1] p-4 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[#eef2ff] file:px-3 file:py-2 file:font-semibold file:text-[#191970]" /></label>
          <label className="block"><span className="text-sm font-semibold text-slate-700">O enlace externo</span><input name="url" type="url" placeholder="https://…" className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 text-sm outline-none focus:border-[#191970]" /></label>
          <div className="flex justify-end gap-3 border-t border-[#edf0f6] pt-5">
            <button type="button" onClick={onClose} className="rounded-md border border-[#d8deeb] px-4 py-2 text-sm font-semibold text-[#191970]">
              Cancelar
            </button>
            <button type="submit" className="rounded-md bg-[#191970] px-4 py-2 text-sm font-semibold text-white">
              Subir
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
