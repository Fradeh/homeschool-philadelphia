import { AdminPortalShell } from "@/features/admin/AdminPortalShell";
import { AdminFamiliesPage } from "@/features/admin/families/AdminFamiliesPage";

export default function AdminFamiliesRoute() {
  return (
    <AdminPortalShell active="families" eyebrow="Panel ADMIN" title="Familias" contentOverflow="hidden">
      <AdminFamiliesPage />
    </AdminPortalShell>
  );
}
