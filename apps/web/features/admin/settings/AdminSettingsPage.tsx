"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, GraduationCap, Plus, Settings2 } from "lucide-react";
import { AdminAcademicYearSummary, GradeLevel } from "@homeschool/shared";
import { scheduleApi } from "@/features/schedules/schedule-api";
import { activateAdminAcademicYear, createAdminAcademicTerm, createAdminAcademicYear, getAdminAcademicYears } from "../admin-api";

export function AdminSettingsPage() {
  const [years, setYears] = useState<AdminAcademicYearSummary[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [message, setMessage] = useState("Cargando años académicos...");

  useEffect(() => {
    let ignore = false;

    Promise.all([getAdminAcademicYears(), scheduleApi.admin.grades()])
      .then(([items, nextGrades]) => {
        if (ignore) return;
        setYears(items);
        setGrades(nextGrades);
        setSelectedYearId(items.find((item) => item.isActive)?.id ?? items[0]?.id ?? "");
        setMessage(items.length ? "" : "Todavía no hay años académicos configurados.");
      })
      .catch(() => setMessage("No se pudo conectar con la configuración académica."));
      return () => {
      ignore = true;
    };
  }, []);

  const selectedYear = years.find((year) => year.id === selectedYearId);

  async function createYear(form: FormData) {
    const created = await createAdminAcademicYear({
      name: String(form.get("name") ?? "").trim(),
      startsAt: String(form.get("startsAt") ?? ""),
      endsAt: String(form.get("endsAt") ?? ""),
      isActive: Boolean(form.get("isActive"))
    });

    setYears((current) => [created, ...current.filter((item) => item.id !== created.id)].map((item) => (created.isActive && item.id !== created.id ? { ...item, isActive: false } : item)));
    setSelectedYearId(created.id);
    setMessage("");
  }

  async function activateYear(yearId: string) {
    const activated = await activateAdminAcademicYear(yearId);
    setYears((current) => current.map((item) => (item.id === activated.id ? activated : { ...item, isActive: false })));
    setSelectedYearId(activated.id);
  }

  async function createTerm(form: FormData) {
    if (!selectedYear) return;

    const updated = await createAdminAcademicTerm(selectedYear.id, {
      name: String(form.get("name") ?? "").trim(),
      order: Number(form.get("order") ?? selectedYear.terms.length + 1),
      startsAt: String(form.get("startsAt") ?? ""),
      endsAt: String(form.get("endsAt") ?? ""),
      isActive: Boolean(form.get("isActive"))
    });

    setYears((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setSelectedYearId(updated.id);
  }

  async function createGrade(form: FormData) {
    try {
      const created = await scheduleApi.admin.createGrade({
        code: String(form.get("code") ?? "").trim(),
        name: String(form.get("name") ?? "").trim(),
        sortOrder: Number(form.get("sortOrder") ?? grades.length + 1)
      });
      setGrades((current) => [...current.filter((item) => item.id !== created.id), created].sort((a, b) => a.sortOrder - b.sortOrder));
      setMessage("Grado creado correctamente.");
    } catch {
      setMessage("No se pudo crear el grado. Revisa que el código y el orden no estén repetidos.");
    }
  }

  return (
    <div className="grid min-h-full gap-5 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-8">
      <main className="space-y-5">
        <section className="rounded-lg border border-[#dde3ef] bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#eef2ff] text-[#191970]">
              <Settings2 size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#078cc5]">Configuración general</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#191970]">Año y periodos académicos</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Activa el año vigente y define sus periodos para que las clases nuevas usen el ciclo correcto por defecto.
              </p>
              {message ? <p className="mt-3 text-xs font-semibold text-amber-700">{message}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[#dde3ef] bg-white shadow-sm">
          <header className="border-b border-[#edf0f6] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Años académicos</p>
            <h3 className="mt-1 text-lg font-semibold text-[#191970]">{years.length} configurados</h3>
          </header>
          <div className="divide-y divide-[#edf0f6]">
            {years.map((year) => (
              <button
                key={year.id}
                onClick={() => setSelectedYearId(year.id)}
                className={`flex w-full items-center justify-between gap-4 p-5 text-left hover:bg-[#fafbfc] ${selectedYearId === year.id ? "bg-[#eef2ff]" : ""}`}
              >
                <div>
                  <h4 className="font-semibold text-[#191970]">{year.name}</h4>
                  <p className="mt-1 text-xs text-slate-500">{dateLabel(year.startsAt)} - {dateLabel(year.endsAt)} · {year.terms.length} periodos</p>
                </div>
                <div className="flex items-center gap-3">
                  {year.isActive ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Activo</span> : null}
                  {!year.isActive ? <span onClick={(event) => { event.stopPropagation(); activateYear(year.id); }} className="rounded-md border border-[#d8deeb] px-3 py-2 text-xs font-bold text-[#191970]">Activar</span> : null}
                </div>
              </button>
            ))}
          </div>
        </section>

        {selectedYear ? (
          <section className="grid gap-4 lg:grid-cols-3">
            {selectedYear.terms.map((term) => (
              <article key={term.id} className="rounded-lg border border-[#dde3ef] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-[#eef2ff] text-[#191970]">
                    {term.isActive ? <CheckCircle2 size={18} /> : <CalendarDays size={18} />}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[#191970]">{term.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">Orden {term.order} · {dateLabel(term.startsAt)}</p>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : null}
        <section className="rounded-lg border border-[#dde3ef] bg-white shadow-sm">
          <header className="border-b border-[#edf0f6] p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Grados académicos</p><h3 className="mt-1 text-lg font-semibold text-[#191970]">{grades.length} configurados</h3></header>
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">{grades.map((grade) => <article key={grade.id} className="rounded-lg border border-[#dde3ef] bg-[#f8f9fc] p-4"><p className="text-xs font-bold uppercase tracking-wide text-[#078cc5]">{grade.code}</p><h4 className="mt-1 font-semibold text-[#191970]">{grade.name}</h4><p className="mt-1 text-xs text-slate-500">Orden {grade.sortOrder}</p></article>)}{!grades.length ? <p className="text-sm text-slate-500">Todavía no hay grados configurados.</p> : null}</div>
        </section>
      </main>

      <aside className="space-y-5">
        <FormPanel title="Crear año académico" icon={<Plus size={18} />}>
          <form action={createYear} className="space-y-4">
            <Field label="Nombre"><input name="name" required placeholder="2026-2027" className="input" /></Field>
            <Field label="Inicio"><input name="startsAt" type="date" required className="input" /></Field>
            <Field label="Fin"><input name="endsAt" type="date" required className="input" /></Field>
            <Check name="isActive" label="Activar inmediatamente" />
            <button type="submit" className="primary w-full">Crear año</button>
          </form>
        </FormPanel>

        <FormPanel title="Crear periodo" icon={<CalendarDays size={18} />}>
          <form action={createTerm} className="space-y-4">
            <Field label="Año seleccionado"><input value={selectedYear?.name ?? "Selecciona un año"} readOnly className="input" /></Field>
            <Field label="Nombre"><input name="name" required placeholder="Primer trimestre" className="input" /></Field>
            <Field label="Orden"><input name="order" type="number" min={1} defaultValue={(selectedYear?.terms.length ?? 0) + 1} className="input" /></Field>
            <Field label="Inicio"><input name="startsAt" type="date" required className="input" /></Field>
            <Field label="Fin"><input name="endsAt" type="date" required className="input" /></Field>
            <Check name="isActive" label="Periodo activo" />
            <button type="submit" disabled={!selectedYear} className="primary w-full disabled:cursor-not-allowed disabled:bg-[#191970]/55">Crear periodo</button>
          </form>
        </FormPanel>
        <FormPanel title="Crear grado académico" icon={<GraduationCap size={18} />}>
          <form action={createGrade} className="space-y-4"><Field label="Código"><input name="code" required placeholder="Ej. 8" spellCheck={false} className="input" /></Field><Field label="Nombre"><input name="name" required placeholder="Ej. Octavo…" className="input" /></Field><Field label="Orden"><input name="sortOrder" type="number" min={0} defaultValue={grades.length + 1} required className="input" /></Field><button type="submit" className="primary w-full">Crear grado</button></form>
        </FormPanel>
      </aside>
    </div>
  );
}

function FormPanel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#dde3ef] bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-[#eef2ff] text-[#191970]">{icon}</span>
        <h3 className="font-semibold text-[#191970]">{title}</h3>
      </header>
      {children}
    </section>
  );
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function Check({ name, label }: { name: string; label: string }) {
  return <label className="flex items-center gap-2 rounded-md border border-[#dde3ef] px-3 py-2 text-sm font-semibold text-slate-600"><input name={name} type="checkbox" />{label}</label>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>;
}
