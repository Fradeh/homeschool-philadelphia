"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  BookOpenCheck,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  MessageCircle,
  Send,
  Trash2,
  Upload
} from "lucide-react";
import type { ClassAssignmentSummary, ClassroomWorkspace } from "@homeschool/shared";
import { classroomApi } from "@/features/classroom/classroom-api";
import { ClassroomWall } from "@/features/classroom/ClassroomWall";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest, buildApiUrl } from "@/lib/api-client";

export type StudentClassTab = "wall" | "paces" | "assignments" | "resources";
export function StudentClassWorkspacePage({
  classId,
  initialTab = "wall"
}: {
  classId: string;
  initialTab?: StudentClassTab;
}) {
  const [workspace, setWorkspace] = useState<ClassroomWorkspace | null>(null);
  const [tab, setTab] = useState<StudentClassTab>(initialTab);
  const [message, setMessage] = useState("Cargando el espacio de clase…");
  useEffect(() => {
    const syncTab = () => {
      const next = new URL(window.location.href).searchParams.get("tab") as StudentClassTab | null;
      if (next && ["wall", "paces", "assignments", "resources"].includes(next)) setTab(next);
    };
    window.addEventListener("popstate", syncTab);
    return () => window.removeEventListener("popstate", syncTab);
  }, []);
  useEffect(() => {
    classroomApi
      .workspace(classId)
      .then((x) => {
        setWorkspace(x);
        setMessage("");
      })
      .catch(() => setMessage("La clase no existe o no está asignada a tu cuenta."));
  }, [classId]);
  function changeTab(next: StudentClassTab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.pushState({}, "", url);
  }
  if (!workspace && message.startsWith("Cargando")) return <ClassWorkspaceSkeleton />;
  if (!workspace)
    return (
      <div className="p-5 lg:p-8">
        <ErrorState
          description={message}
          action={
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Intentar de nuevo
            </Button>
          }
        />
      </div>
    );
  const tabs: Array<{ id: StudentClassTab; label: string; icon: ReactNode; count?: number }> = [
    { id: "wall", label: "Muro", icon: <BookOpen size={16} />, count: workspace.wall.length },
    {
      id: "paces",
      label: "PACEs",
      icon: <BookOpenCheck size={16} />,
      count: workspace.subjects.length
    },
    {
      id: "assignments",
      label: "Tareas",
      icon: <ClipboardList size={16} />,
      count: workspace.assignments.length
    },
    {
      id: "resources",
      label: "Contenido",
      icon: <FileText size={16} />,
      count: workspace.materials.length
    }
  ];
  return (
    <div className="grid h-full min-h-0 overflow-hidden bg-[var(--color-page)] lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="hidden overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
        <div className="border-b border-[var(--color-border)] p-5">
          <Link
            href="/student/classes"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"
          >
            <ArrowLeft size={14} />
            Todas las clases
          </Link>
          <span
            className="mt-6 grid h-16 w-16 place-items-center rounded-lg text-lg font-bold text-white"
            style={{ backgroundColor: workspace.color ?? "#191970" }}
          >
            {workspace.code.slice(0, 2)}
          </span>
          <h2 className="mt-4 text-lg font-semibold text-[#191970]">{workspace.name}</h2>
          <p className="mt-1 text-xs text-slate-400">
            {workspace.code} · {workspace.gradeName}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-600">{workspace.description}</p>
        </div>
        <nav className="space-y-1 p-3">
          {tabs.map((x) => (
            <button
              key={x.id}
              onClick={() => changeTab(x.id)}
              aria-current={tab === x.id ? "page" : undefined}
              className={`flex min-h-12 w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold ${tab === x.id ? "bg-[var(--color-brand-100)] text-[var(--color-brand-900)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)]"}`}
            >
              <span className="grid h-9 w-9 place-items-center rounded-md bg-white">{x.icon}</span>
              <span className="flex-1">{x.label}</span>
              <span className="text-xs text-slate-400">{x.count}</span>
            </button>
          ))}
        </nav>
      </aside>
      <section className="flex min-h-0 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 sm:px-5 lg:px-6">
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6f75a8]">
            {tabs.find((x) => x.id === tab)?.label}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#191970]">{workspace.name}</h2>
          <nav
            className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden"
            aria-label="Secciones de la clase"
          >
            {tabs.map((x) => (
              <button
                key={x.id}
                onClick={() => changeTab(x.id)}
                aria-current={tab === x.id ? "page" : undefined}
                className={`min-h-11 shrink-0 rounded-md px-3 py-2 text-xs font-semibold ${tab === x.id ? "bg-[var(--color-brand-900)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]"}`}
              >
                {x.label}
              </button>
            ))}
          </nav>
        </header>
        <main
          className={`min-h-0 flex-1 p-4 sm:p-5 lg:p-6 ${tab === "wall" ? "overflow-hidden" : "overflow-y-auto"}`}
        >
          {tab === "wall" ? <ClassroomWall workspace={workspace} onChange={setWorkspace} /> : null}
          {tab === "paces" ? <Paces workspace={workspace} /> : null}
          {tab === "assignments" ? (
            <Assignments workspace={workspace} onChange={setWorkspace} />
          ) : null}
          {tab === "resources" ? <Resources workspace={workspace} /> : null}
        </main>
      </section>
    </div>
  );
}

