"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  FileText,
  MessageSquareText,
  UsersRound
} from "lucide-react";
import { ClassActivity } from "./ClassActivity";
import { ClassAssignments } from "./ClassAssignments";
import { ClassContent } from "./ClassContent";
import { ClassHeader } from "./ClassHeader";
import { ClassStudents } from "./ClassStudents";
import { ClassSchedule } from "./ClassSchedule";
import { ClassWall } from "./ClassWall";
import type { CreateWallPostForm } from "./ClassWall";
import { CreateAssignmentModal, type CreateAssignmentForm } from "./CreateAssignmentModal";
import { UploadContentModal, type UploadContentForm } from "./UploadContentModal";
import {
  classColorMap,
  type ClassActivityItem,
  type ClassWallItem,
  type TeacherAssignment,
  type TeacherClass,
  type TeacherMaterial
} from "./mock-teacher-classes";
import type { PhysicalClassRequest, PhysicalClassSchedule } from "./mock-teacher-classes";
import { TeacherClassPaces } from "./TeacherClassPaces";
import { InlineAlert } from "@/components/feedback/inline-alert";

export type ClassTab =
  | "wall"
  | "paces"
  | "assignments"
  | "content"
  | "students"
  | "schedule"
  | "activity";

export function ClassDetailPage({
  teacherClass,
  initialTab = "wall",
  persistence,
  wallContent
}: {
  teacherClass: TeacherClass;
  initialTab?: ClassTab;
  wallContent?: ReactNode;
  persistence?: {
    createWall: (form: CreateWallPostForm) => Promise<TeacherClass>;
    createAssignment: (form: CreateAssignmentForm) => Promise<TeacherClass>;
    uploadContent: (form: UploadContentForm) => Promise<TeacherClass>;
  };
}) {
  const [activeTab, setActiveTab] = useState<ClassTab>(initialTab);
  const students = teacherClass.students;
  const [assignments, setAssignments] = useState<TeacherAssignment[]>(teacherClass.assignments);
  const [materials, setMaterials] = useState<TeacherMaterial[]>(teacherClass.materials);
  const [wall, setWall] = useState<ClassWallItem[]>([...teacherClass.wall].reverse());
  const [activity, setActivity] = useState<ClassActivityItem[]>(teacherClass.activity);
  const [physicalRequests, setPhysicalRequests] = useState<PhysicalClassRequest[]>(
    teacherClass.physicalSchedule.requests
  );
  const [physicalSchedule, setPhysicalSchedule] = useState<PhysicalClassSchedule>(
    teacherClass.physicalSchedule
  );
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isContentOpen, setIsContentOpen] = useState(false);

  useEffect(() => {
    const syncTab = () => {
      const next = new URL(window.location.href).searchParams.get("tab") as ClassTab | null;
      if (
        next &&
        ["wall", "paces", "assignments", "content", "students", "schedule", "activity"].includes(
          next
        )
      )
        setActiveTab(next);
    };
    window.addEventListener("popstate", syncTab);
    return () => window.removeEventListener("popstate", syncTab);
  }, []);

  function changeTab(next: ClassTab) {
    setActiveTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.pushState({}, "", url);
  }

  function addActivity(label: string, detail: string) {
    setActivity((current) => [
      {
        id: `activity-${Date.now()}`,
        label,
        detail,
        time: "Ahora"
      },
      ...current
    ]);
  }

  async function handleCreateAssignment(form: CreateAssignmentForm) {
    if (persistence) {
      const updated = await persistence.createAssignment(form);
      setAssignments(updated.assignments);
      setActivity(updated.activity);
      setWall([...updated.wall].reverse());
      setIsAssignmentOpen(false);
      return;
    }
    setAssignments((current) => [
      {
        id: `assignment-${Date.now()}`,
        title: form.title,
        description: form.description,
        dueDate: form.dueDate,
        status: form.status,
        submissionsCount: 0,
        totalStudents: students.length,
        points: form.points,
        submissionType: form.submissionType
      },
      ...current
    ]);
    addActivity("Tarea creada", form.title);
    setIsAssignmentOpen(false);
  }

  async function handleUploadContent(form: UploadContentForm) {
    if (persistence) {
      const updated = await persistence.uploadContent(form);
      setMaterials(updated.materials);
      setActivity(updated.activity);
      setWall([...updated.wall].reverse());
      setIsContentOpen(false);
      return;
    }
    setMaterials((current) => [
      {
        id: `material-${Date.now()}`,
        name: form.name,
        type: form.type,
        uploadedAt: "Hoy"
      },
      ...current
    ]);
    addActivity("Archivo subido", form.name);
    setIsContentOpen(false);
  }

  async function handlePublishWallPost(form: CreateWallPostForm) {
    if (persistence) {
      const updated = await persistence.createWall(form);
      setWall([...updated.wall].reverse());
      setActivity(updated.activity);
      return;
    }
    setWall((current) => [
      ...current,
      {
        id: `wall-${Date.now()}`,
        kind: "post",
        title: form.title,
        message: form.message,
        date: "Ahora",
        author: "Ana Garcia"
      }
    ]);
    addActivity("Comunicado publicado", form.title);
  }

  return (
    <>
      <div className="grid h-full min-h-0 overflow-hidden bg-[var(--color-page)] lg:grid-cols-[16rem_1fr]">
        <ClassContextPanel
          teacherClass={teacherClass}
          activeTab={activeTab}
          studentsCount={students.length}
          assignmentsCount={assignments.length}
          materialsCount={materials.length}
          pendingRequestsCount={
            physicalRequests.filter((request) => request.status === "pending").length
          }
          onChangeTab={changeTab}
        />

        <section className="flex min-w-0 flex-col overflow-hidden">
          <ClassHeader teacherClass={teacherClass} studentsCount={students.length} />
          <ClassMobileTabs
            activeTab={activeTab}
            studentsCount={students.length}
            assignmentsCount={assignments.length}
            materialsCount={materials.length}
            onChangeTab={changeTab}
          />
          <div className="min-h-0 flex-1 overflow-hidden px-5 py-5 lg:px-6">
            <div
              className={activeTab === "wall" ? "mx-auto h-full max-w-5xl" : "h-full overflow-auto"}
            >
              {activeTab === "schedule" ? (
                <InlineAlert tone="info" title="Vista informativa" className="mb-4">
                  Los cambios realizados en esta sección todavía no se guardan de forma permanente.
                </InlineAlert>
              ) : null}
              {activeTab === "wall"
                ? (wallContent ?? <ClassWall wall={wall} onPublish={handlePublishWallPost} />)
                : null}
              {activeTab === "paces" ? (
                <TeacherClassPaces
                  classId={teacherClass.id}
                  studentIds={students.map((item) => item.id)}
                />
              ) : null}
              {activeTab === "assignments" ? (
                <ClassAssignments
                  assignments={assignments}
                  onCreateAssignment={() => setIsAssignmentOpen(true)}
                />
              ) : null}
              {activeTab === "content" ? (
                <ClassContent
                  materials={materials}
                  onUploadContent={() => setIsContentOpen(true)}
                />
              ) : null}
              {activeTab === "students" ? <ClassStudents students={students} /> : null}
              {activeTab === "schedule" ? (
                <ClassSchedule
                  schedule={physicalSchedule}
                  requests={physicalRequests}
                  onUpdateSchedule={setPhysicalSchedule}
                  onUpdateRequests={setPhysicalRequests}
                  onActivity={addActivity}
                />
              ) : null}
              {activeTab === "activity" ? <ClassActivity activity={activity} /> : null}
            </div>
          </div>
        </section>
      </div>

      <CreateAssignmentModal
        open={isAssignmentOpen}
        onClose={() => setIsAssignmentOpen(false)}
        onCreate={handleCreateAssignment}
      />
      <UploadContentModal
        open={isContentOpen}
        onClose={() => setIsContentOpen(false)}
        onUpload={handleUploadContent}
      />
    </>
  );
}

