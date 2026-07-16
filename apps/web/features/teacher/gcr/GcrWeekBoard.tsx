import {
  BookOpenCheck,
  Check,
  CircleDashed,
  Clock3,
  FilePlus2,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UserCheck,
  X
} from "lucide-react";
import type { ReactNode } from "react";
import type { GcrReport, GcrState, GcrSubject, GcrWeek } from "./gcr-types";

const stateLabels: Record<GcrState, string> = {
  PENDING: "Pendiente",
  DRAFT: "Borrador",
  SUBMITTED_ON_TIME: "Enviado",
  SUBMITTED_LATE: "Enviado tarde",
  INCOMPLETE: "Incompleto",
  MODIFIED_POST_CLOSE: "Corregido",
  NOT_EXPECTED: "No esperado"
};
const stateStyles: Record<GcrState, string> = {
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  DRAFT: "bg-blue-50 text-blue-800 ring-blue-200",
  SUBMITTED_ON_TIME: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  SUBMITTED_LATE: "bg-orange-50 text-orange-800 ring-orange-200",
  INCOMPLETE: "bg-rose-50 text-rose-800 ring-rose-200",
  MODIFIED_POST_CLOSE: "bg-violet-50 text-violet-800 ring-violet-200",
  NOT_EXPECTED: "bg-slate-100 text-slate-600 ring-slate-200"
};
const dayFormatter = new Intl.DateTimeFormat("es-PA", { weekday: "short", timeZone: "UTC" });
const dateFormatter = new Intl.DateTimeFormat("es-PA", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC"
});
const attendanceLabels: Record<string, string> = {
  PRESENT: "Presente",
  ABSENT: "Ausente",
  LATE: "Tarde",
  HALF_DAY: "Medio día"
};

