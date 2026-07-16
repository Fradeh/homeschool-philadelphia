import { StudentPortalShell } from "@/features/student/StudentPortalShell";
import { StudentGradesPage } from "@/features/student/grades/StudentGradesPage";

export default function StudentGradesRoute() {
  return (
    <StudentPortalShell active="grades" eyebrow="Portal del estudiante" title="Mis notas">
      <StudentGradesPage />
    </StudentPortalShell>
  );
}
