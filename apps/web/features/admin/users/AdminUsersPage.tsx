"use client";

import { useEffect, useMemo, useState } from "react";
import { GraduationCap, Landmark, Plus, Search, ShieldCheck, UserRoundCog, UsersRound } from "lucide-react";
import { AdminUserSummary, GradeLevel, UserRole } from "@homeschool/shared";
import { scheduleApi } from "@/features/schedules/schedule-api";
import { configureAdministrativeUser, createAdminUser, getAdminUsers } from "../admin-api";

type RoleFilter = "ALL" | UserRole;
type CreateRole = UserRole.STUDENT | UserRole.TEACHER | UserRole.ADMINISTRATIVE | UserRole.PARENT;

const createRoles: Array<{ role: CreateRole; label: string; description: string; icon: typeof GraduationCap }> = [
  { role: UserRole.STUDENT, label: "Alumno", description: "Código de alumno y grado.", icon: GraduationCap },
  { role: UserRole.TEACHER, label: "Profesor", description: "Código de profesor.", icon: UserRoundCog },
  { role: UserRole.ADMINISTRATIVE, label: "Dirección", description: "Profesora con acceso de Dirección.", icon: Landmark },
  { role: UserRole.PARENT, label: "Padre o acudiente", description: "Datos de contacto del acudiente.", icon: UsersRound }
];

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("ALL");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("Cargando datos reales...");
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);

  useEffect(() => {
    let ignore = false;
    Promise.all([getAdminUsers(), scheduleApi.admin.grades()])
      .then(([items, grades]) => {
        if (ignore) return;
        setUsers(items);
        setGradeLevels(grades);
        setMessage("");
      })
      .catch(() => !ignore && setMessage("No fue posible cargar los usuarios."));
    return () => { ignore = true; };
  }, []);

  const filtered = useMemo(() => users.filter((user) => {
    const matchesRole = role === "ALL" || user.roles.includes(role);
    const matchesQuery = `${user.firstName} ${user.lastName} ${user.email}`.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es"));
    return matchesRole && matchesQuery;
  }), [users, role, query]);

  const roleStats = useMemo(() => [
    { role: "ALL" as const, label: "Todas las cuentas", count: users.length },
    { role: UserRole.STUDENT, label: "Alumnos", count: users.filter((user) => user.roles.includes(UserRole.STUDENT)).length },
    { role: UserRole.TEACHER, label: "Profesores", count: users.filter((user) => user.roles.includes(UserRole.TEACHER) && !user.roles.includes(UserRole.ADMINISTRATIVE)).length },
    { role: UserRole.ADMINISTRATIVE, label: "Dirección", count: users.filter((user) => user.roles.includes(UserRole.ADMINISTRATIVE)).length },
    { role: UserRole.PARENT, label: "Padres", count: users.filter((user) => user.roles.includes(UserRole.PARENT)).length }
  ], [users]);

  async function createUser(form: FormData) {
    const payload = {
      firstName: String(form.get("firstName") ?? "").trim(),
      lastName: String(form.get("lastName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      role: String(form.get("role")) as CreateRole,
      studentCode: optionalText(form, "studentCode"),
      employeeCode: optionalText(form, "employeeCode"),
      gradeLevelId: optionalText(form, "gradeLevelId"),
      parentPhone: optionalText(form, "parentPhone"),
      directorTitle: optionalText(form, "directorTitle")
    };

    const created = await createAdminUser(payload);
    setUsers((current) => [created, ...current.filter((item) => item.id !== created.id)]);
    setIsCreating(false);
    setMessage(`Cuenta de ${roleLabel(payload.role)} creada correctamente.`);
  }

  async function configureDirection(user: AdminUserSummary) {
    if (!confirm(`¿Asignar a ${user.firstName} ${user.lastName} como Profesora + Dirección? Se retirarán los roles ADMIN o Directivo anterior.`)) return;
    try {
      const updated = await configureAdministrativeUser(user.id);
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
      setMessage("La cuenta quedó configurada como Profesora + Dirección.");
    } catch {
      setMessage("No fue posible configurar esta cuenta. No puedes retirar tu propio acceso ADMIN.");
    }
  }

  return (
    <>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col gap-5 overflow-hidden px-5 py-6 lg:px-8">
        <section className="flex shrink-0 flex-col gap-4 rounded-xl border border-[#dde3ef] bg-white px-5 py-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Gestión de identidad</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-[#191970]">Usuarios</h2>
              <span className="text-sm font-medium text-slate-500">{users.length} cuentas registradas</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">Crea accesos y consulta rápidamente el rol de cada persona.</p>
          </div>
          <button onClick={() => setIsCreating(true)} className="primary shrink-0"><Plus size={18} /> Nuevo usuario</button>
        </section>

        <section className="shrink-0 rounded-xl border border-[#dde3ef] bg-white p-3 shadow-sm">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {roleStats.map((item) => {
              const selected = role === item.role;
              return <button key={item.role} onClick={() => setRole(item.role)} aria-pressed={selected} className={`rounded-lg border px-3 py-3 text-left transition ${selected ? "border-[#191970] bg-[#191970] text-white shadow-sm" : "border-transparent bg-[#f6f8fc] text-slate-700 hover:border-[#cfd8eb] hover:bg-[#eef2ff]"}`}>
                <span className={`block text-xs font-semibold ${selected ? "text-[#cbd5ff]" : "text-slate-500"}`}>{item.label}</span>
                <span className="mt-1 block text-xl font-bold">{item.count}</span>
              </button>;
            })}
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dde3ef] bg-white shadow-sm">
          <header className="flex flex-col gap-3 border-b border-[#edf0f6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-[#191970]">Directorio de usuarios</h3>
              <p className="mt-0.5 text-xs text-slate-500">Mostrando {filtered.length} de {users.length} cuentas</p>
            </div>
            <label className="relative block"><span className="sr-only">Buscar usuario</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o correo" className="control w-full pl-9 sm:w-80" /></label>
          </header>
          {message ? <p className="border-b border-amber-100 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-800" role="status">{message}</p> : null}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="hidden grid-cols-[minmax(17rem,1fr)_minmax(12rem,0.8fr)_8rem_10rem] gap-4 border-b bg-[#f8f9fc] px-5 py-3 text-xs font-bold uppercase tracking-[0.13em] text-slate-400 xl:grid"><span>Cuenta</span><span>Acceso</span><span>Estado</span><span>Gestión</span></div>
            <div className="divide-y divide-[#edf0f6]">{filtered.map((user) => <UserRow key={user.id} user={user} onConfigureDirection={configureDirection} />)}</div>
            {!filtered.length && !message ? <p className="p-8 text-center text-sm text-slate-500">No hay usuarios que coincidan con la búsqueda.</p> : null}
          </div>
        </section>
      </div>
      {isCreating ? <CreateUserDialog gradeLevels={gradeLevels} onClose={() => setIsCreating(false)} onCreate={createUser} /> : null}
    </>
  );
}

