"use client";

import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, RotateCcw, UsersRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { gcrApi } from "@/features/teacher/gcr/gcr-api";
import type { GcrAttendanceSession, GcrAttendanceStatus } from "@/features/teacher/gcr/gcr-types";

type ClassOption = { id: string; name: string; code: string; grade?: { name: string } | null };
type PreviousMark = { index: number; status: GcrAttendanceStatus };

const statuses: Array<{ value: GcrAttendanceStatus; label: string; shortLabel: string; className: string }> = [
  { value: "PRESENT", label: "Asistió", shortLabel: "Presente", className: "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100" },
  { value: "ABSENT", label: "No asistió", shortLabel: "Ausente", className: "border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100" },
  { value: "LATE", label: "Tardanza", shortLabel: "Tarde", className: "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100" },
  { value: "HALF_DAY", label: "Media jornada", shortLabel: "Media jornada", className: "border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100" }
];

function panamaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function weekday(date: string) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return day !== 0 && day !== 6;
}

function attendanceSaveError(error: unknown) {
  if (error instanceof ApiError && /postCloseReason.*attendance after 10:00/i.test(error.message)) {
    return "La asistencia rápida ya cerró porque son más de las 10:00 a. m. (hora de Panamá). Para modificar la asistencia desde el GCR, escribe el motivo del cambio y vuelve a intentarlo.";
  }
  return error instanceof Error ? error.message : "No se pudo guardar la asistencia.";
}

