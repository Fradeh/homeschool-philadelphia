"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BookOpen, ClipboardList, FileText, Search, UsersRound } from "lucide-react";
import { ClassCard } from "./ClassCard";
import { classroomApi } from "@/features/classroom/classroom-api";
import type { ClassroomClassSummary } from "@homeschool/shared";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";
import { TextInput } from "@/components/ui/text-input";

export function TeacherClassesPage() {
  const [classes, setClasses] = useState<ClassroomClassSummary[]>([]);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    classroomApi
      .teacherClasses()
      .then((items) => {
        setClasses(items);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return classes.filter((item) =>
      `${item.name} ${item.code} ${item.description}`.toLocaleLowerCase("es").includes(normalized)
    );
  }, [classes, query]);
  const totals = useMemo(
    () => ({
      students: classes.reduce((total, item) => total + item.studentCount, 0),
      assignments: classes.reduce((total, item) => total + item.assignmentCount, 0),
      materials: classes.reduce((total, item) => total + item.materialCount, 0)
    }),
    [classes]
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
    <div className="p-4 sm:p-5 lg:p-8">
      <header className="rounded-[var(--radius-card)] bg-[linear-gradient(120deg,var(--color-brand-900),var(--color-brand-700))] p-6 text-white shadow-[var(--shadow-card)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-white/65">
              Espacios docentes
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-balance sm:text-3xl">Mis clases</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
              Gestiona alumnos, muro, PACEs, tareas y recursos desde cada espacio académico.
            </p>
          </div>
          <label
            className="grid gap-2 text-sm font-semibold text-white"
            htmlFor="teacher-class-search"
          >
            Buscar clases
            <span className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <TextInput
                id="teacher-class-search"
                name="teacherClassSearch"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ej. Inglés o código…"
                className="bg-white pl-10 text-[var(--color-text)] lg:w-80"
                autoComplete="off"
              />
            </span>
          </label>
        </div>
      </header>

      <section
        className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Resumen de clases"
      >
        <Summary icon={<BookOpen size={18} />} label="Clases activas" value={classes.length} />
        <Summary
          icon={<UsersRound size={18} />}
          label="Alumnos inscritos"
          value={totals.students}
        />
        <Summary icon={<ClipboardList size={18} />} label="Tareas" value={totals.assignments} />
        <Summary icon={<FileText size={18} />} label="Materiales" value={totals.materials} />
      </section>

      <section
        className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5"
        aria-labelledby="teacher-classes-heading"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2
              id="teacher-classes-heading"
              className="text-lg font-semibold text-[var(--color-text)]"
            >
              Todas las clases
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Clases asignadas a tu perfil docente.
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--color-text-secondary)]">
            {filtered.length} {filtered.length === 1 ? "clase" : "clases"}
          </span>
        </div>
        {filtered.length ? (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((item) => (
              <ClassCard key={item.id} teacherClass={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<UsersRound size={22} />}
            title={classes.length ? "No encontramos clases" : "Aún no tienes clases asignadas"}
            description={
              classes.length
                ? "Prueba con el nombre, código o descripción de la clase."
                : "Las clases asignadas a tu perfil aparecerán en este espacio."
            }
          />
        )}
      </section>
    </div>
  );
}

function Summary({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <article className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
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
function ClassesSkeleton() {
  return (
    <SkeletonGroup label="Cargando clases">
      <div className="space-y-5 p-5 lg:p-8">
        <Skeleton className="h-40" rounded="lg" />
        <div className="grid gap-3 sm:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Skeleton className="h-96" rounded="lg" />
          <Skeleton className="h-96" rounded="lg" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
