import { StudentPortalShell } from "@/features/student/StudentPortalShell";
import { StudentDashboardV1 } from "@/features/student/dashboard/StudentDashboardV1";
export default function StudentDashboardRoute() { return <StudentPortalShell active="dashboard" eyebrow="Portal del estudiante" title="Inicio"><StudentDashboardV1/></StudentPortalShell>; }
