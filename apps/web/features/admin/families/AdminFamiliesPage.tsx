"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, Mail, MessageSquare, Plus, Search, ShieldCheck } from "lucide-react";
import { AdminFamilyLinkSummary, AdminUserSummary, ParentRelationship, UserRole } from "@homeschool/shared";
import { getAdminFamilyLinks, getAdminUsers, updateAdminFamilyLink, upsertAdminFamilyLink } from "../admin-api";

export function AdminFamiliesPage() {
  const [links, setLinks] = useState<AdminFamilyLinkSummary[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState("Cargando datos reales...");
  const students = users.filter((user) => user.roles.includes(UserRole.STUDENT) && user.studentProfileId);
  const parents = users.filter((user) => user.roles.includes(UserRole.PARENT) && user.parentProfileId);
  const filtered = useMemo(
    () => links.filter((link) => `${fullName(link.student)} ${fullName(link.parent)}`.toLowerCase().includes(query.toLowerCase())),
    [links, query]
  );

  useEffect(() => {
    let ignore = false;

    Promise.all([getAdminFamilyLinks(), getAdminUsers()])
      .then(([nextLinks, nextUsers]) => {
        if (ignore) return;
        setLinks(nextLinks);
        setUsers(nextUsers);
        setMessage("");
      })
      .catch(() => setMessage("No fue posible cargar las familias."));

    return () => {
      ignore = true;
    };
  }, []);

  async function createLink(form: FormData) {
    const studentProfileId = String(form.get("studentProfileId") ?? "");
    const parentProfileId = String(form.get("parentProfileId") ?? "");
    if (!studentProfileId || !parentProfileId) return;

    const created = await upsertAdminFamilyLink({
      studentProfileId,
      parentProfileId,
      relationship: String(form.get("relationship") ?? ParentRelationship.GUARDIAN) as ParentRelationship,
      isPrimary: Boolean(form.get("isPrimary")),
      receivesAcademicEmails: Boolean(form.get("receivesAcademicEmails")),
      receivesBehaviorEmails: Boolean(form.get("receivesBehaviorEmails")),
      receivesBillingEmails: Boolean(form.get("receivesBillingEmails")),
      canViewGrades: Boolean(form.get("canViewGrades")),
      canMessageTeachers: Boolean(form.get("canMessageTeachers"))
    });

    setLinks((current) => [created, ...current.filter((item) => !(item.studentId === created.studentId && item.parentId === created.parentId))]);
    setIsCreating(false);
    setMessage("");
  }

  async function togglePermission(link: AdminFamilyLinkSummary, field: "isPrimary" | "receivesAcademicEmails" | "canViewGrades" | "canMessageTeachers") {
    const updated = await updateAdminFamilyLink(link.studentId, link.parentId, { [field]: !link[field] });
    setLinks((current) => current.map((item) => (item.studentId === updated.studentId && item.parentId === updated.parentId ? updated : item)));
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-6 lg:px-8">
        <section className="flex shrink-0 flex-col gap-5 rounded-lg border border-[#dde3ef] bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#078cc5]">Relación familia-alumno</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#191970]">Familias</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Define qué padre o acudiente queda ligado a cada alumno y qué comunicaciones recibe.
            </p>
            {message ? <p className="mt-3 text-xs font-semibold text-amber-700">{message}</p> : null}
          </div>
          <button onClick={() => setIsCreating(true)} className="primary">
            <Plus size={18} />
            Ligar familia
          </button>
        </section>

        <section className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-[#edf0f6] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-[#eef2ff] text-[#191970]"><Link2 size={18} /></span>
              <div>
                <h3 className="font-semibold text-[#191970]">Vínculos activos</h3>
                <p className="text-sm text-slate-500">{links.length} relaciones configuradas</p>
              </div>
            </div>
            <label className="relative">
              <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar alumno o padre" className="control w-72 pl-9" />
            </label>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((link) => (
                <article key={`${link.studentId}-${link.parentId}`} className="rounded-lg border border-[#dde3ef] bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">{relationshipLabel(link.relationship)}</p>
                      <h3 className="mt-1 text-lg font-semibold text-[#191970]">{fullName(link.parent)}</h3>
                      <p className="mt-1 text-sm text-slate-500">Alumno: {fullName(link.student)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${link.isPrimary ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {link.isPrimary ? "Principal" : "Secundario"}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <PermissionToggle icon={<ShieldCheck size={15} />} label="Padre principal" checked={link.isPrimary} onToggle={() => togglePermission(link, "isPrimary")} />
                    <PermissionToggle icon={<Mail size={15} />} label="Recibe correos" checked={link.receivesAcademicEmails} onToggle={() => togglePermission(link, "receivesAcademicEmails")} />
                    <PermissionToggle icon={<ShieldCheck size={15} />} label="Ve notas" checked={link.canViewGrades} onToggle={() => togglePermission(link, "canViewGrades")} />
                    <PermissionToggle icon={<MessageSquare size={15} />} label="Puede escribir" checked={link.canMessageTeachers} onToggle={() => togglePermission(link, "canMessageTeachers")} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
      {isCreating ? <CreateFamilyLinkDialog students={students} parents={parents} onClose={() => setIsCreating(false)} onCreate={createLink} /> : null}
    </>
  );
}

function PermissionToggle({ icon, label, checked, onToggle }: { icon: React.ReactNode; label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-semibold ${checked ? "border-[#078cc5]/20 bg-[#eaf7fc] text-[#076f9d]" : "border-[#dde3ef] bg-white text-slate-500"}`}>
      {icon}
      <span className="flex-1">{label}</span>
      <span>{checked ? "Sí" : "No"}</span>
    </button>
  );
}

function CreateFamilyLinkDialog({
  students,
  parents,
  onClose,
  onCreate
}: {
  students: AdminUserSummary[];
  parents: AdminUserSummary[];
  onClose: () => void;
  onCreate: (form: FormData) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <section className="w-full max-w-lg rounded-lg bg-white shadow-2xl">
        <header className="border-b p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6f75a8]">Nuevo vínculo</p>
          <h3 className="mt-1 text-lg font-semibold text-[#191970]">Ligar padre con alumno</h3>
        </header>
        <form action={onCreate} className="space-y-4 p-5">
          <Field label="Alumno">
            <select name="studentProfileId" required defaultValue="" className="input">
              <option value="" disabled>Selecciona un alumno</option>
              {students.map((student) => <option key={student.id} value={student.studentProfileId ?? ""}>{fullName(student)}</option>)}
            </select>
          </Field>
          <Field label="Padre o acudiente">
            <select name="parentProfileId" required defaultValue="" className="input">
              <option value="" disabled>Selecciona un padre</option>
              {parents.map((parent) => <option key={parent.id} value={parent.parentProfileId ?? ""}>{fullName(parent)}</option>)}
            </select>
          </Field>
          <Field label="Relación">
            <select name="relationship" defaultValue={ParentRelationship.GUARDIAN} className="input">
              <option value={ParentRelationship.MOTHER}>Madre</option>
              <option value={ParentRelationship.FATHER}>Padre</option>
              <option value={ParentRelationship.GUARDIAN}>Acudiente</option>
              <option value={ParentRelationship.TUTOR}>Tutor</option>
            </select>
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Check name="isPrimary" label="Padre principal" />
            <Check name="receivesAcademicEmails" label="Recibe correos" defaultChecked />
            <Check name="canViewGrades" label="Puede ver notas" defaultChecked />
            <Check name="canMessageTeachers" label="Puede escribir" defaultChecked />
          </div>
          <footer className="flex justify-end gap-3 border-t pt-5">
            <button type="button" onClick={onClose} className="secondary">Cancelar</button>
            <button type="submit" className="primary">Guardar vínculo</button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function relationshipLabel(value: ParentRelationship) {
  const labels: Record<ParentRelationship, string> = {
    [ParentRelationship.MOTHER]: "Madre",
    [ParentRelationship.FATHER]: "Padre",
    [ParentRelationship.GUARDIAN]: "Acudiente",
    [ParentRelationship.TUTOR]: "Tutor",
    [ParentRelationship.OTHER]: "Otro"
  };
  return labels[value];
}

function fullName(user: AdminUserSummary) {
  return `${user.firstName} ${user.lastName}`;
}

function Check({ name, label, defaultChecked = false }: { name: string; label: string; defaultChecked?: boolean }) {
  return <label className="flex items-center gap-2 rounded-md border border-[#dde3ef] px-3 py-2 text-sm font-semibold text-slate-600"><input name={name} type="checkbox" defaultChecked={defaultChecked} />{label}</label>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>;
}
