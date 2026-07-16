"use client";

import { UserRole } from "@homeschool/shared";
import {
  Bell,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FolderOpen,
  GraduationCap,
  Home,
  MessageSquare
} from "lucide-react";
import type { ReactNode } from "react";
import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { PortalShell, type PortalNavigationItem } from "@/components/layout/portal-shell";

const navigation: PortalNavigationItem[] = [
  { label: "Inicio", href: "/student/dashboard", icon: Home, key: "dashboard" },
  { label: "Mis clases", href: "/student/classes", icon: BookOpen, key: "classes" },
  { label: "Mi horario", href: "/student/schedule", icon: Clock3, key: "schedule" },
  { label: "Mis PACEs", href: "/student/paces", icon: BookOpenCheck, key: "paces" },
  { label: "Mis notas", href: "/student/grades", icon: CheckCircle2, key: "grades" },
  { label: "Tareas", href: "/student/assignments", icon: ClipboardList, key: "assignments" },
  { label: "Calendario", href: "/student/calendar", icon: CalendarDays, key: "calendar" },
  { label: "Archivos", href: "/student/files", icon: FolderOpen, key: "files" },
  { label: "Mensajes", href: "/student/messages", icon: MessageSquare, key: "messages" },
  { label: "Notificaciones", href: "/student/notifications", icon: Bell, key: "notifications" }
];

export function StudentPortalShell({
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
  return (
    <PortalAuthGate role={UserRole.STUDENT}>
      <PortalShell
        active={active}
        accent="accent"
        brandIcon={GraduationCap}
        contentOverflow={contentOverflow}
        defaultUserName="Estudiante"
        eyebrow={eyebrow}
        navigation={navigation}
        portalLabel="Portal del estudiante"
        roleLabel="Estudiante"
        storageKey="student-sidebar-collapsed"
        title={title}
      >
        {children}
      </PortalShell>
    </PortalAuthGate>
  );
}
