import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { TeacherAssignmentsPage } from "@/features/teacher/assignments/TeacherAssignmentsPage";

export default function TeacherAssignmentsRoute() {
  return <TeacherPortalShell active="assignments" eyebrow="Portal del profesor" title="Tareas"><TeacherAssignmentsPage /></TeacherPortalShell>;
}
