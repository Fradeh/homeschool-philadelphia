"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  FileEdit,
  Plus,
  Search,
  UsersRound
} from "lucide-react";
import { ClassAssignmentStatus, type ClassroomWorkspace } from "@homeschool/shared";
import { classroomApi } from "@/features/classroom/classroom-api";
import { CreateAssignmentModal, type CreateAssignmentForm } from "../classes/CreateAssignmentModal";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextInput } from "@/components/ui/text-input";
import { buildApiUrl } from "@/lib/api-client";

export function TeacherAssignmentsPage() {
  const [classes, setClasses] = useState<ClassroomWorkspace[]>([]);
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  async function load() {
    const items = await classroomApi.teacherWorkspaces();
    setClasses(items);
    setState("ready");
  }
  useEffect(() => {
    load().catch(() => setState("error"));
  }, []);

  const rows = useMemo(
    () =>
      classes.flatMap((classroom) =>
        classroom.assignments.map((assignment) => ({
          ...assignment,
          className: classroom.name,
          classCode: classroom.code,
          classColor: classroom.color ?? "#191970",
          studentCount: classroom.students.length
        }))
      ),
    [classes]
  );
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return rows.filter(
      (item) =>
        (course === "ALL" || item.classId === course) &&
        `${item.title} ${item.className} ${item.description}`
          .toLocaleLowerCase("es")
          .includes(normalized)
    );
  }, [course, query, rows]);

  async function create(form: CreateAssignmentForm) {
    if (!form.classId) return;
    await classroomApi.assignment(
      form.classId,
      {
        title: form.title,
        description: form.description,
        dueAt: new Date(`${form.dueDate}T${form.dueTime}:00`).toISOString(),
        points: form.points,
        submissionType: form.submissionType,
        status:
          form.status === "Publicada"
            ? ClassAssignmentStatus.PUBLISHED
            : ClassAssignmentStatus.DRAFT
      },
      form.files
    );
    await load();
    setOpen(false);
  }

  if (state === "loading") return <AssignmentsSkeleton />;
  if (state === "error")
    return (
      <div className="p-5 lg:p-8">
        <ErrorState
          description="No pudimos cargar las tareas. Revisa tu conexión e inténtalo nuevamente."
          action={
            <button className="secondary" onClick={() => window.location.reload()}>
              Intentar de nuevo
            </button>
          }
        />
      </div>
    );

  return (
    <>
      <div className="space-y-5 p-4 sm:p-5 lg:p-8">
        <header className="flex flex-col gap-5 rounded-[var(--radius-card)] bg-[linear-gradient(120deg,var(--color-brand-900),var(--color-brand-700))] p-6 text-white shadow-[var(--shadow-card)] sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-white/65">
              Centro de tareas
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-balance sm:text-3xl">
              Tareas de mis clases
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Publica actividades y supervisa el avance de las entregas.
            </p>
          </div>
          <Button
            variant="secondary"
            className="bg-white"
            leadingIcon={<Plus size={18} />}
            onClick={() => setOpen(true)}
          >
            Nueva tarea
          </Button>
        </header>

        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Resumen de tareas"
        >
          <Metric icon={<ClipboardList />} value={rows.length} label="Total" />
          <Metric
            icon={<CalendarClock />}
            value={rows.filter((item) => item.status === "PUBLISHED").length}
            label="Publicadas"
          />
          <Metric
            icon={<FileEdit />}
            value={rows.filter((item) => item.status === "DRAFT").length}
            label="Borradores"
          />
          <Metric
            icon={<CheckCircle2 />}
            value={rows.reduce((total, item) => total + item.submissions.length, 0)}
            label="Entregas"
          />
        </section>

        <section
          className="grid gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] md:grid-cols-[1fr_minmax(14rem,20rem)] md:items-end"
          aria-label="Filtros de tareas"
        >
          <label
            className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
            htmlFor="teacher-assignment-search"
          >
            Buscar tareas
            <span className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <TextInput
                id="teacher-assignment-search"
                name="teacherAssignmentSearch"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej. proyecto de ciencias…"
                className="pl-10"
                autoComplete="off"
              />
            </span>
          </label>
          <label
            className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
            htmlFor="teacher-assignment-course"
          >
            Clase
            <select
              id="teacher-assignment-course"
              name="teacherAssignmentCourse"
              value={course}
              onChange={(event) => setCourse(event.target.value)}
              className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
            >
              <option value="ALL">Todas las clases</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="grid gap-4 xl:grid-cols-2" aria-label="Listado de tareas">
          {filtered.map((item) => (
            <TeacherAssignmentCard key={item.id} item={item} />
          ))}
          {!filtered.length ? (
            <EmptyState
              className="col-span-full"
              icon={<ClipboardList size={22} />}
              title="No encontramos tareas"
              description={
                rows.length
                  ? "Prueba con otra clase o término de búsqueda."
                  : "Crea la primera tarea para comenzar a recibir entregas."
              }
              action={
                !rows.length ? (
                  <Button leadingIcon={<Plus size={16} />} onClick={() => setOpen(true)}>
                    Crear tarea
                  </Button>
                ) : undefined
              }
            />
          ) : null}
        </section>
      </div>
      <CreateAssignmentModal
        open={open}
        onClose={() => setOpen(false)}
        onCreate={create}
        classes={classes}
      />
    </>
  );
}

