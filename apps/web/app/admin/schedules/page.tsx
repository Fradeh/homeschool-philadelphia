import { AdminPortalShell } from "@/features/admin/AdminPortalShell";
import { AdminSchedulesPage } from "@/features/admin/schedules/AdminSchedulesPage";

export default function AdminSchedulesRoute() {
  return <AdminPortalShell active="schedules" eyebrow="Panel ADMIN" title="Horarios" contentOverflow="hidden"><AdminSchedulesPage /></AdminPortalShell>;
}