function UserRow({ user, onConfigureDirection }: { user: AdminUserSummary; onConfigureDirection: (user: AdminUserSummary) => void }) {
  const canAssignDirection = !user.roles.includes(UserRole.ADMINISTRATIVE) && (user.roles.includes(UserRole.TEACHER) || user.roles.includes(UserRole.DIRECTOR));
  return <article className="grid gap-4 px-5 py-4 transition hover:bg-[#fafbff] xl:grid-cols-[minmax(17rem,1fr)_minmax(12rem,0.8fr)_8rem_10rem] xl:items-center"><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#eef2ff] text-sm font-bold text-[#191970]">{initials(user)}</span><div className="min-w-0"><h3 className="truncate font-semibold text-[#191970]">{user.firstName} {user.lastName}</h3><p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p></div></div><div className="flex flex-wrap gap-1.5">{user.roles.map((item) => <RoleBadge key={item} role={item} />)}</div><Status active={user.isActive} />{user.roles.includes(UserRole.ADMINISTRATIVE) ? <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><ShieldCheck size={15} /> Dirección activa</span> : canAssignDirection ? <button onClick={() => onConfigureDirection(user)} className="secondary w-fit">Asignar Dirección</button> : user.roles.includes(UserRole.ADMIN) ? <span className="text-xs font-semibold text-slate-500">Cuenta de sistema</span> : <span className="text-xs text-slate-400">—</span>}</article>;
}

