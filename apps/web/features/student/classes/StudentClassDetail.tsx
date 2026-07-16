"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, BookOpenCheck, CalendarDays, ClipboardList, Clock3, Download, ExternalLink, FileText, MapPin, Plus, X } from "lucide-react";
import type { TeacherClass } from "@/features/teacher/classes/mock-teacher-classes";
import { studentAssignments, studentClasses, studentUser } from "../mock-student-data";
import { StudentClassWall } from "./StudentClassWall";
import { usePaceWorkspace } from "@/features/paces/use-pace-workspace";
import type { PaceItem, PaceSubject } from "@/features/paces/mock-pace-data";

type Tab = "home" | "paces" | "assignments" | "resources" | "meetings";
type Assignment = (typeof studentAssignments)[number];

export function StudentClassDetail({ teacherClass }: { teacherClass: TeacherClass }) {
  const info = studentClasses.find((item) => item.id === teacherClass.id)!;
  const assignments = studentAssignments.filter((item) => item.classId === teacherClass.id);
  const [tab, setTab] = useState<Tab>("home");
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const { workspace } = usePaceWorkspace();
  const classPaceSubjects = workspace.subjects.filter((subject) => subject.classId === teacherClass.id);
  const studentPacePlan = workspace.plans.find((item) => item.studentId === studentUser.id);
  const tabs: Array<{ id: Tab; label: string; icon: ReactNode; count?: number }> = [
    { id: "home", label: "Inicio", icon: <BookOpen size={16} /> },
    { id: "paces", label: "PACEs", icon: <BookOpenCheck size={16} />, count: classPaceSubjects.length },
    { id: "assignments", label: "Tareas", icon: <ClipboardList size={16} />, count: assignments.length },
    { id: "resources", label: "Recursos", icon: <FileText size={16} />, count: teacherClass.materials.length },
    { id: "meetings", label: "Encuentros", icon: <CalendarDays size={16} /> }
  ];

  return <>
    <div className="grid h-full min-h-0 overflow-hidden lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="hidden min-h-0 border-r border-[#dde3ef] bg-white lg:flex lg:flex-col">
        <div className="border-b border-[#edf0f6] p-5">
          <Link href="/student/classes" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#191970]"><ArrowLeft size={14} />Todas las clases</Link>
          <span className="mt-6 grid h-16 w-16 place-items-center rounded-lg text-lg font-bold text-white" style={{ backgroundColor: info.color }}>{teacherClass.code.slice(0, 2)}</span>
          <h2 className="mt-4 text-lg font-semibold leading-6 text-[#191970]">{teacherClass.name}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">{teacherClass.code} · {info.teacher}</p>
          <div className="mt-4"><div className="flex items-center justify-between text-xs font-semibold"><span className="text-slate-400">Mi progreso</span><span className="text-[#191970]">{info.progress}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#078cc5]" style={{ width: `${info.progress}%` }} /></div></div>
          <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-500"><Clock3 size={14} />{info.nextClass}</p>
        </div>
        <nav className="space-y-1 p-3">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold ${tab === item.id ? "bg-[#eef2ff] text-[#191970]" : "text-slate-600 hover:bg-[#f6f8fc]"}`}><span className={`grid h-9 w-9 place-items-center rounded-md ${tab === item.id ? "bg-white" : "bg-[#f4f6fb]"}`}>{item.icon}</span><span className="min-w-0 flex-1">{item.label}</span>{item.count !== undefined ? <span className="text-xs text-slate-400">{item.count}</span> : null}</button>)}</nav>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-[#dde3ef] bg-white px-5 py-3 lg:px-6">
          <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#6f75a8]">{tabs.find((item) => item.id === tab)?.label}</p><h2 className="mt-1 text-lg font-semibold text-[#191970]">{teacherClass.name}</h2></div><span className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-xs font-semibold text-[#191970]">{assignments.filter((item) => item.status !== "Entregada").length} pendientes</span></div>
          <nav className="mt-3 flex gap-1 overflow-x-auto lg:hidden">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold ${tab === item.id ? "bg-[#191970] text-white" : "bg-[#f4f6fb] text-slate-500"}`}>{item.icon}{item.label}</button>)}</nav>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 lg:px-6">
          {tab === "home" ? <div className="mx-auto max-w-5xl"><StudentClassWall wall={[...teacherClass.wall].reverse()} /></div> : null}
          {tab === "paces" ? <ClassPaces subjects={classPaceSubjects} plans={studentPacePlan?.plans ?? {}} /> : null}
          {tab === "assignments" ? <Assignments items={assignments} /> : null}
          {tab === "resources" ? <Resources teacherClass={teacherClass} /> : null}
          {tab === "meetings" ? <Meetings teacherClass={teacherClass} sent={requestSent} onRequest={() => setRequestOpen(true)} /> : null}
        </main>
      </section>
    </div>
    {requestOpen ? <RequestDialog teacherClass={teacherClass} onClose={() => setRequestOpen(false)} onSend={() => { setRequestSent(true); setRequestOpen(false); }} /> : null}
  </>;
}

