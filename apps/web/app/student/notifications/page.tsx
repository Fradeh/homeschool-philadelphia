import { StudentPortalShell } from "@/features/student/StudentPortalShell";
import { NotificationsPage } from "@/features/notifications/NotificationsPage";
export default function StudentNotificationsRoute() { return <StudentPortalShell active="notifications" eyebrow="Portal del estudiante" title="Notificaciones"><NotificationsPage/></StudentPortalShell>; }
