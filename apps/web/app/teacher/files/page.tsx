import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { TeacherFilesPage } from "@/features/teacher/files/TeacherFilesPage";

export default function TeacherFilesRoute() {
  return <TeacherPortalShell active="files" eyebrow="Portal del profesor" title="Archivos"><TeacherFilesPage /></TeacherPortalShell>;
}
