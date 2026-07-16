"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  FileText,
  MessageSquare,
  Search,
  UserRound
} from "lucide-react";
import type { ClassroomClassSummary } from "@homeschool/shared";
import { classroomApi } from "@/features/classroom/classroom-api";
export function StudentClassesV1Page() {
  const [classes, setClasses] = useState<ClassroomClassSummary[]>([]),
    [query, setQuery] = useState(""),
    [message, setMessage] = useState("Cargando clases…");
  useEffect(() => {
    classroomApi
      .studentClasses()
      .then((x) => {
        setClasses(x);
        setMessage(x.length ? "" : "No tienes clases asignadas.");
      })
      .catch(() => setMessage("No fue posible cargar tus clases."));
  }, []);
  const filtered = useMemo(
    () =>
      classes.filter((c) =>
        `${c.name} ${c.code} ${c.subjects.map((s) => s.name).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase())
      ),
    [classes, query]
  );
  return (
    <div className="space-y-5 p-5 lg:p-8">
      <section className="flex flex-col gap-4 rounded-xl border bg-white p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#078cc5]">Espacios académicos</p>
          <h2 className="mt-1 text-3xl font-semibold text-[#191970]">Mis clases</h2>
          <p className="mt-2 text-sm text-slate-500">
            Entra al muro, revisa tareas, PACEs y materiales de cada curso.
          </p>
        </div>
        <label className="relative">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clase o materia"
            className="h-11 rounded-lg border pl-9 pr-3 text-sm sm:w-72"
          />
        </label>
      </section>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
          return (
            <Link
              key={c.id}
              href={`/student/classes/${c.id}`}
              className="group overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="h-2" style={{ backgroundColor: c.color ?? "#191970" }} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#eef2ff] text-[#191970]">
                    <BookOpen size={21} />
                  </span>
                  <ChevronRight className="text-slate-300 group-hover:text-[#191970]" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#078cc5]">
                  {c.code} · {c.gradeName || "Curso"}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-[#191970]">{c.name}</h3>
                <p className="mt-2 line-clamp-2 min-h-10 text-sm text-slate-500">
                  {c.description || "Espacio de aprendizaje, recursos y comunicación de la clase."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.subjects.slice(0, 4).map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        color: s.color ?? "#191970",
                        backgroundColor: `${s.color ?? "#191970"}12`
                      }}
                    >
                      {s.shortName}
                    </span>
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4 text-center">
                      <Stat
                        icon={<ClipboardList />}
                        value={c.pendingAssignmentsCount}
                        label="Pendientes"
                      />
                      <Stat icon={<FileText />} value={c.materialCount} label="Recursos" />
                      <Stat icon={<MessageSquare />} value={c.wallPostCount} label="Novedades" />
                </div>
                <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <UserRound size={14} />
                  {c.teachers.map((t) => t.displayName).join(", ") || "Profesor por asignar"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      {message && <p className="p-8 text-center text-sm text-slate-500">{message}</p>}
    </div>
  );
}
function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="text-slate-500">
      <span className="mx-auto flex justify-center text-[#078cc5]">{icon}</span>
      <strong className="mt-1 block text-base text-[#191970]">{value}</strong>
      <span className="text-[10px] font-semibold">{label}</span>
    </div>
  );
}
