"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PhysicalBookingStatus,
  Weekday,
  type AcademicClassOption,
  type StudentPhysicalBooking,
  type TeacherAvailabilitySlot
} from "@homeschool/shared";
import { scheduleApi } from "@/features/schedules/schedule-api";

export function TeacherMeetingsPage() {
  const [classes, setClasses] = useState<AcademicClassOption[]>([]);
  const [slots, setSlots] = useState<TeacherAvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<StudentPhysicalBooking[]>([]);
  const [message, setMessage] = useState("");
  const subjects = useMemo(
    () =>
      classes.flatMap((item) =>
        item.subjects.map((subject) => ({ ...subject, className: item.name }))
      ),
    [classes]
  );
  async function load() {
    const [nextClasses, nextSlots, nextBookings] = await Promise.all([
      scheduleApi.teacher.classes(),
      scheduleApi.teacher.availability(),
      scheduleApi.teacher.bookings()
    ]);
    setClasses(nextClasses);
    setSlots(nextSlots);
    setBookings(nextBookings);
  }
  useEffect(() => {
    load().catch(() => setMessage("No fue posible cargar los encuentros."));
  }, []);
  async function create(form: FormData) {
    try {
      await scheduleApi.teacher.createAvailability({
        classSubjectId: String(form.get("classSubjectId")),
        weekday: String(form.get("weekday")) as Weekday,
        startTime: String(form.get("startTime")),
        endTime: String(form.get("endTime")),
        location: String(form.get("location") || "") || undefined,
        instructions: String(form.get("instructions") || "") || undefined
      });
      await load();
      setMessage("Disponibilidad publicada.");
    } catch {
      setMessage("No se pudo publicar la disponibilidad.");
    }
  }
  async function status(id: string, next: PhysicalBookingStatus) {
    await scheduleApi.teacher.updateBooking(id, { status: next });
    await load();
  }
  return (
    <div className="space-y-6 p-5 lg:p-8">
      {message ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p>
      ) : null}
      <section className="rounded-xl border bg-white p-5">
        <h2 className="text-xl font-semibold text-[#191970]">Publicar disponibilidad</h2>
        <form action={create} className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <select name="classSubjectId" required className="input">
            <option value="">Materia</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} · {subject.className}
              </option>
            ))}
          </select>
          <select name="weekday" required className="input">
            {Object.values(Weekday).map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
          <input name="startTime" type="time" required className="input" />
          <input name="endTime" type="time" required className="input" />
          <input name="location" placeholder="Ubicación" className="input" />
          <button className="primary">Publicar</button>
        </form>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-[#191970]">Disponibilidad activa</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {slots.map((slot) => (
            <article key={slot.id} className="rounded-xl border bg-white p-4">
              <p className="font-semibold text-[#191970]">{slot.subjectName}</p>
              <p className="mt-1 text-sm text-slate-600">
                {slot.weekday} · {slot.startTime}–{slot.endTime}
              </p>
              <button
                onClick={async () => {
                  await scheduleApi.teacher.updateAvailability(slot.id, {
                    isActive: !slot.isActive
                  });
                  await load();
                }}
                className="mt-3 text-xs font-semibold text-[#078cc5]"
              >
                {slot.isActive ? "Desactivar" : "Activar"}
              </button>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-xl font-semibold text-[#191970]">Solicitudes</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {bookings.map((booking) => (
            <article key={booking.id} className="rounded-xl border bg-white p-5">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#191970]">{booking.studentName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {booking.subjectName} · {booking.scheduledDate} · {booking.startTime}
                  </p>
                </div>
                <b className="text-xs text-[#078cc5]">{booking.status}</b>
              </div>
              {booking.studentNote ? (
                <p className="mt-3 rounded bg-slate-50 p-3 text-sm">{booking.studentNote}</p>
              ) : null}
              {booking.status === PhysicalBookingStatus.PENDING ? (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => status(booking.id, PhysicalBookingStatus.APPROVED)}
                    className="rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Aprobar
                  </button>
                </div>
              ) : booking.status === PhysicalBookingStatus.APPROVED ? (
                <button
                  onClick={() => status(booking.id, PhysicalBookingStatus.CANCELLED)}
                  className="mt-4 text-xs font-semibold text-rose-700"
                >
                  Cancelar encuentro
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
