"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BookOpenCheck, GraduationCap, Plus, Search, UserMinus, UserPlus, UsersRound } from "lucide-react";
import { AdminAcademicYearSummary, AdminClassSummary, AdminSubjectSummary, AdminUserSummary, GradeLevel, UserRole } from "@homeschool/shared";
import { scheduleApi } from "@/features/schedules/schedule-api";
import { assignAdminClassSubject, assignAdminClassTeacher, createAdminClass, enrollAdminClassStudent, getAdminAcademicYears, getAdminClasses, getAdminSubjects, getAdminUsers, removeAdminClassTeacher, unenrollAdminClassStudent } from "../admin-api";

export function AdminClassesPage() {
  const [classes, setClasses] = useState<AdminClassSummary[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [subjects, setSubjects] = useState<AdminSubjectSummary[]>([]);
  const [years, setYears] = useState<AdminAcademicYearSummary[]>([]);
  const [grades, setGrades] = useState<GradeLevel[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("Cargando datos reales...");

  useEffect(() => {
    let ignore = false;
    Promise.all([getAdminClasses(), getAdminUsers(), getAdminSubjects(), getAdminAcademicYears(), scheduleApi.admin.grades()])
      .then(([nextClasses, nextUsers, nextSubjects, nextYears, nextGrades]) => {
        if (ignore) return;
        setClasses(nextClasses); setUsers(nextUsers); setSubjects(nextSubjects); setYears(nextYears); setGrades(nextGrades);
        setSelectedId(nextClasses[0]?.id ?? ""); setMessage("");
      })
      .catch(() => !ignore && setMessage("No fue posible cargar la configuración de clases."));
    return () => { ignore = true; };
  }, []);

  const teachers = useMemo(() => users.filter((user) => user.roles.includes(UserRole.TEACHER) && user.teacherProfileId), [users]);
  const students = useMemo(() => users.filter((user) => user.roles.includes(UserRole.STUDENT) && user.studentProfileId), [users]);
  const selected = classes.find((item) => item.id === selectedId) ?? classes[0];
  const filtered = useMemo(() => classes.filter((item) => `${item.name} ${item.code} ${item.academicYearName} ${item.gradeLevelName ?? ""}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"))), [classes, query]);

  function updateClass(nextClass: AdminClassSummary) { setClasses((current) => current.map((item) => item.id === nextClass.id ? nextClass : item)); }
  async function perform(action: () => Promise<AdminClassSummary>, success: string) { try { updateClass(await action()); setMessage(success); } catch { setMessage("No se pudo guardar el cambio. Verifica los datos e inténtalo otra vez."); } }
  async function addTeacher(user: AdminUserSummary) { if (selected && user.teacherProfileId) await perform(() => assignAdminClassTeacher(selected.id, { teacherProfileId: user.teacherProfileId! }), "Profesor asignado correctamente."); }
  async function removeTeacher(user: AdminUserSummary) { if (selected && user.teacherProfileId) await perform(() => removeAdminClassTeacher(selected.id, user.teacherProfileId!), "Profesor retirado de la clase."); }
  async function addStudent(user: AdminUserSummary) { if (selected && user.studentProfileId) await perform(() => enrollAdminClassStudent(selected.id, { studentProfileId: user.studentProfileId! }), "Alumno matriculado correctamente."); }
  async function removeStudent(user: AdminUserSummary) { if (selected && user.studentProfileId) await perform(() => unenrollAdminClassStudent(selected.id, user.studentProfileId!), "Alumno retirado de la clase."); }
  async function addSubject(subject: AdminSubjectSummary) { if (selected) await perform(() => assignAdminClassSubject(selected.id, { subjectId: subject.id }), "Materia vinculada a la clase."); }

  async function createClass(form: FormData) {
    try {
      const created = await createAdminClass({ academicYearId: optionalText(form, "academicYearId"), gradeLevelId: optionalText(form, "gradeLevelId"), name: requiredText(form, "name"), code: requiredText(form, "code").toUpperCase(), description: optionalText(form, "description"), color: optionalText(form, "color") });
      setClasses((current) => [created, ...current]); setSelectedId(created.id); setIsCreating(false); setMessage("Clase creada. Ahora puedes asignar docentes, alumnos y materias desde su espacio.");
    } catch { setMessage("No se pudo crear la clase. Revisa que el código sea único para el año académico."); }
  }

  return <>
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col gap-5 overflow-hidden px-5 py-6 lg:px-8">
      <section className="flex shrink-0 flex-col gap-4 rounded-xl border border-[#dde3ef] bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f75a8]">Configuración académica</p><div className="mt-1 flex items-baseline gap-3"><h2 className="text-2xl font-semibold text-[#191970]">Clases</h2><span className="text-sm text-slate-500">{classes.length} espacios activos</span></div><p className="mt-2 text-sm text-slate-600">Crea el espacio académico y luego administra docentes, alumnos y materias desde la clase.</p></div><button onClick={() => setIsCreating(true)} className="primary shrink-0"><Plus size={18} /> Nueva clase</button></section>
      {message ? <p className="shrink-0 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="status">{message}</p> : null}
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#dde3ef] bg-white shadow-sm"><div className="border-b p-4"><label className="relative block"><span className="sr-only">Buscar clase</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar clase" className="control w-full pl-9" /></label></div><div className="min-h-0 flex-1 overflow-y-auto p-2">{filtered.map((item) => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`mb-1 w-full rounded-lg p-3 text-left transition ${selected?.id === item.id ? "bg-[#eef2ff] ring-1 ring-[#cbd5ff]" : "hover:bg-slate-50"}`}><div className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color ?? "#191970" }} /><span className="min-w-0"><b className="block truncate text-sm text-[#191970]">{item.name}</b><small className="mt-1 block truncate text-slate-500">{item.code} · {item.gradeLevelName ?? "Sin grado"}</small><small className="mt-1 block font-medium text-slate-400">{item.students.length} alumnos · {item.teachers.length} profesores</small></span></div></button>)}{!filtered.length ? <p className="p-4 text-center text-sm text-slate-500">No hay clases.</p> : null}</div></aside>
        <main className="min-h-0 overflow-y-auto">{selected ? <ClassWorkspace schoolClass={selected} teachers={teachers} students={students} subjects={subjects} onAddTeacher={addTeacher} onRemoveTeacher={removeTeacher} onAddStudent={addStudent} onRemoveStudent={removeStudent} onAddSubject={addSubject} /> : <EmptyClasses onCreate={() => setIsCreating(true)} />}</main>
      </div>
    </div>
    {isCreating ? <CreateClassDialog academicYears={years} gradeLevels={grades} onClose={() => setIsCreating(false)} onCreate={createClass} /> : null}
  </>;
}

function ClassWorkspace({ schoolClass, teachers, students, subjects, onAddTeacher, onRemoveTeacher, onAddStudent, onRemoveStudent, onAddSubject }: { schoolClass: AdminClassSummary; teachers: AdminUserSummary[]; students: AdminUserSummary[]; subjects: AdminSubjectSummary[]; onAddTeacher: (user: AdminUserSummary) => void; onRemoveTeacher: (user: AdminUserSummary) => void; onAddStudent: (user: AdminUserSummary) => void; onRemoveStudent: (user: AdminUserSummary) => void; onAddSubject: (subject: AdminSubjectSummary) => void }) {
  const assignedTeacherIds = new Set(schoolClass.teachers.map((user) => user.id)); const assignedStudentIds = new Set(schoolClass.students.map((user) => user.id));
  return <div className="space-y-5"><section className="rounded-xl border border-[#dde3ef] bg-white p-5 shadow-sm sm:p-6"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f75a8]">Clase seleccionada</p><div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="text-2xl font-semibold text-[#191970]">{schoolClass.name}</h2><p className="mt-1 text-sm text-slate-500">{schoolClass.code} · {schoolClass.academicYearName} · {schoolClass.gradeLevelName ?? "Sin grado asignado"}</p></div><div className="flex flex-wrap gap-2"><Metric icon={<UserPlus size={16} />} label="Profesores" value={schoolClass.teachers.length} /><Metric icon={<UsersRound size={16} />} label="Alumnos" value={schoolClass.students.length} /><Metric icon={<BookOpenCheck size={16} />} label="Materias" value={schoolClass.subjects.length} /></div></div></section>
    <section className="grid gap-5 xl:grid-cols-2"><RosterPanel title="Equipo docente" description="Un profesor puede estar en varias clases." assigned={schoolClass.teachers} available={teachers.filter((user) => !assignedTeacherIds.has(user.id))} onAdd={onAddTeacher} onRemove={onRemoveTeacher} empty="No hay profesores asignados." /><RosterPanel title="Alumnos matriculados" description="Solo se muestran alumnos del grado de la clase o sin grado definido." assigned={schoolClass.students} available={students.filter((user) => !assignedStudentIds.has(user.id) && (!schoolClass.gradeLevelId || !user.gradeLevelId || user.gradeLevelId === schoolClass.gradeLevelId))} onAdd={onAddStudent} onRemove={onRemoveStudent} empty="Aún no hay alumnos matriculados." /></section>
    <section className="rounded-xl border border-[#dde3ef] bg-white shadow-sm"><header className="border-b p-4"><h3 className="font-semibold text-[#191970]">Materias del grupo</h3><p className="mt-1 text-xs text-slate-500">Vincula las materias que recibe este grupo. Cada combinación aparecerá por separado en Horarios.</p></header><div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">{subjects.filter((subject) => subject.status === "ACTIVE").map((subject) => { const linked = schoolClass.subjects.some((item) => item.subjectId === subject.id); return <button key={subject.id} disabled={linked} onClick={() => onAddSubject(subject)} className={`flex items-center justify-between rounded-lg border p-3 text-left ${linked ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-[#dde3ef] hover:border-[#191970]/40 hover:bg-slate-50"}`}><span><b className="block text-sm">{subject.name}</b><small className="text-slate-500">{subject.shortName}{subject.paceEnabled ? " · Usa PACEs" : " · Materia regular"}</small></span><span className="text-xs font-bold">{linked ? "Vinculada" : "Vincular"}</span></button>; })}</div></section>
  </div>;
}

type RosterView = "assigned" | "available";
const PEOPLE_PER_PAGE = 6;

function RosterPanel({ title, description, assigned, available, onAdd, onRemove, empty }: { title: string; description: string; assigned: AdminUserSummary[]; available: AdminUserSummary[]; onAdd: (user: AdminUserSummary) => void; onRemove: (user: AdminUserSummary) => void; empty: string }) {
  const [view, setView] = useState<RosterView>("assigned");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("es"));
  const source = view === "assigned" ? assigned : available;
  const filteredPeople = useMemo(() => source.filter((user) => `${user.firstName} ${user.lastName} ${user.email}`.toLocaleLowerCase("es").includes(deferredSearch)), [source, deferredSearch]);
  const pageCount = Math.max(1, Math.ceil(filteredPeople.length / PEOPLE_PER_PAGE));
  const safePage = Math.min(page, pageCount);
  const visiblePeople = filteredPeople.slice((safePage - 1) * PEOPLE_PER_PAGE, safePage * PEOPLE_PER_PAGE);

  function selectView(nextView: RosterView) {
    setView(nextView);
    setSearch("");
    setPage(1);
  }

  return <section className="overflow-hidden rounded-xl border border-[#dde3ef] bg-white shadow-sm">
    <header className="border-b p-4"><h3 className="font-semibold text-[#191970]">{title}</h3><p className="mt-1 text-xs text-slate-500">{description}</p></header>
    <div className="border-b px-3 pt-3">
      <div className="grid grid-cols-2 rounded-lg bg-[#f4f6fb] p-1" role="tablist" aria-label={`Vista de ${title}`}>
        <button type="button" role="tab" aria-selected={view === "assigned"} onClick={() => selectView("assigned")} className={`rounded-md px-3 py-2 text-sm font-semibold ${view === "assigned" ? "bg-white text-[#191970] shadow-sm" : "text-slate-500 hover:text-[#191970]"}`}>Asignados <span className="ml-1 tabular-nums">{assigned.length}</span></button>
        <button type="button" role="tab" aria-selected={view === "available"} onClick={() => selectView("available")} className={`rounded-md px-3 py-2 text-sm font-semibold ${view === "available" ? "bg-white text-[#191970] shadow-sm" : "text-slate-500 hover:text-[#191970]"}`}>Disponibles <span className="ml-1 tabular-nums">{available.length}</span></button>
      </div>
      <label className="relative my-3 block"><span className="sr-only">Buscar en {title}</span><Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" name={`search-${title}`} autoComplete="off" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por nombre o correo…" className="control w-full pl-9" /></label>
    </div>
    <div className="min-h-[23rem] p-3" role="tabpanel">
      {visiblePeople.length ? visiblePeople.map((user) => <PersonRow key={user.id} user={user} action={view === "assigned" ? "Quitar" : "Agregar"} icon={view === "assigned" ? <UserMinus size={15} aria-hidden="true" /> : <UserPlus size={15} aria-hidden="true" />} onAction={() => view === "assigned" ? onRemove(user) : onAdd(user)} />) : <p className="rounded-lg bg-slate-50 p-4 text-center text-sm text-slate-500">{deferredSearch ? "No hay coincidencias con esa búsqueda." : view === "assigned" ? empty : "No hay personas disponibles."}</p>}
    </div>
    <footer className="flex min-h-14 items-center justify-between border-t px-3 py-2 text-xs text-slate-500">
      <span>{filteredPeople.length ? `${(safePage - 1) * PEOPLE_PER_PAGE + 1}–${Math.min(safePage * PEOPLE_PER_PAGE, filteredPeople.length)} de ${filteredPeople.length}` : "0 resultados"}</span>
      <div className="flex gap-2"><button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="secondary px-2.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40">Anterior</button><button type="button" disabled={safePage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="secondary px-2.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40">Siguiente</button></div>
    </footer>
  </section>;
}
function PersonRow({ user, action, icon, onAction }: { user: AdminUserSummary; action: string; icon: React.ReactNode; onAction: () => void }) { return <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#edf0f6] p-2.5"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#eef2ff] text-xs font-bold text-[#191970]">{initials(user)}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-[#191970]">{user.firstName} {user.lastName}</b><small className="block truncate text-slate-500">{user.email}</small></span><button onClick={onAction} className="secondary shrink-0 px-2.5 py-1.5 text-xs">{icon}{action}</button></div>; }
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <span className="flex items-center gap-2 rounded-lg bg-[#f6f8fc] px-3 py-2"><span className="text-[#191970]">{icon}</span><span><b className="block text-sm text-[#191970]">{value}</b><small className="block text-xs text-slate-500">{label}</small></span></span>; }
function EmptyClasses({ onCreate }: { onCreate: () => void }) { return <section className="grid min-h-64 place-items-center rounded-xl border border-dashed border-[#cfd8eb] bg-white p-8 text-center"><div><GraduationCap className="mx-auto text-[#191970]" /><h2 className="mt-3 font-semibold text-[#191970]">Crea la primera clase</h2><p className="mt-1 text-sm text-slate-500">Después podrás asignar profesores, alumnos y materias.</p><button onClick={onCreate} className="primary mt-4"><Plus size={17} /> Nueva clase</button></div></section>; }

function CreateClassDialog({ academicYears, gradeLevels, onClose, onCreate }: { academicYears: AdminAcademicYearSummary[]; gradeLevels: GradeLevel[]; onClose: () => void; onCreate: (form: FormData) => Promise<void> }) {
  const activeYear = academicYears.find((year) => year.isActive);
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4"><section className="mx-auto my-5 w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true"><header className="border-b p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f75a8]">Nueva clase</p><h3 className="mt-1 text-xl font-semibold text-[#191970]">Configura el espacio académico</h3><p className="mt-2 text-sm text-slate-600">Define los datos básicos. Los docentes y alumnos se asignan después desde el espacio de la clase.</p></header><form action={onCreate} className="space-y-5 p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Año académico"><select name="academicYearId" defaultValue={activeYear?.id ?? ""} className="input"><option value="">Usar año activo</option>{academicYears.map((year) => <option key={year.id} value={year.id}>{year.name}{year.isActive ? " (activo)" : ""}</option>)}</select></Field><Field label="Grado"><select name="gradeLevelId" required className="input"><option value="">Selecciona un grado</option>{gradeLevels.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}</select></Field></div><div className="grid gap-4 sm:grid-cols-[1fr_10rem]"><Field label="Nombre de la clase"><input name="name" required placeholder="Ej. English 8th Grade" className="input" /></Field><Field label="Código"><input name="code" required placeholder="Ej. ENG-8-A" className="input" /></Field></div><Field label="Descripción opcional"><input name="description" placeholder="Grupo, sección u observación" className="input" /></Field><Field label="Color identificador"><input name="color" type="color" defaultValue="#191970" className="mt-2 h-11 w-16 rounded-md border p-1" /></Field><footer className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="secondary">Cancelar</button><button type="submit" className="primary">Crear clase</button></footer></form></section></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>; }
function optionalText(form: FormData, key: string) { const value = String(form.get(key) ?? "").trim(); return value || undefined; }
function requiredText(form: FormData, key: string) { return String(form.get(key) ?? "").trim(); }
function initials(user: AdminUserSummary) { return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase(); }
