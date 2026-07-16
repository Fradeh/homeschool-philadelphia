"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CalendarDays, CheckSquare, ChevronLeft, ChevronRight, Clock3, UsersRound } from "lucide-react";
import { studentClasses } from "../mock-student-data";
import { getStudentCalendarEvents, type StudentCalendarEvent } from "../student-learning-data";
import { scheduleApi } from "@/features/schedules/schedule-api";
import { demoDataEnabled } from "@/lib/feature-flags";
import { getCalendarEvents } from "@/features/calendar/calendar-api";

type EventType = "Todos" | StudentCalendarEvent["type"];

const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function StudentCalendarPage() {
  const baseEvents = useMemo(() => demoDataEnabled ? getStudentCalendarEvents() : [], []);
  const [bookingEvents, setBookingEvents] = useState<StudentCalendarEvent[]>([]);
  const [generalEvents, setGeneralEvents] = useState<StudentCalendarEvent[]>([]);
  const events = [...baseEvents, ...bookingEvents, ...generalEvents];
  useEffect(() => { scheduleApi.student.bookings().then((items) => setBookingEvents(items.map((item) => ({ id: `booking-${item.id}`, title: `Encuentro · ${item.subjectName}`, date: item.scheduledDate, time: item.startTime, type: "Encuentro", classId: item.classSubjectId, className: item.className, classCode: item.subjectShortName, detail: `${item.status} · ${item.teacherName}`, color: item.status === "APPROVED" ? "#059669" : item.status === "REJECTED" ? "#e11d48" : "#078cc5" })))).catch(() => setBookingEvents([])); }, []);
  useEffect(() => { getCalendarEvents().then((items) => setGeneralEvents(items.map((item) => { const date = new Date(item.startsAt); return { id: `general-${item.id}`, title: item.title, date: toIsoDate(date), time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`, type: "Clase", classId: "general", className: "Evento general", classCode: "GENERAL", detail: item.scope, color: "#64748b" }; }))).catch(() => setGeneralEvents([])); }, []);
  const firstEvent = events[0]?.date ?? toIsoDate(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => parseIsoDate(firstEvent));
  const [selectedDate, setSelectedDate] = useState(firstEvent);
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<EventType>("Todos");
  const filteredEvents = events.filter(
    (event) => (classFilter === "all" || event.classId === classFilter) && (typeFilter === "Todos" || event.type === typeFilter)
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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-5 lg:px-8">
      <section className="flex shrink-0 flex-col gap-4 rounded-lg border border-[#dde3ef] bg-white p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#078cc5]">Agenda académica</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#191970]">Mi calendario</h2>
          <p className="mt-1 text-sm text-slate-500">Tareas, clases y encuentros de tu plan de estudio.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="h-10 rounded-md border border-[#d8deeb] bg-white px-3 text-sm font-semibold text-slate-600 outline-none"
          >
            <option value="all">Todas las clases</option>
            {(demoDataEnabled ? studentClasses : []).map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <div className="flex rounded-md bg-[#f4f6fb] p-1">
            {(["Todos", "Tarea", "Encuentro", "Clase"] as const).map((item) => (
              <button
                key={item}
                onClick={() => setTypeFilter(item)}
                className={`rounded px-3 py-2 text-xs font-semibold ${
                  typeFilter === item ? "bg-white text-[#191970] shadow-sm" : "text-slate-500"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-5 grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(34rem,1fr)_22rem]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
          <header className="flex shrink-0 items-center justify-between border-b border-[#edf0f6] px-5 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Vista mensual</p>
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
              <NavButton label="Mes anterior" onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></NavButton>
              <NavButton label="Mes siguiente" onClick={() => moveMonth(1)}><ChevronRight size={18} /></NavButton>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col p-3">
            <div className="grid min-h-0 flex-1 grid-cols-7" style={{ gridTemplateRows: `auto repeat(${weekCount}, minmax(0, 1fr))` }}>
              {weekdays.map((day) => (
                <div key={day} className="pb-2 text-center text-xs font-bold text-slate-400">{day}</div>
              ))}
              {calendarDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="border border-transparent" />;
                const key = toIsoDate(day);
                const dayEvents = monthEvents.filter((event) => event.date === key);
                const isSelected = key === selectedDate;
                const isToday = key === toIsoDate(new Date());

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(key)}
                    className={`min-h-0 overflow-hidden border p-1.5 text-left transition ${
                      isSelected ? "border-[#191970] bg-[#f5f6ff] ring-1 ring-[#191970]" : "border-[#edf0f6] hover:bg-[#fafbfc]"
                    }`}
                  >
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${isToday ? "bg-[#191970] text-white" : "text-slate-600"}`}>
                      {day.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <span
                          key={event.id}
                          className="block truncate rounded px-1.5 py-1 text-[10px] font-semibold"
                          style={{ backgroundColor: `${event.color}12`, color: event.color, borderLeft: `3px solid ${event.color}` }}
                        >
                          {event.time ? `${event.time} · ` : ""}
                          {event.title}
                        </span>
                      ))}
                      {dayEvents.length > 3 ? <span className="block px-1 text-[10px] font-bold text-slate-400">+{dayEvents.length - 3} más</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
          <header className="shrink-0 border-b border-[#edf0f6] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Agenda del día</p>
            <h3 className="mt-1 text-xl font-semibold capitalize text-[#191970]">{formatLongDate(selectedDate)}</h3>
            <p className="mt-1 text-sm text-slate-500">{selectedEvents.length} actividad{selectedEvents.length === 1 ? "" : "es"}</p>
          </header>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
            {selectedEvents.map((event) => <EventCard key={event.id} event={event} />)}
            {!selectedEvents.length ? (
              <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-[#d8deeb] bg-[#fafbfc] p-6 text-center">
                <div>
                  <CalendarDays className="mx-auto text-slate-300" size={32} />
                  <p className="mt-3 font-semibold text-[#191970]">Día sin actividades</p>
                  <p className="mt-1 text-sm leading-5 text-slate-500">Selecciona otra fecha para revisar tu agenda.</p>
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function EventCard({ event }: { event: StudentCalendarEvent }) {
  const icon = event.type === "Tarea" ? <CheckSquare size={17} /> : event.type === "Encuentro" ? <UsersRound size={17} /> : <CalendarDays size={17} />;

  return (
    <article className="rounded-lg border border-[#e1e6ef] p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md" style={{ color: event.color, backgroundColor: `${event.color}12` }}>
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: event.color }}>{event.type}</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">{event.classCode}</span>
          </div>
          <h4 className="mt-1 font-semibold text-[#191970]">{event.title}</h4>
          {event.time ? <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-500"><Clock3 size={13} />{event.time}</p> : null}
          <p className="mt-2 text-sm leading-5 text-slate-600">{event.detail}</p>
          <Link href={`/student/classes/${event.classId}`} className="mt-3 inline-flex text-xs font-semibold text-[#191970]">
            Abrir clase
          </Link>
        </div>
      </div>
    </article>
  );
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} className="grid h-9 w-9 place-items-center rounded-md border border-[#d8deeb] text-[#191970]">
      {children}
    </button>
  );
}

function buildCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  return [...Array<Date | null>(offset).fill(null), ...Array.from({ length: count }, (_, index) => new Date(year, month, index + 1))];
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
  return new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long" }).format(parseIsoDate(value));
}
