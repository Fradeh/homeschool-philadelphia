import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { TeacherPacesPage } from "@/features/teacher/paces/TeacherPacesPage";
export default function TeacherPacesRoute() { return <TeacherPortalShell active="paces" eyebrow="Portal del profesor" title="PACEs" contentOverflow="hidden"><TeacherPacesPage /></TeacherPortalShell>; }
