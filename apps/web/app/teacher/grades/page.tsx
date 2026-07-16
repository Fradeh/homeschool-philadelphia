import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { TeacherGradesPage } from "@/features/teacher/grades/TeacherGradesPage";

export default function TeacherGradesRoute() {
  return (
    <TeacherPortalShell active="grades" eyebrow="Portal del profesor" title="Calificación" contentOverflow="hidden">
      <TeacherGradesPage />
    </TeacherPortalShell>
  );
}
