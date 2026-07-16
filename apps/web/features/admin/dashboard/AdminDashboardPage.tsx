"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpenCheck, GraduationCap, UserRoundCog, UsersRound } from "lucide-react";
import { AdminAcademicOverview, AdminClassSummary } from "@homeschool/shared";
import { getAdminClasses, getAdminOverview } from "../admin-api";

const emptyOverview: AdminAcademicOverview = { users: { total: 0, teachers: 0, students: 0, parents: 0, directors: 0 }, classes: { total: 0, active: 0 }, subjects: { total: 0, active: 0 }, familyLinks: { total: 0 } };

export function AdminDashboardPage() {
  const [overview, setOverview] = useState<AdminAcademicOverview>(emptyOverview);
  const [classes, setClasses] = useState<AdminClassSummary[]>([]);
  const [source, setSource] = useState<"loading" | "api" | "error">("loading");

  useEffect(() => {
    let ignore = false;

    Promise.all([getAdminOverview(), getAdminClasses()])
      .then(([nextOverview, nextClasses]) => {
        if (ignore) return;
        setOverview(nextOverview);
        setClasses(nextClasses);
        setSource("api");
      })
      .catch(() => setSource("error"));

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-6 lg:px-8">
      <section className="shrink-0 rounded-lg bg-[#191970] p-6 text-white shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">Centro de configuración</p>
            <h2 className="mt-2 text-2xl font-semibold">Operación académica lista para configurar.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
              Desde este panel se preparan usuarios, familias, clases y PACEs para que profesores, alumnos y padres solo vean lo que les corresponde.
            </p>
          </div>
          {source === "loading" ? <span className="w-fit rounded-md bg-white/10 px-3 py-2 text-xs font-bold text-white/75">Cargando…</span> : null}
          {source === "error" ? <span className="w-fit rounded-md bg-rose-500/20 px-3 py-2 text-xs font-bold text-white">API no disponible</span> : null}
        </div>
      </section>

      <section className="mt-5 grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<UserRoundCog size={20} />} label="Profesores" value={overview.users.teachers} />
        <Metric icon={<GraduationCap size={20} />} label="Alumnos" value={overview.users.students} />
        <Metric icon={<UsersRound size={20} />} label="Familias ligadas" value={overview.familyLinks.total} />
        <Metric icon={<BookOpenCheck size={20} />} label="Materias PACE" value={overview.subjects.total} />
      </section>

      <section className="mt-5 grid min-h-0 flex-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,.8fr)]">
        <div className="min-h-0 overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
          <header className="border-b border-[#edf0f6] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Siguiente configuración</p>
            <h3 className="mt-1 text-lg font-semibold text-[#191970]">Módulos administrativos</h3>
          </header>
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            <ModuleCard href="/admin/users" title="Usuarios" detail="Crear y activar profesores, alumnos, padres y directivos." />
            <ModuleCard href="/admin/classes" title="Clases" detail="Asignar profesores, matricular alumnos y ligar materias." />
            <ModuleCard href="/admin/families" title="Familias" detail="Ligar padres o acudientes con sus hijos y permisos de comunicación." />
            <ModuleCard href="/admin/paces" title="PACEs" detail="Configurar materias, rangos iniciales y cantidad objetivo por materia." />
          </div>
        </div>

        <aside className="min-h-0 overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
          <header className="border-b border-[#edf0f6] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Clases activas</p>
            <h3 className="mt-1 text-lg font-semibold text-[#191970]">{overview.classes.active} configuradas</h3>
          </header>
          <div className="min-h-0 space-y-3 overflow-y-auto p-4">
            {classes.map((item) => (
              <article key={item.id} className="rounded-lg border border-[#e1e6ef] p-4">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color ?? "#191970" }} />
                  <div>
                    <h4 className="font-semibold text-[#191970]">{item.name}</h4>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.code} · {item.students.length} alumnos · {item.subjects.length} materias
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
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

function ModuleCard({ href, title, detail }: { href: string; title: string; detail: string }) {
  return (
    <Link href={href} className="group rounded-lg border border-[#dde3ef] p-4 transition hover:border-[#cbd3e1] hover:bg-[#fafbfc]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-[#191970]">{title}</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
        </div>
        <ArrowRight size={17} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#191970]" />
      </div>
    </Link>
  );
}
