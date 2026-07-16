"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BookOpenCheck, CheckCircle2, ClipboardList, Edit3, Search, X } from "lucide-react";
import { PaceRecordSummary } from "@homeschool/shared";
import { getTeacherGrades, gradeTeacherPace, updateTeacherPaceGrade } from "@/features/paces/pace-api";

type Filter = "Todos" | "Pendientes" | "Calificados";

export function TeacherGradesPage() {
  const [rows, setRows] = useState<PaceRecordSummary[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("Pendientes");
  const [classFilter, setClassFilter] = useState("all");
  const [editing, setEditing] = useState<PaceRecordSummary | null>(null);
  const [message, setMessage] = useState("Cargando calificaciones reales...");

  useEffect(() => {
    let ignore = false;

    getTeacherGrades()
      .then((items) => {
        if (ignore) return;
        setRows(items);
        setMessage(items.length ? "" : "No hay PACEs completados para calificar.");
      })
      .catch(() => setMessage("No se pudieron cargar las calificaciones desde la API."));

    return () => {
      ignore = true;
    };
  }, []);

  const classes = useMemo(() => Array.from(new Map(rows.map((row) => [row.class.id, row.class])).values()), [rows]);
  const filtered = rows.filter((row) => {
    const isGraded = Boolean(row.grade);
    const matchesStatus = filter === "Todos" || (filter === "Pendientes" ? !isGraded : isGraded);
    const matchesClass = classFilter === "all" || row.class.id === classFilter;
    const matchesSearch = `${row.student.displayName} ${row.subject.name} ${row.class.name} ${row.pace.number}`.toLowerCase().includes(query.toLowerCase());
    return matchesStatus && matchesClass && matchesSearch;
  });
  const graded = rows.filter((row) => row.grade).length;
  const pending = rows.length - graded;
  const average = graded ? Math.round(rows.reduce((sum, row) => sum + (row.grade?.score ?? 0), 0) / graded) : 0;

  function replaceRecord(updated: PaceRecordSummary) {
    setRows((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-6 lg:px-8">
        <section className="flex shrink-0 flex-col gap-5 rounded-lg border border-[#dde3ef] bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#078cc5]">Evaluación por PACEs</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#191970]">Calificación</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Cada PACE completado queda ligado al estudiante, materia y número de PACE en la base de datos.
            </p>
            {message ? <p className="mt-3 text-xs font-semibold text-amber-700">{message}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="control">
              <option value="all">Todas las clases</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <label className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar estudiante o PACE" className="control w-64 pl-9" />
            </label>
          </div>
        </section>

        <section className="mt-6 grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<BookOpenCheck size={19} />} label="PACEs completados" value={rows.length} />
          <Metric icon={<ClipboardList size={19} />} label="Pendientes de nota" value={pending} />
          <Metric icon={<CheckCircle2 size={19} />} label="Calificados" value={graded} />
          <Metric icon={<CheckCircle2 size={19} />} label="Promedio" value={graded ? `${average}%` : "Sin notas"} />
        </section>

        <section className="mt-6 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#edf0f6] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(["Todos", "Pendientes", "Calificados"] as const).map((item) => (
                <button key={item} onClick={() => setFilter(item)} className={`rounded-md px-3 py-2 text-sm font-semibold ${filter === item ? "bg-[#191970] text-white" : "bg-[#f4f6fb] text-slate-600"}`}>
                  {item}
                </button>
              ))}
            </div>
            <span className="text-sm font-semibold text-slate-400">{filtered.length} registros</span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="hidden grid-cols-[minmax(15rem,1.1fr)_12rem_8rem_10rem_8rem_7rem] gap-4 border-b bg-[#f8f9fc] px-5 py-3 text-xs font-bold uppercase tracking-[0.13em] text-slate-400 xl:grid">
              <span>Estudiante</span>
              <span>Materia</span>
              <span>PACE</span>
              <span>Clase</span>
              <span>Nota</span>
              <span>Acción</span>
            </div>
            <div className="divide-y divide-[#edf0f6]">
              {filtered.map((row) => (
                <article key={row.id} className="grid gap-4 p-5 xl:grid-cols-[minmax(15rem,1.1fr)_12rem_8rem_10rem_8rem_7rem] xl:items-center">
                  <div>
                    <p className="font-semibold text-[#191970]">{row.student.displayName}</p>
                    <p className="mt-1 text-xs text-slate-400">{row.student.gradeLevel ?? "Sin grado"}</p>
                  </div>
                  <div>
                    <span className="rounded px-2 py-1 text-xs font-bold" style={{ color: row.subject.color ?? "#191970", backgroundColor: `${row.subject.color ?? "#191970"}12` }}>
                      {row.subject.shortName}
                    </span>
                    <p className="mt-1 text-sm font-semibold text-slate-700">{row.subject.name}</p>
                  </div>
                  <strong className="text-lg text-[#191970]">{row.pace.number}</strong>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{row.class.code}</p>
                    <p className="mt-1 truncate text-xs text-slate-400">{row.class.name}</p>
                  </div>
                  <GradeBadge score={row.grade?.score} />
                  <button onClick={() => setEditing(row)} className="inline-flex items-center justify-center gap-2 rounded-md border border-[#d8deeb] px-3 py-2 text-sm font-semibold text-[#191970] hover:bg-[#eef2ff]">
                    <Edit3 size={15} />
                    {row.grade ? "Editar" : "Calificar"}
                  </button>
                </article>
              ))}
            </div>
            {!filtered.length ? <div className="p-12 text-center text-sm text-slate-500">No hay PACEs con este filtro.</div> : null}
          </div>
        </section>
      </div>

      {editing ? (
        <GradeDialog
          row={editing}
          onClose={() => setEditing(null)}
          onSave={async (score, feedback) => {
            const updated = editing.grade
              ? await updateTeacherPaceGrade(editing.grade.id, { score, feedback })
              : await gradeTeacherPace(editing.id, { score, feedback });
            replaceRecord(updated);
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

function GradeDialog({ row, onClose, onSave }: { row: PaceRecordSummary; onClose: () => void; onSave: (score: number, feedback?: string) => void }) {
  const [score, setScore] = useState(row.grade?.score ?? 90);
  const [feedback, setFeedback] = useState(row.grade?.feedback ?? "");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <section className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Calificar PACE</p>
            <h3 className="mt-1 text-lg font-semibold text-[#191970]">{row.student.displayName} · PACE {row.pace.number}</h3>
            <p className="mt-1 text-sm text-slate-500">{row.subject.name} · {row.class.name}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        </header>

        <div className="space-y-4 p-5">
          <label className="block text-sm font-semibold text-slate-700">
            Nota final del PACE
            <input type="number" min={0} max={100} value={score} onChange={(event) => setScore(Number(event.target.value))} className="input" />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Retroalimentación
            <textarea rows={4} value={feedback} onChange={(event) => setFeedback(event.target.value)} className="mt-2 w-full resize-none rounded-md border border-[#d8deeb] px-3 py-3 text-sm outline-none focus:border-[#191970]" />
          </label>
        </div>

        <footer className="flex justify-end gap-3 border-t p-5">
          <button onClick={onClose} className="secondary">Cancelar</button>
          <button onClick={() => onSave(Math.max(0, Math.min(100, score)), feedback.trim() || undefined)} className="primary">Guardar nota</button>
        </footer>
      </section>
    </div>
  );
}

function GradeBadge({ score }: { score?: number }) {
  if (score === undefined) return <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Pendiente</span>;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${score >= 80 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{score}%</span>;
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number | string }) {
  return (
    <article className="flex items-center gap-4 rounded-lg border border-[#dde3ef] bg-white p-5 shadow-sm">
      <span className="grid h-10 w-10 place-items-center rounded-md bg-[#eef2ff] text-[#191970]">{icon}</span>
      <div>
        <strong className="block text-2xl text-[#191970]">{value}</strong>
        <span className="text-sm font-semibold text-slate-500">{label}</span>
      </div>
    </article>
  );
}
