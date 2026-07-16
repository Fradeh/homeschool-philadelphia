import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BookOpen, ClipboardList, FileText, UsersRound } from "lucide-react";
import type { ClassroomClassSummary } from "@homeschool/shared";

export function ClassCard({ teacherClass }: { teacherClass: ClassroomClassSummary }) {
  const color = teacherClass.color ?? "#191970";
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="h-1.5" style={{ backgroundColor: color }} aria-hidden="true" />
      <div className="flex min-w-0 items-start gap-4 p-5">
        <div
          className="grid h-14 w-14 shrink-0 place-items-center rounded-lg text-lg font-semibold text-white ring-4 ring-black/5"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          {teacherClass.code.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-info)]">
            {teacherClass.code}
          </p>
          <h3 className="mt-1 break-words text-lg font-semibold text-[var(--color-text)]">
            {teacherClass.name}
          </h3>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[var(--color-text-secondary)]">
            {teacherClass.description || "Espacio docente para acompañamiento y gestión académica."}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 border-y border-[var(--color-border)] text-sm">
        <CardMetric
          icon={<UsersRound size={16} />}
          label="Alumnos"
          value={teacherClass.studentCount}
        />
        <CardMetric
          icon={<ClipboardList size={16} />}
          label="Tareas"
          value={teacherClass.assignmentCount}
        />
        <CardMetric
          icon={<FileText size={16} />}
          label="Materiales"
          value={teacherClass.materialCount}
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex min-w-0 gap-3 rounded-lg bg-[var(--color-surface-soft)] p-3">
          <BookOpen
            size={18}
            className="mt-0.5 shrink-0 text-[var(--color-info)]"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Actividad reciente
            </p>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-[var(--color-text-secondary)]">
              {teacherClass.latestActivity
                ? `${activityLabel(teacherClass.latestActivity.kind)}: ${teacherClass.latestActivity.title}`
                : "Sin actividad reciente"}
            </p>
          </div>
        </div>
        <Link
          href={`/teacher/classes/${teacherClass.id}`}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--color-brand-900)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-brand-800)]"
        >
          Abrir clase <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function activityLabel(kind: NonNullable<ClassroomClassSummary["latestActivity"]>["kind"]) {
  if (kind === "WALL") return "Publicación";
  if (kind === "ASSIGNMENT") return "Tarea";
  return "Recurso";
}

function CardMetric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="min-w-0 border-r border-[var(--color-border)] px-2 py-3 text-center last:border-r-0">
      <div className="flex items-center justify-center gap-1.5 text-[var(--color-brand-900)]">
        <span aria-hidden="true">{icon}</span>
        <strong className="tabular-nums">{value}</strong>
      </div>
      <span className="mt-1 block truncate text-[10px] text-[var(--color-text-muted)] sm:text-xs">
        {label}
      </span>
    </div>
  );
}
