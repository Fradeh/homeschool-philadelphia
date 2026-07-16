import { StudentPortalShell } from "@/features/student/StudentPortalShell";
import { StudentMessagesPage } from "@/features/student/messages/StudentMessagesPage";

export default function StudentMessagesRoute() {
  return (
    <StudentPortalShell active="messages" eyebrow="Portal del estudiante" title="Mensajes" contentOverflow="hidden">
      <StudentMessagesPage />
    </StudentPortalShell>
  );
}
