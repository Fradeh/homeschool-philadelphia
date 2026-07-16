import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { TeacherDashboardV1 } from "@/features/teacher/dashboard/TeacherDashboardV1";
export default function TeacherDashboardRoute() { return <TeacherPortalShell active="dashboard" eyebrow="Portal del profesor" title="Inicio"><TeacherDashboardV1/></TeacherPortalShell>; }
