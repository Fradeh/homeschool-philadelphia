import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { NotificationsPage } from "@/features/notifications/NotificationsPage";
export default function TeacherNotificationsRoute() { return <TeacherPortalShell active="notifications" eyebrow="Portal del profesor" title="Notificaciones"><NotificationsPage/></TeacherPortalShell>; }
