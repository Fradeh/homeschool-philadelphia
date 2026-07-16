"use client";

import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  ListTodo,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
  X
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "@/lib/api-client";
import { gcrApi } from "./gcr-api";
import type { GcrMissingField, GcrReport, GcrSubject, GcrTermVerse } from "./gcr-types";

type Props = {
  report: GcrReport;
  subjects: GcrSubject[];
  termVerses: GcrTermVerse[];
  studentName?: string;
  className?: string;
  onClose: () => void;
  onSaved: () => Promise<void>;
  onError: (error: unknown) => void;
};
type MutationResult =
  | { reportVersion?: number; version?: number }
  | Array<{ reportVersion: number }>;
type AttendanceValue = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";

const attendanceOptions: Array<{ value: AttendanceValue; label: string }> = [
  { value: "PRESENT", label: "Presente" },
  { value: "ABSENT", label: "Ausente" },
  { value: "LATE", label: "Tarde" },
  { value: "HALF_DAY", label: "Media jornada" }
];

function isPastGcrDeadline(reportDate: string) {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Panama",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
  if (reportDate !== date) return reportDate < date;
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Panama",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);
  const hour = Number(time.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(time.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute >= 10 * 60;
}

export function GcrEditorDialog({
  report,
  subjects,
  termVerses,
  studentName,
  className,
  onClose,
  onSaved,
  onError
}: Props) {
  const [version, setVersion] = useState(report.version);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [reasonRequired, setReasonRequired] = useState(false);
  const [postCloseReason, setPostCloseReason] = useState("");
  const [missingFields, setMissingFields] = useState<GcrMissingField[]>(report.missingFields ?? []);
  const [baseDirty, setBaseDirty] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [showMerit, setShowMerit] = useState(false);
  const [showDemerit, setShowDemerit] = useState(false);
  const [lateGuidance, setLateGuidance] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const incompleteRef = useRef<HTMLElement>(null);
  const lateGuidanceRef = useRef<HTMLElement>(null);
  const attendanceRef = useRef<HTMLDivElement>(null);
  const subjectsRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setVersion(report.version);
    setMissingFields(report.missingFields ?? []);
    if (report.hasPostCloseChanges) {
      setReasonRequired(false);
      setLateGuidance(true);
    }
  }, [report]);
  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    headingRef.current?.focus();
    return () => returnFocusRef.current?.focus();
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (baseDirty) event.preventDefault();
    };
    window.addEventListener("keydown", escape);
    window.addEventListener("beforeunload", unload);
    return () => {
      window.removeEventListener("keydown", escape);
      window.removeEventListener("beforeunload", unload);
    };
  }, [baseDirty]);

  function close() {
    if (!baseDirty || window.confirm("Hay cambios sin guardar. ¿Quieres cerrar el editor?"))
      onClose();
  }

  async function mutate(
    label: string,
    operation: (body: { version: number; postCloseReason?: string }) => Promise<MutationResult>
  ) {
    setBusy(label);
    setNotice("");
    try {
      const result = await operation({
        version,
        ...(postCloseReason.trim() ? { postCloseReason: postCloseReason.trim() } : {})
      });
      const nextVersion = Array.isArray(result)
        ? result[0]?.reportVersion
        : (result.reportVersion ?? result.version);
      if (nextVersion) setVersion(nextVersion);
      setConflict(false);
      setReasonRequired(false);
      setPostCloseReason("");
      setNotice("Cambios guardados.");
      try {
        await onSaved();
      } catch (refreshError) {
        setNotice("Cambios guardados. No se pudo actualizar la vista; puedes refrescar la semana después.");
        onError(refreshError);
      }
      return true;
    } catch (error) {
      if (error instanceof ApiError && /postCloseReason/i.test(error.message)) {
        setReasonRequired(true);
        setLateGuidance(true);
        setNotice("Este cambio ocurre después del cierre. Escribe un motivo y vuelve a guardar.");
        requestAnimationFrame(() => lateGuidanceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
      } else {
        if (
          error instanceof ApiError &&
          error.status === 409 &&
          /already has a verse/i.test(error.message)
        ) {
          setNotice(
            "Ese número de versículo ya fue registrado en otro GCR de este período. Actualiza la semana y selecciona otro disponible."
          );
        } else if (error instanceof ApiError && error.status === 409) {
          setConflict(true);
          setNotice("Hay una versión más reciente de este GCR.");
          onError(error);
        } else {
          setNotice(error instanceof Error ? error.message : "No se pudieron guardar los cambios.");
          onError(error);
        }
      }
      return false;
    } finally {
      setBusy("");
    }
  }

  async function submitReport() {
    setBusy("submit");
    setNotice("");
    try {
      await gcrApi.submit(report.id, version);
      setBaseDirty(false);
      setMissingFields([]);
      setNotice("GCR enviado correctamente.");
      await onSaved();
    } catch (error) {
      if (error instanceof ApiError && error.payload.code === "GCR_INCOMPLETE") {
        const fields = (error.payload.missingFields as GcrMissingField[]) ?? [];
        setMissingFields(fields);
        if (typeof error.payload.version === "number") setVersion(error.payload.version);
        requestAnimationFrame(() => incompleteRef.current?.focus());
        await onSaved();
      } else {
        if (error instanceof ApiError && error.status === 409) {
          setConflict(true);
          setNotice("Hay una versión más reciente de este GCR.");
        }
        onError(error);
      }
    } finally {
      setBusy("");
    }
  }

  async function saveBaseChanges(form: HTMLFormElement) {
    const data = new FormData(form);
    const subjectTasks = subjects.flatMap((subject) => {
      const assigned = data.get(`task-${subject.classSubjectId}Assigned`);
      if (assigned !== "yes" && assigned !== "no") return [];
      return [
        {
          classSubjectId: subject.classSubjectId,
          homeworkAssigned: assigned === "yes",
          completionStatus:
            assigned === "yes"
              ? data.get(`task-${subject.classSubjectId}Completion`) || null
              : null,
          comment: data.get(`task-${subject.classSubjectId}Comment`) || null
        }
      ];
    });
    const attendanceStatus = data.get("attendanceStatus");
    const attendanceComment = String(data.get("attendanceComment") ?? "").trim() || null;
    const attendanceChanged = Boolean(
      attendanceStatus &&
      (!report.attendance ||
        report.attendance.status !== attendanceStatus ||
        report.attendance.comment !== attendanceComment)
    );
    if (
      attendanceChanged &&
      isPastGcrDeadline(report.reportDate) &&
      !report.hasPostCloseChanges &&
      !postCloseReason.trim()
    ) {
      setReasonRequired(true);
      setLateGuidance(true);
      setNotice(
        "No se guardó nada todavía. Como cambiaste la asistencia después del cierre, escribe el motivo y vuelve a pulsar “Guardar cambios”. El versículo y los demás datos se guardarán juntos."
      );
      requestAnimationFrame(() =>
        lateGuidanceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
      return;
    }
    const verseReference = String(data.get("verseReference") ?? "").trim();
    const saved = await mutate("draft", (meta) =>
      gcrApi.saveDraft(report.id, {
        ...meta,
        generalComment: data.get("generalComment") || null,
        ...(attendanceStatus
          ? {
              attendance: {
                status: attendanceStatus,
                comment: attendanceComment
              }
            }
          : {}),
        subjectTasks,
        ...(verseReference
          ? {
              verse: {
                slot: Number(data.get("verseSlot")),
                reference: verseReference,
                text: data.get("verseText") || null,
                score: Number(data.get("verseScore"))
              }
            }
          : {})
      })
    );
    if (saved) setBaseDirty(false);
  }

  function handleBaseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveBaseChanges(event.currentTarget);
  }

  const isSubmitted = Boolean(report.submittedAt);
  const attendanceMissing = missingFields.some((field) => field.code === "ATTENDANCE_REQUIRED");
  const trackedTasks = report.subjectTasks.length;
  const activityCount = Number(Boolean(report.attendance)) + trackedTasks;
  const activityTotal = 1 + subjects.length;
  const missingItems = useMemo(() => {
    const items: Array<{ id: string; label: string; action: () => void }> = [];
    if (attendanceMissing)
      items.push({
        id: "attendance",
        label: "Registrar asistencia",
        action: () => attendanceRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      });
    if (trackedTasks < subjects.length)
      items.push({
        id: "subjects",
        label: `${subjects.length - trackedTasks} materia${subjects.length - trackedTasks === 1 ? "" : "s"} sin registrar`,
        action: () => subjectsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      });
    return items;
  }, [attendanceMissing, subjects.length, trackedTasks]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-0 backdrop-blur-[2px] sm:p-5"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="gcr-editor-title"
        className="flex h-full w-full flex-col overflow-hidden border-white/60 bg-[var(--color-canvas)] shadow-[0_28px_80px_-24px_rgba(15,23,42,0.55)] sm:h-[90vh] sm:max-w-[1180px] sm:rounded-[22px] sm:border"
      >
        <header className="relative shrink-0 overflow-hidden border-b border-[var(--color-border)] bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-indigo-50/80 to-transparent sm:block" />
          <div className="relative mx-auto flex w-full max-w-[1080px] items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <div className="mt-0.5 hidden size-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-900)] text-white shadow-lg shadow-indigo-950/15 sm:flex">
                <ClipboardCheck size={21} aria-hidden="true" />
              </div>
              <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 size={14} aria-hidden="true" /> Límite: 10:00 a. m.
                </span>
                <span>Versión {version}</span>
                <span
                  className={
                    isSubmitted ? "text-[var(--color-success)]" : "text-[var(--color-warning)]"
                  }
                >
                  {isSubmitted ? "Enviado" : "Borrador"}
                </span>
              </div>
              <h2
                ref={headingRef}
                tabIndex={-1}
                id="gcr-editor-title"
                className="mt-1 text-pretty text-lg font-semibold text-[var(--color-brand-900)] sm:text-xl"
              >
                GCR ·{" "}
                {new Intl.DateTimeFormat("es-PA", { dateStyle: "long", timeZone: "UTC" }).format(
                  new Date(`${report.reportDate}T00:00:00Z`)
                )}
              </h2>
              <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-[var(--color-text-secondary)]">
                {studentName ? (
                  <span className="inline-flex items-center gap-1">
                    <UserRound size={14} aria-hidden="true" />
                    {studentName}
                  </span>
                ) : null}
                {className ? (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap size={14} aria-hidden="true" />
                    {className}
                  </span>
                ) : null}
              </p>
            </div>
            </div>
            <button
              type="button"
              aria-label="Cerrar editor"
              onClick={close}
              className="relative rounded-xl border border-transparent p-2 text-slate-500 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-[var(--color-brand-900)]"
            >
              <X aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-[1080px] p-4 pb-28 sm:p-5 sm:pb-28">
            <div aria-live="polite" className="sr-only">
              {notice}
            </div>
            {lateGuidance ? (
              <section
                ref={lateGuidanceRef}
                tabIndex={-1}
                className="mb-4 rounded-xl border border-rose-300 bg-rose-50 p-4 text-rose-950 shadow-sm focus-visible:ring-2 focus-visible:ring-rose-600"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 shrink-0 text-rose-700" size={20} aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold">{report.hasPostCloseChanges ? "Motivo post-cierre guardado" : "Este GCR se entregará tarde"}</h3>
                    <p className="mt-1 text-sm leading-5">{report.hasPostCloseChanges ? "La justificación ya quedó registrada. Puedes seguir completando tareas sin volver a enviarla." : "Registra la asistencia, pulsa “Guardar cambios” y luego revisa el reporte antes de presionar “Enviar GCR”."}</p>
                    {reasonRequired ? <p className="mt-2 text-sm font-semibold">Antes de continuar, explica el motivo del cambio posterior al cierre.</p> : null}
                  </div>
                </div>
              </section>
            ) : null}
            {notice ? (
              <div
                className={`mb-4 rounded-xl border px-4 py-3 text-sm ${reasonRequired ? "border-rose-300 bg-rose-50 text-rose-900" : conflict ? "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]" : "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]"}`}
              >
                {notice}
              </div>
            ) : null}

            <section
              ref={incompleteRef}
              tabIndex={-1}
              className="mb-5 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-white via-white to-indigo-50/60 p-4 shadow-[0_10px_32px_-24px_rgba(30,41,125,0.65)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-900)] sm:p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-[var(--color-brand-900)]">
                    <ListTodo size={18} aria-hidden="true" />
                  </div>
                  <div>
                  <p className="text-sm font-semibold text-[var(--color-brand-900)]">
                    Completa el reporte en este orden
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    1. Asistencia · 2. Tareas · 3. Información adicional solo si aplica.
                  </p>
                </div>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-indigo-100 lg:w-72"
                  aria-label={`${activityCount} de ${activityTotal} registros principales completados`}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={activityTotal}
                  aria-valuenow={activityCount}
                >
                  <div
                    className="h-full rounded-full bg-[var(--color-accent-500)] transition-[width] motion-reduce:transition-none"
                    style={{ width: `${Math.min(100, (activityCount / activityTotal) * 100)}%` }}
                  />
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${missingFields.length ? "bg-[var(--color-warning-bg)] text-[var(--color-warning)]" : "bg-[var(--color-success-bg)] text-[var(--color-success)]"}`}
                >
                  {missingFields.length
                    ? `${activityCount}/${activityTotal} · Faltan ${missingFields.length} requisito${missingFields.length === 1 ? "" : "s"}`
                    : `${activityCount}/${activityTotal} · Listo para enviar`}
                </span>
              </div>
              {missingItems.length ? (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-border-soft)] pt-3">
                  {missingItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.action}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-[var(--color-brand-900)] shadow-sm transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-[var(--color-brand-900)] motion-reduce:transform-none"
                    >
                      <AlertTriangle size={14} aria-hidden="true" />
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </section>

            {reasonRequired ? (
              <label className="mb-4 block rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm font-semibold text-rose-950">
                Motivo del cambio post-cierre
                <textarea
                  name="postCloseReason"
                  autoComplete="off"
                  rows={3}
                  maxLength={500}
                  value={postCloseReason}
                  onChange={(event) => setPostCloseReason(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-rose-300 bg-white p-3 font-normal"
                  placeholder="Explica brevemente por qué necesitas corregir este dato…"
                />
              </label>
            ) : null}
            {conflict ? (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4 text-sm text-[var(--color-warning)]">
                <span>Hay cambios guardados desde otra pestaña. Refresca antes de continuar.</span>
                <button
                  type="button"
                  className="secondary shrink-0"
                  onClick={async () => {
                    await onSaved();
                    setConflict(false);
                    setNotice("Datos refrescados. Revisa la versión antes de guardar.");
                  }}
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  Refrescar datos
                </button>
              </div>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.72fr)]">
              <form
                id="gcr-base-form"
                onSubmit={handleBaseSubmit}
                onChange={() => setBaseDirty(true)}
                className="space-y-4"
              >
                <WorkspaceSection
                  title="1. Empieza aquí"
                  description="Marca la asistencia. El comentario es opcional."
                >
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div ref={attendanceRef}>
                      <AttendanceForm
                        report={report}
                        issue={attendanceMissing}
                        onStatusChange={() => {
                          if (!isPastGcrDeadline(report.reportDate)) return;
                          setLateGuidance(true);
                          if (!report.hasPostCloseChanges) {
                            setReasonRequired(true);
                            setNotice(
                              "La asistencia se está registrando después del cierre. Escribe el motivo antes de guardar."
                            );
                          }
                          requestAnimationFrame(() => lateGuidanceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
                        }}
                      />
                    </div>
                    <CommentForm initial={report.generalComment} />
                  </div>
                </WorkspaceSection>
                <div ref={subjectsRef}>
                  <WorkspaceSection
                    title="2. Registra las tareas"
                    description="En cada materia, indica si hubo tarea y su resultado si corresponde."
                  >
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-3">
                      {subjects.map((subject) => (
                        <TaskForm
                          key={subject.classSubjectId}
                          subject={subject}
                          existing={report.subjectTasks.find(
                            (item) => item.classSubjectId === subject.classSubjectId
                          )}
                        />
                      ))}
                    </div>
                    <VerseForm
                      key={`${report.id}-${report.version}`}
                      report={report}
                      termVerses={termVerses}
                      studentName={studentName}
                    />
                  </WorkspaceSection>
                </div>
              </form>
              <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
                <WorkspaceSection
                  title="3. Agrega solo si aplica"
                  description="Méritos y deméritos son opcionales; el reporte puede enviarse sin ellos."
                >
                  <div className="space-y-3">
                    <ActionPanel
                      icon={<Sparkles size={18} aria-hidden="true" />}
                      title="Méritos"
                      summary={`${report.merits.length} registrado${report.merits.length === 1 ? "" : "s"}`}
                      buttonLabel="Agregar mérito"
                      open={showMerit}
                      onToggle={() => setShowMerit((value) => !value)}
                      tone="positive"
                    >
                      <MeritForm
                        busy={busy}
                        save={(data) =>
                          mutate("merit", (meta) =>
                            gcrApi.merit(report.id, { ...data, version: meta.version })
                          )
                        }
                      />
                    </ActionPanel>
                    <ActionPanel
                      icon={<AlertTriangle size={18} aria-hidden="true" />}
                      title="Deméritos"
                      summary={`${report.demerits.length} registrado${report.demerits.length === 1 ? "" : "s"}`}
                      buttonLabel="Registrar demérito"
                      open={showDemerit}
                      onToggle={() => setShowDemerit((value) => !value)}
                      tone="warning"
                    >
                      <DemeritForm
                        existing={report.demerits.map((item) => item.ordinal)}
                        busy={busy}
                        save={(demerits) =>
                          mutate("demerits", (meta) =>
                            gcrApi.demerits(report.id, { demerits, version: meta.version })
                          )
                        }
                      />
                    </ActionPanel>
                  </div>
                </WorkspaceSection>
                {report.merits.length || report.demerits.length ? (
                  <WorkspaceSection
                    title="Eventos registrados"
                    description="Se actualiza después de cada respuesta de la API."
                  >
                    <EventList report={report} />
                  </WorkspaceSection>
                ) : null}
              </aside>
            </div>
          </div>
        </div>
        <footer className="shrink-0 border-t border-[var(--color-border)] bg-white/95 px-4 py-3 shadow-[0_-12px_30px_-24px_rgba(15,23,42,0.6)] backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-[1080px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]" aria-live="polite">
              <span
                className={`size-2 rounded-full ${busy ? "animate-pulse bg-blue-500" : baseDirty ? "bg-amber-500" : "bg-emerald-500"}`}
                aria-hidden="true"
              />
              {busy
                ? "Guardando cambios…"
                : baseDirty
                  ? reasonRequired && !postCloseReason.trim()
                    ? "Falta el motivo post-cierre; todavía no se ha guardado nada"
                    : "Hay cambios sin guardar"
                  : isSubmitted
                    ? "GCR enviado"
                    : missingFields.length
                      ? `Faltan ${missingFields.length} campo${missingFields.length === 1 ? "" : "s"}`
                      : "Cambios guardados. El reporte está listo para enviar"}
            </p>
            <div className="grid grid-cols-3 gap-2 sm:flex">
              <button type="button" className="secondary" onClick={close}>
                Cerrar
              </button>
              <button
                type="submit"
                form="gcr-base-form"
                className="secondary"
                disabled={Boolean(busy) || !baseDirty}
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                {busy === "draft"
                  ? "Guardando…"
                  : reasonRequired && !postCloseReason.trim()
                    ? "Completa el motivo"
                  : "Guardar cambios"}
              </button>
              <button
                type="button"
                className="primary"
                disabled={Boolean(busy) || isSubmitted || baseDirty}
                title={baseDirty ? "Guarda los cambios antes de enviar" : undefined}
                onClick={() => void submitReport()}
              >
                <Send size={16} aria-hidden="true" />
                {isSubmitted ? "GCR enviado" : busy === "submit" ? "Enviando…" : "Enviar GCR"}
              </button>
            </div>
          </div>
        </footer>
      </section>
    </div>
  );
}

const WorkspaceSection = ({
  title,
  description,
  children,
  ...props
}: {
  title: string;
  description: string;
  children: ReactNode;
} & React.HTMLAttributes<HTMLElement>) => (
  <section
    {...props}
    className={`overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.65)] sm:p-5 ${props.className ?? ""}`}
  >
    <div className="mb-5 border-b border-slate-100 pb-4">
      <h3 className="text-base font-bold tracking-[-0.01em] text-[var(--color-brand-900)]">
        {title}
      </h3>
      <p className="mt-1 text-pretty text-sm leading-5 text-[var(--color-text-secondary)]">
        {description}
      </p>
    </div>
    {children}
  </section>
);

function AttendanceForm({ report, issue, onStatusChange }: { report: GcrReport; issue: boolean; onStatusChange: () => void }) {
  const [status, setStatus] = useState<AttendanceValue | "">(
    (report.attendance?.status as AttendanceValue) ?? ""
  );
  const [comment, setComment] = useState(report.attendance?.comment ?? "");
  return (
    <section
      className={`h-full rounded-xl border p-4 shadow-[0_8px_22px_-20px_rgba(15,23,42,0.7)] ${issue ? "border-[var(--color-warning-border)] bg-gradient-to-br from-[var(--color-warning-bg)] to-white" : "border-[var(--color-border-soft)] bg-gradient-to-br from-[var(--color-surface-soft)] to-white"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-semibold text-slate-800">Asistencia</h4>
        {issue ? (
          <span className="text-xs font-semibold text-[var(--color-warning)]">Pendiente</span>
        ) : null}
      </div>
      <fieldset className="mt-3">
        <legend className="sr-only">Estado de asistencia</legend>
        <div className="grid grid-cols-2 gap-2">
          {attendanceOptions.map((option) => (
            <label
              key={option.value}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-xs font-semibold shadow-sm transition-[background-color,border-color,transform] focus-within:ring-2 focus-within:ring-[var(--color-brand-900)] ${status === option.value ? "border-[var(--color-brand-900)] bg-[var(--color-brand-100)] text-[var(--color-brand-900)]" : "border-[var(--color-border)] bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 motion-reduce:transform-none"}`}
            >
              <input
                className="sr-only"
                type="radio"
                name="attendanceStatus"
                value={option.value}
                checked={status === option.value}
                onChange={() => { setStatus(option.value); onStatusChange(); }}
              />
              {status === option.value ? (
                <Check size={14} className="mr-1" aria-hidden="true" />
              ) : null}
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="mt-3 block text-sm font-semibold text-slate-700">
        Nota opcional
        <input
          className="input"
          name="attendanceComment"
          autoComplete="off"
          maxLength={1000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Ej.: llegó a las 8:15 a. m.…"
        />
      </label>
    </section>
  );
}

function CommentForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  return (
    <section className="h-full rounded-xl border border-[var(--color-border-soft)] bg-gradient-to-br from-[var(--color-surface-soft)] to-white p-4 shadow-[0_8px_22px_-20px_rgba(15,23,42,0.7)]">
      <label className="block text-sm font-semibold text-slate-700">
        Comentario general
        <textarea
          className="mt-2 w-full rounded-xl border border-[var(--color-border)] bg-white p-3 text-sm shadow-inner shadow-slate-100 focus-visible:ring-2 focus-visible:ring-[var(--color-brand-900)]"
          name="generalComment"
          autoComplete="off"
          rows={4}
          maxLength={4000}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Resumen académico o conductual del día…"
        />
      </label>
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
        Opcional. Úsalo solo si aporta contexto al reporte.
      </p>
    </section>
  );
}

function TaskForm({
  subject,
  existing
}: {
  subject: GcrSubject;
  existing?: GcrReport["subjectTasks"][number];
}) {
  const [assigned, setAssigned] = useState<"yes" | "no" | "">(
    existing ? (existing.homeworkAssigned ? "yes" : "no") : ""
  );
  const [completion, setCompletion] = useState(existing?.completionStatus ?? "");
  const [comment, setComment] = useState(existing?.comment ?? "");
  const id = `task-${subject.classSubjectId}`;
  return (
    <article className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/70 p-4 shadow-[0_10px_24px_-22px_rgba(15,23,42,0.75)]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-[var(--color-brand-900)] ring-1 ring-inset ring-indigo-100" title={subject.name}>
            {subject.shortName}
          </span>
          <p className="mt-2 truncate text-sm font-semibold text-slate-800">{subject.name}</p>
        </div>
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-slate-700">¿Se asignó tarea?</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(
            [
              ["yes", "Sí hubo"],
              ["no", "No hubo"]
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition-[background-color,border-color,transform] focus-within:ring-2 focus-within:ring-[var(--color-brand-900)] ${assigned === value ? "border-[var(--color-brand-900)] bg-[var(--color-brand-100)] text-[var(--color-brand-900)]" : "border-slate-200 bg-white text-slate-600 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 motion-reduce:transform-none"}`}
            >
              <input
                type="radio"
                name={`${id}Assigned`}
                value={value}
                checked={assigned === value}
                onChange={() => {
                  setAssigned(value);
                  if (value === "no") setCompletion("");
                }}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      {assigned === "yes" ? (
        <label className="mt-3 block text-sm font-semibold text-slate-700">
          Resultado opcional
          <select
            className="input"
            name={`${id}Completion`}
            autoComplete="off"
            value={completion}
            onChange={(event) => setCompletion(event.target.value as typeof completion)}
          >
            <option value="">Selecciona un resultado</option>
            <option value="COMPLETED">Completada</option>
            <option value="NOT_COMPLETED">No completada</option>
          </select>
        </label>
      ) : null}
      <label className="mt-3 block text-sm font-semibold text-slate-700">
        Comentario opcional
        <input
          className="input"
          name={`${id}Comment`}
          autoComplete="off"
          maxLength={1000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Detalle breve de la tarea…"
        />
      </label>
    </article>
  );
}

function VerseForm({
  report,
  termVerses,
  studentName
}: {
  report: GcrReport;
  termVerses: GcrTermVerse[];
  studentName?: string;
}) {
  const gradedSlots = new Set(termVerses.map((item) => item.slot));
  const firstPendingSlot = [1, 2, 3].find((item) => !gradedSlots.has(item));
  const initialSlot = firstPendingSlot ?? termVerses[0]?.slot ?? 1;
  const initialVerse = termVerses.find((item) => item.slot === initialSlot);
  const [slot, setSlot] = useState(String(initialSlot));
  const [reference, setReference] = useState(initialVerse?.reference ?? "");
  const [text, setText] = useState(initialVerse?.text ?? "");
  const [score, setScore] = useState(String(initialVerse?.score ?? 100));
  const [expanded, setExpanded] = useState(Boolean(initialVerse?.text));
  const selectedVerse = termVerses.find((item) => item.slot === Number(slot));

  function selectSlot(nextSlot: number) {
    const nextVerse = termVerses.find((item) => item.slot === nextSlot);
    setSlot(String(nextSlot));
    setReference(nextVerse?.reference ?? "");
    setText(nextVerse?.text ?? "");
    setScore(String(nextVerse?.score ?? 100));
    setExpanded(Boolean(nextVerse?.text));
  }
  return (
    <details className="group mt-4 overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white shadow-[0_10px_24px_-22px_rgba(30,41,125,0.75)]">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold text-[var(--color-brand-900)] transition-colors hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-brand-900)]">
        <span className="inline-flex items-center gap-2">
          <BookOpen size={17} aria-hidden="true" />
          Religión & versículo (solo si aplica)
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${termVerses.length ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}
        >
          {termVerses.length} de 3 calificado{termVerses.length === 1 ? "" : "s"}
        </span>
      </summary>
      <div className="grid gap-3 border-t border-[var(--color-border-soft)] p-4 sm:grid-cols-2">
        <div className="flex flex-wrap gap-2 sm:col-span-2" aria-label="Estado de los versículos del trimestre">
          {[1, 2, 3].map((item) => {
            const graded = gradedSlots.has(item);
            const selected = Number(slot) === item;
            return (
              <button
                type="button"
                key={item}
                onClick={() => selectSlot(item)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${graded ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-500"} ${selected ? "ring-2 ring-indigo-200" : ""}`}
              >
                {graded ? <CheckCircle2 size={14} aria-hidden="true" /> : null}
                Versículo {item} · {graded ? "Calificado" : "Pendiente"}
              </button>
            );
          })}
        </div>
        <label className="text-sm font-semibold text-slate-700">
          Número de versículo
          <select
            className="input"
            name="verseSlot"
            value={slot}
            onChange={(event) => {
              event.stopPropagation();
              selectSlot(Number(event.target.value));
            }}
          >
            {[1, 2, 3].map((item) => (
              <option key={item} value={item}>
                Versículo {item}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs font-normal text-slate-500">
            {selectedVerse
              ? `Este versículo ya está calificado para ${studentName ?? "este estudiante"}. Puedes corregir su referencia o nota sin afectar los demás.`
              : `Ingresa los datos del versículo ${slot}. Al guardar quedará calificado y el formulario avanzará al siguiente pendiente.`}
          </span>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Nota
          <input
            className="input"
            type="number"
            name="verseScore"
            autoComplete="off"
            min={0}
            max={100}
            value={score}
            onChange={(event) => setScore(event.target.value)}
            disabled={!slot}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
          Referencia
          <input
            className="input"
            name="verseReference"
            autoComplete="off"
            maxLength={500}
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            placeholder="Ej.: Juan 3:16…"
            disabled={!slot}
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="text-xs font-semibold text-[var(--color-accent-700)]"
            disabled={!slot}
          >
            {expanded ? "Ocultar texto completo" : "Agregar texto completo (opcional)"}
          </button>
          {expanded ? (
            <label className="mt-2 block text-sm font-semibold text-slate-700">
              Texto
              <textarea
                className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-white p-3 text-sm"
                name="verseText"
                autoComplete="off"
                rows={3}
                maxLength={4000}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Texto del versículo…"
              />
            </label>
          ) : (
            <input type="hidden" name="verseText" value={text} />
          )}
        </div>
      </div>
    </details>
  );
}

function ActionPanel({
  icon,
  title,
  summary,
  buttonLabel,
  open,
  onToggle,
  tone,
  children
}: {
  icon: ReactNode;
  title: string;
  summary: string;
  buttonLabel: string;
  open: boolean;
  onToggle: () => void;
  tone: "positive" | "warning";
  children: ReactNode;
}) {
  const styles =
    tone === "positive"
      ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)] text-[var(--color-success)]"
      : "border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] text-[var(--color-warning)]";
  return (
    <div className={`rounded-xl border p-3.5 shadow-[0_10px_24px_-22px_currentColor] ${styles}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            {icon}
            {title}
          </p>
          <p className="mt-1 text-xs opacity-80">{summary}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="secondary shrink-0 !bg-white !px-3 !py-2 text-xs"
        >
          {!open ? <Plus size={15} aria-hidden="true" /> : null}
          {open ? "Cancelar" : buttonLabel}
        </button>
      </div>
      {open ? <div className="mt-3 border-t border-current/15 pt-3">{children}</div> : null}
    </div>
  );
}

function MeritForm({ busy, save }: { busy: string; save: (data: object) => Promise<boolean> }) {
  const [comment, setComment] = useState("");
  const [benefit, setBenefit] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (await save({ comment: comment.trim(), benefit: benefit.trim() || undefined })) {
          setComment("");
          setBenefit("");
        }
      }}
    >
      <label className="block text-sm font-semibold text-slate-700">
        Comentario
        <input
          className="input"
          name="meritComment"
          autoComplete="off"
          required
          maxLength={1000}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Describe el mérito…"
        />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Beneficio opcional
        <input
          className="input"
          name="meritBenefit"
          autoComplete="off"
          maxLength={1000}
          value={benefit}
          onChange={(event) => setBenefit(event.target.value)}
          placeholder="Ej.: reconocimiento en clase…"
        />
      </label>
      <SaveButton busy={busy} id="merit">
        Registrar mérito
      </SaveButton>
    </form>
  );
}

function DemeritForm({
  existing,
  busy,
  save
}: {
  existing: number[];
  busy: string;
  save: (items: Array<{ ordinal: number; comment: string }>) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<number[]>([]);
  const [comments, setComments] = useState<Record<number, string>>({});
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const items = selected.map((ordinal) => ({
          ordinal,
          comment: comments[ordinal]?.trim() ?? ""
        }));
        if (await save(items)) {
          setSelected([]);
          setComments({});
        }
      }}
    >
      <div className="space-y-2">
        {[1, 2, 3].map((ordinal) => {
          const disabled = existing.includes(ordinal);
          const checked = selected.includes(ordinal);
          return (
            <div
              key={ordinal}
              className={`rounded-lg border p-3 ${disabled ? "border-slate-200 bg-slate-100 text-slate-400" : checked ? "border-[var(--color-warning-border)] bg-white" : "border-current/15 bg-white/50"}`}
            >
              <label className="flex cursor-pointer items-center justify-between gap-3 font-semibold">
                <span>Ordinal {ordinal}</span>
                <input
                  type="checkbox"
                  name={`demerit${ordinal}`}
                  disabled={disabled}
                  checked={checked}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, ordinal]
                        : current.filter((item) => item !== ordinal)
                    )
                  }
                />
              </label>
              {disabled ? <p className="mt-1 text-xs">Ya registrado</p> : null}
              {checked ? (
                <label className="mt-3 block text-sm font-semibold text-slate-700">
                  Motivo
                  <textarea
                    required
                    name={`demerit${ordinal}Comment`}
                    autoComplete="off"
                    rows={2}
                    maxLength={1000}
                    value={comments[ordinal] ?? ""}
                    onChange={(event) =>
                      setComments((current) => ({ ...current, [ordinal]: event.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-white p-2 text-sm"
                    placeholder="Motivo del demérito…"
                  />
                </label>
              ) : null}
              {ordinal === 3 && checked ? (
                <p className="mt-2 text-xs font-semibold text-[var(--color-danger)]">
                  Generará una detención provisional.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3">
        <SaveButton busy={busy} id="demerits">
          Registrar deméritos
        </SaveButton>
      </div>
    </form>
  );
}

function SaveButton({ busy, id, children }: { busy: string; id: string; children: ReactNode }) {
  return (
    <button className="secondary" type="submit" disabled={Boolean(busy)}>
      <CheckCircle2 size={15} aria-hidden="true" />
      {busy === id ? "Guardando…" : children}
    </button>
  );
}

function EventList({ report }: { report: GcrReport }) {
  return (
    <ul className="space-y-2 text-sm">
      {report.merits.map((item) => (
        <li
          key={item.id}
          className="rounded-lg bg-[var(--color-success-bg)] p-2 text-[var(--color-success)]"
        >
          <strong>Mérito:</strong> {item.comment}
        </li>
      ))}
      {report.demerits.map((item) => (
        <li
          key={item.id}
          className="rounded-lg bg-[var(--color-warning-bg)] p-2 text-[var(--color-warning)]"
        >
          <strong>Ordinal {item.ordinal}:</strong> {item.comment}
          {item.detentionRequired ? " · Detención provisional" : ""}
        </li>
      ))}
    </ul>
  );
}
