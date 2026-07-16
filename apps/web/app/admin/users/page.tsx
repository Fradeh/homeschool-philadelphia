import { AdminPortalShell } from "@/features/admin/AdminPortalShell";
import { AdminUsersPage } from "@/features/admin/users/AdminUsersPage";

export default function AdminUsersRoute() {
  return (
    <AdminPortalShell active="users" eyebrow="Panel ADMIN" title="Usuarios" contentOverflow="hidden">
      <AdminUsersPage />
    </AdminPortalShell>
  );
}