function ClassContextPanel({
  teacherClass,
  activeTab,
  studentsCount,
  assignmentsCount,
  materialsCount,
  pendingRequestsCount,
  onChangeTab
}: {
  teacherClass: TeacherClass;
  activeTab: ClassTab;
  studentsCount: number;
  assignmentsCount: number;
  materialsCount: number;
  pendingRequestsCount: number;
  onChangeTab: (tab: ClassTab) => void;
}) {
  const color = classColorMap[teacherClass.color];
  const links: Array<{ id: ClassTab; label: string; meta: string; icon: ReactNode }> = [
    {
      id: "wall",
      label: "Muro",
      meta: "Avisos y novedades",
      icon: <MessageSquareText size={17} />
    },
    {
      id: "paces",
      label: "PACEs",
      meta: "Proyección de la clase",
      icon: <BookOpenCheck size={17} />
    },
    {
      id: "assignments",
      label: "Tareas",
      meta: `${assignmentsCount} activas`,
      icon: <ClipboardList size={17} />
    },
    {
      id: "content",
      label: "Contenido",
      meta: `${materialsCount} recursos`,
      icon: <FileText size={17} />
    },
    {
      id: "students",
      label: "Alumnos",
      meta: `${studentsCount} inscritos`,
      icon: <UsersRound size={17} />
    },
    {
      id: "schedule",
      label: "Calendario",
      meta: `${pendingRequestsCount} pendientes`,
      icon: <CalendarDays size={17} />
    },
    {
      id: "activity",
      label: "Actividad",
      meta: "Registro reciente",
      icon: <ClipboardList size={17} />
    }
  ];

  return (
    <aside className="hidden overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
      <div className="border-b border-[#edf0f6] p-5">
        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#191970]"
        >
          <ChevronLeft size={16} />
          Todas las clases
        </Link>

        <div
          className={`mt-6 grid h-20 w-20 place-items-center rounded-lg text-2xl font-semibold text-white ring-8 ${color.ring}`}
          style={{ backgroundColor: color.bg }}
        >
          {teacherClass.code.slice(0, 2)}
        </div>
        <h2 className="mt-5 text-xl font-semibold leading-6 text-[#191970]">{teacherClass.name}</h2>
        <p className="mt-2 text-sm font-semibold text-slate-400">{teacherClass.code}</p>
        <p className="mt-4 text-sm leading-6 text-slate-600">{teacherClass.description}</p>
      </div>

      <nav className="space-y-1 p-3">
        {links.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeTab(item.id)}
            aria-current={activeTab === item.id ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition ${
              activeTab === item.id
                ? "bg-[#eef2ff] text-[#191970]"
                : "text-slate-600 hover:bg-[#f6f8fc]"
            }`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${
                activeTab === item.id ? "bg-white" : "bg-[#f4f6fb]"
              }`}
            >
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{item.label}</span>
              <span className="block truncate text-xs text-slate-400">{item.meta}</span>
            </span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

function ClassMobileTabs({
  activeTab,
  studentsCount,
  assignmentsCount,
  materialsCount,
  onChangeTab
}: {
  activeTab: ClassTab;
  studentsCount: number;
  assignmentsCount: number;
  materialsCount: number;
  onChangeTab: (tab: ClassTab) => void;
}) {
  const links: Array<{ id: ClassTab; label: string; count?: number }> = [
    { id: "wall", label: "Muro" },
    { id: "paces", label: "PACEs" },
    { id: "assignments", label: "Tareas", count: assignmentsCount },
    { id: "content", label: "Contenido", count: materialsCount },
    { id: "students", label: "Alumnos", count: studentsCount },
    { id: "schedule", label: "Calendario" },
    { id: "activity", label: "Actividad" }
  ];
  return (
    <nav
      className="shrink-0 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 lg:hidden"
      aria-label="Secciones de la clase"
    >
      <div className="flex min-w-max gap-2">
        {links.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChangeTab(item.id)}
            aria-current={activeTab === item.id ? "page" : undefined}
            className={`min-h-11 rounded-md px-3 text-xs font-semibold ${activeTab === item.id ? "bg-[var(--color-brand-900)] text-white" : "border border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]"}`}
          >
            {item.label}
            {item.count !== undefined ? ` · ${item.count}` : ""}
          </button>
        ))}
      </div>
    </nav>
  );
}
