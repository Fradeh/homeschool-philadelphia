"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import type {
  ScheduleTemplate,
  ScheduleTemplateBlock,
  StudentPhysicalBooking,
  TeacherAvailabilitySlot
} from "@homeschool/shared";
import { scheduleApi } from "@/features/schedules/schedule-api";
import { WeeklyScheduleTable } from "@/features/schedules/WeeklyScheduleTable";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";

export function StudentSchedulePage() {
  const [template, setTemplate] = useState<ScheduleTemplate | null>(null);
  const [selected, setSelected] = useState<ScheduleTemplateBlock | null>(null);
  const [slots, setSlots] = useState<TeacherAvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<StudentPhysicalBooking[]>([]);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    Promise.all([scheduleApi.student.schedule(), scheduleApi.student.bookings()])
      .then(([item, currentBookings]) => {
        setTemplate(item);
        setBookings(currentBookings);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  async function openBooking(block: ScheduleTemplateBlock) {
    if (!block.classSubjectId) return;
    setSelected(block);
    setSlots([]);
    try {
      setSlots(await scheduleApi.student.availability(block.classSubjectId));
    } catch {
      setMessage("No fue posible consultar la disponibilidad del profesor.");
    }
  }

  async function book(slot: TeacherAvailabilitySlot, date: string, note: string) {
    const created = await scheduleApi.student.book(slot.classSubjectId, {
      availabilitySlotId: slot.id,
      scheduledDate: date,
      studentNote: note || undefined
    });
    setBookings((current) => [created, ...current]);
    setSelected(null);
    setMessage("Solicitud enviada. Puedes seguir usando tu horario normalmente.");
  }

  if (state === "loading") return <ScheduleSkeleton />;
  if (state === "error" || !template)
    return (
      <div className="p-5 lg:p-8">
        <ErrorState
          title="No hay un horario disponible"
          description="No pudimos cargar un horario publicado para tu grado. Inténtalo nuevamente o consulta con la institución."
          action={
            <button className="secondary" onClick={() => window.location.reload()}>
              Intentar de nuevo
            </button>
          }
        />
      </div>
    );
  return (
    <div className="space-y-5 p-4 sm:p-5 lg:p-8">
      <header className="rounded-[var(--radius-card)] bg-[linear-gradient(120deg,var(--color-brand-900),var(--color-brand-700))] p-6 text-white shadow-[var(--shadow-card)] sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">
          {template.targetClass?.name ?? template.gradeLevel?.name ?? "Mi clase"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-balance sm:text-3xl">{template.name}</h1>
        <p className="mt-2 text-sm text-white/70">
          Tu horario académico. Pulsa una materia para consultar los días presenciales habilitados
          por su profesor.
        </p>
      </header>
      {message ? (
        <InlineAlert tone="info" title="Actualización">
          {message}
        </InlineAlert>
      ) : null}
      <WeeklyScheduleTable template={template} onSubjectClick={openBooking} />
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <header className="border-b border-[var(--color-border)] p-5">
          <h2 className="font-semibold text-[var(--color-text)]">Mis solicitudes presenciales</h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Consulta si el profesor confirmó tu asistencia.
          </p>
        </header>
        <div className="divide-y divide-[var(--color-border)]">
          {bookings.map((booking) => {
            const status = bookingStatus(booking);
            return (
              <article
                key={booking.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold uppercase text-[var(--color-info)]">
                    {booking.className} · {booking.subjectName}
                  </p>
                  <p className="mt-1 font-semibold text-[var(--color-text)]">
                    {new Intl.DateTimeFormat("es-CO", {
                      dateStyle: "long",
                      timeZone: "UTC"
                    }).format(new Date(booking.scheduledDate))}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {booking.startTime}–{booking.endTime} · {booking.teacherName}
                  </p>
                  {booking.teacherResponse ? (
                    <p className="mt-3 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-sm text-[var(--color-text-secondary)]">
                      {booking.isChangeProposal ? "Nueva fecha propuesta: " : "Respuesta del profesor: "}
                      {booking.teacherResponse}
                    </p>
                  ) : null}
                </div>
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              </article>
            );
          })}
          {!bookings.length ? (
            <EmptyState
              className="m-5"
              icon={<CalendarDays size={22} />}
              title="No tienes solicitudes"
              description="Pulsa una materia del horario para consultar la disponibilidad del profesor."
            />
          ) : null}
        </div>
      </section>
      {selected ? (
        <ScheduleBookingDialog
          block={selected}
          slots={slots}
          onClose={() => setSelected(null)}
          onBook={book}
        />
      ) : null}
    </div>
  );
}

function ScheduleBookingDialog({
  block,
  slots,
  onClose,
  onBook
}: {
  block: ScheduleTemplateBlock;
  slots: TeacherAvailabilitySlot[];
  onClose: () => void;
  onBook: (slot: TeacherAvailabilitySlot, date: string, note: string) => Promise<void>;
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selection, setSelection] = useState<{
    slot: TeacherAvailabilitySlot;
    date: string;
  } | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const month = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + monthOffset, 1);
  }, [monthOffset]);
  const days = useMemo(() => calendarDays(month, slots), [month, slots]);
  useEffect(() => {
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function submit() {
    if (!selection) return;
    setSubmitting(true);
    try {
      await onBook(selection.slot, selection.date, note);
    } catch {
      setError("No se pudo enviar la solicitud. Revisa si ya solicitaste ese horario.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overscroll-contain bg-slate-950/50 p-3 sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-2xl"
      >
        <header className="flex items-start justify-between border-b p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[var(--color-info)]">
              {block.subjectName}
            </p>
            <h2 id="booking-title" className="mt-1 text-xl font-semibold text-[var(--color-text)]">
              Solicitar asistencia presencial
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Elige únicamente una fecha habilitada por {block.teacherName}.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="grid min-h-11 min-w-11 place-items-center rounded-md hover:bg-[var(--color-surface-soft)]"
            aria-label="Cerrar solicitud"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <button
              disabled={monthOffset === 0}
              onClick={() => setMonthOffset(0)}
              className="rounded-md border p-2 disabled:opacity-30"
            >
              <ChevronLeft size={18} />
            </button>
            <h4 className="font-semibold capitalize text-[#191970]">
              {new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" }).format(month)}
            </h4>
            <button
              disabled={monthOffset === 1}
              onClick={() => setMonthOffset(1)}
              className="rounded-md border p-2 disabled:opacity-30"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400">
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {days.map((day, index) =>
              day ? (
                <button
                  key={day.date}
                  disabled={!day.slot}
                  onClick={() => day.slot && setSelection({ slot: day.slot, date: day.date })}
                  className={`min-h-16 rounded-lg border p-2 text-sm ${selection?.date === day.date ? "border-[#191970] bg-[#191970] text-white" : day.slot ? "border-sky-200 bg-sky-50 font-semibold text-[#191970] hover:bg-sky-100" : "bg-slate-50 text-slate-300"}`}
                >
                  <span>{day.day}</span>
                  {day.slot ? (
                    <small className="mt-1 block text-[9px]">{day.slot.startTime}</small>
                  ) : null}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              )
            )}
          </div>
          {!slots.length ? (
            <InlineAlert className="mt-5" tone="warning" title="Sin disponibilidad">
              Este profesor aún no ha publicado fechas disponibles para esta materia.
            </InlineAlert>
          ) : null}
          {selection ? (
            <div className="mt-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-4">
              <p className="flex items-center gap-2 font-semibold text-[var(--color-text)]">
                <CalendarDays size={17} aria-hidden="true" />
                {new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "UTC" }).format(
                  new Date(selection.date)
                )}{" "}
                · {selection.slot.startTime}–{selection.slot.endTime}
              </p>
              {selection.slot.location ? (
                <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <MapPin size={15} aria-hidden="true" />
                  {selection.slot.location}
                </p>
              ) : null}
              <label
                className="mt-4 grid gap-2 text-sm font-semibold text-[var(--color-text)]"
                htmlFor="booking-note"
              >
                Motivo de la visita
                <textarea
                  id="booking-note"
                  name="bookingNote"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Ej. Necesito revisar el PACE 4…"
                  className="w-full rounded-md border border-[var(--color-border)] bg-white p-3 text-base font-normal sm:text-sm"
                />
              </label>
            </div>
          ) : null}
          {error ? (
            <InlineAlert className="mt-3" tone="danger" title="No se envió la solicitud">
              {error}
            </InlineAlert>
          ) : null}
          <footer className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              disabled={!selection}
              onClick={submit}
              loading={submitting}
              loadingLabel="Enviando…"
            >
              Enviar solicitud
            </Button>
          </footer>
        </div>
      </section>
    </div>
  );
}

function bookingStatus(booking: StudentPhysicalBooking): { label: string; tone: StatusBadgeTone } {
  if (booking.isChangeProposal) return { label: "Cambio propuesto", tone: "info" };
  if (booking.status === "APPROVED") return { label: "Confirmada", tone: "success" };
  if (booking.status === "REJECTED") return { label: "Rechazada", tone: "danger" };
  if (booking.status === "CANCELLED") return { label: "Cancelada", tone: "neutral" };
  return { label: "Pendiente", tone: "warning" };
}
function ScheduleSkeleton() {
  return (
    <SkeletonGroup label="Cargando horario">
      <div className="space-y-5 p-5 lg:p-8">
        <Skeleton className="h-36" rounded="lg" />
        <Skeleton className="h-96" rounded="lg" />
        <Skeleton className="h-52" rounded="lg" />
      </div>
    </SkeletonGroup>
  );
}

function calendarDays(month: Date, slots: TeacherAvailabilitySlot[]) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const result: Array<{ day: number; date: string; slot?: TeacherAvailabilitySlot } | null> = Array(
    (first.getDay() + 6) % 7
  ).fill(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekdays = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  for (let day = 1; day <= last.getDate(); day++) {
    const date = new Date(month.getFullYear(), month.getMonth(), day);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const slot =
      date >= today ? slots.find((item) => item.weekday === weekdays[date.getDay()]) : undefined;
    result.push({ day, date: iso, slot });
  }
  return result;
}
