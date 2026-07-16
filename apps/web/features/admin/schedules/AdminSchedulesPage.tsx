"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ScheduleAudienceType,
  ScheduleBlockKind,
  ScheduleTemplateStatus,
  UserRole,
  Weekday,
  type AdminAcademicYearSummary,
  type AdminClassSummary,
  type AdminUserSummary,
  type ScheduleGrid,
  type SchedulePeriod,
  type ScheduleTemplate,
  type ScheduleTemplateBlockInput
} from "@homeschool/shared";
import { CalendarRange, GraduationCap, Plus, UserRoundCog, X } from "lucide-react";
import { getAdminAcademicYears, getAdminClasses, getAdminUsers } from "../admin-api";
import { scheduleApi } from "@/features/schedules/schedule-api";
import { scheduleWeekdays } from "@/features/schedules/WeeklyScheduleTable";

const dayLabels: Record<Weekday, string> = { MONDAY: "Lunes", TUESDAY: "Martes", WEDNESDAY: "Miércoles", THURSDAY: "Jueves", FRIDAY: "Viernes" };

type SubjectOption = { value: string; label: string };

export function AdminSchedulesPage() {
  const [grid, setGrid] = useState<ScheduleGrid | null>(null);
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [years, setYears] = useState<AdminAcademicYearSummary[]>([]);
  const [classes, setClasses] = useState<AdminClassSummary[]>([]);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [blocks, setBlocks] = useState<ScheduleTemplateBlockInput[]>([]);
  const [periods, setPeriods] = useState<SchedulePeriod[]>([]);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("Cargando configuración…");

  async function load(preferredId?: string) {
    try {
      const [nextGrid, nextTemplates, nextYears, nextClasses, nextUsers] = await Promise.all([
        scheduleApi.admin.grid(), scheduleApi.admin.templates(), getAdminAcademicYears(), getAdminClasses(), getAdminUsers()
      ]);
      const targetId = preferredId ?? selectedId;
      const chosen = nextTemplates.find((item) => item.id === targetId) ?? nextTemplates[0];
      setGrid(nextGrid); setTemplates(nextTemplates); setYears(nextYears); setClasses(nextClasses); setUsers(nextUsers);
      setSelectedId(chosen?.id ?? ""); setBlocks(chosen?.blocks.map(toInput) ?? []); setPeriods(chosen?.grid.periods ?? nextGrid.periods); setMessage("");
    } catch { setMessage("No fue posible cargar la configuración de horarios."); }
  }

  useEffect(() => { void load(); }, []);

  const selected = templates.find((item) => item.id === selectedId) ?? null;
  const teachers = useMemo(() => users.filter((user) => user.roles.includes(UserRole.TEACHER) && user.teacherProfileId), [users]);
  const subjectOptions = useMemo<SubjectOption[]>(() => {
    if (!selected) return [];
    if (selected.audienceType === ScheduleAudienceType.TEACHER && selected.targetTeacher) {
      const options = classes
        .filter((schoolClass) =>
          schoolClass.academicYearId === selected.academicYearId
          && schoolClass.teachers.some((teacher) => teacher.teacherProfileId === selected.targetTeacher!.id)
        )
        .flatMap((schoolClass) => schoolClass.subjects.map((subject) => ({
          value: `SUBJECT|${subject.id}|${selected.targetTeacher!.id}`,
          label: `${subject.subjectShortName} · ${schoolClass.name}`
        })));
      return [...new Map(options.map((option) => [option.value, option])).values()];
    }
    const targetClasses = selected.audienceType === ScheduleAudienceType.CLASS
      ? classes.filter((item) => item.id === selected.targetClass?.id)
      : classes.filter((item) => item.gradeLevelId === selected.gradeLevel?.id);
    return targetClasses.flatMap((schoolClass) => schoolClass.subjects.flatMap((subject) => schoolClass.teachers.filter((teacher) => teacher.teacherProfileId).map((teacher) => ({ value: `SUBJECT|${subject.id}|${teacher.teacherProfileId}`, label: `${subject.subjectShortName} · ${teacher.firstName} ${teacher.lastName}` }))));
  }, [classes, selected]);

  function selectTemplate(id: string) { setSelectedId(id); const template = templates.find((item) => item.id === id); setBlocks(template?.blocks.map(toInput) ?? []); setPeriods(template?.grid.periods ?? grid?.periods ?? []); setMessage(""); }
  function setCell(periodId: string, weekday: Weekday, value: string) { const next = parseCellValue(periodId, weekday, value); setBlocks((current) => [...current.filter((item) => item.periodId !== periodId || item.weekday !== weekday), next]); }
  function setPeriodTime(periodId: string, field: "startTime" | "endTime", value: string) { setPeriods((current) => current.map((period) => period.id === periodId ? { ...period, [field]: value } : period)); }

  async function createTemplate(payload: { academicYearId: string; audienceType: ScheduleAudienceType.CLASS | ScheduleAudienceType.TEACHER; classId?: string; teacherId?: string; classSubjectIds?: string[]; name: string }) {
    try { const template = await scheduleApi.admin.createTemplate(payload); setCreating(false); await load(template.id); setMessage("Plantilla lista. Las materias seleccionadas ya están disponibles sin borrar el horario existente."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo preparar la plantilla."); }
  }

  async function save() {
    if (!selected || !periods.length) return;
    setSaving(true);
    try {
      const gridChanged = selected.grid.periods.some((period, index) => period.startTime !== periods[index]?.startTime || period.endTime !== periods[index]?.endTime || period.kind !== periods[index]?.kind);
      const templateWithGrid = gridChanged
        ? await scheduleApi.admin.saveGrid(selected.id, periods.map((period) => ({ startTime: period.startTime, endTime: period.endTime, suggestedBreak: period.kind === "BREAK" })))
        : selected;
      const complete = templateWithGrid.grid.periods.flatMap((period, index) => scheduleWeekdays.map((weekday) => {
        const sourcePeriodId = periods[index].id;
        const block = blocks.find((item) => item.periodId === sourcePeriodId && item.weekday === weekday);
        return block ? { ...block, periodId: period.id } : { periodId: period.id, weekday, kind: ScheduleBlockKind.EMPTY };
      }));
      const assignments = complete.filter((item) => item.kind === ScheduleBlockKind.SUBJECT && item.classSubjectId && item.teacherId);
      await Promise.all(assignments.map((item) => scheduleApi.admin.assignSubjectTeacher(item.classSubjectId!, item.teacherId!)));
      const updated = await scheduleApi.admin.saveBlocks(templateWithGrid.id, complete);
      setTemplates((current) => current.map((item) => item.id === updated.id ? updated : item)); setBlocks(updated.blocks.map(toInput)); setPeriods(updated.grid.periods); setMessage("Horario guardado como borrador.");
    } catch { setMessage("No se pudo guardar. Usa únicamente las materias y profesores habilitados para esta plantilla."); }
    finally { setSaving(false); }
  }

  async function publish() {
    if (!selected) return;
    setSaving(true);
    try { const updated = await scheduleApi.admin.publish(selected.id); setTemplates((current) => current.map((item) => item.id === updated.id ? updated : item)); setMessage("Horario publicado y disponible para su destinatario."); }
    catch { setMessage("No se pudo publicar. Revisa celdas incompletas y cruces de horario del profesor."); }
    finally { setSaving(false); }
  }

  return <>
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1500px] flex-col gap-5 overflow-y-auto px-5 py-6 lg:px-8">
      <section className="flex shrink-0 flex-col gap-4 rounded-xl border border-[#dde3ef] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f75a8]">Configuración académica</p><h2 className="mt-1 text-2xl font-semibold text-[#191970]">Horarios</h2><p className="mt-2 text-sm text-slate-600">Publica una plantilla para una clase de estudiantes o para la carga de un profesor.</p></div><button type="button" onClick={() => setCreating(true)} className="primary shrink-0"><Plus size={18} aria-hidden="true" /> Nueva plantilla</button></section>
      {message ? <p className="shrink-0 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800" role="status" aria-live="polite">{message}</p> : null}
      <section className="flex shrink-0 flex-col gap-3 rounded-xl border border-[#dde3ef] bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"><label className="grid gap-1 text-xs font-bold uppercase tracking-wide text-slate-500">Plantilla activa<select value={selectedId} onChange={(event) => selectTemplate(event.target.value)} className="input min-w-72 font-normal normal-case tracking-normal"><option value="">Selecciona una plantilla</option>{templates.map((template) => <option key={template.id} value={template.id}>{audienceLabel(template)} · {template.name}</option>)}</select></label>{selected ? <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${selected.status === ScheduleTemplateStatus.PUBLISHED ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{selected.status === ScheduleTemplateStatus.PUBLISHED ? "Publicado" : "Borrador"}</span><button type="button" onClick={save} disabled={saving} className="secondary">{saving ? "Guardando…" : "Guardar borrador"}</button><button type="button" onClick={publish} disabled={saving} className="primary">Publicar horario</button></div> : null}</section>
      {selected ? <section className="shrink-0 rounded-xl border border-[#dde3ef] bg-white px-5 py-4 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-[#078cc5]">{selected.audienceType === ScheduleAudienceType.TEACHER ? "Horario del profesor" : selected.audienceType === ScheduleAudienceType.CLASS ? "Horario de estudiantes" : "Plantilla anterior por grado"}</p><h3 className="mt-1 font-semibold text-[#191970]">{audienceLabel(selected)}</h3></div><p className="text-sm text-slate-500">{selected.allowedSubjects.length ? `${selected.allowedSubjects.length} materias habilitadas` : selected.gradeLevel ? `Grado ${selected.gradeLevel.name}` : "Sin materias habilitadas"}</p></div></section> : null}
      <div className="rounded-xl border border-[#dde3ef] bg-white shadow-sm">{selected?.grid ?? grid ? <ScheduleEditor periods={periods} blocks={blocks} subjectOptions={subjectOptions} onChange={setCell} onTimeChange={setPeriodTime} /> : <div className="grid min-h-80 place-items-center p-8 text-center"><div><CalendarRange className="mx-auto text-[#191970]" aria-hidden="true" /><h3 className="mt-3 font-semibold text-[#191970]">Selecciona o crea una plantilla</h3><p className="mt-1 text-sm text-slate-500">La cuadrícula semanal aparecerá aquí.</p></div></div>}</div>
    </div>
    {creating ? <CreateTemplateDialog years={years} classes={classes} teachers={teachers} onClose={() => setCreating(false)} onCreate={createTemplate} /> : null}
  </>;
}

function ScheduleEditor({ periods, blocks, subjectOptions, onChange, onTimeChange }: { periods: SchedulePeriod[]; blocks: ScheduleTemplateBlockInput[]; subjectOptions: SubjectOption[]; onChange: (periodId: string, weekday: Weekday, value: string) => void; onTimeChange: (periodId: string, field: "startTime" | "endTime", value: string) => void }) {
  return <table className="w-full border-collapse text-sm"><thead><tr className="bg-[#191970] text-white"><th className="border border-white/20 p-3">Hora</th>{scheduleWeekdays.map((day) => <th key={day} className="border border-white/20 p-3">{dayLabels[day]}</th>)}</tr></thead><tbody>{periods.map((period) => {
    const suggestedBreak = period.kind === "BREAK";
    return <tr key={period.id} className={suggestedBreak ? "bg-amber-50" : undefined}><td className={`border p-3 font-semibold tabular-nums ${suggestedBreak ? "bg-amber-100 text-amber-900" : "bg-slate-50"}`}><div className="grid gap-2"><label className="text-xs font-bold" htmlFor={`${period.id}-start`}>Inicio<input id={`${period.id}-start`} type="time" value={period.startTime} onChange={(event) => onTimeChange(period.id, "startTime", event.target.value)} className="mt-1 block h-9 w-full rounded border border-slate-300 bg-white px-2 text-sm font-medium text-slate-900" /></label><label className="text-xs font-bold" htmlFor={`${period.id}-end`}>Fin<input id={`${period.id}-end`} type="time" value={period.endTime} onChange={(event) => onTimeChange(period.id, "endTime", event.target.value)} className="mt-1 block h-9 w-full rounded border border-slate-300 bg-white px-2 text-sm font-medium text-slate-900" /></label></div>{suggestedBreak ? <small className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-amber-700">Recreo sugerido</small> : null}</td>{scheduleWeekdays.map((day) => <td key={day} className={`border p-2 ${suggestedBreak ? "bg-amber-50" : ""}`}><label className="sr-only" htmlFor={`${period.id}-${day}`}>{dayLabels[day]} {period.startTime}</label><select id={`${period.id}-${day}`} value={cellValue(blocks.find((item) => item.periodId === period.id && item.weekday === day))} onChange={(event) => onChange(period.id, day, event.target.value)} className={`h-11 w-full rounded-md border px-2 text-xs ${suggestedBreak ? "border-amber-200 bg-amber-50" : "border-[#dde3ef] bg-white"}`}><option value="EMPTY">Libre</option><option value="PACES">PACEs</option><option value="ACTIVITY|OPENING EXERCISES">Opening Exercises</option><option value="ACTIVITY|CLOSING">Closing</option><option value="ACTIVITY|CHAPEL">Chapel</option>{subjectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></td>)}</tr>;
  })}</tbody></table>;
}
function CreateTemplateDialog({ years, classes, teachers, onClose, onCreate }: { years: AdminAcademicYearSummary[]; classes: AdminClassSummary[]; teachers: AdminUserSummary[]; onClose: () => void; onCreate: (payload: { academicYearId: string; audienceType: ScheduleAudienceType.CLASS | ScheduleAudienceType.TEACHER; classId?: string; teacherId?: string; classSubjectIds?: string[]; name: string }) => Promise<void> }) {
  const activeYear = years.find((year) => year.isActive);
  const [audience, setAudience] = useState<ScheduleAudienceType.CLASS | ScheduleAudienceType.TEACHER>(ScheduleAudienceType.CLASS);
  const [yearId, setYearId] = useState(activeYear?.id ?? "");
  const [teacherId, setTeacherId] = useState("");
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const yearClasses = classes.filter((item) => item.academicYearId === yearId);
  const teacherClasses = yearClasses.filter((item) => item.teachers.some((teacher) => teacher.teacherProfileId === teacherId));
  const teacherSubjects = teacherClasses.flatMap((item) => item.subjects.map((subject) => ({ id: subject.id, label: `${subject.subjectName} · ${item.name}` })));
  function toggleSubject(id: string) { setSubjectIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  async function submit(form: FormData) { setError(""); const classId = String(form.get("classId") ?? ""); if (!yearId || (audience === ScheduleAudienceType.CLASS && !classId) || (audience === ScheduleAudienceType.TEACHER && (!teacherId || !subjectIds.length))) { setError("Completa el destinatario y las materias antes de crear la plantilla."); return; } setSaving(true); try { await onCreate({ academicYearId: yearId, audienceType: audience, classId: audience === ScheduleAudienceType.CLASS ? classId : undefined, teacherId: audience === ScheduleAudienceType.TEACHER ? teacherId : undefined, classSubjectIds: audience === ScheduleAudienceType.TEACHER ? subjectIds : undefined, name: String(form.get("name") ?? "").trim() }); } catch { setError("No se pudo guardar la plantilla."); setSaving(false); } }
  return <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-slate-950/45 p-4"><section className="mx-auto my-5 w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="new-template-title"><header className="flex items-start justify-between border-b p-5 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f75a8]">Nueva plantilla</p><h2 id="new-template-title" className="mt-1 text-xl font-semibold text-[#191970]">¿A quién se mostrará este horario?</h2></div><button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-10 w-10 place-items-center rounded-md hover:bg-slate-100"><X size={19} aria-hidden="true" /></button></header><form action={submit} className="space-y-5 p-5 sm:p-6"><fieldset><legend className="text-sm font-semibold text-slate-700">1. Tipo de horario</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><AudienceButton selected={audience === ScheduleAudienceType.CLASS} icon={<GraduationCap size={19} />} title="Estudiantes de una clase" description="Todos los alumnos matriculados verán la misma plantilla." onClick={() => { setAudience(ScheduleAudienceType.CLASS); setSubjectIds([]); }} /><AudienceButton selected={audience === ScheduleAudienceType.TEACHER} icon={<UserRoundCog size={19} />} title="Profesor" description="Permite organizar una o varias materias del profesor." onClick={() => setAudience(ScheduleAudienceType.TEACHER)} /></div></fieldset><div className="grid gap-4 sm:grid-cols-2"><Field label="Año académico"><select value={yearId} onChange={(event) => { setYearId(event.target.value); setSubjectIds([]); }} required className="input"><option value="">Selecciona el año</option>{years.map((year) => <option key={year.id} value={year.id}>{year.name}{year.isActive ? " (activo)" : ""}</option>)}</select></Field><Field label="Nombre de la plantilla"><input name="name" required placeholder={audience === ScheduleAudienceType.CLASS ? "Ej. Horario Octavo A…" : "Ej. Carga semanal de Laura…"} className="input" /></Field></div>{audience === ScheduleAudienceType.CLASS ? <Field label="Clase o grupo de estudiantes"><select name="classId" required defaultValue="" className="input"><option value="">Selecciona una clase</option>{yearClasses.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.code} · {item.gradeLevelName ?? "Sin grado"}</option>)}</select><small className="mt-1 block font-normal text-slate-500">El grado se obtiene automáticamente de la clase.</small></Field> : <><Field label="Profesor"><select value={teacherId} onChange={(event) => { setTeacherId(event.target.value); setSubjectIds([]); }} required className="input"><option value="">Selecciona un profesor</option>{teachers.map((teacher) => <option key={teacher.teacherProfileId} value={teacher.teacherProfileId!}>{teacher.firstName} {teacher.lastName}</option>)}</select></Field><fieldset className="rounded-lg border border-[#dde3ef] bg-[#f8f9fc] p-4"><legend className="px-1 text-sm font-semibold text-slate-700">2. Materias que imparte</legend><p className="mb-3 text-xs text-slate-500">Puedes seleccionar una materia específica o varias. Solo aparecen clases donde el profesor está asignado.</p><div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">{teacherSubjects.map((subject) => <label key={subject.id} className="flex cursor-pointer items-center gap-2 rounded-md border bg-white p-3 text-sm"><input type="checkbox" checked={subjectIds.includes(subject.id)} onChange={() => toggleSubject(subject.id)} /><span>{subject.label}</span></label>)}</div>{teacherId && !teacherSubjects.length ? <p className="text-sm text-amber-700">Este profesor aún no está asignado a ninguna clase del año seleccionado.</p> : null}</fieldset></>}{error ? <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700" role="alert">{error}</p> : null}<footer className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} disabled={saving} className="secondary">Cancelar</button><button type="submit" disabled={saving} className="primary">{saving ? "Creando…" : "Crear plantilla"}</button></footer></form></section></div>;
}

function AudienceButton({ selected, icon, title, description, onClick }: { selected: boolean; icon: React.ReactNode; title: string; description: string; onClick: () => void }) { return <button type="button" aria-pressed={selected} onClick={onClick} className={`flex gap-3 rounded-lg border p-4 text-left ${selected ? "border-[#191970] bg-[#eef2ff] ring-1 ring-[#191970]" : "border-[#dde3ef] hover:border-[#191970]/40 hover:bg-slate-50"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${selected ? "bg-[#191970] text-white" : "bg-[#f4f6fb] text-[#191970]"}`}>{icon}</span><span><b className="block text-sm text-[#191970]">{title}</b><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span></button>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>; }
function audienceLabel(template: ScheduleTemplate) { if (template.audienceType === ScheduleAudienceType.CLASS) return template.targetClass?.name ?? "Clase"; if (template.audienceType === ScheduleAudienceType.TEACHER) return template.targetTeacher?.name ?? "Profesor"; return template.gradeLevel?.name ?? "Plantilla por grado"; }
function toInput(block: ScheduleTemplate["blocks"][number]): ScheduleTemplateBlockInput { return { periodId: block.periodId, weekday: block.weekday, kind: block.kind, label: block.label ?? undefined, classSubjectId: block.classSubjectId ?? undefined, teacherId: block.teacherId ?? undefined }; }
function cellValue(block?: ScheduleTemplateBlockInput) { if (!block) return "EMPTY"; if (block.kind === ScheduleBlockKind.SUBJECT) return `SUBJECT|${block.classSubjectId}|${block.teacherId}`; if (block.kind === ScheduleBlockKind.ACTIVITY) return `ACTIVITY|${block.label}`; return block.kind; }
function parseCellValue(periodId: string, weekday: Weekday, value: string): ScheduleTemplateBlockInput { const [kind, first, second] = value.split("|"); if (kind === "SUBJECT") return { periodId, weekday, kind: ScheduleBlockKind.SUBJECT, classSubjectId: first, teacherId: second }; if (kind === "ACTIVITY") return { periodId, weekday, kind: ScheduleBlockKind.ACTIVITY, label: first }; if (kind === "PACES") return { periodId, weekday, kind: ScheduleBlockKind.PACES, label: "PACES" }; return { periodId, weekday, kind: ScheduleBlockKind.EMPTY }; }
