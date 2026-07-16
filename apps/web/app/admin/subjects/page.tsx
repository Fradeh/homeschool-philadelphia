import { AdminPortalShell } from "@/features/admin/AdminPortalShell";
import { AdminSubjectsPage } from "@/features/admin/subjects/AdminSubjectsPage";

export default function AdminSubjectsRoute() {
  return <AdminPortalShell active="subjects" eyebrow="Panel ADMIN" title="Materias" contentOverflow="hidden"><AdminSubjectsPage /></AdminPortalShell>;
}
