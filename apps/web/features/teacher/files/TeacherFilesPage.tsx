"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, ExternalLink, FileText, Flag, FolderOpen, Search, Trash2, Upload, X } from "lucide-react";
import type { ClassroomWorkspace } from "@homeschool/shared";
import { classroomApi } from "@/features/classroom/classroom-api";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";
import { apiRequest } from "@/lib/api-client";

export function TeacherFilesPage() {
  const [classes, setClasses] = useState<ClassroomWorkspace[]>([]);
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  async function load() {
    const items = await classroomApi.teacherWorkspaces();
    setClasses(items);
    setState("ready");
  }
  useEffect(() => {
    load().catch(() => setState("error"));
  }, []);

  const files = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return classes
      .flatMap((classroom) =>
        classroom.materials.map((material) => ({ ...material, color: classroom.color }))
      )
      .filter(
        (item) =>
          (course === "ALL" || item.classId === course) &&
          `${item.name} ${item.className}`.toLocaleLowerCase("es").includes(normalized)
      );
  }, [classes, course, query]);

  async function deleteMaterial(item: Resource) {
    if (!window.confirm(`¿Eliminar “${item.name}”? Esta acción no se puede deshacer.`)) return;
    setDeletingId(item.id);
    setDeleteError("");
    try {
      await apiRequest<{ id: string }>(`/classroom/materials/${item.id}`, {
        method: "DELETE"
      });
      await load();
    } catch (caught) {
      setDeleteError(
        caught instanceof Error
          ? caught.message
          : "No pudimos eliminar el recurso. Inténtalo nuevamente."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (state === "loading") return <FilesSkeleton />;
  if (state === "error")
    return (
      <div className="p-5 lg:p-8">
        <ErrorState
          description="No pudimos cargar los archivos. Revisa tu conexión e inténtalo nuevamente."
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
      <div className="flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5 lg:p-8">
        <header className="shrink-0 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-info)]">Biblioteca docente</p>
              <h1 className="mt-1 text-2xl font-semibold text-balance text-[var(--color-text)]">
                Archivos y recursos
              </h1>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Organiza materiales reales y publícalos para tus estudiantes.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:w-[38rem]">
              <label
                className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
                htmlFor="teacher-file-course"
              >
                Clase
                <select
                  id="teacher-file-course"
                  name="teacherFileCourse"
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                  className="min-h-11 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                >
                  <option value="ALL">Todas las clases</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} · {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label
                className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
                htmlFor="teacher-file-search"
              >
                Buscar archivos
                <span className="relative">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    aria-hidden="true"
                  />
                  <TextInput
                    id="teacher-file-search"
                    name="teacherFileSearch"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ej. guía de lectura…"
                    className="pl-10"
                    autoComplete="off"
                  />
                </span>
              </label>
            </div>
          </div>
          <div className="mt-5 flex justify-end">
            <Button
              leadingIcon={<Upload size={16} />}
              onClick={() => setOpen(true)}
              disabled={!classes.length}
            >
              Subir recurso
            </Button>
          </div>
          {deleteError ? (
            <InlineAlert className="mt-4" tone="danger" title="No se pudo eliminar el recurso">
              {deleteError}
            </InlineAlert>
          ) : null}
        </header>

        <section
          className="mt-5 min-h-0 flex-1 overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5"
          aria-labelledby="teacher-files-heading"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 id="teacher-files-heading" className="font-semibold text-[var(--color-text)]">
                Materiales publicados
              </h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                Documentos y enlaces visibles en tus clases
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-[var(--color-text-secondary)]">
              {files.length} {files.length === 1 ? "recurso" : "recursos"}
            </span>
          </div>
          {files.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {files.map((item) => (
                <TeacherResourceCard
                  key={item.id}
                  item={item}
                  deleting={deletingId === item.id}
                  onDelete={() => deleteMaterial(item)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<FolderOpen size={23} />}
              title="No encontramos recursos"
              description={
                classes.flatMap((item) => item.materials).length
                  ? "Prueba con otra clase o término de búsqueda."
                  : "Sube el primer documento o enlace para tus estudiantes."
              }
              action={
                !classes.flatMap((item) => item.materials).length && classes.length ? (
                  <Button leadingIcon={<Upload size={16} />} onClick={() => setOpen(true)}>
                    Subir recurso
                  </Button>
                ) : undefined
              }
            />
          )}
        </section>
      </div>
      {open ? (
        <UploadDialog
          classes={classes}
          onClose={() => setOpen(false)}
          onUploaded={async () => {
            await load();
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

type Resource = ClassroomWorkspace["materials"][number] & { color?: string | null };
function TeacherResourceCard({
  item,
  deleting,
  onDelete
}: {
  item: Resource;
  deleting: boolean;
  onDelete: () => void;
}) {
  const actionClass =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)]";
  return (
    <article className="flex min-w-0 flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
          aria-hidden="true"
        >
          <FileText size={20} />
        </span>
        <span
          className="truncate rounded-full px-2.5 py-1 text-xs font-bold"
          style={{
            color: item.color ?? "#191970",
            backgroundColor: `${item.color ?? "#191970"}12`
          }}
        >
          {item.classCode}
        </span>
      </div>
      <h3 className="mt-4 break-words font-semibold text-[var(--color-text)]">{item.name}</h3>
      {item.isImportant ? (
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 ring-1 ring-inset ring-amber-200">
          <Flag size={13} aria-hidden="true" />
          Importante
        </span>
      ) : null}
      <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
        {item.className} ·{" "}
        {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(item.createdAt))}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {item.externalUrl ? (
          <a href={item.externalUrl} target="_blank" rel="noreferrer" className={actionClass}>
            <ExternalLink size={15} aria-hidden="true" />
            Abrir enlace
          </a>
        ) : null}
        {item.downloadUrl ? (
          <a href={`${process.env.NEXT_PUBLIC_API_URL}${item.downloadUrl}`} className={actionClass}>
            <Download size={15} aria-hidden="true" />
            Descargar
          </a>
        ) : null}
        {!item.externalUrl && !item.downloadUrl ? (
          <span className="text-xs text-[var(--color-text-muted)]">Recurso no disponible</span>
        ) : null}
        <Button
          variant="danger"
          size="sm"
          onClick={onDelete}
          loading={deleting}
          loadingLabel="Eliminando…"
          leadingIcon={<Trash2 size={15} aria-hidden="true" />}
        >
          Eliminar
        </Button>
      </div>
    </article>
  );
}

function UploadDialog({
  classes,
  onClose,
  onUploaded
}: {
  classes: ClassroomWorkspace[];
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  async function submit(data: FormData) {
    data.delete("classId");
    const selectedFile = data.get("file");
    const hasFile = selectedFile instanceof File && selectedFile.size > 0;
    const hasExternalUrl = Boolean(String(data.get("externalUrl") ?? "").trim());
    if (hasFile === hasExternalUrl) {
      setError("Selecciona un archivo o agrega un enlace, pero no ambos.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await classroomApi.material(classId, data);
      await onUploaded();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No pudimos publicar el recurso. Inténtalo nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overscroll-contain bg-slate-950/45 p-4"
      role="presentation"
    >
      <section
        className="w-full max-w-xl rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-title"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-info)]">
              Biblioteca docente
            </p>
            <h2 id="upload-title" className="mt-1 text-xl font-semibold text-[var(--color-text)]">
              Subir recurso
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="grid min-h-11 min-w-11 place-items-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)]"
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <form action={submit} className="space-y-4 p-5">
          <label
            className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
            htmlFor="upload-class"
          >
            Clase
            <select
              id="upload-class"
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="input"
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label
            className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
            htmlFor="upload-name"
          >
            Nombre
            <input
              id="upload-name"
              required
              name="name"
              className="input"
              autoComplete="off"
              placeholder="Ej. Guía de lectura…"
            />
          </label>
          <label
            className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
            htmlFor="upload-file"
          >
            Archivo
            <input
              id="upload-file"
              name="file"
              type="file"
              className="block w-full rounded-md border border-dashed border-[var(--color-border)] p-4 text-sm"
            />
          </label>
          <label
            className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
            htmlFor="upload-url"
          >
            O enlace
            <input
              id="upload-url"
              name="externalUrl"
              type="url"
              className="input"
              placeholder="https://ejemplo.com/recurso…"
              autoComplete="url"
            />
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-950">
            <input
              name="isImportant"
              type="checkbox"
              value="true"
              className="mt-0.5 size-4 rounded border-amber-400 text-[var(--color-brand-900)] focus:ring-[var(--color-brand-900)]"
            />
            <span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Flag size={15} aria-hidden="true" />
                Marcar como importante
              </span>
              <span className="mt-1 block text-xs leading-5 text-amber-800">
                Guarda esta prioridad para futuras notificaciones; no se enviará ningún aviso ahora.
              </span>
            </span>
          </label>
          <input type="hidden" name="visibleToStudents" value="true" />
          {error ? (
            <InlineAlert tone="danger" title="No se pudo publicar el recurso">
              {error}
            </InlineAlert>
          ) : null}
          <footer className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting} loadingLabel="Publicando…">
              Publicar recurso
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function FilesSkeleton() {
  return (
    <SkeletonGroup label="Cargando archivos">
      <div className="space-y-5 p-5 lg:p-8">
        <Skeleton className="h-40" rounded="lg" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-56" rounded="lg" />
          <Skeleton className="h-56" rounded="lg" />
          <Skeleton className="h-56" rounded="lg" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
