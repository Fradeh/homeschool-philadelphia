import { UsersRound } from "lucide-react";
import type { TeacherClassStudent } from "./mock-teacher-classes";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { StatusBadge } from "@/components/ui/status-badge";

export function ClassStudents({ students }: { students: TeacherClassStudent[] }) {
  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <header className="border-b border-[var(--color-border)] p-5">
        <h2 className="text-xl font-semibold text-[var(--color-text)]">Alumnos matriculados</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Consulta los estudiantes que la administración ha matriculado en esta clase.
        </p>
        <InlineAlert className="mt-4" tone="info" title="Matrícula administrada por la institución">
          Para agregar o retirar un alumno, solicita el cambio al equipo administrativo. Los
          profesores no modifican matrículas desde este portal.
        </InlineAlert>
      </header>

      {students.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-[var(--color-surface-soft)] text-xs uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-5 py-3">Nombre</th>
                <th className="px-5 py-3">Correo institucional</th>
                <th className="px-5 py-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-5 py-4 font-semibold text-[var(--color-text)]">
                    {student.name}
                  </td>
                  <td className="px-5 py-4 text-[var(--color-text-secondary)]">{student.email}</td>
                  <td className="px-5 py-4">
                    <StatusBadge tone="success">{student.status}</StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          className="m-5"
          icon={<UsersRound size={22} />}
          title="No hay alumnos matriculados"
          description="Cuando la administración matricule estudiantes, aparecerán en esta lista."
        />
      )}
    </section>
  );
}