function ClassPaces({ subjects, plans }: { subjects: PaceSubject[]; plans: Record<string, PaceItem[]> }) {
  return <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">{subjects.map((subject) => { const items = plans[subject.id] ?? []; const active = items.find((item) => item.status === "current"); return <article key={subject.id} className="overflow-hidden rounded-lg border bg-white"><div className="h-2" style={{ backgroundColor: subject.color }} /><div className="p-5"><p className="text-xs font-bold" style={{ color: subject.color }}>{subject.shortName}</p><h3 className="mt-1 font-semibold text-[#191970]">{subject.name}</h3>{items.length ? <><p className="mt-4 text-xs text-slate-400">PACE actual</p><strong className="text-3xl text-[#191970]">{active?.number ?? "—"}</strong><div className="mt-4 flex gap-2">{items.map((item) => <span key={item.number} className={`rounded-md px-3 py-2 text-xs font-bold ${item.status === "completed" ? "bg-emerald-500 text-white" : item.status === "current" ? "bg-[#078cc5] text-white" : "bg-slate-100 text-slate-500"}`}>{item.number}</span>)}</div></> : <p className="mt-4 text-sm text-slate-500">Esta materia aún no tiene PACEs vinculados.</p>}</div></article>; })}{!subjects.length ? <p className="text-sm text-slate-500">No hay materias PACE vinculadas con esta clase.</p> : null}</div>;
}

function Assignments({ items }: { items: Assignment[] }) {
  return <section className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-[#dde3ef] bg-white"><header className="border-b p-5"><h3 className="text-lg font-semibold text-[#191970]">Tareas de la clase</h3></header><div className="divide-y">{items.map((item) => <article key={item.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_10rem_auto] sm:items-center"><div><Status value={item.status} /><h4 className="mt-2 font-semibold text-[#191970]">{item.title}</h4><p className="mt-1 text-xs text-slate-500">{item.points} puntos</p></div><div><p className="text-[10px] font-bold uppercase text-slate-400">Entrega</p><p className="mt-1 text-sm font-semibold">{item.due}</p></div><button className={`rounded-md px-4 py-2 text-sm font-semibold ${item.status === "Entregada" ? "border text-[#191970]" : "bg-[#191970] text-white"}`}>{item.status === "En progreso" ? "Continuar" : item.status === "Entregada" ? "Ver entrega" : "Comenzar"}</button></article>)}</div></section>;
}

function Resources({ teacherClass }: { teacherClass: TeacherClass }) {
  return <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 xl:grid-cols-3">{teacherClass.materials.map((item) => <article key={item.id} className="rounded-lg border border-[#dde3ef] bg-white p-5"><span className="grid h-10 w-10 place-items-center rounded-md bg-[#eef2ff] text-[#191970]"><FileText size={19} /></span><p className="mt-4 text-[10px] font-bold text-slate-400">{item.type}</p><h3 className="mt-2 min-h-10 font-semibold text-[#191970]">{item.name}</h3><p className="text-xs text-slate-400">Publicado {item.uploadedAt}</p><div className="mt-4 flex gap-2"><button className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border py-2 text-xs font-semibold text-[#191970]"><ExternalLink size={14} />Ver</button>{item.type !== "Enlace" ? <button className="rounded-md border px-3 text-[#191970]"><Download size={14} /></button> : null}</div></article>)}</div>;
}

function Meetings({ teacherClass, sent, onRequest }: { teacherClass: TeacherClass; sent: boolean; onRequest: () => void }) {
  const schedule = teacherClass.physicalSchedule;
  const mine = schedule.requests.filter((item) => item.studentId === studentUser.id);
  return <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_20rem]"><section className="rounded-lg border bg-white p-5"><h3 className="font-semibold text-[#191970]">Disponibilidad del profesor</h3><p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><MapPin size={16} />{schedule.location}</p><p className="mt-2 text-sm leading-6 text-slate-500">{schedule.instructions}</p><div className="mt-4 flex flex-wrap gap-2">{schedule.availability.map((slot) => <span key={slot.weekday} className="rounded-md bg-[#eef2ff] px-3 py-2 text-xs font-semibold text-[#191970]">{["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][slot.weekday]} · {slot.startTime}–{slot.endTime}</span>)}</div><button onClick={onRequest} className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#191970] px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16} />Solicitar encuentro</button>{sent ? <p className="mt-3 text-sm font-semibold text-emerald-700">Solicitud enviada al profesor.</p> : null}</section><aside className="rounded-lg border bg-white p-5"><h3 className="font-semibold text-[#191970]">Mis solicitudes</h3>{mine.map((item) => <article key={item.id} className="mt-4 rounded-md bg-[#f6f8fc] p-3"><p className="text-sm font-semibold text-[#191970]">{item.requestedDate} · {item.requestedTime}</p><p className="mt-1 text-xs text-slate-500">Estado: {item.status}</p></article>)}</aside></div>;
}

function RequestDialog({ teacherClass, onClose, onSend }: { teacherClass: TeacherClass; onClose: () => void; onSend: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"><section className="w-full max-w-lg rounded-lg bg-white"><header className="flex justify-between border-b p-5"><h3 className="text-lg font-semibold text-[#191970]">Solicitar encuentro</h3><button onClick={onClose}><X size={20} /></button></header><form action={onSend} className="space-y-4 p-5"><div className="grid grid-cols-2 gap-4"><Field label="Fecha"><input required type="date" className="mt-2 h-11 w-full rounded-md border px-3" /></Field><Field label="Hora"><input required type="time" className="mt-2 h-11 w-full rounded-md border px-3" /></Field></div><Field label="¿Qué necesitas revisar?"><textarea required rows={4} className="mt-2 w-full resize-none rounded-md border p-3" /></Field><p className="text-xs text-slate-500">La solicitud será revisada por {studentClasses.find((item) => item.id === teacherClass.id)?.teacher}.</p><footer className="flex justify-end gap-3 border-t pt-4"><button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-semibold text-[#191970]">Cancelar</button><button className="rounded-md bg-[#191970] px-4 py-2 text-sm font-semibold text-white">Enviar solicitud</button></footer></form></section></div>;
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) { return <section className="rounded-lg border bg-white p-4"><p className="mb-3 text-[10px] font-bold uppercase tracking-[.16em] text-[#6f75a8]">{title}</p>{children}</section>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block text-sm font-semibold text-slate-700">{label}{children}</label>; }
function Status({ value }: { value: string }) { return <span className={`inline-block rounded-full px-2 py-1 text-[10px] font-bold ${value === "Entregada" ? "bg-emerald-50 text-emerald-700" : value === "En progreso" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{value}</span>; }
