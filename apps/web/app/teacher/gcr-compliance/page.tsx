import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { GcrCompliancePage } from "@/features/administrative/GcrCompliancePage";

export default function AdministrativeGcrComplianceRoute() {
  return <PortalAuthGate role={UserRole.ADMINISTRATIVE}><TeacherPortalShell active="gcr-compliance" eyebrow="Dirección" title="Supervisión GCR"><GcrCompliancePage /></TeacherPortalShell></PortalAuthGate>;
}
import { UserRole } from "@homeschool/shared";
import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
