import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { TeacherClassesPage } from "@/features/teacher/classes/TeacherClassesPage";
export default function TeacherClassesRoute() { return <TeacherPortalShell active="classes" eyebrow="Portal del profesor" title="Mis clases"><TeacherClassesPage/></TeacherPortalShell>; }