type TeacherAssignmentRow = ClassroomWorkspace["assignments"][number] & {
  className: string;
  classCode: string;
  classColor: string;
  studentCount: number;
};
function TeacherAssignmentCard({ item }: { item: TeacherAssignmentRow }) {
  const ratio = item.studentCount
    ? Math.round((item.submissions.length / item.studentCount) * 100)
    : 0;
  return (
    <article className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="h-1.5" style={{ backgroundColor: item.classColor }} aria-hidden="true" />
      <div className="p-5 sm:p-6">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-wider text-[var(--color-info)]">
              {item.classCode} · {item.className}
            </p>
            <h2 className="mt-2 break-words text-lg font-semibold text-[var(--color-text)]">
              {item.title}
            </h2>
          </div>
          <StatusBadge tone={item.status === "PUBLISHED" ? "success" : "neutral"}>
            {item.status === "PUBLISHED" ? "Publicada" : "Borrador"}
          </StatusBadge>
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          {item.description || "Sin descripción."}
        </p>
        {item.attachments.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {item.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={buildApiUrl(attachment.downloadUrl)}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)]"
              >
                <Download size={14} aria-hidden="true" />
                {attachment.fileName}
              </a>
            ))}
          </div>
        ) : null}
        <div className="mt-5 grid gap-3 rounded-lg bg-[var(--color-surface-soft)] p-4 text-sm sm:grid-cols-2">
          <span className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <CalendarClock size={16} aria-hidden="true" />
            {item.dueAt
              ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
                  new Date(item.dueAt)
                )
              : "Sin fecha"}
          </span>
          <span className="flex items-center gap-2 text-[var(--color-text-secondary)]">
            <UsersRound size={16} aria-hidden="true" />
            <strong className="tabular-nums">
              {item.submissions.length} de {item.studentCount}
            </strong>{" "}
            entregas
          </span>
        </div>
        <div className="mt-3">
          <div className="mb-2 flex justify-between text-xs font-semibold text-[var(--color-text-secondary)]">
            <span>Progreso</span>
            <span className="tabular-nums">{ratio}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]"
            role="progressbar"
            aria-label={`Progreso de entregas de ${item.title}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={ratio}
          >
            <div
              className="h-full rounded-full bg-[var(--color-info)]"
              style={{ width: `${ratio}%` }}
            />
          </div>
        </div>
        <Link
          href={`/teacher/classes/${item.classId}?tab=assignments`}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-md text-sm font-semibold text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)] sm:w-auto sm:px-3"
        >
          Abrir y revisar <ChevronRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function Metric({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <article className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
      <span
        className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div>
        <strong className="text-xl tabular-nums text-[var(--color-text)]">{value}</strong>
        <p className="text-xs text-[var(--color-text-secondary)]">{label}</p>
      </div>
    </article>
  );
}
function AssignmentsSkeleton() {
  return (
    <SkeletonGroup label="Cargando tareas">
      <div className="space-y-5 p-5 lg:p-8">
        <Skeleton className="h-36" rounded="lg" />
        <div className="grid gap-3 sm:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-24" />
        <div className="grid gap-4 xl:grid-cols-2">
          <Skeleton className="h-64" rounded="lg" />
          <Skeleton className="h-64" rounded="lg" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
