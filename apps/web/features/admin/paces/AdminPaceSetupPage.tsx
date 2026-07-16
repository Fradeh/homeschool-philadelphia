"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, Search } from "lucide-react";
import { AcademicStatus, type AdminSubjectSummary } from "@homeschool/shared";
import { getAdminSubjects, updateAdminSubject } from "../admin-api";

export function AdminPaceSetupPage() {
  const [subjects, setSubjects] = useState<AdminSubjectSummary[]>([]);
  const [query, setQuery] = useState("");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("Cargando configuración…");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("es"));
  const filtered = useMemo(() => subjects.filter((subject) => `${subject.name} ${subject.shortName}`.toLocaleLowerCase("es").includes(deferredQuery)), [subjects, deferredQuery]);

  useEffect(() => {
    let ignore = false;
    getAdminSubjects().then((data) => { if (!ignore) { setSubjects(data); setMessage(""); } }).catch((error: Error) => !ignore && setMessage(error.message));
    return () => { ignore = true; };
  }, []);

  async function toggle(subject: AdminSubjectSummary) {
    setSavingId(subject.id);
    setMessage("");
    try {
      const updated = await updateAdminSubject(subject.id, { paceEnabled: !subject.paceEnabled });
      setSubjects((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage(updated.paceEnabled ? `${updated.name} ya está disponible para la gestión docente de PACEs.` : `PACEs deshabilitado para ${updated.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar la configuración.");
    } finally {
      setSavingId("");
    }
  }

  const enabledCount = subjects.filter((subject) => subject.paceEnabled).length;
  const groupsWithPaces = subjects.filter((subject) => subject.paceEnabled).reduce((total, subject) => total + subject.classCount, 0);

  return <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col gap-5 overflow-hidden px-5 py-6 lg:px-8">
    <section className="shrink-0 rounded-xl border border-[#dde3ef] bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f75a8]">Configuración PACE</p><h2 className="mt-1 text-2xl font-semibold text-[#191970]">Materias que trabajan con PACEs</h2><p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">El administrador solo habilita la modalidad PACE. El profesor define para cada alumno el número actual y cuántos PACEs trabajará.</p></section>
    {message ? <p className="shrink-0 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="status">{message}</p> : null}
    <section className="grid shrink-0 gap-4 sm:grid-cols-3"><Metric value={subjects.length} label="Materias registradas" /><Metric value={enabledCount} label="Con PACEs habilitado" /><Metric value={groupsWithPaces} label="Grupos alcanzados" /></section>
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dde3ef] bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#eef2ff] text-[#191970]"><BookOpenCheck size={19} /></span><div><h3 className="font-semibold text-[#191970]">Habilitar PACEs por materia</h3><p className="text-xs text-slate-500">Las materias se crean en el apartado Materias.</p></div></div><label className="relative"><span className="sr-only">Buscar materia</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar materia" className="control w-full pl-9 sm:w-72" /></label></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-4"><div className="grid gap-3 lg:grid-cols-2">{filtered.map((subject) => <article key={subject.id} className={`flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between ${subject.paceEnabled ? "border-indigo-200 bg-indigo-50/40" : "border-[#dde3ef]"}`}><div className="flex min-w-0 items-start gap-3"><span className="mt-1 h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: subject.color ?? "#191970" }} /><div><div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-[#191970]">{subject.name}</h4><span className="rounded bg-white px-2 py-0.5 text-xs font-bold text-slate-500">{subject.shortName}</span></div><p className="mt-1 text-sm text-slate-500">{subject.classCount} grupos vinculados</p><p className="mt-2 text-xs font-semibold text-slate-600">{subject.paceEnabled ? "El profesor puede gestionar números y cantidades." : "Materia regular; no aparece en la gestión docente de PACEs."}</p></div></div><button type="button" disabled={savingId === subject.id || (!subject.paceEnabled && subject.status !== AcademicStatus.ACTIVE)} onClick={() => toggle(subject)} className={subject.paceEnabled ? "secondary shrink-0 disabled:opacity-50" : "primary shrink-0 disabled:opacity-50"}>{savingId === subject.id ? "Guardando…" : subject.paceEnabled ? "Deshabilitar PACEs" : "Habilitar PACEs"}</button></article>)}</div>{!filtered.length ? <div className="grid min-h-48 place-items-center text-center"><div><p className="text-sm text-slate-500">{deferredQuery ? "No hay coincidencias con la búsqueda." : "No hay materias registradas."}</p>{!deferredQuery ? <Link href="/admin/subjects" className="primary mt-4 inline-flex">Ir a Materias</Link> : null}</div></div> : null}</div>
    </section>
  </div>;
}

function Metric({ value, label }: { value: number; label: string }) { return <article className="rounded-xl border border-[#dde3ef] bg-white p-4 shadow-sm"><strong className="block text-2xl text-[#191970]">{value}</strong><span className="mt-1 block text-sm text-slate-500">{label}</span></article>; }
