"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BookOpenCheck, CheckCircle2, ClipboardList, MessageSquareText, Search } from "lucide-react";
import { PaceRecordSummary } from "@homeschool/shared";
import { getStudentGrades } from "@/features/paces/pace-api";

type Filter = "Todos" | "Calificados" | "Pendientes";

export function StudentGradesPage() {
  const [rows, setRows] = useState<PaceRecordSummary[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Todos");
  const [message, setMessage] = useState("Cargando tus notas...");

  useEffect(() => {
    let ignore = false;

    getStudentGrades()
      .then((items) => {
        if (ignore) return;
        setRows(items);
        setMessage(items.length ? "" : "Aún no tienes PACEs completados.");
      })
      .catch(() => setMessage("No pudimos cargar tus notas desde la API."));

    return () => {
      ignore = true;
    };
  }, []);

  const graded = rows.filter((row) => row.grade);
  const pending = rows.filter((row) => !row.grade);
  const subjectSummaries = Array.from(new Map(rows.map((row) => [row.subject.id, row.subject])).values()).map((subject) => {
    const subjectRows = rows.filter((row) => row.subject.id === subject.id);
    return {
      ...subject,
      completed: subjectRows.length,
      graded: subjectRows.filter((row) => Boolean(row.grade)).length
    };
  });
  const targetPaces = subjectSummaries.reduce((sum, subject) => sum + subject.targetPaces, 0);
  const filtered = rows.filter((row) => {
    const matchesStatus = filter === "Todos" || (filter === "Calificados" ? Boolean(row.grade) : !row.grade);
    const matchesSearch = `${row.subject.name} ${row.subject.shortName} ${row.pace.number}`.toLowerCase().includes(query.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (!rows.length && message) {
    return <div className="grid h-full place-items-center text-sm text-slate-500">{message}</div>;
  }

  return (
    <div className="min-h-full px-5 py-6 lg:px-8">
      <section className="flex shrink-0 flex-col gap-5 rounded-lg border border-[#dde3ef] bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-[#078cc5]">Calificaciones por PACE</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#191970]">Mis notas</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Consulta las notas que tu profesor registró al completar cada PACE y revisa sus observaciones.
          </p>
        </div>
        <label className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar materia o PACE" className="h-11 w-full rounded-md border border-[#d8deeb] pl-9 pr-3 text-sm outline-none focus:border-[#191970] sm:w-80" />
        </label>
      </section>

      <section className="mt-6 grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<BookOpenCheck size={19} />} label="PACEs realizados" value={`${rows.length}/${targetPaces}`} />
        <Metric icon={<CheckCircle2 size={19} />} label="Calificados" value={graded.length} />
        <Metric icon={<ClipboardList size={19} />} label="Pendientes" value={pending.length} />
        <Metric icon={<CheckCircle2 size={19} />} label="Materias" value={subjectSummaries.length} />
      </section>

      <section className="mt-6 shrink-0 rounded-xl border border-[#dde3ef] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><h3 className="font-semibold text-[#191970]">Avance por materia</h3><p className="mt-1 text-xs text-slate-500">PACEs realizados de la meta definida para cada materia.</p></div><span className="text-xs font-semibold text-slate-400">{subjectSummaries.length} materias</span></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{subjectSummaries.map((subject) => <article key={subject.id} className="rounded-lg border p-4"><div className="flex items-center justify-between"><div><span className="rounded px-2 py-1 text-xs font-bold" style={{ color: subject.color ?? "#191970", backgroundColor: `${subject.color ?? "#191970"}12` }}>{subject.shortName}</span><p className="mt-2 text-sm font-semibold text-[#191970]">{subject.name}</p></div><strong className="tabular-nums text-xl text-[#191970]">{subject.completed}/{subject.targetPaces}</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#078cc5]" style={{ width: `${subject.targetPaces ? Math.min(100, subject.completed / subject.targetPaces * 100) : 0}%` }} /></div><p className="mt-2 text-xs text-slate-500">PACEs realizados</p></article>)}</div>
      </section>

      <section className="mt-6 rounded-lg border border-[#dde3ef] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#edf0f6] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(["Todos", "Calificados", "Pendientes"] as const).map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === item ? "bg-[#191970] text-white" : "bg-[#f4f6fb] text-slate-600"}`}>
                {item}
              </button>
            ))}
          </div>
          <span className="text-sm font-semibold text-slate-400">{filtered.length} registros</span>
        </div>

        <div>
          <div className="hidden grid-cols-[minmax(14rem,1fr)_8rem_9rem_minmax(16rem,1.2fr)_8rem] gap-4 border-b bg-[#f8f9fc] px-5 py-3 text-xs font-bold uppercase tracking-[0.13em] text-slate-400 xl:grid">
            <span>Materia</span>
            <span>PACE</span>
            <span>Nota</span>
            <span>Retroalimentación</span>
            <span>Actualizado</span>
          </div>
          <div className="divide-y divide-[#edf0f6]">
            {filtered.map((row) => (
              <article key={row.id} className="grid gap-4 p-5 xl:grid-cols-[minmax(14rem,1fr)_8rem_9rem_minmax(16rem,1.2fr)_8rem] xl:items-center">
                <div>
                  <span className="rounded px-2 py-1 text-xs font-bold" style={{ color: row.subject.color ?? "#191970", backgroundColor: `${row.subject.color ?? "#191970"}12` }}>
                    {row.subject.shortName}
                  </span>
                  <h3 className="mt-2 font-semibold text-[#191970]">{row.subject.name}</h3>
                  <p className="mt-1 text-xs text-slate-400">{row.class.name}</p>
                </div>
                <strong className="text-lg text-[#191970]">{row.pace.number}</strong>
                <GradeBadge score={row.grade?.score} />
                <div className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#eef2ff] text-[#191970]">
                    <MessageSquareText size={17} />
                  </span>
                  <p className="text-sm leading-5 text-slate-600">{row.grade?.feedback ?? "Aún no hay observaciones registradas."}</p>
                </div>
                <span className="text-sm font-semibold text-slate-500">{row.grade ? shortDate(row.grade.updatedAt) : "Pendiente"}</span>
              </article>
            ))}
          </div>
          {!filtered.length ? <div className="p-12 text-center text-sm text-slate-500">No hay notas con este filtro.</div> : null}
        </div>
      </section>
    </div>
  );
}

function GradeBadge({ score }: { score?: number }) {
  if (score === undefined) return <span className="inline-flex w-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Pendiente</span>;
  return <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-bold ${score >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{score}/100</span>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <article className="flex items-center gap-4 rounded-lg border border-[#dde3ef] bg-white p-5 shadow-sm">
      <span className="grid h-10 w-10 place-items-center rounded-md bg-[#eaf7fc] text-[#078cc5]">{icon}</span>
      <div>
        <strong className="block text-2xl text-[#191970]">{value}</strong>
        <span className="text-sm font-semibold text-slate-500">{label}</span>
      </div>
    </article>
  );
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(new Date(value));
}