export function TeacherAttendancePage() {
  const today = panamaToday();
  const [date, setDate] = useState(today);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [session, setSession] = useState<GcrAttendanceSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [postCloseReason, setPostCloseReason] = useState("");
  const [previousMark, setPreviousMark] = useState<PreviousMark | null>(null);
  const pointerStart = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSession(null);
    setMessage("");
    gcrApi.classes(date)
      .then((items) => {
        if (!active) return;
        setClasses(items);
        setClassId((current) => (items.some((item) => item.id === current) ? current : (items[0]?.id ?? "")));
      })
      .catch((error) => active && setMessage(error instanceof Error ? error.message : "No se pudieron cargar los cursos."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [date]);

  const loadSession = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setMessage("");
    try {
      const next = await gcrApi.attendanceSession(classId, date);
      setSession(next);
      setCurrentIndex((current) => Math.min(current, Math.max(next.students.length - 1, 0)));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar la asistencia del GCR.");
    } finally {
      setLoading(false);
    }
  }, [classId, date]);

  useEffect(() => { void loadSession(); }, [loadSession]);

  const current = session?.students[currentIndex] ?? null;
  const markedCount = useMemo(() => session?.students.filter((student) => student.report?.attendance).length ?? 0, [session]);
  const counts = useMemo(() => {
    const next = new Map<GcrAttendanceStatus, number>();
    session?.students.forEach((student) => {
      const status = student.report?.attendance?.status;
      if (status) next.set(status, (next.get(status) ?? 0) + 1);
    });
    return next;
  }, [session]);

  const mark = useCallback(async (status: GcrAttendanceStatus) => {
    if (!session || !current || saving || !weekday(date)) return;
    setSaving(true);
    setMessage("");
    const oldStatus = current.report?.attendance?.status;
    try {
      const report = current.report ?? await gcrApi.open(current.id, date, session.class.id);
      const saved = await gcrApi.attendance(report.id, {
        status,
        version: report.version,
        ...(postCloseReason.trim() ? { postCloseReason: postCloseReason.trim() } : {})
      });
      setSession((existing) => existing ? {
        ...existing,
        students: existing.students.map((student, index) => index === currentIndex ? {
          ...student,
          report: { id: report.id, version: saved.reportVersion, attendance: { status, comment: null } }
        } : student)
      } : existing);
      setPreviousMark(oldStatus ? { index: currentIndex, status: oldStatus } : null);
      setCurrentIndex((index) => Math.min(index + 1, session.students.length - 1));
    } catch (error) {
      setMessage(attendanceSaveError(error));
    } finally {
      setSaving(false);
    }
  }, [current, currentIndex, date, postCloseReason, saving, session]);

  async function undo() {
    if (!previousMark) return;
    setCurrentIndex(previousMark.index);
    await mark(previousMark.status);
    setPreviousMark(null);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerStart.current == null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) < 70) return;
    void mark(distance > 0 ? "PRESENT" : "ABSENT");
  }

  return (
    <main id="main-content" className="min-h-full overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand-100)] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-brand-900)]"><UsersRound size={14} /> Asistencia rápida</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--color-brand-950)]">Toma asistencia sin salir del GCR</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Cada marca se guarda en el Goal Check Report del curso y día seleccionados.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">Fecha<input className="input" type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} /></label>
            <label className="text-sm font-semibold text-slate-700">Curso<select className="input" value={classId} onChange={(event) => setClassId(event.target.value)} disabled={!classes.length}>{classes.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label>
          </div>
        </div>
      </section>

      {message ? <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{message}</div> : null}
      {!weekday(date) ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">El GCR solo permite asistencia de lunes a viernes. Elige un día lectivo.</div> : null}

      {loading ? <div className="mt-5 rounded-[var(--radius-card)] border bg-white p-10 text-center text-sm text-slate-500">Cargando alumnos del GCR…</div> : null}
      {!loading && session && !session.students.length ? <div className="mt-5 rounded-[var(--radius-card)] border bg-white p-10 text-center text-sm text-slate-500">No hay alumnos activos en este curso para la fecha seleccionada.</div> : null}

      {!loading && current && session ? <section className="mx-auto mt-5 max-w-5xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="font-semibold text-[var(--color-brand-950)]">{session.class.code} · {session.class.name}</p>
          <p className="text-[var(--color-text-secondary)]"><strong className="text-[var(--color-brand-950)]">{markedCount}</strong> de {session.students.length} registrados</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)] sm:p-8">
            <div className="flex items-center justify-between"><Button variant="ghost" aria-label="Alumno anterior" disabled={currentIndex === 0 || saving} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}><ChevronLeft size={20} /></Button><span className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Alumno {currentIndex + 1} de {session.students.length}</span><Button variant="ghost" aria-label="Alumno siguiente" disabled={currentIndex === session.students.length - 1 || saving} onClick={() => setCurrentIndex((index) => Math.min(session.students.length - 1, index + 1))}><ChevronRight size={20} /></Button></div>
            <div className="mt-5 select-none text-center" onPointerDown={(event) => { pointerStart.current = event.clientX; }} onPointerUp={handlePointerUp}>
              <div className="mx-auto grid size-44 place-items-center rounded-full bg-[linear-gradient(145deg,var(--color-brand-100),#dbeafe)] text-5xl font-bold text-[var(--color-brand-900)] ring-8 ring-white shadow-[0_16px_35px_-15px_rgba(25,25,112,.35)] sm:size-52">{initials(current.displayName)}</div>
              <h3 className="mt-6 text-2xl font-semibold text-[var(--color-brand-950)] sm:text-3xl">{current.displayName}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{current.studentCode ?? "Sin código"}{current.grade ? ` · ${current.grade.name}` : ""}</p>
              {current.report?.attendance ? <p className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Estado actual: {statuses.find((item) => item.value === current.report?.attendance?.status)?.shortLabel}</p> : <p className="mt-4 text-sm font-medium text-[var(--color-text-muted)]">Desliza para marcar o usa los botones.</p>}
            </div>
            <div className="mt-7 grid grid-cols-2 gap-3">
              {statuses.map((item) => <button key={item.value} disabled={saving || !weekday(date)} onClick={() => void mark(item.value)} className={`min-h-14 rounded-xl border px-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${item.className}`}>{item.value === "PRESENT" ? <Check className="mx-auto mb-1" size={19} /> : item.value === "ABSENT" ? <X className="mx-auto mb-1" size={19} /> : <Clock3 className="mx-auto mb-1" size={19} />}{item.label}</button>)}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><label className="text-xs text-[var(--color-text-secondary)]">Motivo si se modifica después del cierre<input className="input mt-1 h-9 text-xs" value={postCloseReason} maxLength={500} onChange={(event) => setPostCloseReason(event.target.value)} placeholder="Solo si GCR lo solicita" /></label>{previousMark ? <Button variant="secondary" size="sm" onClick={() => void undo()} disabled={saving} leadingIcon={<RotateCcw size={15} />}>Deshacer</Button> : null}</div>
          </div>
          <aside className="rounded-[var(--radius-panel)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]"><h3 className="font-semibold text-[var(--color-brand-950)]">Resumen del día</h3><div className="mt-4 space-y-2">{statuses.map((item) => <div key={item.value} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>{item.shortLabel}</span><strong>{counts.get(item.value) ?? 0}</strong></div>)}</div><div className="mt-5 max-h-64 space-y-1 overflow-y-auto border-t pt-3">{session.students.map((student, index) => <button key={student.id} onClick={() => setCurrentIndex(index)} className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs ${index === currentIndex ? "bg-[var(--color-brand-100)] font-bold text-[var(--color-brand-950)]" : "hover:bg-slate-50"}`}><span className="truncate">{student.displayName}</span><span>{student.report?.attendance ? statuses.find((item) => item.value === student.report?.attendance?.status)?.shortLabel : "Pendiente"}</span></button>)}</div></aside>
        </div>
      </section> : null}
    </main>
  );
}
