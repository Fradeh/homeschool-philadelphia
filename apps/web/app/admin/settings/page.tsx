import { AdminPortalShell } from "@/features/admin/AdminPortalShell";
import { AdminSettingsPage } from "@/features/admin/settings/AdminSettingsPage";

export default function AdminSettingsRoute() {
  return (
    <AdminPortalShell active="settings" eyebrow="Panel ADMIN" title="Configuración" contentOverflow="auto">
      <AdminSettingsPage />
    </AdminPortalShell>
  );
}
