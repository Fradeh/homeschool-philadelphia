"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, FileText, Plus, UserRound, X } from "lucide-react";
import {
  ClassSubmissionStatus,
  type ClassSubmissionSummary,
  type GradeClassSubmissionRequest
} from "@homeschool/shared";
import type { TeacherAssignment } from "./mock-teacher-classes";
import { apiRequest, buildApiUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";

type AssignmentSubmissions = {
  id: string;
  title: string;
  points: number | null;
  submissions: ClassSubmissionSummary[];
};

export function ClassAssignments({
  assignments,
  onCreateAssignment
}: {
  assignments: TeacherAssignment[];
  onCreateAssignment: () => void;
}) {
  const [reviewing, setReviewing] = useState<TeacherAssignment | null>(null);
  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-lg border border-[#dde3ef] bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f75a8]">
            Trabajo de clase
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#191970]">Tareas</h2>
          <p className="mt-1 text-sm text-slate-600">
            Publica instrucciones y supervisa las entregas de esta clase.
          </p>
        </div>
        <Button onClick={onCreateAssignment} leadingIcon={<Plus size={17} />}>
          Crear tarea
        </Button>
      </section>
      <section className="overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
        {assignments.length ? (
          <div className="divide-y divide-[#edf0f6]">
            {assignments.map((assignment) => {
              const progress = assignment.totalStudents
                ? Math.round((assignment.submissionsCount / assignment.totalStudents) * 100)
                : 0;
              return (
                <article key={assignment.id} className="p-5">
                  <div className="flex min-w-0 gap-4">
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-[#eef2ff] text-[#191970]"
                      aria-hidden="true"
                    >
                      <FileText size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[#191970]">{assignment.title}</h3>
                        <AssignmentStatus status={assignment.status} />
                      </div>
                      <p className="mt-1 max-w-2xl text-sm leading-5 text-slate-600">
                        {assignment.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                        <span>Entrega: {assignment.dueDate}</span>
                        <span>{assignment.points ?? 100} puntos</span>
                        <span>{assignment.submissionType ?? "Archivo"}</span>
                      </div>
                      {assignment.attachments?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {assignment.attachments.map((attachment) => (
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
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 rounded-md bg-[#f8f9fc] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">Progreso de entregas</span>
                        <span className="tabular-nums text-[#191970]">
                          {assignment.submissionsCount}/{assignment.totalStudents}
                        </span>
                      </div>
                      <div
                        className="mt-2 h-2 overflow-hidden rounded-full bg-[#e3e8f2]"
                        role="progressbar"
                        aria-label={`Entregas de ${assignment.title}`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                      >
                        <div
                          className="h-full rounded-full bg-[#078cc5]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => setReviewing(assignment)}
                      leadingIcon={<CheckCircle2 size={16} />}
                    >
                      Revisar entregas
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            className="m-5"
            icon={<FileText size={22} />}
            title="Aún no hay tareas"
            description="Crea la primera tarea para esta clase."
            action={
              <Button onClick={onCreateAssignment} leadingIcon={<Plus size={16} />}>
                Crear tarea
              </Button>
            }
          />
        )}
      </section>
      {reviewing ? (
        <SubmissionsDialog assignment={reviewing} onClose={() => setReviewing(null)} />
      ) : null}
    </div>
  );
}

function SubmissionsDialog({
  assignment,
  onClose
}: {
  assignment: TeacherAssignment;
  onClose: () => void;
}) {
  const [data, setData] = useState<AssignmentSubmissions | null>(null);
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEscape);
    apiRequest<AssignmentSubmissions>(`/classroom/assignments/${assignment.id}/submissions`)
      .then(setData)
      .catch(() => setError("No pudimos cargar las entregas de esta tarea."));
    return () => window.removeEventListener("keydown", onEscape);
  }, [assignment.id, onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overscroll-contain bg-slate-950/50 p-3 sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="submissions-title"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-[var(--radius-card)] bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-info)]">
              Revisión de entregas
            </p>
            <h2
              id="submissions-title"
              className="mt-1 text-xl font-semibold text-[var(--color-text)]"
            >
              {assignment.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Califica sobre {data?.points ?? assignment.points ?? 100} puntos.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar revisión de entregas"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-md hover:bg-[var(--color-surface-soft)]"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {error ? (
            <InlineAlert tone="danger" title="No se cargaron las entregas">
              {error}
            </InlineAlert>
          ) : null}
          {!data && !error ? (
            <p
              className="py-12 text-center text-sm text-[var(--color-text-secondary)]"
              role="status"
            >
              Cargando entregas…
            </p>
          ) : null}
          {data?.submissions.length ? (
            <div className="space-y-4">
              {data.submissions.map((submission) => (
                <SubmissionReview
                  key={submission.id}
                  submission={submission}
                  maxPoints={data.points ?? assignment.points ?? 100}
                  onGraded={setData}
                />
              ))}
            </div>
          ) : null}
          {data && !data.submissions.length ? (
            <EmptyState
              icon={<UserRound size={22} />}
              title="Todavía no hay entregas"
              description="Las respuestas enviadas por estudiantes aparecerán aquí."
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SubmissionReview({
  submission,
  maxPoints,
  onGraded
}: {
  submission: ClassSubmissionSummary;
  maxPoints: number;
  onGraded: (data: AssignmentSubmissions) => void;
}) {
  const [score, setScore] = useState(String(submission.score ?? ""));
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const status = submissionStatus(submission.status);
  async function save() {
    const numericScore = Number(score);
    if (
      score.trim() === "" ||
      !Number.isFinite(numericScore) ||
      numericScore < 0 ||
      numericScore > maxPoints
    ) {
      setError(`Ingresa una nota entre 0 y ${maxPoints}.`);
      return;
    }
    setSaving(true);
    setError("");
    const payload: GradeClassSubmissionRequest = {
      score: numericScore,
      feedback: feedback.trim() || undefined
    };
    try {
      onGraded(
        await apiRequest<AssignmentSubmissions>(`/classroom/submissions/${submission.id}/grade`, {
          method: "PATCH",
          body: JSON.stringify(payload)
        })
      );
    } catch {
      setError("No pudimos guardar la calificación.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-[var(--color-text)]">
            {submission.student.displayName}
          </h3>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {submission.submittedAt
              ? `Entregada ${new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(submission.submittedAt))}`
              : "Sin fecha de entrega"}
          </p>
        </div>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </div>
      {submission.body ? (
        <section className="mt-4 rounded-lg bg-[var(--color-surface-soft)] p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            Respuesta
          </h4>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[var(--color-text-secondary)]">
            {submission.body}
          </p>
        </section>
      ) : null}
      {submission.attachments.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {submission.attachments.map((attachment) => (
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
      ) : submission.fileName ? (
        <a
          href={buildApiUrl(`/classroom/submissions/${submission.id}/download`)}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)]"
        >
          <Download size={16} aria-hidden="true" />
          {submission.fileName}
        </a>
      ) : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-[10rem_1fr]">
        <label
          className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
          htmlFor={`score-${submission.id}`}
        >
          Nota
          <input
            id={`score-${submission.id}`}
            name={`score-${submission.id}`}
            type="number"
            min={0}
            max={maxPoints}
            step="0.1"
            value={score}
            onChange={(event) => setScore(event.target.value)}
            className="input"
          />
          <span className="text-xs font-normal text-[var(--color-text-muted)]">
            Máximo: {maxPoints}
          </span>
        </label>
        <label
          className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
          htmlFor={`feedback-${submission.id}`}
        >
          Retroalimentación
          <textarea
            id={`feedback-${submission.id}`}
            name={`feedback-${submission.id}`}
            rows={3}
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="Escribe una observación para el estudiante…"
            className="w-full resize-none rounded-md border border-[var(--color-border)] p-3 text-base font-normal sm:text-sm"
          />
        </label>
      </div>
      {error ? (
        <p className="mt-3 text-sm font-semibold text-[var(--color-danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex justify-end">
        <Button onClick={save} loading={saving} loadingLabel="Guardando…">
          {submission.status === ClassSubmissionStatus.GRADED
            ? "Actualizar calificación"
            : "Guardar calificación"}
        </Button>
      </div>
    </article>
  );
}

function AssignmentStatus({ status }: { status: TeacherAssignment["status"] }) {
  const tone: StatusBadgeTone =
    status === "Publicada" ? "success" : status === "Borrador" ? "warning" : "neutral";
  return <StatusBadge tone={tone}>{status}</StatusBadge>;
}
function submissionStatus(status: ClassSubmissionStatus): { label: string; tone: StatusBadgeTone } {
  if (status === ClassSubmissionStatus.GRADED) return { label: "Calificada", tone: "info" };
  if (status === ClassSubmissionStatus.SUBMITTED)
    return { label: "Por calificar", tone: "warning" };
  if (status === ClassSubmissionStatus.RETURNED) return { label: "Devuelta", tone: "danger" };
  return { label: status, tone: "neutral" };
}
