import { StudentPortalShell } from "@/features/student/StudentPortalShell";
import { StudentCalendarPage } from "@/features/student/calendar/StudentCalendarPage";

export default function StudentCalendarRoute() {
  return (
    <StudentPortalShell active="calendar" eyebrow="Portal del estudiante" title="Calendario" contentOverflow="hidden">
      <StudentCalendarPage />
    </StudentPortalShell>
  );
}
