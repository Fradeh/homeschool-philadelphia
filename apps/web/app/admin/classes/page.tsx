import { AdminPortalShell } from "@/features/admin/AdminPortalShell";
import { AdminClassesPage } from "@/features/admin/classes/AdminClassesPage";

export default function AdminClassesRoute() {
  return (
    <AdminPortalShell active="classes" eyebrow="Panel ADMIN" title="Clases" contentOverflow="hidden">
      <AdminClassesPage />
    </AdminPortalShell>
  );
}
