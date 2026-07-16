"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BookOpen, Pencil, Plus, Search } from "lucide-react";
import { AcademicStatus, type AdminSubjectSummary } from "@homeschool/shared";
import { createAdminSubject, getAdminSubjects, updateAdminSubject } from "../admin-api";

type EditorState = AdminSubjectSummary | "new" | null;

export function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<AdminSubjectSummary[]>([]);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<EditorState>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Cargando materias…");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("es"));
  const filtered = useMemo(
    () => subjects.filter((subject) => `${subject.name} ${subject.shortName}`.toLocaleLowerCase("es").includes(deferredQuery)),
    [subjects, deferredQuery]
  );

  useEffect(() => {
    let ignore = false;
    getAdminSubjects()
      .then((data) => {
        if (ignore) return;
        setSubjects(data);
        setMessage("");
      })
      .catch((error: Error) => !ignore && setMessage(error.message));
    return () => { ignore = true; };
  }, []);

  async function save(form: FormData) {
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        name: String(form.get("name") ?? "").trim(),
        shortName: String(form.get("shortName") ?? "").trim().toUpperCase(),
        color: String(form.get("color") ?? "").trim() || undefined
      };
      const saved = editor === "new"
        ? await createAdminSubject(payload)
        : await updateAdminSubject(editor!.id, {
            ...payload,
            status: String(form.get("status") ?? AcademicStatus.ACTIVE) as AcademicStatus
          });
      setSubjects((current) => [...current.filter((item) => item.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name, "es")));
      setEditor(null);
      setMessage(editor === "new" ? "Materia creada. Ahora puedes vincularla a uno o varios grupos." : "Materia actualizada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar la materia.");
    } finally {
      setSaving(false);
    }
  }

  const activeCount = subjects.filter((subject) => subject.status === AcademicStatus.ACTIVE).length;
  const linkedGroups = subjects.reduce((total, subject) => total + subject.classCount, 0);

  return (
    <>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col gap-5 overflow-hidden px-5 py-6 lg:px-8">
        <section className="flex shrink-0 flex-col gap-4 rounded-xl border border-[#dde3ef] bg-white p-6 shadow-sm md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f75a8]">Catálogo académico</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#191970]">Materias</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Crea cada materia una sola vez. Después vincúlala a todos los grupos que la reciben desde Clases.</p>
          </div>
          <button type="button" onClick={() => setEditor("new")} className="primary shrink-0"><Plus size={18} /> Nueva materia</button>
        </section>

        {message ? <p className="shrink-0 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="status">{message}</p> : null}

        <section className="grid shrink-0 gap-4 sm:grid-cols-3">
          <Metric value={subjects.length} label="Materias registradas" />
          <Metric value={activeCount} label="Materias activas" />
          <Metric value={linkedGroups} label="Vínculos con grupos" />
        </section>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#dde3ef] bg-white shadow-sm">
          <header className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#eef2ff] text-[#191970]"><BookOpen size={19} /></span><div><h3 className="font-semibold text-[#191970]">Catálogo de materias</h3><p className="text-xs text-slate-500">El código es el que verás en el horario, por ejemplo GEO.</p></div></div>
            <label className="relative"><span className="sr-only">Buscar materia</span><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar materia o código" className="control w-full pl-9 sm:w-72" /></label>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="sticky top-0 z-[1] bg-[#f8f9fc] text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Materia</th><th className="px-5 py-3">Código</th><th className="px-5 py-3">Grupos</th><th className="px-5 py-3">Modalidad</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acción</th></tr></thead>
              <tbody>{filtered.map((subject) => <tr key={subject.id} className="border-t border-[#edf0f6]"><td className="px-5 py-4"><span className="mr-3 inline-block h-3 w-3 rounded-full" style={{ backgroundColor: subject.color ?? "#191970" }} /><b className="text-sm text-[#191970]">{subject.name}</b></td><td className="px-5 py-4 text-sm font-semibold text-slate-600">{subject.shortName}</td><td className="px-5 py-4 text-sm text-slate-600">{subject.classCount}</td><td className="px-5 py-4"><span className={subject.paceEnabled ? "rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700" : "text-xs text-slate-500"}>{subject.paceEnabled ? "Usa PACEs" : "Regular"}</span></td><td className="px-5 py-4"><span className={subject.status === AcademicStatus.ACTIVE ? "text-xs font-semibold text-emerald-700" : "text-xs font-semibold text-slate-500"}>{subject.status === AcademicStatus.ACTIVE ? "Activa" : "Inactiva"}</span></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setEditor(subject)} className="secondary"><Pencil size={15} /> Editar</button></td></tr>)}</tbody>
            </table>
            {!filtered.length ? <p className="p-10 text-center text-sm text-slate-500">No hay materias que coincidan con la búsqueda.</p> : null}
          </div>
        </section>
      </div>
      {editor ? <SubjectDialog subject={editor === "new" ? null : editor} saving={saving} onClose={() => setEditor(null)} onSave={save} /> : null}
    </>
  );
}

function SubjectDialog({ subject, saving, onClose, onSave }: { subject: AdminSubjectSummary | null; saving: boolean; onClose: () => void; onSave: (form: FormData) => Promise<void> }) {
  return <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4"><section className="mx-auto my-8 w-full max-w-xl rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="subject-dialog-title"><header className="border-b p-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f75a8]">{subject ? "Editar materia" : "Nueva materia"}</p><h3 id="subject-dialog-title" className="mt-1 text-xl font-semibold text-[#191970]">{subject ? subject.name : "Registrar materia"}</h3></header><form action={onSave} className="space-y-4 p-5"><Field label="Nombre"><input name="name" required minLength={2} defaultValue={subject?.name ?? ""} placeholder="Ej. Ciencias Sociales" className="input" /></Field><div className="grid gap-4 sm:grid-cols-[1fr_8rem]"><Field label="Código para horarios"><input name="shortName" required minLength={2} maxLength={24} defaultValue={subject?.shortName ?? ""} placeholder="Ej. SOC" className="input uppercase" /></Field><Field label="Color"><input name="color" type="color" defaultValue={subject?.color ?? "#191970"} className="mt-2 h-11 w-16 rounded-md border p-1" /></Field></div>{subject ? <Field label="Estado"><select name="status" defaultValue={subject.status} className="input"><option value={AcademicStatus.ACTIVE}>Activa</option><option value={AcademicStatus.INACTIVE}>Inactiva</option></select></Field> : null}<p className="rounded-lg bg-[#f4f6fb] p-3 text-sm leading-6 text-slate-600">Después ve a <b>Clases</b> para vincular esta materia a cada grupo y asignar sus profesores.</p><footer className="flex justify-end gap-3 border-t pt-5"><button type="button" onClick={onClose} disabled={saving} className="secondary">Cancelar</button><button type="submit" disabled={saving} className="primary disabled:opacity-60">{saving ? "Guardando…" : "Guardar materia"}</button></footer></form></section></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>; }
function Metric({ value, label }: { value: number; label: string }) { return <article className="rounded-xl border border-[#dde3ef] bg-white p-4 shadow-sm"><strong className="block text-2xl text-[#191970]">{value}</strong><span className="mt-1 block text-sm text-slate-500">{label}</span></article>; }
