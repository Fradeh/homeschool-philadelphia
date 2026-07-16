import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { TeacherMessagesPage } from "@/features/teacher/messages/TeacherMessagesPage";

export default function TeacherMessagesRoute() {
  return (
    <TeacherPortalShell active="messages" eyebrow="Portal del profesor" title="Mensajes" contentOverflow="hidden">
      <TeacherMessagesPage />
    </TeacherPortalShell>
  );
}
