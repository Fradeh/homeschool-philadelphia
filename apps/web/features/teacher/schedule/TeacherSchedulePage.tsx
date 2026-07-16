"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarCheck, Clock3, MapPin, Pencil, Plus, Power, X } from "lucide-react";
import {
  PhysicalBookingStatus,
  Weekday,
  type AcademicClassOption,
  type ScheduleTemplate,
  type StudentPhysicalBooking,
  type TeacherAvailabilitySlot
} from "@homeschool/shared";
import { scheduleApi } from "@/features/schedules/schedule-api";
import { WeeklyScheduleTable } from "@/features/schedules/WeeklyScheduleTable";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";

const dayNames: Record<Weekday, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes"
};

export function TeacherSchedulePage() {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [classes, setClasses] = useState<AcademicClassOption[]>([]);
  const [slots, setSlots] = useState<TeacherAvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<StudentPhysicalBooking[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TeacherAvailabilitySlot | null>(null);
  const [rescheduling, setRescheduling] = useState<StudentPhysicalBooking | null>(null);
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  async function load() {
    try {
      const [t, c, s, b] = await Promise.all([
        scheduleApi.teacher.schedule(),
        scheduleApi.teacher.classes(),
        scheduleApi.teacher.availability(),
        scheduleApi.teacher.bookings()
      ]);
      setTemplates(t);
      setClasses(c);
      setSlots(s);
      setBookings(b);
      setState("ready");
    } catch {
      setState("error");
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function toggle(slot: TeacherAvailabilitySlot) {
    try {
      const updated = await scheduleApi.teacher.updateAvailability(slot.id, {
        isActive: !slot.isActive
      });
      setSlots((current) => current.map((x) => (x.id === slot.id ? updated : x)));
      setMessage("");
    } catch {
      setMessage("No pudimos cambiar el estado de esta disponibilidad.");
    }
  }
  async function respond(booking: StudentPhysicalBooking, status: PhysicalBookingStatus) {
    try {
      const updated = await scheduleApi.teacher.updateBooking(booking.id, { status });
      setBookings((current) => current.map((x) => (x.id === updated.id ? updated : x)));
      setMessage("");
    } catch {
      setMessage("No pudimos actualizar esta solicitud.");
    }
  }
  if (state === "loading") return <ScheduleSkeleton />;
  if (state === "error")
    return (
      <div className="p-5 lg:p-8">
        <ErrorState
          description="No pudimos cargar tu horario, disponibilidad y solicitudes. Revisa tu conexión e inténtalo nuevamente."
          action={
            <button className="secondary" onClick={() => window.location.reload()}>
              Intentar de nuevo
            </button>
          }
        />
      </div>
    );
  return (
    <div className="space-y-6 p-4 sm:p-5 lg:p-8">
      <header className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-[linear-gradient(120deg,var(--color-brand-900),var(--color-brand-700))] p-6 text-white shadow-[var(--shadow-card)] sm:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-white/65">
            Horario y atención presencial
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-balance sm:text-3xl">Mi horario</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/80">
            El administrador define tus clases. Tú decides cuándo pueden solicitar asistencia
            presencial.
          </p>
        </div>
        <Button
          variant="secondary"
          className="bg-white"
          leadingIcon={<Plus size={17} />}
          onClick={() => setCreating(true)}
          disabled={!classes.length}
        >
          Agregar disponibilidad
        </Button>
      </header>
      {message ? (
        <InlineAlert tone="warning" title="Revisa esta acción">
          {message}
        </InlineAlert>
      ) : null}
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div>
            <h2 className="font-semibold text-[var(--color-text)]">Solicitudes de estudiantes</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Confirma la asistencia o propón otra fecha disponible.
            </p>
          </div>
          <StatusBadge tone="warning">
            {bookings.filter((x) => x.status === PhysicalBookingStatus.PENDING).length} pendientes
          </StatusBadge>
        </header>
        <div className="divide-y divide-[var(--color-border)]">
          {bookings.map((booking) => {
            const status = bookingStatus(booking);
            return (
              <article
                key={booking.id}
                className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold uppercase text-[var(--color-info)]">
                    {booking.className} · {booking.subjectName}
                  </p>
                  <h3 className="mt-1 font-semibold text-[var(--color-text)]">
                    {booking.studentName}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {new Intl.DateTimeFormat("es-CO", {
                      dateStyle: "long",
                      timeZone: "UTC"
                    }).format(new Date(booking.scheduledDate))}{" "}
                    · {booking.startTime}–{booking.endTime}
                  </p>
                  {booking.studentNote ? (
                    <p className="mt-3 rounded-lg bg-[var(--color-surface-soft)] p-3 text-sm text-[var(--color-text-secondary)]">
                      “{booking.studentNote}”
                    </p>
                  ) : null}
                  {booking.isChangeProposal && booking.teacherResponse ? (
                    <p className="mt-3 rounded-lg border border-[var(--color-info-border)] bg-[var(--color-info-bg)] p-3 text-sm text-[var(--color-text-secondary)]">
                      Cambio propuesto: {booking.teacherResponse}
                    </p>
                  ) : null}
                </div>
                {booking.status === PhysicalBookingStatus.PENDING ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="secondary"
                      onClick={() => setRescheduling(booking)}
                    >
                      Proponer otro día
                    </Button>
                    <Button onClick={() => respond(booking, PhysicalBookingStatus.APPROVED)}>
                      Confirmar asistencia
                    </Button>
                  </div>
                ) : (
                  <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                )}
              </article>
            );
          })}
          {!bookings.length ? (
            <EmptyState
              className="m-5"
              icon={<CalendarCheck size={22} />}
              title="No hay solicitudes"
              description="Las solicitudes enviadas por estudiantes aparecerán aquí."
            />
          ) : null}
        </div>
      </section>
      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div>
            <h2 className="font-semibold text-[var(--color-text)]">
              Disponibilidad para solicitudes
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Solo las franjas activas aparecen cuando el estudiante pulsa una materia.
            </p>
          </div>
          <StatusBadge tone="success">{slots.filter((x) => x.isActive).length} activas</StatusBadge>
        </header>
        <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {slots.map((slot) => (
            <article
              key={slot.id}
              className={`rounded-[var(--radius-card)] border p-4 ${slot.isActive ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)]" : "border-[var(--color-border)] bg-[var(--color-surface-soft)]"}`}
            >
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold uppercase tracking-wider text-[var(--color-info)]">
                    {slot.className}
                  </p>
                  <h3 className="mt-1 break-words font-semibold text-[var(--color-text)]">
                    {slot.subjectName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(slot)}
                  aria-label={`${slot.isActive ? "Desactivar" : "Activar"} disponibilidad de ${slot.subjectName}`}
                  className={`grid min-h-11 min-w-11 place-items-center rounded-full ${slot.isActive ? "bg-[var(--color-success)] text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"}`}
                >
                  <Power size={15} aria-hidden="true" />
                </button>
              </div>
              <StatusBadge className="mt-4" tone={slot.isActive ? "success" : "neutral"}>
                {slot.isActive ? "Disponible" : "Inactiva"}
              </StatusBadge>
              <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                <Clock3 size={15} aria-hidden="true" />
                {dayNames[slot.weekday]} · {slot.startTime}–{slot.endTime}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <MapPin size={15} aria-hidden="true" />
                {slot.location || "Centro educativo"}
              </p>
              {slot.instructions ? (
                <p className="mt-3 text-xs leading-5 text-[var(--color-text-secondary)]">
                  {slot.instructions}
                </p>
              ) : null}
              <Button
                variant="secondary"
                className="mt-4 w-full"
                leadingIcon={<Pencil size={15} aria-hidden="true" />}
                onClick={() => setEditingSlot(slot)}
              >
                Editar
              </Button>
            </article>
          ))}
          {!slots.length ? (
            <EmptyState
              className="col-span-full"
              icon={<CalendarCheck size={22} />}
              title="No has publicado disponibilidad"
              description="Agrega una franja para que los estudiantes puedan solicitar atención presencial."
              action={
                <Button leadingIcon={<Plus size={16} />} onClick={() => setCreating(true)}>
                  Agregar disponibilidad
                </Button>
              }
            />
          ) : null}
        </div>
      </section>
      {templates.map((template) => (
        <section key={template.id} className="space-y-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#078cc5]">
              {template.targetTeacher?.name ?? template.targetClass?.name ?? template.gradeLevel?.name ?? "Mi horario"}
            </p>
            <h3 className="mt-1 text-xl font-semibold text-[#191970]">{template.name}</h3>
          </div>
          <WeeklyScheduleTable template={template} />
        </section>
      ))}
      {creating && (
        <AvailabilityDialog
          classes={classes}
          onClose={() => setCreating(false)}
          onSaved={async () => {
            await load();
            setCreating(false);
          }}
        />
      )}
      {editingSlot && (
        <AvailabilityDialog
          classes={classes}
          slot={editingSlot}
          onClose={() => setEditingSlot(null)}
          onSaved={async () => {
            await load();
            setEditingSlot(null);
          }}
        />
      )}
      {rescheduling ? (
        <RescheduleBookingDialog
          booking={rescheduling}
          slots={slots.filter(
            (slot) => slot.classSubjectId === rescheduling.classSubjectId && slot.isActive
          )}
          onClose={() => setRescheduling(null)}
          onSaved={(updated) => {
            setBookings((current) =>
              current.map((booking) => (booking.id === updated.id ? updated : booking))
            );
            setRescheduling(null);
            setMessage("La nueva fecha fue propuesta al estudiante.");
          }}
        />
      ) : null}
    </div>
  );
}

function AvailabilityDialog({
  classes,
  slot,
  onClose,
  onSaved
}: {
  classes: AcademicClassOption[];
  slot?: TeacherAvailabilitySlot;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const subjects = useMemo(
    () => classes.flatMap((c) => c.subjects.map((s) => ({ ...s, className: c.name }))),
    [classes]
  );
  const [classSubjectId, setClassSubjectId] = useState(slot?.classSubjectId ?? subjects[0]?.id ?? "");
  const [weekday, setWeekday] = useState<Weekday>(slot?.weekday ?? Weekday.MONDAY);
  const [startTime, setStartTime] = useState(slot?.startTime ?? "08:00");
  const [endTime, setEndTime] = useState(slot?.endTime ?? "09:00");
  const [location, setLocation] = useState(slot?.location ?? "Centro educativo");
  const [instructions, setInstructions] = useState(slot?.instructions ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  async function submit() {
    if (!classSubjectId || startTime >= endTime) {
      setError("Selecciona una materia y una hora final posterior a la inicial.");
      return;
    }
    setSubmitting(true);
    try {
      if (slot) {
        await scheduleApi.teacher.updateAvailability(slot.id, {
          weekday,
          startTime,
          endTime,
          location,
          instructions
        });
      } else {
        await scheduleApi.teacher.createAvailability({
          classSubjectId,
          weekday,
          startTime,
          endTime,
          location,
          instructions: instructions || undefined
        });
      }
      await onSaved();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo guardar. Revisa los datos e inténtalo nuevamente."
      );
      setSubmitting(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overscroll-contain bg-slate-950/50 p-3 sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="availability-title"
        className="w-full max-w-xl rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-info)]">
              {slot ? "Editar franja" : "Nueva franja"}
            </p>
            <h2
              id="availability-title"
              className="mt-1 text-xl font-semibold text-[var(--color-text)]"
            >
              {slot ? "Actualizar disponibilidad" : "Habilitar atención presencial"}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar disponibilidad"
            className="grid min-h-11 min-w-11 place-items-center rounded-md hover:bg-[var(--color-surface-soft)]"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label
            className="grid gap-2 text-sm font-semibold sm:col-span-2"
            htmlFor="availability-subject"
          >
            Clase y materia
            <select
              id="availability-subject"
              name="classSubjectId"
              value={classSubjectId}
              onChange={(e) => setClassSubjectId(e.target.value)}
              className="input"
              disabled={Boolean(slot)}
            >
              <option value="">Selecciona una materia</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.className} · {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="availability-day">
            Día
            <select
              id="availability-day"
              name="weekday"
              value={weekday}
              onChange={(e) => setWeekday(e.target.value as Weekday)}
              className="input"
            >
              {Object.entries(dayNames).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="availability-location">
            Lugar
            <input
              id="availability-location"
              name="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input"
              autoComplete="off"
              placeholder="Ej. Sede principal…"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="availability-start">
            Desde
            <input
              id="availability-start"
              name="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="availability-end">
            Hasta
            <input
              id="availability-end"
              name="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
            />
          </label>
          <label
            className="grid gap-2 text-sm font-semibold sm:col-span-2"
            htmlFor="availability-instructions"
          >
            Indicaciones
            <textarea
              id="availability-instructions"
              name="instructions"
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] p-3 text-base font-normal sm:text-sm"
              placeholder="Ej. Traer el PACE que deseas revisar…"
            />
          </label>
          {error ? (
            <InlineAlert
              className="sm:col-span-2"
              tone="danger"
              title="No se guardó la disponibilidad"
            >
              {error}
            </InlineAlert>
          ) : null}
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] p-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={submitting} loadingLabel="Guardando…">
            {slot ? "Guardar cambios" : "Publicar disponibilidad"}
          </Button>
        </footer>
      </section>
    </div>
  );
}

function RescheduleBookingDialog({
  booking,
  slots,
  onClose,
  onSaved
}: {
  booking: StudentPhysicalBooking;
  slots: TeacherAvailabilitySlot[];
  onClose: () => void;
  onSaved: (booking: StudentPhysicalBooking) => void;
}) {
  const [slotId, setSlotId] = useState(slots[0]?.id ?? "");
  const [scheduledDate, setScheduledDate] = useState("");
  const [response, setResponse] = useState(booking.teacherResponse ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedSlot = slots.find((slot) => slot.id === slotId);
  const today = new Date();
  const maximum = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  const dateValue = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  async function submit() {
    if (!slotId || !scheduledDate || !response.trim()) {
      setError("Selecciona una franja, una fecha y explica brevemente el cambio.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      onSaved(
        await scheduleApi.teacher.updateBooking(booking.id, {
          status: PhysicalBookingStatus.PENDING,
          availabilitySlotId: slotId,
          scheduledDate,
          teacherResponse: response.trim()
        })
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No fue posible proponer la nueva fecha."
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-title"
        className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-[var(--color-border)] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-info)]">
              Solicitud de {booking.studentName}
            </p>
            <h2 id="reschedule-title" className="mt-1 text-xl font-semibold text-[var(--color-text)]">
              Proponer otro día
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar propuesta"
            className="grid min-h-11 min-w-11 place-items-center rounded-md hover:bg-[var(--color-surface-soft)]"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </header>
        <div className="grid gap-4 p-5">
          <label className="grid gap-2 text-sm font-semibold" htmlFor="reschedule-slot">
            Franja disponible
            <select
              id="reschedule-slot"
              value={slotId}
              onChange={(event) => setSlotId(event.target.value)}
              className="input"
            >
              <option value="">Selecciona una franja</option>
              {slots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {dayNames[slot.weekday]} · {slot.startTime}–{slot.endTime}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="reschedule-date">
            Nueva fecha {selectedSlot ? `(${dayNames[selectedSlot.weekday]})` : ""}
            <input
              id="reschedule-date"
              type="date"
              min={dateValue(today)}
              max={dateValue(maximum)}
              value={scheduledDate}
              onChange={(event) => setScheduledDate(event.target.value)}
              className="input"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold" htmlFor="reschedule-response">
            Mensaje para el estudiante
            <textarea
              id="reschedule-response"
              rows={4}
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              placeholder="Explica por qué propones este nuevo día."
              className="w-full rounded-md border border-[var(--color-border)] p-3 text-base font-normal sm:text-sm"
            />
          </label>
          {!slots.length ? (
            <InlineAlert tone="warning" title="No hay otra disponibilidad">
              Publica primero otra franja activa para esta materia.
            </InlineAlert>
          ) : null}
          {error ? (
            <InlineAlert tone="danger" title="No se guardó la propuesta">
              {error}
            </InlineAlert>
          ) : null}
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] p-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={submit}
            loading={submitting}
            loadingLabel="Proponiendo…"
            disabled={!slots.length}
          >
            Proponer nueva fecha
          </Button>
        </footer>
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
      <div className="space-y-6 p-5 lg:p-8">
        <Skeleton className="h-40" rounded="lg" />
        <Skeleton className="h-64" rounded="lg" />
        <Skeleton className="h-64" rounded="lg" />
        <Skeleton className="h-96" rounded="lg" />
      </div>
    </SkeletonGroup>
  );
}
