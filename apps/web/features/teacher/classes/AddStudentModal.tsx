"use client";

import { X } from "lucide-react";
import type { TeacherClassStudent } from "./mock-teacher-classes";

export function AddStudentModal({
  open,
  availableStudents,
  onClose,
  onAdd
}: {
  open: boolean;
  availableStudents: TeacherClassStudent[];
  onClose: () => void;
  onAdd: (studentId: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <section className="w-full max-w-xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#edf0f6] px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f75a8]">Alumnos existentes</p>
            <h2 className="mt-1 text-xl font-semibold text-[#191970]">Agregar alumno a la clase</h2>
          </div>
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[24rem] divide-y divide-[#edf0f6] overflow-auto">
          {availableStudents.length ? (
            availableStudents.map((student) => (
              <article key={student.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="font-semibold text-[#191970]">{student.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{student.email}</p>
                </div>
                <button
                  onClick={() => onAdd(student.id)}
                  className="rounded-md bg-[#191970] px-3 py-2 text-sm font-semibold text-white"
                >
                  Agregar
                </button>
              </article>
            ))
          ) : (
            <p className="px-6 py-8 text-sm text-slate-500">No hay alumnos disponibles para agregar.</p>
          )}
        </div>
      </section>
    </div>
  );
}
