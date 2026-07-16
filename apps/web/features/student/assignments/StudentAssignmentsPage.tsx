"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Search
} from "lucide-react";
import type { ClassroomWorkspace } from "@homeschool/shared";
import { classroomApi } from "@/features/classroom/classroom-api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";
import { TextInput } from "@/components/ui/text-input";

type Filter = "ALL" | "PENDING" | "DONE";

export function StudentAssignmentsPage() {
  const [classes, setClasses] = useState<ClassroomWorkspace[]>([]);
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("ALL");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    classroomApi
      .studentWorkspaces()
      .then((items) => {
        setClasses(items);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  const rows = useMemo(
    () =>
      classes.flatMap((classroom) =>
        classroom.assignments.map((assignment) => {
          const status = assignment.mySubmission?.status;
          const completed = status === "SUBMITTED" || status === "GRADED";
          return {
            ...assignment,
            className: classroom.name,
            classCode: classroom.code,
            classColor: classroom.color ?? "#191970",
            completed,
            overdue: Boolean(
              assignment.dueAt && new Date(assignment.dueAt) < new Date() && !completed
            )
          };
        })
      ),
    [classes]
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return rows.filter(
      (item) =>
        (course === "ALL" || item.classId === course) &&
        (filter === "ALL" || (filter === "DONE" ? item.completed : !item.completed)) &&
        `${item.title} ${item.className} ${item.description}`
          .toLocaleLowerCase("es")
          .includes(normalizedQuery)
    );
  }, [course, filter, query, rows]);

  if (state === "loading") return <AssignmentsSkeleton />;
  if (state === "error")
    return (
      <div className="p-5 lg:p-8">
        <ErrorState
          description="No pudimos cargar tus tareas. Revisa tu conexión e inténtalo nuevamente."
          action={
            <button className="secondary" onClick={() => window.location.reload()}>
              Intentar de nuevo
            </button>
          }
        />
      </div>
    );

  return (
    <div className="space-y-5 p-4 sm:p-5 lg:p-8">
      <header className="rounded-[var(--radius-card)] bg-[linear-gradient(120deg,var(--color-brand-900),var(--color-brand-700))] p-6 text-white shadow-[var(--shadow-card)] sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-white/65">
          Centro de tareas
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-balance sm:text-3xl">Mis tareas</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
          Identifica qué debes entregar, cuándo vence y en qué clase debes trabajar.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Resumen de tareas">
        <Metric icon={<ClipboardList />} value={rows.length} label="Total" />
        <Metric
          icon={<Clock3 />}
          value={rows.filter((item) => !item.completed).length}
          label="Pendientes"
        />
        <Metric
          icon={<CheckCircle2 />}
          value={rows.filter((item) => item.completed).length}
          label="Completadas"
        />
      </section>

      <section
        className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]"
        aria-label="Filtros de tareas"
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_minmax(12rem,18rem)_auto] lg:items-end">
          <label
            className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
            htmlFor="assignment-search"
          >
            Buscar tareas
            <span className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <TextInput
                id="assignment-search"
                name="assignmentSearch"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej. ensayo de ciencias…"
                className="pl-10"
                autoComplete="off"
              />
            </span>
          </label>
          <label
            className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
            htmlFor="assignment-course"
          >
            Curso
            <select
              id="assignment-course"
              name="assignmentCourse"
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]"
            >
              <option value="ALL">Todos los cursos</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 overflow-x-auto" aria-label="Filtrar por estado">
            {(
              [
                ["ALL", "Todas"],
                ["PENDING", "Pendientes"],
                ["DONE", "Completadas"]
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`min-h-11 shrink-0 rounded-[var(--radius-control)] px-4 text-sm font-semibold ${filter === key ? "bg-[var(--color-brand-900)] text-white" : "border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-strong)]"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2" aria-label="Listado de tareas">
        {filtered.map((item) => (
          <AssignmentCard key={item.id} item={item} />
        ))}
        {!filtered.length ? (
          <EmptyState
            className="col-span-full"
            icon={<ClipboardList size={22} />}
            title="No hay tareas con estos filtros"
            description="Prueba con otro curso, estado o término de búsqueda."
          />
        ) : null}
      </section>
    </div>
  );
}

type AssignmentRow = ClassroomWorkspace["assignments"][number] & {
  className: string;
  classCode: string;
  classColor: string;
  completed: boolean;
  overdue: boolean;
};

function AssignmentCard({ item }: { item: AssignmentRow }) {
  const status = getStudentStatus(item.mySubmission?.status, item.overdue);
  return (
    <article
      className={`overflow-hidden rounded-[var(--radius-card)] border bg-[var(--color-surface)] shadow-[var(--shadow-card)] ${item.overdue ? "border-[var(--color-danger-border)]" : "border-[var(--color-border)]"}`}
    >
      <div className="h-1.5" style={{ backgroundColor: item.classColor }} aria-hidden="true" />
      <div className="p-5 sm:p-6">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-wider text-[var(--color-info)]">
              {item.classCode} · {item.className}
            </p>
            <h2 className="mt-2 break-words text-lg font-semibold text-[var(--color-text)]">
              {item.title}
            </h2>
          </div>
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          {item.description || "Revisa la clase para consultar las instrucciones de esta tarea."}
        </p>
        {item.mySubmission?.status === "GRADED" ? (
          <div className="mt-4 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3">
            <p className="text-sm font-semibold text-[var(--color-info)]">
              Nota: {item.mySubmission.score ?? "—"}/{item.points ?? 100}
            </p>
            {item.mySubmission.feedback ? (
              <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                {item.mySubmission.feedback}
              </p>
            ) : null}
          </div>
        ) : null}
        <div className="mt-5 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          <span
            className={`inline-flex items-center gap-2 text-sm font-semibold ${item.overdue ? "text-[var(--color-danger)]" : "text-[var(--color-text-secondary)]"}`}
          >
            <CalendarDays size={16} aria-hidden="true" />
            {item.dueAt
              ? new Intl.DateTimeFormat("es-CO", {
                  dateStyle: "medium",
                  timeStyle: "short"
                }).format(new Date(item.dueAt))
              : "Sin fecha límite"}
          </span>
          {item.points ? (
            <span className="text-sm text-[var(--color-text-muted)]">{item.points} puntos</span>
          ) : null}
          <Link
            href={`/student/classes/${item.classId}?tab=assignments`}
            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-md px-2 text-sm font-semibold text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)] sm:ml-auto"
          >
            Abrir tarea <ChevronRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function getStudentStatus(
  status: string | undefined,
  overdue: boolean
): { label: string; tone: StatusBadgeTone } {
  if (status === "GRADED") return { label: "Calificada", tone: "info" };
  if (status === "SUBMITTED") return { label: "Entregada", tone: "success" };
  if (overdue) return { label: "Vencida", tone: "danger" };
  return { label: "Pendiente", tone: "warning" };
}

function Metric({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <article className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <span
        className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div>
        <strong className="text-2xl tabular-nums text-[var(--color-text)]">{value}</strong>
        <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</p>
      </div>
    </article>
  );
}

function AssignmentsSkeleton() {
  return (
    <SkeletonGroup label="Cargando tareas">
      <div className="space-y-5 p-5 lg:p-8">
        <Skeleton className="h-36 w-full" rounded="lg" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-24" rounded="lg" />
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-64" rounded="lg" />
          <Skeleton className="h-64" rounded="lg" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
