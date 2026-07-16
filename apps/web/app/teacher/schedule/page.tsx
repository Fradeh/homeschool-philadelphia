import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { TeacherSchedulePage } from "@/features/teacher/schedule/TeacherSchedulePage";

export default function TeacherScheduleRoute() {
  return <TeacherPortalShell active="schedule" eyebrow="Portal del profesor" title="Mi horario"><TeacherSchedulePage /></TeacherPortalShell>;
}
