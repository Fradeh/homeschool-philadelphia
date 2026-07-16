"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Palette, Plus, Search } from "lucide-react";
import { AdminClassSummary, AdminSubjectSummary } from "@homeschool/shared";
import { createAdminSubject, getAdminClasses, getAdminSubjects, updateAdminSubject } from "../admin-api";

export function AdminPacesPage() {
  const [subjects, setSubjects] = useState<AdminSubjectSummary[]>([]);
  const [classes, setClasses] = useState<AdminClassSummary[]>([]);
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("Cargando datos reales...");
  const filtered = useMemo(
    () => subjects.filter((item) => `${item.name} ${item.shortName}`.toLowerCase().includes(query.toLowerCase())),
    [subjects, query]
  );

  useEffect(() => {
    let ignore = false;

    Promise.all([getAdminSubjects(), getAdminClasses()])
      .then(([nextSubjects, nextClasses]) => {
        if (ignore) return;
        setSubjects(nextSubjects);
        setClasses(nextClasses);
        setMessage("");
      })
      .catch(() => setMessage("No fue posible cargar las materias."));

    return () => {
      ignore = true;
    };
  }, []);

  async function updateColor(subject: AdminSubjectSummary, color: string) {
    setSubjects((current) => current.map((item) => (item.id === subject.id ? { ...item, color } : item)));
    const updated = await updateAdminSubject(subject.id, { color });
    setSubjects((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function createSubject(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    const shortName = String(form.get("shortName") ?? "").trim().toUpperCase();
    if (!name || !shortName) return;

    const created = await createAdminSubject({
      name,
      shortName,
      color: optionalText(form, "color")
    });

    setSubjects((current) => [created, ...current.filter((item) => item.id !== created.id)]);
    setIsCreating(false);
    setMessage("");
  }

  const classesWithPaces = classes.filter((item) => item.subjects.length).length;
  const activePaces = subjects.filter((item) => item.status === "ACTIVE").length;

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-6 lg:px-8">
        <section className="flex shrink-0 flex-col gap-5 rounded-lg border border-[#dde3ef] bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#078cc5]">Configuración PACE</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#191970]">Catálogo de PACEs</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Registra los PACEs disponibles para asignarlos a clases y profesores. La numeración y el avance los gestiona cada profesor.
            </p>
            {message ? <p className="mt-3 text-xs font-semibold text-amber-700">{message}</p> : null}
          </div>
          <button onClick={() => setIsCreating(true)} className="primary">
            <Plus size={18} />
            Nuevo PACE
          </button>
        </section>

        <section className="mt-5 grid shrink-0 gap-4 sm:grid-cols-3">
          <Metric label="Materias" value={subjects.length} />
          <Metric label="Clases con PACEs" value={classesWithPaces} />
          <Metric label="PACEs activos" value={activePaces} />
        </section>

        <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-[#edf0f6] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-[#eef2ff] text-[#191970]"><BookOpenCheck size={18} /></span>
              <div>
                <h3 className="font-semibold text-[#191970]">PACEs registrados</h3>
                <p className="text-sm text-slate-500">El profesor define el número actual y la cantidad por alumno.</p>
              </div>
            </div>
            <label className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar PACE" className="control w-72 pl-9" />
            </label>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((subject) => (
                <article key={subject.id} className="rounded-lg border border-[#dde3ef] bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-4 w-4 rounded-full" style={{ backgroundColor: subject.color ?? "#191970" }} />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: subject.color ?? "#191970" }}>{subject.shortName}</p>
                        <h3 className="mt-1 text-lg font-semibold text-[#191970]">{subject.name}</h3>
                      </div>
                    </div>
                    <span className="rounded bg-[#f4f6fb] px-2 py-1 text-xs font-bold text-slate-500">Configurado</span>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                    <p className="text-sm leading-6 text-slate-500">Disponible para vincular a clases y profesores. El número de PACE se asigna desde el portal docente.</p>
                    <Field label="Color">
                      <div className="mt-2 flex h-11 items-center gap-2 rounded-md border border-[#d8deeb] px-2">
                        <Palette size={16} className="text-slate-400" />
                        <input type="color" value={subject.color ?? "#191970"} onChange={(event) => updateColor(subject, event.target.value)} className="h-8 w-10 border-0 p-0" />
                      </div>
                    </Field>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
      {isCreating ? <CreateSubjectDialog onClose={() => setIsCreating(false)} onCreate={createSubject} /> : null}
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-[#dde3ef] bg-white p-5 shadow-sm">
      <strong className="block text-2xl text-[#191970]">{value}</strong>
      <span className="mt-1 block text-sm font-semibold text-slate-500">{label}</span>
    </article>
  );
}

function CreateSubjectDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (form: FormData) => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <section className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
        <header className="border-b p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Nuevo PACE</p>
          <h3 className="mt-1 text-lg font-semibold text-[#191970]">Registrar PACE</h3>
        </header>
        <form action={onCreate} className="space-y-4 p-5">
          <Field label="Nombre"><input name="name" required className="input" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Código"><input name="shortName" required className="input" /></Field>
            <Field label="Color"><input name="color" type="color" defaultValue="#191970" className="mt-2 h-11 w-16 rounded-md border p-1" /></Field>
          </div>
          <p className="rounded-lg bg-[#f4f6fb] p-3 text-sm leading-6 text-slate-600">El profesor definirá el número actual y la cantidad de PACEs para cada alumno.</p>
          <footer className="flex justify-end gap-3 border-t pt-5">
            <button type="button" onClick={onClose} className="secondary">Cancelar</button>
            <button type="submit" className="primary">Crear PACE</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function optionalText(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  return value || undefined;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>;
}
