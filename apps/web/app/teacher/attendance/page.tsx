import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { TeacherAttendancePage } from "@/features/teacher/attendance/TeacherAttendancePage";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function isRapidAttendanceClosed() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Panama",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date());
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  return hour >= 10;
}

export default function TeacherAttendanceRoute() {
  if (isRapidAttendanceClosed()) redirect("/teacher/attendance/closed");
  return <TeacherPortalShell active="attendance" eyebrow="Portal del profesor" title="Asistencia"><TeacherAttendancePage /></TeacherPortalShell>;
}