export function GcrWeekBoard({
  week,
  today,
  selectedDate,
  loading,
  busyDate,
  onEdit,
  onRefresh
}: {
  week: GcrWeek;
  today: string;
  selectedDate: string;
  loading: boolean;
  busyDate: string | null;
  onEdit: (day: GcrWeek["days"][number]) => void;
  onRefresh: () => void;
}) {
  const visibleDays = week.days.filter((day) => day.date <= today);
  return (
    <section
      className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]"
      aria-labelledby="gcr-week-heading"
    >
      <header className="flex flex-col gap-5 bg-gradient-to-br from-[var(--color-brand-950)] via-[var(--color-brand-900)] to-[var(--color-brand-700)] px-5 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">
            {week.academicTerm?.name ?? "Sin trimestre"} · Semana {week.weekNumber ?? "—"}
          </p>
          <div className="mt-3 flex min-w-0 items-center gap-3">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 text-lg font-bold ring-1 ring-white/20"
              aria-hidden="true"
            >
              {week.student.displayName.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <h3 id="gcr-week-heading" className="truncate text-xl font-semibold sm:text-2xl">
                {week.student.displayName}
              </h3>
              <p className="mt-0.5 truncate text-sm text-blue-100">
                {week.class.code} · {week.class.name}
                {week.grade ? ` · ${week.grade.name}` : ""}
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={16} aria-hidden="true" />
          {loading ? "Actualizando…" : "Refrescar"}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border-soft)] bg-[var(--color-surface-soft)] px-5 py-3 sm:px-7">
        <span className="mr-1 text-xs font-semibold text-[var(--color-text-secondary)]">
          Materias
        </span>
        {week.subjects.map((subject) => (
          <span
            key={subject.classSubjectId}
            className="rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-bold text-[var(--color-brand-900)]"
            title={subject.name}
          >
            {subject.shortName}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto overscroll-x-contain bg-[var(--color-canvas)]">
        <div
          className="grid min-w-[960px] items-start gap-3 p-3 sm:p-4"
          style={{ gridTemplateColumns: `repeat(${visibleDays.length}, minmax(184px, 1fr))` }}
        >
          {visibleDays.map((day) => (
            <GcrDayCard
              key={day.date}
              day={day}
              subjects={week.subjects}
              today={today}
              selectedDate={selectedDate}
              busy={busyDate === day.date}
              onEdit={() => onEdit(day)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function GcrDayCard({
  day,
  subjects,
  today,
  selectedDate,
  busy,
  onEdit
}: {
  day: GcrWeek["days"][number];
  subjects: GcrSubject[];
  today: string;
  selectedDate: string;
  busy: boolean;
  onEdit: () => void;
}) {
  const isToday = day.date === today;
  const isSelected = day.date === selectedDate;
  const hasActivity = Boolean(
    day.report &&
    (day.report.attendance ||
      day.report.subjectTasks.length ||
      day.report.verse ||
      day.report.merits.length ||
      day.report.demerits.length ||
      day.report.generalComment)
  );
  return (
    <article
      className={`self-start overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${isSelected ? "border-[var(--color-accent-500)] ring-2 ring-blue-100" : "border-[var(--color-border)]"}`}
    >
      <header
        className={`border-b px-4 py-3 ${isSelected ? "border-blue-200 bg-[var(--color-accent-100)]" : "border-[var(--color-border-soft)] bg-slate-50"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="capitalize text-base font-bold text-[var(--color-brand-900)]">
              {dayFormatter.format(new Date(`${day.date}T00:00:00Z`))}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-[var(--color-text-secondary)]">
              {dateFormatter.format(new Date(`${day.date}T00:00:00Z`))}
              {isToday ? " · Hoy" : ""}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-bold ring-1 ring-inset ${stateStyles[day.state]}`}
          >
            {stateLabels[day.state]}
          </span>
        </div>
      </header>
      <div className="p-3">
        {hasActivity ? (
          <ReportSnapshot report={day.report!} subjects={subjects} />
        ) : (
          <EmptyDay state={day.state} />
        )}
        {day.report?.hasPostCloseChanges ? (
          <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-violet-700">
            <Clock3 size={13} aria-hidden="true" />
            Modificado después del cierre
          </p>
        ) : null}
        <button
          type="button"
          className="primary mt-4 w-full"
          disabled={day.state === "NOT_EXPECTED" || busy}
          onClick={onEdit}
        >
          {busy ? "Abriendo…" : day.report ? "Abrir reporte" : "Crear borrador"}
        </button>
      </div>
    </article>
  );
}

function EmptyDay({ state }: { state: GcrState }) {
  const isDraft = state === "DRAFT";
  return (
    <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-5 text-center">
      <FilePlus2 className="mx-auto text-[var(--color-accent-700)]" size={22} aria-hidden="true" />
      <p className="mt-2 text-sm font-semibold text-[var(--color-brand-900)]">
        {isDraft ? "Borrador listo para continuar" : "Aún no hay reporte"}
      </p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">
        {isDraft
          ? "Abre el borrador para registrar el día."
          : "Crea el borrador cuando vayas a completar este día."}
      </p>
    </div>
  );
}

function ReportSnapshot({ report, subjects }: { report: GcrReport; subjects: GcrSubject[] }) {
  const tasks = new Map(report.subjectTasks.map((task) => [task.classSubjectId, task]));
  return (
    <div className="space-y-3">
      <SnapshotRow icon={<UserCheck size={15} />} label="Asistencia">
        {report.attendance ? (
          <span
            className={`rounded-md px-2 py-1 text-xs font-bold ${report.attendance.status === "PRESENT" ? "bg-emerald-50 text-emerald-800" : report.attendance.status === "ABSENT" ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-800"}`}
          >
            {attendanceLabels[report.attendance.status] ?? report.attendance.status}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Sin registrar</span>
        )}
      </SnapshotRow>
      <SnapshotRow icon={<BookOpenCheck size={15} />} label="Tareas">
        <div className="grid grid-cols-2 gap-1.5">
          {subjects.map((subject) => (
            <SubjectChip
              key={subject.classSubjectId}
              subject={subject}
              task={tasks.get(subject.classSubjectId)}
            />
          ))}
        </div>
      </SnapshotRow>
      {report.verse ? (
        <SnapshotRow icon={<Sparkles size={15} />} label="Religión">
          <p className="truncate text-xs font-semibold text-[var(--color-brand-900)]">
            {report.verse.reference} · {report.verse.score}/100
          </p>
        </SnapshotRow>
      ) : null}
      {report.merits.length || report.demerits.length || report.detention ? (
        <SnapshotRow icon={<ShieldAlert size={15} />} label="Conducta">
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
              {report.merits.length} mérito{report.merits.length === 1 ? "" : "s"}
            </span>
            <span className="rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-800">
              {report.demerits.length} demérito{report.demerits.length === 1 ? "" : "s"}
            </span>
          </div>
        </SnapshotRow>
      ) : null}
      {report.generalComment ? (
        <SnapshotRow icon={<MessageSquareText size={15} />} label="Comentario">
          <p className="line-clamp-2 text-xs leading-5 text-[var(--color-text-secondary)]">
            {report.generalComment}
          </p>
        </SnapshotRow>
      ) : null}
    </div>
  );
}

function SnapshotRow({
  icon,
  label,
  children
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <section>
      <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        <span aria-hidden="true">{icon}</span>
        {label}
      </p>
      {children}
    </section>
  );
}

function SubjectChip({
  subject,
  task
}: {
  subject: GcrSubject;
  task: GcrReport["subjectTasks"][number] | undefined;
}) {
  const complete = task?.completionStatus === "COMPLETED";
  const incomplete = task?.completionStatus === "NOT_COMPLETED";
  return (
    <div
      title={subject.name}
      className={`flex min-w-0 items-center justify-between rounded-md px-2 py-1.5 text-xs ring-1 ring-inset ${complete ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : incomplete ? "bg-rose-50 text-rose-800 ring-rose-200" : task?.homeworkAssigned ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-slate-50 text-slate-500 ring-slate-200"}`}
    >
      <strong className="truncate">{subject.shortName}</strong>
      {complete ? (
        <Check size={13} aria-label="Completada" />
      ) : incomplete ? (
        <X size={13} aria-label="No completada" />
      ) : task ? (
        <span aria-label="Sin tarea">—</span>
      ) : (
        <CircleDashed size={13} aria-label="Sin registro" />
      )}
    </div>
  );
}
