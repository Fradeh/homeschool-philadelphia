"use client";

import { CalendarDays, ClipboardCheck, RefreshCw, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api-client";
import { GcrEditorDialog } from "./GcrEditorDialog";
import { GcrWeekBoard } from "./GcrWeekBoard";
import { gcrApi } from "./gcr-api";
import type { GcrReport, GcrStudent, GcrWeek } from "./gcr-types";

function panamaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Panama",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function GcrTeacherPage() {
  const router = useRouter();
  const params = useSearchParams();
  const today = panamaToday();
  const requestedDate = params.get("date") ?? today;
  const date = requestedDate > today ? today : requestedDate;
  const studentId = params.get("studentId") ?? "";
  const [students, setStudents] = useState<GcrStudent[]>([]);
  const [week, setWeek] = useState<GcrWeek | null>(null);
  const [editing, setEditing] = useState<GcrReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyDate, setBusyDate] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [conflict, setConflict] = useState(false);
  const weekRequestRef = useRef(0);

  const setFilters = useCallback(
    (next: { date?: string; studentId?: string }) => {
      const query = new URLSearchParams(params.toString());
      Object.entries(next).forEach(([key, value]) =>
        value ? query.set(key, value) : query.delete(key)
      );
      router.replace(`/teacher/gcr?${query.toString()}`, { scroll: false });
    },
    [params, router]
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage("");
    setWeek(null);
    setStudents([]);
    gcrApi
      .students(date)
      .then((items) => {
        if (active) setStudents(items);
      })
      .catch((error) => {
        if (active)
          setMessage(error instanceof Error ? error.message : "No se pudieron cargar los estudiantes.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date]);

  const loadWeek = useCallback(async () => {
    const requestId = ++weekRequestRef.current;
    if (!studentId) {
      setWeek(null);
      setEditing(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const next = await gcrApi.week(studentId, date);
      if (requestId !== weekRequestRef.current || next.student.id !== studentId) return;
      setWeek(next);
      setConflict(false);
      setEditing((current) =>
        current ? (next.days.find((day) => day.date === current.reportDate)?.report ?? null) : null
      );
    } catch (error) {
      if (requestId === weekRequestRef.current)
        setMessage(error instanceof Error ? error.message : "No se pudo cargar la semana.");
    } finally {
      if (requestId === weekRequestRef.current) setLoading(false);
    }
  }, [date, studentId]);

  useEffect(() => {
    void loadWeek();
  }, [loadWeek]);

  async function editDay(day: GcrWeek["days"][number]) {
    if (day.state === "NOT_EXPECTED") return;
    if (day.report) {
      setEditing(day.report);
      return;
    }
    setBusyDate(day.date);
    setMessage("");
    try {
      await gcrApi.open(studentId, day.date);
      const nextWeek = await gcrApi.week(studentId, date);
      setWeek(nextWeek);
      setEditing(nextWeek.days.find((item) => item.date === day.date)?.report ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo abrir el borrador.");
    } finally {
      setBusyDate(null);
    }
  }

  function handleEditorError(error: unknown) {
    if (error instanceof ApiError && error.status === 409) {
      setConflict(true);
      setMessage("Otra pestaña modificó este GCR. Refresca la semana antes de continuar.");
      return;
    }
    setMessage(error instanceof Error ? error.message : "No se pudo guardar el cambio.");
  }

  return (
    <main id="main-content" className="min-h-full overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(23rem,0.85fr)]">
          <div className="relative overflow-hidden bg-[linear-gradient(125deg,var(--color-brand-950),var(--color-brand-700))] px-5 py-6 text-white sm:px-7 sm:py-7">
            <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -bottom-24 right-20 size-52 rounded-full bg-white/5" />
            <div className="relative max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-blue-100 ring-1 ring-inset ring-white/15">
                <ClipboardCheck size={14} aria-hidden="true" /> Seguimiento diario
              </span>
              <h2 className="mt-4 text-pretty text-2xl font-semibold tracking-tight sm:text-3xl">
                Goal Check Report
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-blue-100 sm:text-[15px]">
                Registra el progreso del día de forma ordenada, estudiante por estudiante.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-white/90">
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-inset ring-white/10">
                  1. Elige la fecha
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-inset ring-white/10">
                  2. Selecciona al estudiante
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center bg-white px-5 py-6 sm:px-7 sm:py-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[var(--color-brand-100)] text-[var(--color-brand-900)]">
                <UserRound size={19} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-bold text-[var(--color-brand-950)]">Comienza un GCR</p>
                <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-secondary)]">
                  La semana aparecerá al elegir al estudiante.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Fecha
                <span className="mt-1.5 flex items-center gap-2 text-xs font-normal text-[var(--color-text-muted)]">
                  <CalendarDays size={14} aria-hidden="true" /> Día del registro
                </span>
                <input
                  className="input mt-2"
                  type="date"
                  name="gcrDate"
                  autoComplete="off"
                  max={today}
                  value={date}
                  onChange={(event) => setFilters({ date: event.target.value })}
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Estudiante
                <span className="mt-1.5 block text-xs font-normal text-[var(--color-text-muted)]">
                  Selecciona para continuar
                </span>
                <select
                  className="input mt-2 w-full"
                  name="gcrStudent"
                  autoComplete="off"
                  value={studentId}
                  onChange={(event) => {
                    setWeek(null);
                    setEditing(null);
                    setFilters({ studentId: event.target.value });
                  }}
                >
                  <option value="">Selecciona un estudiante</option>
                  {students.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.displayName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>
      </section>

      <div aria-live="polite" className="mt-4">
        {message ? (
          <div
            className={`flex items-start justify-between gap-3 rounded-lg border p-4 text-sm ${conflict ? "border-amber-300 bg-amber-50 text-amber-900" : "border-rose-200 bg-rose-50 text-rose-800"}`}
          >
            <span>{message}</span>
            {conflict ? (
              <button className="secondary shrink-0" onClick={() => void loadWeek()}>
                <RefreshCw size={16} aria-hidden="true" />
                Refrescar
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-6 rounded-xl border bg-white p-10 text-center text-sm text-slate-500">
          Cargando datos reales…
        </div>
      ) : null}
      {!loading && !studentId ? (
        <section className="relative mt-5 overflow-hidden rounded-[var(--radius-card)] border border-dashed border-indigo-200 bg-[linear-gradient(135deg,white,rgba(238,240,255,0.75))] px-5 py-10 text-center sm:px-8 sm:py-12">
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />
          <div className="relative mx-auto max-w-lg">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-[var(--color-brand-900)] shadow-[0_12px_30px_-18px_rgba(25,25,112,0.45)] ring-1 ring-inset ring-indigo-100">
              <UserRound size={24} aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-semibold text-[var(--color-brand-950)]">
              Listo para comenzar
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Selecciona un estudiante arriba para consultar su semana y registrar únicamente lo que corresponda.
            </p>
            <div className="mt-5 grid gap-2 text-left sm:grid-cols-2">
              <p className="rounded-xl border border-white bg-white/80 px-3 py-2.5 text-xs font-semibold text-[var(--color-brand-900)] shadow-sm">
                01 · No se crean reportes todavía
              </p>
              <p className="rounded-xl border border-white bg-white/80 px-3 py-2.5 text-xs font-semibold text-[var(--color-brand-900)] shadow-sm">
                02 · Elige el día que deseas registrar
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {week ? (
        <GcrWeekBoard
          week={week}
          today={today}
          selectedDate={date}
          loading={loading}
          busyDate={busyDate}
          onEdit={(day) => void editDay(day)}
          onRefresh={() => void loadWeek()}
        />
      ) : null}

      {editing && week ? (
        <GcrEditorDialog
          key={`${week.student.id}-${editing.id}`}
          report={editing}
          subjects={week.subjects}
          termVerses={week.termVerses}
          studentName={week.student.displayName}
          className={`${week.class.code} · ${week.class.name}`}
          onClose={() => setEditing(null)}
          onSaved={loadWeek}
          onError={handleEditorError}
        />
      ) : null}
    </main>
  );
}