function RoleBadge({ role }: { role: UserRole }) {
  const tone = role === UserRole.ADMINISTRATIVE ? "bg-violet-50 text-violet-700" : role === UserRole.TEACHER ? "bg-blue-50 text-blue-700" : role === UserRole.STUDENT ? "bg-cyan-50 text-cyan-700" : role === UserRole.PARENT ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone}`}>{roleLabel(role)}</span>;
}

function CreateUserDialog({ gradeLevels, onClose, onCreate }: { gradeLevels: GradeLevel[]; onClose: () => void; onCreate: (form: FormData) => Promise<void> }) {
  const [selectedRole, setSelectedRole] = useState<CreateRole>(UserRole.STUDENT);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const roleInfo = createRoles.find((item) => item.role === selectedRole)!;

  async function submit(form: FormData) {
    setError("");
    if (selectedRole === UserRole.STUDENT && (!String(form.get("studentCode") ?? "").trim() || !String(form.get("gradeLevelId") ?? ""))) {
      setError("Para crear un alumno indica su código y grado.");
      return;
    }
    if ((selectedRole === UserRole.TEACHER || selectedRole === UserRole.ADMINISTRATIVE) && !String(form.get("employeeCode") ?? "").trim()) {
      setError("Para crear un profesor o cuenta de Dirección indica el código de profesor.");
      return;
    }
    setIsSaving(true);
    try {
      await onCreate(form);
    } catch {
      setError("No fue posible crear la cuenta. Revisa que el correo y los códigos no estén en uso.");
      setIsSaving(false);
    }
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4"><section className="mx-auto my-5 w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="create-user-title"><header className="border-b p-5 sm:p-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Nuevo usuario</p><h3 id="create-user-title" className="mt-1 text-xl font-semibold text-[#191970]">Crear una cuenta</h3><p className="mt-2 text-sm text-slate-600">Primero elige el tipo de cuenta. Solo se solicitan los datos necesarios para ese rol.</p></header><form action={submit} className="space-y-6 p-5 sm:p-6"><input type="hidden" name="role" value={selectedRole} />
    <fieldset><legend className="text-sm font-semibold text-slate-700">1. Tipo de cuenta</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{createRoles.map((item) => { const Icon = item.icon; const selected = selectedRole === item.role; return <button key={item.role} type="button" onClick={() => setSelectedRole(item.role)} aria-pressed={selected} className={`flex min-h-24 items-start gap-3 rounded-lg border p-4 text-left transition ${selected ? "border-[#191970] bg-[#eef2ff] ring-1 ring-[#191970]" : "border-[#dde3ef] hover:border-[#191970]/40 hover:bg-slate-50"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${selected ? "bg-[#191970] text-white" : "bg-[#f4f6fb] text-[#191970]"}`}><Icon size={18} /></span><span><b className="block text-sm text-[#191970]">{item.label}</b><span className="mt-1 block text-xs leading-5 text-slate-600">{item.description}</span></span></button>; })}</div></fieldset>
    <fieldset className="space-y-4"><legend className="text-sm font-semibold text-slate-700">2. Datos de acceso</legend><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre"><input name="firstName" required autoComplete="given-name" className="input" /></Field><Field label="Apellido"><input name="lastName" required autoComplete="family-name" className="input" /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Correo institucional"><input name="email" type="email" required autoComplete="email" className="input" /></Field><Field label="Contraseña inicial"><input name="password" type="password" required minLength={8} autoComplete="new-password" className="input" /><span className="mt-1 block text-xs font-normal text-slate-500">Mínimo 8 caracteres.</span></Field></div></fieldset>
    <fieldset className="rounded-lg border border-[#dde3ef] bg-[#f8f9fc] p-4"><legend className="px-1 text-sm font-semibold text-slate-700">3. Datos de {roleInfo.label}</legend>{selectedRole === UserRole.STUDENT ? <div className="grid gap-4 sm:grid-cols-2"><Field label="Código de alumno"><input name="studentCode" required placeholder="Ej. EST-2026-001" className="input" /></Field><Field label="Grado"><select name="gradeLevelId" required defaultValue="" className="input"><option value="" disabled>Selecciona un grado</option>{gradeLevels.map((grade) => <option key={grade.id} value={grade.id}>{grade.name}</option>)}</select></Field></div> : null}{selectedRole === UserRole.TEACHER ? <Field label="Código de profesor"><input name="employeeCode" required placeholder="Ej. PRO-001" className="input" /></Field> : null}{selectedRole === UserRole.ADMINISTRATIVE ? <div className="grid gap-4 sm:grid-cols-2"><Field label="Código de profesor"><input name="employeeCode" required placeholder="Ej. DIR-001" className="input" /></Field><Field label="Cargo de Dirección"><input name="directorTitle" placeholder="Ej. Dirección académica" className="input" /></Field></div> : null}{selectedRole === UserRole.PARENT ? <Field label="Teléfono de contacto"><input name="parentPhone" type="tel" autoComplete="tel" placeholder="Ej. +57 300 000 0000" className="input" /></Field> : null}</fieldset>
    {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">{error}</p> : null}
    <footer className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={isSaving} className="secondary">Cancelar</button><button type="submit" disabled={isSaving} className="primary">{isSaving ? "Creando cuenta…" : `Crear ${roleInfo.label.toLocaleLowerCase("es")}`}</button></footer>
  </form></section></div>;
}

function optionalText(form: FormData, key: string) { const value = String(form.get(key) ?? "").trim(); return value || undefined; }
function roleLabel(role: UserRole) { return ({ ADMIN: "ADMIN", ADMINISTRATIVE: "Dirección", TEACHER: "Profesor", STUDENT: "Alumno", PARENT: "Padre", DIRECTOR: "Directivo" } as Record<UserRole, string>)[role]; }
function initials(user: AdminUserSummary) { return `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase(); }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>; }
function Status({ active }: { active: boolean }) { return <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{active ? "Activo" : "Inactivo"}</span>; }