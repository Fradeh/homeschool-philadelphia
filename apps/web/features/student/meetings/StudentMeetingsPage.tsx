"use client";

import { useEffect, useMemo, useState } from "react";
import { PhysicalBookingStatus, type AcademicClassOption, type StudentPhysicalBooking, type TeacherAvailabilitySlot } from "@homeschool/shared";
import { CalendarDays, MapPin, X } from "lucide-react";
import { scheduleApi } from "@/features/schedules/schedule-api";

export function StudentMeetingsPage() {
  const [classes, setClasses] = useState<AcademicClassOption[]>([]);
  const [bookings, setBookings] = useState<StudentPhysicalBooking[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [slots, setSlots] = useState<TeacherAvailabilitySlot[]>([]);
  const [activeSlot, setActiveSlot] = useState<TeacherAvailabilitySlot | null>(null);
  const [message, setMessage] = useState("");
  const subjects = useMemo(() => classes.flatMap((item) => item.subjects.map((subject) => ({ ...subject, className: item.name }))), [classes]);

  async function loadBookings() { setBookings(await scheduleApi.student.bookings()); }
  useEffect(() => { Promise.all([scheduleApi.student.classes(), scheduleApi.student.bookings()]).then(([nextClasses, nextBookings]) => { setClasses(nextClasses); setBookings(nextBookings); setSubjectId(nextClasses[0]?.subjects[0]?.id ?? ""); }).catch(() => setMessage("No fue posible cargar tus encuentros.")); }, []);
  useEffect(() => { if (!subjectId) { setSlots([]); return; } scheduleApi.student.availability(subjectId).then(setSlots).catch(() => setSlots([])); }, [subjectId]);

  async function book(date: string, note: string) {
    if (!activeSlot) return;
    try { await scheduleApi.student.book(activeSlot.classSubjectId, { availabilitySlotId: activeSlot.id, scheduledDate: date, studentNote: note || undefined }); await loadBookings(); setActiveSlot(null); setMessage("Solicitud enviada al profesor."); }
    catch { setMessage("No se pudo reservar. Revisa la fecha o si ya existe una solicitud."); }
  }

  async function cancel(id: string) { await scheduleApi.student.cancel(id); await loadBookings(); }

  return <div className="grid gap-6 p-5 lg:grid-cols-[1fr_24rem] lg:p-8">
    <section className="space-y-5"><div className="rounded-xl border bg-white p-5"><p className="text-sm font-semibold text-[#078cc5]">Disponibilidad docente</p><h2 className="mt-1 text-2xl font-semibold text-[#191970]">Solicitar encuentro</h2><select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="input mt-4 max-w-md"><option value="">Selecciona una materia</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name} · {subject.className}</option>)}</select></div>{message ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p> : null}<div className="grid gap-4 md:grid-cols-2">{slots.map((slot) => <article key={slot.id} className="rounded-xl border bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-wider text-[#078cc5]">{weekdayLabel(slot.weekday)}</p><h3 className="mt-1 text-lg font-semibold text-[#191970]">{slot.startTime}–{slot.endTime}</h3><p className="mt-2 text-sm text-slate-600">{slot.teacherName}</p>{slot.location ? <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><MapPin size={15}/>{slot.location}</p> : null}<button onClick={() => setActiveSlot(slot)} className="primary mt-4">Elegir fecha</button></article>)}{subjectId && !slots.length ? <p className="text-sm text-slate-500">El profesor aún no publicó disponibilidad.</p> : null}</div></section>
    <aside className="rounded-xl border bg-white p-5"><h3 className="font-semibold text-[#191970]">Mis solicitudes</h3><div className="mt-4 space-y-3">{bookings.map((booking) => <article key={booking.id} className="rounded-lg bg-[#f6f8fc] p-4"><p className="font-semibold text-[#191970]">{booking.subjectName}</p><p className="mt-1 text-sm text-slate-600">{booking.scheduledDate} · {booking.startTime}</p><p className="mt-2 text-xs font-bold text-[#078cc5]">{booking.status}</p>{[PhysicalBookingStatus.PENDING, PhysicalBookingStatus.APPROVED].includes(booking.status) ? <button onClick={() => cancel(booking.id)} className="mt-3 text-xs font-semibold text-rose-700">Cancelar</button> : null}</article>)}</div></aside>
    {activeSlot ? <BookingDialog slot={activeSlot} onClose={() => setActiveSlot(null)} onBook={book}/> : null}
  </div>;
}

function BookingDialog({ slot, onClose, onBook }: { slot: TeacherAvailabilitySlot; onClose: () => void; onBook: (date: string, note: string) => void }) {
  const dates = availableDates(slot.weekday);
  const [date, setDate] = useState(dates[0] ?? ""); const [note, setNote] = useState("");
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4"><section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"><header className="flex items-start justify-between border-b p-5"><div><p className="text-xs font-bold uppercase tracking-wider text-[#078cc5]">{slot.subjectName}</p><h3 className="mt-1 text-xl font-semibold text-[#191970]">Selecciona una fecha</h3><p className="mt-1 text-sm text-slate-500">{weekdayLabel(slot.weekday)} · {slot.startTime}–{slot.endTime}</p></div><button onClick={onClose}><X/></button></header><div className="p-5"><div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{dates.map((item) => <button key={item} onClick={() => setDate(item)} className={`rounded-lg border p-2 text-xs ${date === item ? "border-[#191970] bg-[#191970] text-white" : "bg-white text-slate-600"}`}><CalendarDays size={14} className="mx-auto mb-1"/>{item.slice(5)}</button>)}</div><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Nota para el profesor (opcional)" className="mt-5 w-full rounded-lg border p-3 text-sm" rows={3}/><div className="mt-5 flex justify-end gap-2"><button onClick={onClose} className="secondary">Cancelar</button><button disabled={!date} onClick={() => onBook(date, note)} className="primary">Solicitar</button></div></div></section></div>;
}

function availableDates(weekday: TeacherAvailabilitySlot["weekday"]) { const target = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].indexOf(weekday); const today = new Date(); today.setHours(0, 0, 0, 0); const end = new Date(today.getFullYear(), today.getMonth() + 2, 0); const result: string[] = []; for (const date = new Date(today); date <= end; date.setDate(date.getDate() + 1)) if (date.getDay() === target) result.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`); return result; }
function weekdayLabel(value: string) { return ({ MONDAY: "Lunes", TUESDAY: "Martes", WEDNESDAY: "Miércoles", THURSDAY: "Jueves", FRIDAY: "Viernes" } as Record<string, string>)[value] ?? value; }
