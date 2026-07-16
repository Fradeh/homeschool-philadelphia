"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ClipboardList, FolderOpen, Search, UserRound } from "lucide-react";
import type { ClassroomClassSummary } from "@homeschool/shared";
import { classroomApi } from "@/features/classroom/classroom-api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";
import { TextInput } from "@/components/ui/text-input";

export function StudentClassesPage() {
  const [items, setItems] = useState<ClassroomClassSummary[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    classroomApi
      .studentClasses()
      .then((data) => {
        setItems(data);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  const classes = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return items.filter((item) =>
      `${item.name} ${item.code} ${item.gradeName} ${item.subjects.map((subject) => subject.name).join(" ")} ${item.teachers.map((teacher) => teacher.displayName).join(" ")}`
        .toLocaleLowerCase("es")
        .includes(normalized)
    );
  }, [items, query]);

  const totals = useMemo(
    () => ({
      pending: items.reduce(
        (total, item) =>
          total +
          item.pendingAssignmentsCount,
        0
      ),
      resources: items.reduce((total, item) => total + item.materialCount, 0)
    }),
    [items]
  );

  if (state === "loading") return <ClassesSkeleton />;
  if (state === "error")
    return (
      <div className="p-5 lg:p-8">
        <ErrorState
          description="No pudimos cargar tus clases. Revisa tu conexión e inténtalo nuevamente."
          action={
            <button className="secondary" onClick={() => window.location.reload()}>
              Intentar de nuevo
            </button>
          }
        />
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5 lg:p-8">
      <header className="shrink-0 rounded-[var(--radius-card)] bg-[linear-gradient(120deg,var(--color-brand-900),var(--color-brand-700))] p-6 text-white shadow-[var(--shadow-card)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-white/65">
              Espacios académicos
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-balance sm:text-3xl">Mis clases</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Entra al muro, consulta tareas, revisa tus PACEs y abre los materiales de cada curso.
            </p>
          </div>
          <label
            className="grid gap-2 text-sm font-semibold text-white"
            htmlFor="student-class-search"
          >
            Buscar clases
            <span className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <TextInput
                id="student-class-search"
                name="studentClassSearch"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej. Matemáticas o profesor…"
                className="bg-white pl-10 text-[var(--color-text)] lg:w-80"
                autoComplete="off"
              />
            </span>
          </label>
        </div>
      </header>

      <section className="mt-4 grid shrink-0 gap-3 sm:grid-cols-3" aria-label="Resumen de clases">
        <Summary icon={<BookOpen size={18} />} value={items.length} label="Clases activas" />
        <Summary
          icon={<ClipboardList size={18} />}
          value={totals.pending}
          label="Tareas pendientes"
        />
        <Summary
          icon={<FolderOpen size={18} />}
          value={totals.resources}
          label="Recursos disponibles"
        />
      </section>

      <section
        className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
        aria-labelledby="student-classes-heading"
      >
        <header className="shrink-0 border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 id="student-classes-heading" className="font-semibold text-[var(--color-text)]">
                Clases inscritas
              </h2>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Abre una clase para entrar a su espacio académico.
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-[var(--color-text-secondary)]">
              {classes.length} {classes.length === 1 ? "clase" : "clases"}
            </span>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {classes.length ? (
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {classes.map((item) => (
                <StudentClassCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen size={22} />}
              title={items.length ? "No encontramos clases" : "Aún no tienes clases asignadas"}
              description={
                items.length
                  ? "Prueba con el nombre del curso, una materia o el profesor."
                  : "Cuando te asignen una clase, podrás abrirla desde este espacio."
              }
            />
          )}
        </div>
      </section>
    </div>
  );
}

function StudentClassCard({ item }: { item: ClassroomClassSummary }) {
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div
        className="h-1.5"
        style={{ backgroundColor: item.color ?? "#191970" }}
        aria-hidden="true"
      />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: item.color ?? "#191970" }}
            aria-hidden="true"
          >
            {item.code.slice(0, 2)}
          </span>
          <span className="max-w-[60%] truncate rounded-full bg-[var(--color-surface-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
            {item.code} · {item.gradeName || "Curso"}
          </span>
        </div>
        <h3 className="mt-4 break-words text-lg font-semibold text-[var(--color-text)]">
          {item.name}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[var(--color-text-secondary)]">
          {item.description || "Espacio de aprendizaje, recursos y comunicación de la clase."}
        </p>
        <div className="mt-4 flex min-h-7 flex-wrap gap-2">
          {item.subjects.slice(0, 4).map((subject) => (
            <span
              key={subject.id}
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{
                color: subject.color ?? "#191970",
                backgroundColor: `${subject.color ?? "#191970"}12`
              }}
            >
              {subject.shortName}
            </span>
          ))}
        </div>
        <p className="mt-4 flex min-w-0 items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
          <UserRound size={14} className="shrink-0" aria-hidden="true" />
          <span className="truncate">
            {item.teachers.map((teacher) => teacher.displayName).join(", ") ||
              "Profesor por asignar"}
          </span>
        </p>
        <div className="mt-5 grid grid-cols-3 border-y border-[var(--color-border)] py-3 text-center">
          <Mini value={item.pendingAssignmentsCount} label="Pendientes" />
          <Mini value={item.materialCount} label="Recursos" />
          <Mini value={item.wallPostCount} label="Novedades" />
        </div>
        <Link
          href={`/student/classes/${item.id}`}
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand-900)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-800)]"
        >
          Abrir clase <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function Summary({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <article className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-card)]">
      <span
        className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
        aria-hidden="true"
      >
        {icon}
      </span>
      <div>
        <strong className="block text-xl tabular-nums text-[var(--color-text)]">{value}</strong>
        <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{label}</span>
      </div>
    </article>
  );
}
function Mini({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 border-r border-[var(--color-border)] px-1 last:border-0">
      <strong className="block text-sm tabular-nums text-[var(--color-text)]">{value}</strong>
      <span className="block truncate text-[10px] text-[var(--color-text-muted)]">{label}</span>
    </div>
  );
}
function ClassesSkeleton() {
  return (
    <SkeletonGroup label="Cargando clases">
      <div className="space-y-4 p-5 lg:p-8">
        <Skeleton className="h-40" rounded="lg" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96" rounded="lg" />
          <Skeleton className="h-96" rounded="lg" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
