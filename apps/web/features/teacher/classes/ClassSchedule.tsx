"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  CalendarCheck,
  CalendarClock,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  MapPin,
  RotateCcw,
  Settings2,
  UserRound,
  X
} from "lucide-react";
import type {
  PhysicalClassRequest,
  PhysicalClassRequestStatus,
  PhysicalClassSchedule
} from "./mock-teacher-classes";

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];
const weekdayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const shortWeekdays = ["L", "M", "X", "J", "V", "S", "D"];

const statusMeta: Record<PhysicalClassRequestStatus, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-amber-50 text-amber-700" },
  accepted: { label: "Aceptada", className: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rechazada", className: "bg-rose-50 text-rose-700" },
  reschedule_proposed: { label: "Cambio propuesto", className: "bg-indigo-50 text-indigo-700" }
};

type Decision = "accept" | "reject" | "reschedule";

export function ClassSchedule({
  schedule,
  requests,
  onUpdateSchedule,
  onUpdateRequests,
  onActivity
}: {
  schedule: PhysicalClassSchedule;
  requests: PhysicalClassRequest[];
  onUpdateSchedule: (schedule: PhysicalClassSchedule) => void;
  onUpdateRequests: (requests: PhysicalClassRequest[]) => void;
  onActivity: (label: string, detail: string) => void;
}) {
  const initialDate = requests.find((request) => request.status === "pending")?.requestedDate ?? toIsoDate(new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => parseIsoDate(initialDate));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const calendarWeekCount = Math.ceil(calendarDays.length / 7);
  const monthRequests = requests.filter((request) => isInMonth(requestDisplayDate(request), visibleMonth));
  const pendingCount = monthRequests.filter((request) => request.status === "pending").length;
  const acceptedCount = monthRequests.filter((request) => request.status === "accepted").length;
  const rejectedCount = monthRequests.filter((request) => request.status === "rejected").length;
  const postponedCount = monthRequests.filter((request) => request.status === "reschedule_proposed").length;
  const queue = [...monthRequests]
    .filter((request) => !selectedDate || request.requestedDate === selectedDate || request.proposedDate === selectedDate)
    .sort((a, b) => statusRank(a.status) - statusRank(b.status));
  const activeRequest = requests.find((request) => request.id === activeRequestId);

  function moveMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
    setSelectedDate(null);
  }

  function openDecision(requestId: string, nextDecision: Decision) {
    const request = requests.find((item) => item.id === requestId);
    setActiveRequestId(requestId);
    setDecision(nextDecision);
    setNote("");
    setProposedDate(request?.requestedDate ?? "");
    setProposedTime(request?.requestedTime ?? "");
  }

  function closeDecision() {
    setActiveRequestId(null);
    setDecision(null);
    setNote("");
  }

  function submitDecision() {
    if (!activeRequest || !decision) return;
    if ((decision === "reject" || decision === "reschedule") && !note.trim()) return;
    if (decision === "reschedule" && (!proposedDate || !proposedTime)) return;

    const nextStatus: PhysicalClassRequestStatus =
      decision === "accept" ? "accepted" : decision === "reject" ? "rejected" : "reschedule_proposed";
    onUpdateRequests(
      requests.map((request) =>
        request.id === activeRequest.id
          ? {
              ...request,
              status: nextStatus,
              teacherNote: note.trim() || undefined,
              proposedDate: decision === "reschedule" ? proposedDate : undefined,
              proposedTime: decision === "reschedule" ? proposedTime : undefined
            }
          : request
      )
    );

    const activityLabel =
      decision === "accept" ? "Encuentro presencial aceptado" :
      decision === "reject" ? "Solicitud presencial rechazada" : "Nuevo horario propuesto";
    onActivity(activityLabel, activeRequest.studentName);
    closeDecision();
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <div className="grid shrink-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={<CalendarClock size={19} />} label="Pendientes" value={pendingCount} />
        <SummaryCard icon={<CalendarCheck size={19} />} label="Aceptadas" value={acceptedCount} />
        <SummaryCard icon={<X size={19} />} label="Rechazadas" value={rejectedCount} />
        <SummaryCard icon={<RotateCcw size={19} />} label="Pospuestas" value={postponedCount} />
      </div>

      <section className="shrink-0 rounded-lg border border-[#dde3ef] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Settings2 size={18} className="text-[#191970]" />
              <h3 className="font-semibold text-[#191970]">Condiciones para esta clase</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">Estos parámetros se muestran al estudiante antes de solicitar.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <ScheduleFact icon={<MapPin size={16} />} label={schedule.location} />
            <ScheduleFact icon={<Clock3 size={16} />} label={`${schedule.minimumNoticeDays} día${schedule.minimumNoticeDays === 1 ? "" : "s"} de anticipación`} />
            <button type="button" onClick={() => setIsSettingsOpen(true)} className="inline-flex items-center gap-2 rounded-md border border-[#d8deeb] px-3 py-2 text-xs font-semibold text-[#191970] hover:bg-[#eef2ff]"><Edit3 size={14} />Editar condiciones</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#edf0f6] pt-4">
          {schedule.availability.map((slot) => (
            <span key={`${slot.weekday}-${slot.startTime}`} className="rounded-md bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#191970]">
              {weekdayNames[slot.weekday]} · {formatTime(slot.startTime)}–{formatTime(slot.endTime)}
            </span>
          ))}
          {!schedule.availability.length ? <span className="text-sm text-amber-700">Aún no hay horarios habilitados.</span> : null}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{schedule.instructions}</p>
      </section>

      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-[minmax(34rem,1.35fr)_minmax(25rem,1fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
          <header className="flex shrink-0 items-center justify-between border-b border-[#edf0f6] px-5 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Agenda presencial</p>
              <h3 className="mt-1 text-xl font-semibold capitalize text-[#191970]">
                {monthNames[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
              </h3>
            </div>
            <div className="flex gap-2">
              <CalendarButton label="Mes anterior" onClick={() => moveMonth(-1)}><ChevronLeft size={18} /></CalendarButton>
              <CalendarButton label="Mes siguiente" onClick={() => moveMonth(1)}><ChevronRight size={18} /></CalendarButton>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
            <div
              className="grid min-h-0 flex-1 grid-cols-7"
              style={{ gridTemplateRows: `auto repeat(${calendarWeekCount}, minmax(0, 1fr))` }}
            >
              {shortWeekdays.map((day) => <div key={day} className="pb-3 text-center text-xs font-bold text-slate-400">{day}</div>)}
              {calendarDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="min-h-0 border border-transparent" />;
                const dateKey = toIsoDate(day);
                const dayRequests = requests.filter((request) => request.requestedDate === dateKey || request.proposedDate === dateKey);
                const isSelected = selectedDate === dateKey;
                const isToday = dateKey === toIsoDate(new Date());
                const isAvailable = schedule.availability.some((slot) => slot.weekday === day.getDay());
                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                    className={`min-h-0 overflow-hidden border p-1.5 text-left transition sm:p-2 ${
                      isSelected ? "border-[#191970] bg-[#eef2ff] ring-1 ring-[#191970]" : "border-[#edf0f6] hover:bg-[#f8f9fc]"
                    }`}
                  >
                    <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${isToday ? "bg-[#191970] text-white" : "text-slate-600"}`}>
                      {day.getDate()}
                    </span>
                    {isAvailable ? <span className="mt-1 block text-[10px] font-semibold text-[#078cc5]">Disponible</span> : null}
                    {dayRequests.length ? (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#eef2ff] px-2 py-1 text-[10px] font-bold text-[#191970]" title={`${dayRequests.length} solicitud${dayRequests.length === 1 ? "" : "es"}`}>
                        <Bell size={11} />{dayRequests.length}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-lg border border-[#dde3ef] bg-white shadow-sm">
          <header className="flex items-start justify-between gap-3 border-b border-[#edf0f6] p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Bandeja docente</p>
              <h3 className="mt-1 text-xl font-semibold text-[#191970]">
                {selectedDate ? formatLongDate(selectedDate) : "Todas las solicitudes"}
              </h3>
            </div>
            {selectedDate ? (
              <button type="button" onClick={() => setSelectedDate(null)} className="rounded-md border border-[#d8deeb] px-3 py-2 text-xs font-semibold text-[#191970] hover:bg-[#eef2ff]">
                Ver todas
              </button>
            ) : null}
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {queue.map((request) => (
              <RequestCard key={request.id} request={request} onDecision={openDecision} />
            ))}
            {!queue.length ? (
              <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-[#d8deeb] bg-[#fafbfc] p-6 text-center">
                <div>
                  <CalendarCheck className="mx-auto text-slate-300" size={34} />
                  <p className="mt-3 font-semibold text-[#191970]">No hay solicitudes para esta fecha</p>
                  <p className="mt-1 text-sm text-slate-500">Selecciona otro día o vuelve a la vista completa.</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      {activeRequest && decision ? (
        <DecisionDialog
          request={activeRequest}
          decision={decision}
          note={note}
          proposedDate={proposedDate}
          proposedTime={proposedTime}
          onNoteChange={setNote}
          onDateChange={setProposedDate}
          onTimeChange={setProposedTime}
          onClose={closeDecision}
          onSubmit={submitDecision}
        />
      ) : null}
      {isSettingsOpen ? (
        <ScheduleSettingsDialog
          schedule={schedule}
          onClose={() => setIsSettingsOpen(false)}
          onSave={(nextSchedule) => {
            onUpdateSchedule(nextSchedule);
            onActivity("Condiciones presenciales actualizadas", nextSchedule.location);
            setIsSettingsOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}

function RequestCard({ request, onDecision }: { request: PhysicalClassRequest; onDecision: (id: string, decision: Decision) => void }) {
  const meta = statusMeta[request.status];
  return (
    <article className="rounded-lg border border-[#e1e6ef] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eef2ff] text-[#191970]"><UserRound size={18} /></span>
          <div className="min-w-0">
            <h4 className="truncate font-semibold text-[#191970]">{request.studentName}</h4>
            <p className="mt-1 text-xs text-slate-400">Solicitada {request.createdAt}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.className}`}>{meta.label}</span>
      </div>
      <div className="mt-4 rounded-md bg-[#f6f8fc] px-3 py-3">
        <p className="text-sm font-semibold text-[#191970]">{formatLongDate(request.requestedDate)} · {formatTime(request.requestedTime)}</p>
        <p className="mt-2 text-sm leading-5 text-slate-600">{request.reason}</p>
      </div>
      {request.status === "reschedule_proposed" && request.proposedDate ? (
        <div className="mt-3 rounded-md border border-indigo-100 bg-indigo-50/70 p-3 text-sm">
          <p className="font-semibold text-indigo-800">Propuesto: {formatLongDate(request.proposedDate)} · {formatTime(request.proposedTime ?? "")}</p>
          <p className="mt-1 text-indigo-700">{request.teacherNote}</p>
        </div>
      ) : request.teacherNote ? <p className="mt-3 text-sm text-slate-500"><strong>Nota:</strong> {request.teacherNote}</p> : null}
      {request.status === "pending" ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button type="button" onClick={() => onDecision(request.id, "accept")} className="inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 px-2 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><Check size={14} />Aceptar</button>
          <button type="button" onClick={() => onDecision(request.id, "reschedule")} className="inline-flex items-center justify-center gap-1 rounded-md border border-indigo-200 px-2 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"><RotateCcw size={14} />Cambiar</button>
          <button type="button" onClick={() => onDecision(request.id, "reject")} className="inline-flex items-center justify-center gap-1 rounded-md border border-rose-200 px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><X size={14} />Rechazar</button>
        </div>
      ) : null}
    </article>
  );
}

function DecisionDialog({ request, decision, note, proposedDate, proposedTime, onNoteChange, onDateChange, onTimeChange, onClose, onSubmit }: {
  request: PhysicalClassRequest; decision: Decision; note: string; proposedDate: string; proposedTime: string;
  onNoteChange: (value: string) => void; onDateChange: (value: string) => void; onTimeChange: (value: string) => void;
  onClose: () => void; onSubmit: () => void;
}) {
  const content = {
    accept: { eyebrow: "Confirmar encuentro", title: `Aceptar solicitud de ${request.studentName}`, button: "Aceptar y notificar", required: false },
    reject: { eyebrow: "Responder solicitud", title: `Rechazar solicitud de ${request.studentName}`, button: "Rechazar y notificar", required: true },
    reschedule: { eyebrow: "Proponer cambio", title: `Nuevo horario para ${request.studentName}`, button: "Proponer y notificar", required: true }
  }[decision];
  const isDisabled = (content.required && !note.trim()) || (decision === "reschedule" && (!proposedDate || !proposedTime));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f172a]/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <section className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#edf0f6] p-5">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">{content.eyebrow}</p><h3 className="mt-1 text-xl font-semibold text-[#191970]">{content.title}</h3></div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </header>
        <div className="space-y-4 p-5">
          <div className="rounded-md bg-[#f6f8fc] p-4 text-sm"><p className="font-semibold text-[#191970]">{formatLongDate(request.requestedDate)} · {formatTime(request.requestedTime)}</p><p className="mt-2 leading-5 text-slate-600">{request.reason}</p></div>
          {decision === "reschedule" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-semibold text-slate-700">Nueva fecha<input type="date" value={proposedDate} onChange={(event) => onDateChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 font-normal outline-none focus:border-[#191970]" /></label>
              <label className="text-sm font-semibold text-slate-700">Nueva hora<input type="time" value={proposedTime} onChange={(event) => onTimeChange(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 font-normal outline-none focus:border-[#191970]" /></label>
            </div>
          ) : null}
          <label className="block text-sm font-semibold text-slate-700">
            {decision === "accept" ? "Indicaciones para el estudiante (opcional)" : "Motivo (obligatorio)"}
            <textarea value={note} onChange={(event) => onNoteChange(event.target.value)} rows={4} placeholder={decision === "accept" ? "Salón, materiales o recomendaciones..." : "Explica claramente el motivo de la decisión..."} className="mt-2 w-full resize-none rounded-md border border-[#d8deeb] px-3 py-3 font-normal leading-5 outline-none focus:border-[#191970]" />
          </label>
        </div>
        <footer className="flex justify-end gap-3 border-t border-[#edf0f6] p-5"><button type="button" onClick={onClose} className="rounded-md border border-[#d8deeb] px-4 py-2.5 text-sm font-semibold text-[#191970]">Cancelar</button><button type="button" disabled={isDisabled} onClick={onSubmit} className="rounded-md bg-[#191970] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#11115c] disabled:cursor-not-allowed disabled:bg-slate-300">{content.button}</button></footer>
      </section>
    </div>
  );
}

function ScheduleSettingsDialog({ schedule, onClose, onSave }: {
  schedule: PhysicalClassSchedule;
  onClose: () => void;
  onSave: (schedule: PhysicalClassSchedule) => void;
}) {
  const [location, setLocation] = useState(schedule.location);
  const [minimumNoticeDays, setMinimumNoticeDays] = useState(schedule.minimumNoticeDays);
  const [durationMinutes, setDurationMinutes] = useState(schedule.durationMinutes);
  const [instructions, setInstructions] = useState(schedule.instructions);
  const [availability, setAvailability] = useState(schedule.availability);

  function toggleDay(weekday: number) {
    setAvailability((current) => {
      const exists = current.some((slot) => slot.weekday === weekday);
      return exists
        ? current.filter((slot) => slot.weekday !== weekday)
        : [...current, { weekday, startTime: "09:00", endTime: "12:00" }].sort((a, b) => a.weekday - b.weekday);
    });
  }

  function updateSlot(weekday: number, field: "startTime" | "endTime", value: string) {
    setAvailability((current) => current.map((slot) => slot.weekday === weekday ? { ...slot, [field]: value } : slot));
  }

  function save() {
    if (!location.trim() || minimumNoticeDays < 0 || durationMinutes < 15) return;
    onSave({
      ...schedule,
      location: location.trim(),
      minimumNoticeDays,
      durationMinutes,
      instructions: instructions.trim(),
      availability
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f172a]/45 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <section className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#edf0f6] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Disponibilidad de la materia</p>
            <h3 className="mt-1 text-xl font-semibold text-[#191970]">Editar condiciones presenciales</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </header>

        <div className="min-h-0 space-y-5 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="sm:col-span-3 text-sm font-semibold text-slate-700">
              Salón o lugar
              <input value={location} onChange={(event) => setLocation(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 font-normal outline-none focus:border-[#191970]" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Anticipación mínima
              <div className="relative mt-2"><input type="number" min={0} max={60} value={minimumNoticeDays} onChange={(event) => setMinimumNoticeDays(Number(event.target.value))} className="h-11 w-full rounded-md border border-[#d8deeb] px-3 pr-12 font-normal outline-none focus:border-[#191970]" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">días</span></div>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Duración
              <select value={durationMinutes} onChange={(event) => setDurationMinutes(Number(event.target.value))} className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] bg-white px-3 font-normal outline-none focus:border-[#191970]">
                {[15, 30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutos</option>)}
              </select>
            </label>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700">Días y franjas habilitadas</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">El estudiante solo podrá solicitar encuentros en los días activados aquí.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
                const slot = availability.find((item) => item.weekday === weekday);
                return (
                  <div key={weekday} className={`rounded-lg border p-3 ${slot ? "border-[#cfd6ee] bg-[#f8f9ff]" : "border-[#e4e8ef] bg-white"}`}>
                    <button type="button" onClick={() => toggleDay(weekday)} className="flex w-full items-center justify-between text-sm font-semibold text-[#191970]">
                      {weekdayNames[weekday]}
                      <span className={`relative h-5 w-9 rounded-full transition ${slot ? "bg-[#191970]" : "bg-slate-200"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${slot ? "left-[1.125rem]" : "left-0.5"}`} /></span>
                    </button>
                    {slot ? (
                      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <input type="time" value={slot.startTime} onChange={(event) => updateSlot(weekday, "startTime", event.target.value)} className="h-9 min-w-0 rounded-md border border-[#d8deeb] bg-white px-2 text-xs outline-none" />
                        <span className="text-xs text-slate-400">a</span>
                        <input type="time" value={slot.endTime} onChange={(event) => updateSlot(weekday, "endTime", event.target.value)} className="h-9 min-w-0 rounded-md border border-[#d8deeb] bg-white px-2 text-xs outline-none" />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <label className="block text-sm font-semibold text-slate-700">
            Indicaciones para el estudiante
            <textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-md border border-[#d8deeb] px-3 py-3 font-normal leading-5 outline-none focus:border-[#191970]" />
          </label>
        </div>

        <footer className="flex shrink-0 justify-end gap-3 border-t border-[#edf0f6] p-5">
          <button type="button" onClick={onClose} className="rounded-md border border-[#d8deeb] px-4 py-2.5 text-sm font-semibold text-[#191970]">Cancelar</button>
          <button type="button" onClick={save} disabled={!location.trim()} className="rounded-md bg-[#191970] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#11115c] disabled:bg-slate-300">Guardar cambios</button>
        </footer>
      </section>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return <article className="flex items-center gap-3 rounded-lg border border-[#dde3ef] bg-white px-4 py-3 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#eef2ff] text-[#191970]">{icon}</span><div><strong className="block text-xl text-[#191970]">{value}</strong><span className="text-sm font-semibold text-slate-500">{label}</span></div></article>;
}

function ScheduleFact({ icon, label }: { icon: ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-2 font-semibold text-slate-600"><span className="text-[#191970]">{icon}</span>{label}</span>;
}

function CalendarButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} aria-label={label} title={label} className="grid h-9 w-9 place-items-center rounded-md border border-[#d8deeb] text-[#191970] hover:bg-[#eef2ff]">{children}</button>;
}

function buildCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const mondayBasedOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [...Array<Date | null>(mondayBasedOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => new Date(year, month, index + 1))];
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { weekday: "short", day: "numeric", month: "short" }).format(parseIsoDate(value)).replace(/\./g, "");
}

function formatTime(value: string) {
  if (!value) return "";
  const [hour, minute] = value.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function statusRank(status: PhysicalClassRequestStatus) {
  return { pending: 0, reschedule_proposed: 1, accepted: 2, rejected: 3 }[status];
}

function requestDisplayDate(request: PhysicalClassRequest) {
  return request.status === "reschedule_proposed" && request.proposedDate ? request.proposedDate : request.requestedDate;
}

function isInMonth(value: string, month: Date) {
  const date = parseIsoDate(value);
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}
