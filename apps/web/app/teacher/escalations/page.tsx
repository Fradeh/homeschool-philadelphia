import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { ConversationWorkspace } from "@/features/communication/ConversationWorkspace";

export default function AdministrativeEscalationsRoute() {
  return <PortalAuthGate role={UserRole.ADMINISTRATIVE}><TeacherPortalShell active="escalations" eyebrow="Dirección" title="Conversaciones escaladas"><ConversationWorkspace role="administrative" /></TeacherPortalShell></PortalAuthGate>;
}
import { UserRole } from "@homeschool/shared";
import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
