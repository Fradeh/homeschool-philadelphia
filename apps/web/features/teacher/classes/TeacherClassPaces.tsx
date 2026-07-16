"use client";

import { BookOpenCheck } from "lucide-react";
import { usePaceWorkspace } from "@/features/paces/use-pace-workspace";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";

type PaceProjectionItem = {
  number: number;
  status: "completed" | "current" | "planned";
};

export function TeacherClassPaces({
  classId,
  studentIds
}: {
  classId: string;
  studentIds: string[];
}) {
  const { workspace, ready } = usePaceWorkspace();
  const subjects = workspace.subjects.filter((item) => item.classId === classId);
  const students = workspace.plans.filter((item) => studentIds.includes(item.studentId));

  if (!ready) {
    return (
      <p className="p-8 text-center text-sm text-[var(--color-text-secondary)]" role="status">
        Cargando PACEs…
      </p>
    );
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[#191970]">PACEs de la clase</h2>
        <p className="mt-1 text-sm text-slate-500">
          Consulta la secuencia y el avance asignado a cada estudiante.
        </p>
        <InlineAlert className="mt-4" tone="info" title="Proyección académica de solo lectura">
          La cantidad y la secuencia de PACEs se definen en la configuración académica
          institucional. Desde esta vista puedes consultar la proyección; usa el módulo general de
          PACEs para actualizar estados y calificaciones.
        </InlineAlert>
      </div>

      {subjects.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {subjects.map((subject) => (
            <article
              key={subject.id}
              className="overflow-hidden rounded-lg border border-[#d8deeb] bg-white shadow-sm"
            >
              <div className="h-2" style={{ backgroundColor: subject.color }} aria-hidden="true" />
              <header className="border-b border-[#edf0f6] px-5 py-4">
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-md px-2 py-1 text-xs font-bold"
                    style={{ color: subject.color, backgroundColor: `${subject.color}12` }}
                  >
                    {subject.shortName}
                  </span>
                  <h3 className="font-semibold text-[#191970]">{subject.name}</h3>
                </div>
              </header>
              <div className="divide-y divide-[#edf0f6]">
                {students.map((student) => {
                  const items = student.plans[subject.id];
                  return (
                    <div key={student.studentId} className="px-5 py-4">
                      <p className="truncate text-sm font-semibold text-[#191970]">
                        {student.studentName}
                      </p>
                      {items?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {items.map((pace) => (
                            <Chip key={pace.number} pace={pace} />
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-slate-400">Sin PACEs vinculados</p>
                      )}
                    </div>
                  );
                })}
                {!students.length ? (
                  <p className="p-6 text-center text-sm text-slate-500">
                    No hay alumnos matriculados en esta clase.
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpenCheck size={22} />}
          title="Esta clase no tiene materias PACE"
          description="La configuración académica institucional todavía no tiene PACEs vinculados a esta clase."
        />
      )}
    </section>
  );
}

function Chip({ pace }: { pace: PaceProjectionItem }) {
  const css =
    pace.status === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : pace.status === "current"
        ? "bg-[#eaf7fc] text-[#078cc5] border-[#078cc5] ring-1 ring-[#078cc5]"
        : "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`rounded-md border px-2.5 py-1.5 text-xs font-bold ${css}`}>
      {pace.number}
    </span>
  );
}
