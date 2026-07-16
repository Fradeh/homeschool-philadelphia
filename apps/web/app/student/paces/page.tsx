import { StudentPortalShell } from "@/features/student/StudentPortalShell";
import { StudentPacesPage } from "@/features/student/paces/StudentPacesPage";
export default function StudentPacesRoute() { return <StudentPortalShell active="paces" eyebrow="Portal del estudiante" title="Mis PACEs" contentOverflow="hidden"><StudentPacesPage /></StudentPortalShell>; }
