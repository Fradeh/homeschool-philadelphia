import { AdminPortalShell } from "@/features/admin/AdminPortalShell";
import { AdminDashboardPage } from "@/features/admin/dashboard/AdminDashboardPage";

export default function AdminPage() {
  return (
    <AdminPortalShell active="dashboard" eyebrow="Panel ADMIN" title="Configuración académica" contentOverflow="hidden">
      <AdminDashboardPage />
    </AdminPortalShell>
  );
}
