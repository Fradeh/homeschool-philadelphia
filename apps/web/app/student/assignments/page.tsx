import { StudentPortalShell } from "@/features/student/StudentPortalShell";
import { StudentAssignmentsPage } from "@/features/student/assignments/StudentAssignmentsPage";

export default function StudentAssignmentsRoute() {
  return <StudentPortalShell active="assignments" eyebrow="Portal del estudiante" title="Tareas"><StudentAssignmentsPage /></StudentPortalShell>;
}
