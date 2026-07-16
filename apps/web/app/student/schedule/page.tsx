import { StudentPortalShell } from "@/features/student/StudentPortalShell";
import { StudentSchedulePage } from "@/features/student/schedule/StudentSchedulePage";

export default function StudentScheduleRoute() {
  return <StudentPortalShell active="schedule" eyebrow="Portal del estudiante" title="Mi horario"><StudentSchedulePage /></StudentPortalShell>;
}
