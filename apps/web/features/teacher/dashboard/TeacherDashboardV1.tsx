"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  MessageSquare,
  UsersRound
} from "lucide-react";
import type { ClassroomWorkspace, TeacherDashboardSummary } from "@homeschool/shared";
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

type ActivityItem = {
  date: string;
  title: string;
  label: string;
  kind: "wall" | "assignment" | "material";
};

export function TeacherDashboardV1() {
  const [data, setData] = useState<TeacherDashboardSummary | null>(null);
  const [classes, setClasses] = useState<ClassroomWorkspace[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([scheduleApi.teacher.dashboard(), classroomApi.teacherWorkspaces()])
      .then(([summary, workspaces]) => {
        setData(summary);
        setClasses(workspaces);
      })
      .catch(() =>
        setError("No pudimos cargar el panel docente. Revisa tu conexión e inténtalo de nuevo.")
      );
  }, []);

  const totals = useMemo(
    () => ({
      tasks: classes.reduce((total, classroom) => total + classroom.assignments.length, 0),
      students: new Set(
        classes.flatMap((classroom) => classroom.students.map((student) => student.id))
      ).size
    }),
    [classes]
  );
  const activity = useMemo<ActivityItem[]>(
    () =>
      classes
        .flatMap((classroom) => [
          ...classroom.wall.map((item) => ({
            date: item.createdAt,
            title: item.title,
            label: `Muro · ${classroom.name}`,
            kind: "wall" as const
          })),
          ...classroom.assignments.map((item) => ({
            date: item.createdAt,
            title: item.title,
            label: `Tarea · ${classroom.name}`,
            kind: "assignment" as const
          })),
          ...classroom.materials.map((item) => ({
            date: item.createdAt,
            title: item.name,
            label: `Recurso · ${classroom.name}`,
            kind: "material" as const
          }))
        ])
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7),
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
        eyebrow="Panel docente"
        title={`Hola, ${data.teacher.firstName}`}
        description="Organiza tus clases, revisa la actividad académica y atiende las prioridades de tus estudiantes."
        actions={
          <>
            <DashboardHeroLink href="/teacher/classes">Abrir mis clases</DashboardHeroLink>
            <DashboardHeroLink href="/teacher/assignments" tone="outline">
              Gestionar tareas
            </DashboardHeroLink>
          </>
        }
        aside={
          data.pendingBookings ? (
            <Link
              href="/teacher/schedule"
              className="block rounded-xl border border-white/15 bg-white/10 p-4 text-white hover:bg-white/15"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                Atención pendiente
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">{data.pendingBookings}</p>
              <p className="mt-0.5 text-xs text-white/75">Solicitudes presenciales</p>
            </Link>
          ) : undefined
        }
      />

      <section aria-label="Resumen docente" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          href="/teacher/classes"
          icon={<BookOpen />}
          value={classes.length}
          label="Clases activas"
          helper="Espacios asignados"
        />
        <DashboardMetricCard
          href="/teacher/classes"
          icon={<UsersRound />}
          value={totals.students}
          label="Estudiantes"
          helper="En todas tus clases"
        />
        <DashboardMetricCard
          href="/teacher/assignments"
          icon={<ClipboardList />}
          value={totals.tasks}
          label="Tareas"
          helper={`${classes.reduce((total, classroom) => total + classroom.assignments.reduce((count, assignment) => count + assignment.submissions.length, 0), 0)} entregas`}
        />
        <DashboardMetricCard
          href="/teacher/messages"
          icon={<MessageSquare />}
          value={data.conversations}
          label="Conversaciones"
          helper={`${data.unreadNotifications} notificaciones`}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <DashboardPanel
          title="Mis clases"
          description="Vista rápida del trabajo y actividad de cada grupo."
          action={<DashboardPanelLink href="/teacher/classes" />}
        >
          {classes.length ? (
            <div className="grid gap-3 p-4 md:grid-cols-2">
              {classes.slice(0, 4).map((classroom) => (
                <TeacherClassCard key={classroom.id} classroom={classroom} />
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={<BookOpen />}
                title="Aún no tienes clases"
                description="Cuando te asignen una clase aparecerá aquí con sus estudiantes y recursos."
              />
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel title="Actividad reciente" description="Últimos movimientos en tus clases.">
          {activity.length ? (
            <div className="divide-y divide-[var(--color-border-soft)] px-4">
              {activity.map((item, index) => (
                <ActivityRow key={`${item.date}-${index}`} item={item} />
              ))}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={<CalendarCheck />}
                title="Sin actividad reciente"
                description="Las nuevas publicaciones, tareas y recursos aparecerán aquí."
              />
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}

function TeacherClassCard({ classroom }: { classroom: ClassroomWorkspace }) {
  const submissions = classroom.assignments.reduce(
    (total, assignment) => total + assignment.submissions.length,
    0
  );
  return (
    <Link
      href={`/teacher/classes/${classroom.id}`}
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
              {classroom.code} · {classroom.gradeName ?? "Curso"}
            </p>
            <h4 className="mt-1 truncate text-base font-semibold text-[var(--color-brand-950)]">
              {classroom.name}
            </h4>
          </div>
          <StatusBadge tone="info">{classroom.students.length} alumnos</StatusBadge>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <TeacherStat value={classroom.assignments.length} label="Tareas" />
          <TeacherStat value={submissions} label="Entregas" />
          <TeacherStat value={classroom.materials.length} label="Recursos" />
        </div>
      </div>
    </Link>
  );
}

function TeacherStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-[var(--color-surface-soft)] px-2 py-2 text-center">
      <b className="block text-sm tabular-nums text-[var(--color-brand-950)]">{value}</b>
      <span className="text-[10px] text-[var(--color-text-muted)]">{label}</span>
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const icon =
    item.kind === "assignment" ? (
      <ClipboardList />
    ) : item.kind === "material" ? (
      <FileText />
    ) : (
      <MessageSquare />
    );
  return (
    <article className="flex gap-3 py-3.5">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--color-brand-100)] text-[var(--color-brand-900)] [&>svg]:h-4 [&>svg]:w-4"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-[var(--color-accent-700)]">{item.label}</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-[var(--color-brand-950)]">
          {item.title}
        </p>
        <time
          dateTime={item.date}
          className="mt-1 block text-[11px] text-[var(--color-text-muted)]"
        >
          {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(
            new Date(item.date)
          )}
        </time>
      </div>
    </article>
  );
}
