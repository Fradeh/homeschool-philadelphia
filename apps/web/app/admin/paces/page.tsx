import { AdminPortalShell } from "@/features/admin/AdminPortalShell";
import { AdminPaceSetupPage } from "@/features/admin/paces/AdminPaceSetupPage";

export default function AdminPacesRoute() {
  return (
    <AdminPortalShell active="paces" eyebrow="Panel ADMIN" title="PACEs" contentOverflow="hidden">
      <AdminPaceSetupPage />
    </AdminPortalShell>
  );
}
