"use client";

import { type AuthUser, UserRole } from "@homeschool/shared";
import {
  Bell,
  ClipboardCheck,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FolderOpen,
  FileCheck2,
  ShieldCheck,
  GraduationCap,
  Home,
  MessageSquare,
  UsersRound
} from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell, type PortalNavigationItem } from "@/components/layout/portal-shell";

const teacherNavigation: PortalNavigationItem[] = [
  { label: "Inicio", href: "/teacher/dashboard", icon: Home, key: "dashboard" },
  { label: "Mis clases", href: "/teacher/classes", icon: UsersRound, key: "classes" },
  { label: "Goal Check", href: "/teacher/gcr", icon: FileCheck2, key: "gcr" },
  { label: "Asistencia", href: "/teacher/attendance", icon: ClipboardCheck, key: "attendance" },
  { label: "Mi horario", href: "/teacher/schedule", icon: Clock3, key: "schedule" },
  { label: "PACEs", href: "/teacher/paces", icon: BookOpenCheck, key: "paces" },
  { label: "Calificación", href: "/teacher/grades", icon: CheckCircle2, key: "grades" },
  { label: "Mensajes", href: "/teacher/messages", icon: MessageSquare, key: "messages" },
  { label: "Tareas", href: "/teacher/assignments", icon: ClipboardList, key: "assignments" },
  { label: "Calendario", href: "/teacher/calendar", icon: CalendarDays, key: "calendar" },
  { label: "Archivos", href: "/teacher/files", icon: FolderOpen, key: "files" },
  { label: "Notificaciones", href: "/teacher/notifications", icon: Bell, key: "notifications" }
];

const administrativeNavigation: PortalNavigationItem[] = [
  { label: "Supervisión GCR", href: "/teacher/gcr-compliance", icon: ShieldCheck, key: "gcr-compliance" },
  { label: "Casos escalados", href: "/teacher/escalations", icon: MessageSquare, key: "escalations" }
];

export function TeacherPortalShell({
  active,
  eyebrow,
  title,
  children,
  contentOverflow = "auto"
}: {
  active: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  contentOverflow?: "auto" | "hidden";
}) {
  const [isAdministrative, setIsAdministrative] = useState(false);
  const syncAdministrativeRole = useCallback((user: AuthUser) => {
    setIsAdministrative(user.roles.includes(UserRole.ADMINISTRATIVE));
  }, []);
  const navigation = useMemo(
    () => isAdministrative ? [...teacherNavigation.slice(0, 3), ...administrativeNavigation, ...teacherNavigation.slice(3)] : teacherNavigation,
    [isAdministrative]
  );

  return (
    <PortalAuthGate role={UserRole.TEACHER} onAuthenticated={syncAdministrativeRole}>
      <PortalShell
        active={active}
        accent="brand"
        brandIcon={GraduationCap}
        contentOverflow={contentOverflow}
        defaultUserName="Profesor"
        eyebrow={eyebrow}
        navigation={navigation}
        portalLabel={isAdministrative ? "Portal docente y Dirección" : "Portal del profesor"}
        roleLabel={isAdministrative ? "Profesora · Dirección" : "Profesor"}
        storageKey="teacher-sidebar-collapsed"
        title={title}
      >
        {children}
      </PortalShell>
    </PortalAuthGate>
  );
}
