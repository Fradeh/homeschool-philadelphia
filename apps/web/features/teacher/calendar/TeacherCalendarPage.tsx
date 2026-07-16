"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus, UsersRound, X } from "lucide-react";
import {
  EventScope,
  type AcademicClassOption,
  type CalendarEventSummary
} from "@homeschool/shared";
import { scheduleApi } from "@/features/schedules/schedule-api";
import { getCalendarEvents } from "@/features/calendar/calendar-api";
import { apiRequest } from "@/lib/api-client";

type EventType = "Encuentro" | "Evento";
type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: EventType;
  classId?: string;
  className?: string;
  classCode?: string;
  detail: string;
  color: string;
};
const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];
const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function TeacherCalendarPage() {
  const firstEvent = toIsoDate(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => parseIsoDate(firstEvent));
  const [selectedDate, setSelectedDate] = useState(firstEvent);
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"Todos" | EventType>("Todos");
  const [classes, setClasses] = useState<AcademicClassOption[]>([]);
  const [bookingEvents, setBookingEvents] = useState<CalendarEvent[]>([]);
  const [generalEvents, setGeneralEvents] = useState<CalendarEvent[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const events = [...bookingEvents, ...generalEvents];
  useEffect(() => {
    Promise.all([scheduleApi.teacher.classes(), scheduleApi.teacher.bookings()])
      .then(([classItems, items]) => {
        setClasses(classItems);
        setBookingEvents(
          items
            .filter((item) => item.status === "PENDING" || item.status === "APPROVED")
            .map((item) => {
              const owner = classItems.find((classroom) =>
                classroom.subjects.some((subject) => subject.id === item.classSubjectId)
              );
              return {
                id: `booking-${item.id}`,
                title: `Encuentro con ${item.studentName}`,
                date: item.scheduledDate,
                time: item.startTime,
                type: "Encuentro",
                classId: owner?.id,
                className: item.className,
                classCode: item.subjectShortName,
                detail: `${item.status} · ${item.subjectName}`,
                color: item.status === "APPROVED" ? "#059669" : "#078cc5"
              };
            })
        );
      })
      .catch(() => {
        setClasses([]);
        setBookingEvents([]);
      });
  }, []);
  useEffect(() => {
    getCalendarEvents()
      .then((items) => setGeneralEvents(items.map(mapGeneralEvent)))
      .catch(() => setGeneralEvents([]));
  }, []);
  const filteredEvents = events.filter(
    (event) =>
      (classFilter === "all" || event.classId === classFilter) &&
      (typeFilter === "Todos" || event.type === typeFilter)
  );
  const monthEvents = filteredEvents.filter((event) => isSameMonth(event.date, visibleMonth));
  const selectedEvents = filteredEvents
    .filter((event) => event.date === selectedDate)
    .sort((a, b) => (a.time ?? "23:59").localeCompare(b.time ?? "23:59"));
  const calendarDays = buildCalendarDays(visibleMonth);
  const weekCount = Math.ceil(calendarDays.length / 7);

  function moveMonth(offset: number) {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(next);
    setSelectedDate(toIsoDate(next));
  }
  async function createEvent(form: FormData) {
    const date = String(form.get("date") ?? "");
    const time = String(form.get("time") ?? "00:00");
    await apiRequest<CalendarEventSummary>("/calendar/events", {
      method: "POST",
      body: JSON.stringify({
        title: String(form.get("title") ?? ""),
        description: String(form.get("detail") ?? "") || undefined,
        scope: EventScope.GENERAL,
        startsAt: new Date(`${date}T${time}:00`).toISOString()
      })
    });
    const items = await getCalendarEvents();
    setGeneralEvents(items.map(mapGeneralEvent));
    setSelectedDate(date);
    setVisibleMonth(parseIsoDate(date));
    setIsCreateOpen(false);
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-5 lg:px-8">
        <section className="flex shrink-0 flex-col gap-4 rounded-lg border border-[#dde3ef] bg-white p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#078cc5]">Agenda académica</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#191970]">Calendario general</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tareas, encuentros y eventos de todas tus clases.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="h-10 rounded-md border border-[#d8deeb] bg-white px-3 text-sm font-semibold text-slate-600 outline-none"
            >
              <option value="all">Todas las clases</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <div className="flex rounded-md bg-[#f4f6fb] p-1">
              {(["Todos", "Encuentro", "Evento"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setTypeFilter(item)}
                  className={`rounded px-3 py-2 text-xs font-semibold ${typeFilter === item ? "bg-white text-[#191970] shadow-sm" : "text-slate-500"}`}
                >
                  {item}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#191970] px-4 text-sm font-semibold text-white"
            >
              <Plus size={17} />
              Nuevo evento
            </button>
          </div>
        </section>

        <div className="mt-5 grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(34rem,1fr)_22rem]">
          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
            <header className="flex shrink-0 items-center justify-between border-b border-[#edf0f6] px-5 py-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">
                  Vista mensual
                </p>
                <h3 className="mt-1 text-xl font-semibold text-[#191970]">
                  {months[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const today = new Date();
                    setVisibleMonth(today);
                    setSelectedDate(toIsoDate(today));
                  }}
                  className="h-9 rounded-md border border-[#d8deeb] px-3 text-xs font-semibold text-[#191970]"
                >
                  Hoy
                </button>
                <NavButton label="Mes anterior" onClick={() => moveMonth(-1)}>
                  <ChevronLeft size={18} />
                </NavButton>
                <NavButton label="Mes siguiente" onClick={() => moveMonth(1)}>
                  <ChevronRight size={18} />
                </NavButton>
              </div>
            </header>
            <div className="flex min-h-0 flex-1 flex-col p-3">
              <div
                className="grid min-h-0 flex-1 grid-cols-7"
                style={{ gridTemplateRows: `auto repeat(${weekCount}, minmax(0, 1fr))` }}
              >
                {weekdays.map((day) => (
                  <div key={day} className="pb-2 text-center text-xs font-bold text-slate-400">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, index) => {
                  if (!day)
                    return <div key={`empty-${index}`} className="border border-transparent" />;
                  const key = toIsoDate(day);
                  const dayEvents = monthEvents.filter((event) => event.date === key);
                  const isSelected = key === selectedDate;
                  const isToday = key === toIsoDate(new Date());
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(key)}
                      className={`min-h-0 overflow-hidden border p-1.5 text-left transition ${isSelected ? "border-[#191970] bg-[#f5f6ff] ring-1 ring-[#191970]" : "border-[#edf0f6] hover:bg-[#fafbfc]"}`}
                    >
                      <span
                        className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${isToday ? "bg-[#191970] text-white" : "text-slate-600"}`}
                      >
                        {day.getDate()}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <span
                            key={event.id}
                            className="block truncate rounded px-1.5 py-1 text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${event.color}12`,
                              color: event.color,
                              borderLeft: `3px solid ${event.color}`
                            }}
                          >
                            {event.time ? `${event.time} · ` : ""}
                            {event.title}
                          </span>
                        ))}
                        {dayEvents.length > 3 ? (
                          <span className="block px-1 text-[10px] font-bold text-slate-400">
                            +{dayEvents.length - 3} más
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
            <header className="shrink-0 border-b border-[#edf0f6] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">
                Agenda del día
              </p>
              <h3 className="mt-1 text-xl font-semibold capitalize text-[#191970]">
                {formatLongDate(selectedDate)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {selectedEvents.length} actividad{selectedEvents.length === 1 ? "" : "es"}
              </p>
            </header>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
              {selectedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
              {!selectedEvents.length ? (
                <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-[#d8deeb] bg-[#fafbfc] p-6 text-center">
                  <div>
                    <CalendarDays className="mx-auto text-slate-300" size={32} />
                    <p className="mt-3 font-semibold text-[#191970]">Día sin actividades</p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Selecciona otra fecha o crea un evento persistente.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <footer className="shrink-0 border-t border-[#edf0f6] p-4">
              <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-slate-500">
                <Legend color="#078cc5" label="Encuentro" />
                <Legend color="#64748b" label="Evento" />
              </div>
            </footer>
          </aside>
        </div>
      </div>
      {isCreateOpen ? (
        <CreateEventDialog
          onClose={() => setIsCreateOpen(false)}
          onCreate={createEvent}
          defaultDate={selectedDate}
        />
      ) : null}
    </>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
  const icon = event.type === "Encuentro" ? <UsersRound size={17} /> : <CalendarDays size={17} />;
  return (
    <article className="rounded-lg border border-[#e1e6ef] p-4">
      <div className="flex items-start gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md"
          style={{ color: event.color, backgroundColor: `${event.color}12` }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: event.color }}
            >
              {event.type}
            </span>
            {event.classCode ? (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                {event.classCode}
              </span>
            ) : null}
          </div>
          <h4 className="mt-1 font-semibold text-[#191970]">{event.title}</h4>
          {event.time ? (
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-500">
              <Clock3 size={13} />
              {event.time}
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-5 text-slate-600">{event.detail}</p>
          {event.classId ? (
            <Link
              href={`/teacher/classes/${event.classId}`}
              className="mt-3 inline-flex text-xs font-semibold text-[#191970]"
            >
              Abrir clase
            </Link>
          ) : null}
        </div>
      </div>
    </article>
  );
}
function CreateEventDialog({
  onClose,
  onCreate,
  defaultDate
}: {
  onClose: () => void;
  onCreate: (form: FormData) => Promise<void>;
  defaultDate: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(form: FormData) {
    setSaving(true);
    setError("");
    try {
      await onCreate(form);
    } catch {
      setError("No pudimos crear el evento. Revisa los datos e inténtalo nuevamente.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <section className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-[#edf0f6] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">
              Agenda general
            </p>
            <h3 className="mt-1 text-xl font-semibold text-[#191970]">Nuevo evento</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </header>
        <form action={submit} className="space-y-4 p-5">
          <Field label="Título">
            <input
              required
              name="title"
              className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 text-sm outline-none focus:border-[#191970]"
            />
          </Field>
          {error ? (
            <p className="text-sm font-semibold text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha">
              <input
                required
                name="date"
                type="date"
                defaultValue={defaultDate}
                className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 text-sm"
              />
            </Field>
            <Field label="Hora">
              <input
                name="time"
                type="time"
                defaultValue="08:00"
                required
                className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 text-sm"
              />
            </Field>
          </div>
          <Field label="Detalle">
            <textarea
              name="detail"
              rows={3}
              required
              className="mt-2 w-full resize-none rounded-md border border-[#d8deeb] px-3 py-3 text-sm"
            />
          </Field>
          <footer className="flex justify-end gap-3 border-t border-[#edf0f6] pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#d8deeb] px-4 py-2 text-sm font-semibold text-[#191970]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[#191970] px-4 py-2 text-sm font-semibold text-white"
            >
              {saving ? "Creando…" : "Crear evento"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}
function NavButton({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-md border border-[#d8deeb] text-[#191970]"
    >
      {children}
    </button>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function mapGeneralEvent(
  item: CalendarEventSummary & { description?: string | null }
): CalendarEvent {
  const date = new Date(item.startsAt);
  return {
    id: `general-${item.id}`,
    title: item.title,
    date: toIsoDate(date),
    time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
    type: "Evento",
    detail: item.description || "Evento general de la institución",
    color: "#64748b"
  };
}
function buildCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return [
    ...Array<Date | null>(offset).fill(null),
    ...Array.from({ length: count }, (_, index) => new Date(year, month, index + 1))
  ];
}
function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function isSameMonth(value: string, month: Date) {
  const date = parseIsoDate(value);
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}
function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(parseIsoDate(value));
}
