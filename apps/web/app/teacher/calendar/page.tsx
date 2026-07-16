import { TeacherCalendarPage } from "@/features/teacher/calendar/TeacherCalendarPage";
import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";

export default function CalendarRoutePage() {
  return <TeacherPortalShell active="calendar" eyebrow="Portal del profesor" title="Calendario" contentOverflow="hidden"><TeacherCalendarPage /></TeacherPortalShell>;
}
