"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  MessageSquare
} from "lucide-react";
import type { ClassroomWorkspace, StudentDashboardSummary } from "@homeschool/shared";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DashboardHero,
  DashboardHeroLink,
  DashboardLoading,
  DashboardMetricCard,
  DashboardPanel,
  DashboardPanelLink
} from "@/components/ui/dashboard";
import { classroomApi } from "@/features/classroom/classroom-api";
import { scheduleApi } from "@/features/schedules/schedule-api";

type StudentPendingAssignment = ClassroomWorkspace["assignments"][number] & {
  className: string;
  classColor: string;
};

export function StudentDashboardV1() {
  const [data, setData] = useState<StudentDashboardSummary | null>(null);
  const [classes, setClasses] = useState<ClassroomWorkspace[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([scheduleApi.student.dashboard(), classroomApi.studentWorkspaces()])
      .then(([summary, workspaces]) => {
        setData(summary);
        setClasses(workspaces);
      })
      .catch(() =>
        setError(
          "No pudimos cargar tu información académica. Revisa tu conexión e inténtalo de nuevo."
        )
      );
  }, []);

  const pending = useMemo(
    () =>
      classes
        .flatMap((classroom) =>
          classroom.assignments.map((assignment) => ({
            ...assignment,
            className: classroom.name,
            classColor: classroom.color ?? "#191970"
          }))
        )
        .filter(
          (assignment) => !["SUBMITTED", "GRADED"].includes(assignment.mySubmission?.status ?? "")
        )
        .sort((a, b) => (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999")),
    [classes]
  );

  if (!data)
    return error ? (
      <div className="p-4 sm:p-6 lg:p-8">
        <ErrorState description={error} />
      </div>
    ) : (
      <DashboardLoading />
    );

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6 lg:p-8">
      <DashboardHero
        eyebrow={data.student.gradeLevel?.name ?? "Portal del estudiante"}
        title={`Hola, ${data.student.firstName}`}
        description="Revisa tus prioridades académicas, continúa tus tareas y entra rápidamente a tus clases."
        actions={
          <>
            <DashboardHeroLink href="/student/assignments">Ver tareas pendientes</DashboardHeroLink>
            <DashboardHeroLink href="/student/classes" tone="outline">
              Explorar mis clases
            </DashboardHeroLink>
          </>
        }
        aside={
          data.hasPublishedSchedule ? (
            <Link
              href="/student/schedule"
              className="block rounded-xl border border-white/15 bg-white/10 p-4 text-white hover:bg-white/15"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                Horario publicado
              </p>
              <p className="mt-2 text-sm font-semibold">Consulta clases y asistencia presencial</p>
            </Link>
          ) : undefined
        }
      />

      <section aria-label="Resumen académico" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          href="/student/classes"
          icon={<BookOpen />}
          value={classes.length}
          label="Clases activas"
          helper="Espacios académicos"
        />
        <DashboardMetricCard
          href="/student/assignments"
          icon={<ClipboardList />}
          value={pending.length}
          label="Tareas pendientes"
          helper={pending.length ? "Requieren tu atención" : "Todo al día"}
        />
        <DashboardMetricCard
          href="/student/paces"
          icon={<BookOpenCheck />}
          value={data.currentPaces}
          label="PACEs en curso"
          helper={`${data.completedPaces} completados`}
        />
        <DashboardMetricCard
          href="/student/messages"
          icon={<MessageSquare />}
          value={data.conversations}
          label="Conversaciones"
          helper={`${data.unreadNotifications} notificaciones`}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <DashboardPanel
          title="Mis clases"
          description="Acceso rápido a tareas, recursos y novedades."
          action={<DashboardPanelLink href="/student/classes" />}
        >
          {classes.length ? (
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {classes.slice(0, 4).map((classroom) => (
                <StudentClassCard key={classroom.id} classroom={classroom} />
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={<BookOpen />}
                title="Aún no tienes clases"
                description="Cuando te asignen una clase aparecerá aquí con sus tareas y recursos."
              />
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Próximas entregas"
          description="Tareas ordenadas por fecha límite."
          action={<DashboardPanelLink href="/student/assignments">Ver tareas</DashboardPanelLink>}
        >
          {pending.length ? (
            <div className="divide-y divide-[var(--color-border-soft)] px-4">
              {pending.slice(0, 6).map((assignment) => (
                <PendingAssignment key={assignment.id} assignment={assignment} />
              ))}
            </div>
          ) : (
            <div className="p-5 text-center">
              <CheckCircle2
                className="mx-auto h-9 w-9 text-[var(--color-success)]"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm font-semibold text-[var(--color-brand-950)]">
                Estás al día
              </p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                No tienes tareas pendientes en este momento.
              </p>
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}

function StudentClassCard({ classroom }: { classroom: ClassroomWorkspace }) {
  const pending = classroom.assignments.filter(
    (assignment) => !["SUBMITTED", "GRADED"].includes(assignment.mySubmission?.status ?? "")
  ).length;
  return (
    <Link
      href={`/student/classes/${classroom.id}`}
      className="group overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white transition-[border-color,box-shadow] hover:border-[var(--color-border-strong)] hover:shadow-md"
    >
      <div
        className="h-1.5"
        style={{ backgroundColor: classroom.color ?? "var(--color-brand-900)" }}
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-accent-700)]">
              {classroom.code}
            </p>
            <h4 className="mt-1 truncate text-base font-semibold text-[var(--color-brand-950)]">
              {classroom.name}
            </h4>
          </div>
          <StatusBadge tone={pending ? "warning" : "success"}>
            {pending ? `${pending} pendientes` : "Al día"}
          </StatusBadge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ClassStat icon={<FolderOpen />} value={classroom.materials.length} label="Recursos" />
          <ClassStat icon={<MessageSquare />} value={classroom.wall.length} label="Novedades" />
        </div>
      </div>
    </Link>
  );
}

function ClassStat({
  icon,
  value,
  label
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-[var(--color-surface-soft)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
      <span className="text-[var(--color-accent-700)]" aria-hidden="true">
        {icon}
      </span>
      <span>
        <b className="tabular-nums text-[var(--color-brand-950)]">{value}</b> {label}
      </span>
    </div>
  );
}

function PendingAssignment({ assignment }: { assignment: StudentPendingAssignment }) {
  const overdue = Boolean(assignment.dueAt && new Date(assignment.dueAt) < new Date());
  return (
    <Link
      href={`/student/classes/${assignment.classId}?tab=assignments`}
      className="group flex gap-3 py-3.5"
    >
      <span
        className="mt-1 h-9 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: assignment.classColor }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-xs font-bold text-[var(--color-accent-700)]">
            {assignment.className}
          </p>
          <StatusBadge tone={overdue ? "danger" : "warning"}>
            {overdue ? "Vencida" : "Pendiente"}
          </StatusBadge>
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--color-brand-950)] group-hover:text-[var(--color-brand-900)]">
          {assignment.title}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
          <CalendarClock size={12} aria-hidden="true" />
          {assignment.dueAt
            ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
                new Date(assignment.dueAt)
              )
            : "Sin fecha límite"}
        </p>
      </div>
    </Link>
  );
}
