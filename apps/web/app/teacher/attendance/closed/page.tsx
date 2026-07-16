import { Clock3 } from "lucide-react";
import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";

export default function TeacherAttendanceClosedRoute() {
  return (
    <TeacherPortalShell active="attendance" eyebrow="Portal del profesor" title="Asistencia">
      <main id="main-content" className="grid min-h-full place-items-center p-5 sm:p-8">
        <section className="max-w-lg rounded-[var(--radius-card)] border border-amber-200 bg-white p-7 text-center shadow-[var(--shadow-card)] sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-800"><Clock3 size={27} aria-hidden="true" /></span>
          <h2 className="mt-5 text-xl font-semibold text-[var(--color-brand-950)]">El período de asistencia rápida ha finalizado</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">El registro de asistencia rápida está disponible hasta las 10:00 a. m. Para mantener la consistencia del GCR, esta opción no está disponible después de ese horario.</p>
        </section>
      </main>
    </TeacherPortalShell>
  );
}
