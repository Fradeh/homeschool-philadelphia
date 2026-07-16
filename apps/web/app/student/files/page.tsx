import { StudentPortalShell } from "@/features/student/StudentPortalShell";
import { StudentFilesPage } from "@/features/student/files/StudentFilesPage";

export default function StudentFilesRoute() {
  return <StudentPortalShell active="files" eyebrow="Portal del estudiante" title="Archivos"><StudentFilesPage /></StudentPortalShell>;
}