function Wall({
  workspace,
  onChange
}: {
  workspace: ClassroomWorkspace;
  onChange: (x: ClassroomWorkspace) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  async function publish() {
    if (!title.trim() || !content.trim()) return;
    onChange(await classroomApi.post(workspace.id, { title, content }));
    setTitle("");
    setContent("");
  }
  async function comment(id: string) {
    const value = drafts[id]?.trim();
    if (!value) return;
    onChange(await classroomApi.comment(id, value));
    setDrafts((x) => ({ ...x, [id]: "" }));
  }
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="rounded-lg border bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#078cc5]">
          Escribir en el muro
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Asunto"
          className="mt-3 h-10 w-full rounded-md border px-3 text-sm"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Comparte una pregunta, avance o información con tu clase…"
          rows={3}
          className="mt-3 w-full rounded-md border p-3 text-sm"
        />
        <div className="mt-3 flex justify-end">
          <button onClick={publish} className="primary">
            Publicar
          </button>
        </div>
      </section>
      {[...workspace.wall].reverse().map((post) => (
        <article key={post.id} className="rounded-lg border bg-white p-5">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-[#eef2ff] text-[#191970]">
              <MessageCircle size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#191970]">{post.author.displayName}</p>
              <p className="text-xs text-slate-400">
                {new Intl.DateTimeFormat("es-CO", {
                  dateStyle: "medium",
                  timeStyle: "short"
                }).format(new Date(post.createdAt))}
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border p-4">
            <h3 className="font-semibold text-[#191970]">{post.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{post.content}</p>
          </div>
          {post.comments.map((c) => (
            <div key={c.id} className="mt-3 rounded-md bg-[#f6f8fc] p-3">
              <b className="text-xs text-[#191970]">{c.author.displayName}</b>
              <p className="mt-1 text-sm text-slate-600">{c.content}</p>
            </div>
          ))}
          <div className="mt-3 flex gap-2">
            <input
              value={drafts[post.id] ?? ""}
              onChange={(e) => setDrafts((x) => ({ ...x, [post.id]: e.target.value }))}
              placeholder="Responder…"
              className="h-10 min-w-0 flex-1 rounded-md border px-3 text-sm"
            />
            <button
              onClick={() => comment(post.id)}
              className="grid h-10 w-10 place-items-center rounded-md bg-[#191970] text-white"
            >
              <Send size={16} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
function Paces({ workspace }: { workspace: ClassroomWorkspace }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
      {workspace.subjects.map((x) => (
        <article key={x.id} className="overflow-hidden rounded-lg border bg-white">
          <div className="h-2" style={{ backgroundColor: x.color ?? "#078cc5" }} />
          <div className="p-5">
            <p className="text-xs font-bold" style={{ color: x.color ?? "#078cc5" }}>
              {x.shortName}
            </p>
            <h3 className="mt-1 font-semibold text-[#191970]">{x.name}</h3>
            <p className="mt-4 text-sm text-slate-500">
              Consulta el detalle y avance individual en Mis PACEs.
            </p>
            <Link
              href="/student/paces"
              className="mt-4 inline-flex text-sm font-semibold text-[#191970]"
            >
              Abrir PACEs →
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
function Assignments({
  workspace,
  onChange
}: {
  workspace: ClassroomWorkspace;
  onChange: (x: ClassroomWorkspace) => void;
}) {
  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <header className="border-b border-[var(--color-border)] p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-info)]">
          Trabajo de clase
        </p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">Tareas de la clase</h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Consulta instrucciones, fechas y el estado de tus entregas.
        </p>
      </header>
      <div className="divide-y">
        {workspace.assignments.map((x) => (
          <Assignment
            key={x.id}
            item={x}
            onSubmit={async (form) => onChange(await classroomApi.submit(x.id, form))}
            onDeleteAttachment={async (attachmentId) => {
              await apiRequest(`/classroom/submission-attachments/${attachmentId}`, {
                method: "DELETE"
              });
              onChange(await classroomApi.workspace(workspace.id));
            }}
          />
        ))}
      </div>
      {!workspace.assignments.length ? (
        <EmptyState
          className="m-5"
          icon={<ClipboardList size={22} />}
          title="No hay tareas publicadas"
          description="Cuando el profesor publique una tarea, aparecerá aquí con su fecha de entrega."
        />
      ) : null}
    </section>
  );
}
function Assignment({
  item,
  onSubmit,
  onDeleteAttachment
}: {
  item: ClassAssignmentSummary;
  onSubmit: (f: FormData) => Promise<void>;
  onDeleteAttachment: (attachmentId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [error, setError] = useState("");
  return (
    <article className="p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <StatusBadge tone={item.mySubmission?.status === "SUBMITTED" ? "success" : "warning"}>
            {item.mySubmission?.status === "SUBMITTED" ? "Entregada" : "Pendiente"}
          </StatusBadge>
          <h3 className="mt-2 font-semibold text-[var(--color-text)]">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{item.description}</p>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            Entrega:{" "}
            {item.dueAt
              ? new Intl.DateTimeFormat("es-CO", {
                  dateStyle: "medium",
                  timeStyle: "short"
                }).format(new Date(item.dueAt))
              : "Sin fecha"}
          </p>
          {item.attachments.length ? (
            <section className="mt-3">
              <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                Archivos del profesor
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={buildApiUrl(attachment.downloadUrl)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)]"
                  >
                    <Download size={16} aria-hidden="true" />
                    {attachment.fileName}
                  </a>
                ))}
              </div>
            </section>
          ) : null}
          {item.mySubmission?.attachments.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.mySubmission.attachments.map((attachment) => (
                <span key={attachment.id} className="group relative inline-flex max-w-full">
                  <a
                    href={buildApiUrl(attachment.downloadUrl)}
                    className="inline-flex min-h-11 max-w-full items-center gap-2 rounded-md border border-[var(--color-border)] px-3 pr-11 text-sm font-semibold text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)]"
                  >
                    <Download size={16} className="shrink-0" aria-hidden="true" />
                    <span className="truncate">{attachment.fileName}</span>
                  </a>
                  {item.mySubmission?.status !== "GRADED" ? (
                    <button
                      type="button"
                      title={`Eliminar ${attachment.fileName}`}
                      aria-label={`Eliminar archivo ${attachment.fileName}`}
                      disabled={deletingAttachmentId === attachment.id}
                      onClick={async () => {
                        if (!window.confirm(`¿Eliminar “${attachment.fileName}” de la entrega?`))
                          return;
                        setDeletingAttachmentId(attachment.id);
                        setAttachmentError("");
                        try {
                          await onDeleteAttachment(attachment.id);
                        } catch (caught) {
                          setAttachmentError(
                            caught instanceof Error
                              ? caught.message
                              : "No pudimos eliminar el archivo."
                          );
                        } finally {
                          setDeletingAttachmentId(null);
                        }
                      }}
                      className="absolute right-1 top-1/2 grid min-h-9 min-w-9 -translate-y-1/2 place-items-center rounded-md bg-white text-[var(--color-danger)] opacity-100 shadow-sm transition-opacity hover:bg-[var(--color-danger-bg)] focus-visible:opacity-100 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          ) : item.mySubmission?.fileName ? (
            <a
              href={buildApiUrl(`/classroom/submissions/${item.mySubmission.id}/download`)}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)]"
            >
              <Download size={16} aria-hidden="true" />
              {item.mySubmission.fileName}
            </a>
          ) : null}
          {attachmentError ? (
            <InlineAlert className="mt-3" tone="danger" title="No se eliminó el archivo">
              {attachmentError}
            </InlineAlert>
          ) : null}
          {item.mySubmission?.status === "GRADED" ? (
            <div className="mt-4 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-4">
              <p className="text-sm font-semibold text-[var(--color-info)]">
                Calificación: {item.mySubmission.score ?? "—"}/{item.points ?? 100}
              </p>
              {item.mySubmission.feedback ? (
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {item.mySubmission.feedback}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <Button onClick={() => setOpen(!open)} variant={open ? "secondary" : "primary"}>
          {item.mySubmission?.status === "SUBMITTED" ? "Actualizar entrega" : "Entregar tarea"}
        </Button>
      </div>
      {open ? (
        <form
          action={async (data) => {
            const selectedFiles = data
              .getAll("files")
              .filter((entry): entry is File => entry instanceof File && Boolean(entry.name));
            if (selectedFiles.some((file) => file.size === 0)) {
              setError("El archivo seleccionado está vacío. Elige otro archivo.");
              return;
            }
            if ((item.mySubmission?.attachments.length ?? 0) + selectedFiles.length > 5) {
              setError("Cada entrega admite un máximo de 5 archivos.");
              return;
            }
            setSubmitting(true);
            setError("");
            try {
              await onSubmit(data);
              setOpen(false);
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : "No pudimos enviar la entrega. Inténtalo nuevamente."
              );
            } finally {
              setSubmitting(false);
            }
          }}
          className="mt-4 rounded-lg bg-[#f6f8fc] p-4"
        >
          <textarea
            name="body"
            rows={4}
            placeholder="Escribe tu respuesta o agrega una nota…"
            className="w-full rounded-md border bg-white p-3 text-sm"
          />
          <label className="mt-3 flex items-center gap-2 rounded-md border border-dashed bg-white p-3 text-sm font-semibold text-[#191970]">
            <Upload size={17} />
            Adjuntar documentos
            <input name="files" type="file" multiple className="ml-auto text-xs" />
          </label>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Puedes conservar los archivos actuales y agregar hasta 5 en total.
          </p>
          {error ? (
            <InlineAlert className="mt-3" tone="danger" title="No se pudo enviar la entrega">
              {error}
            </InlineAlert>
          ) : null}
          <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setError("");
                  setOpen(false);
                }}
              >
                Cancelar
              </Button>
            <Button type="submit" loading={submitting} loadingLabel="Enviando…">
              Enviar entrega
            </Button>
          </div>
        </form>
      ) : null}
    </article>
  );
}
function Resources({ workspace }: { workspace: ClassroomWorkspace }) {
  if (!workspace.materials.length)
    return (
      <EmptyState
        className="mx-auto max-w-5xl"
        icon={<FileText size={22} />}
        title="No hay materiales disponibles"
        description="Los documentos y enlaces compartidos por el profesor aparecerán aquí."
      />
    );
  return (
    <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {workspace.materials.map((x) => (
        <article
          key={x.id}
          className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]"
        >
          <span className="grid h-10 w-10 place-items-center rounded-md bg-[#eef2ff] text-[#191970]">
            <FileText size={19} />
          </span>
          <p className="mt-4 text-[10px] font-bold text-slate-400">{x.kind}</p>
          <h3 className="mt-2 font-semibold text-[#191970]">{x.name}</h3>
          <div className="mt-4">
            {x.externalUrl ? (
              <a
                href={x.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="secondary inline-flex items-center gap-2"
              >
                <ExternalLink size={14} />
                Abrir
              </a>
            ) : x.downloadUrl ? (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}${x.downloadUrl}`}
                className="secondary inline-flex items-center gap-2"
              >
                <Download size={14} />
                Descargar
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

function ClassWorkspaceSkeleton() {
  return (
    <SkeletonGroup label="Cargando detalle de clase">
      <div className="grid h-full min-h-0 lg:grid-cols-[16rem_1fr]">
        <div className="hidden space-y-4 border-r border-[var(--color-border)] bg-white p-5 lg:block">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-16 w-16" rounded="lg" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="space-y-5 p-5 lg:p-6">
          <Skeleton className="h-20 w-full" rounded="lg" />
          <Skeleton className="h-44 w-full" rounded="lg" />
          <Skeleton className="h-44 w-full" rounded="lg" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
