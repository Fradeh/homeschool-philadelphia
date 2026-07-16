"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, FileText, FolderOpen, Search } from "lucide-react";
import type { ClassroomWorkspace } from "@homeschool/shared";
import { classroomApi } from "@/features/classroom/classroom-api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";
import { TextInput } from "@/components/ui/text-input";

export function StudentFilesPage() {
  const [classes, setClasses] = useState<ClassroomWorkspace[]>([]);
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("ALL");
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

  const files = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return classes
      .flatMap((classroom) =>
        classroom.materials.map((material) => ({ ...material, color: classroom.color }))
      )
      .filter(
        (item) =>
          (course === "ALL" || item.classId === course) &&
          `${item.name} ${item.className}`.toLocaleLowerCase("es").includes(normalizedQuery)
      );
  }, [classes, course, query]);

  if (state === "loading") return <FilesSkeleton />;
  if (state === "error")
    return (
      <div className="p-5 lg:p-8">
        <ErrorState
          description="No pudimos cargar los recursos. Revisa tu conexión e inténtalo nuevamente."
          action={
            <button className="secondary" onClick={() => window.location.reload()}>
              Intentar de nuevo
            </button>
          }
        />
      </div>
    );

  const selectedClass = classes.find((item) => item.id === course);
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5 lg:p-8">
      <header className="shrink-0 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-info)]">Biblioteca académica</p>
            <h1 className="mt-1 text-2xl font-semibold text-balance text-[var(--color-text)]">
              Mis archivos
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Encuentra documentos y enlaces compartidos en cada curso.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:w-[38rem]">
            <label
              className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
              htmlFor="file-course"
            >
              Curso
              <select
                id="file-course"
                name="fileCourse"
                value={course}
                onChange={(event) => setCourse(event.target.value)}
                className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              >
                <option value="ALL">Todos los cursos</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label
              className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
              htmlFor="file-search"
            >
              Buscar recursos
              <span className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  aria-hidden="true"
                />
                <TextInput
                  id="file-search"
                  name="fileSearch"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ej. guía de matemáticas…"
                  className="pl-10"
                  autoComplete="off"
                />
              </span>
            </label>
          </div>
        </div>
      </header>

      <section
        className="mt-5 min-h-0 flex-1 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5"
        aria-labelledby="files-heading"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 id="files-heading" className="font-semibold text-[var(--color-text)]">
              {selectedClass?.name ?? "Todos los cursos"}
            </h2>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Materiales disponibles para consulta
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--color-text-secondary)]">
            {files.length} {files.length === 1 ? "recurso" : "recursos"}
          </span>
        </div>
        {files.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {files.map((item) => (
              <ResourceCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FolderOpen size={23} />}
            title="No encontramos recursos"
            description="Prueba con otro curso o cambia el término de búsqueda."
          />
        )}
      </section>
    </div>
  );
}

type Resource = ClassroomWorkspace["materials"][number] & { color?: string | null };
function ResourceCard({ item }: { item: Resource }) {
  const actionClass =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)]";
  return (
    <article className="flex min-w-0 flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
          aria-hidden="true"
        >
          <FileText size={20} />
        </span>
        <span
          className="max-w-[65%] truncate rounded-full px-2.5 py-1 text-xs font-bold"
          style={{
            color: item.color ?? "#191970",
            backgroundColor: `${item.color ?? "#191970"}12`
          }}
        >
          {item.classCode}
        </span>
      </div>
      <p className="mt-4 truncate text-xs font-semibold text-[var(--color-info)]">
        {item.className}
      </p>
      <h3 className="mt-1 break-words font-semibold text-[var(--color-text)]">{item.name}</h3>
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">{item.kind}</p>
      <div className="mt-auto pt-5">
        {item.externalUrl ? (
          <a href={item.externalUrl} target="_blank" rel="noreferrer" className={actionClass}>
            <ExternalLink size={15} aria-hidden="true" />
            Abrir enlace
          </a>
        ) : item.downloadUrl ? (
          <a href={`${process.env.NEXT_PUBLIC_API_URL}${item.downloadUrl}`} className={actionClass}>
            <Download size={15} aria-hidden="true" />
            Descargar archivo
          </a>
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">Recurso no disponible</span>
        )}
      </div>
    </article>
  );
}

function FilesSkeleton() {
  return (
    <SkeletonGroup label="Cargando recursos">
      <div className="space-y-5 p-5 lg:p-8">
        <Skeleton className="h-32" rounded="lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-56" rounded="lg" />
          <Skeleton className="h-56" rounded="lg" />
          <Skeleton className="h-56" rounded="lg" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
