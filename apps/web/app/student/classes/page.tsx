import { StudentPortalShell } from "@/features/student/StudentPortalShell";
import { StudentClassesPage } from "@/features/student/classes/StudentClassesPage";
export default function StudentClassesRoute(){return <StudentPortalShell active="classes" eyebrow="Portal del estudiante" title="Mis clases"><StudentClassesPage/></StudentPortalShell>}
