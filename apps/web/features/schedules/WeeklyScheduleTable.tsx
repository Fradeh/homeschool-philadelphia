import {
  ScheduleBlockKind,
  SchedulePeriodKind,
  type ScheduleTemplate,
  Weekday
} from "@homeschool/shared";

const dayLabels: Record<Weekday, string> = {
  [Weekday.MONDAY]: "Lunes",
  [Weekday.TUESDAY]: "Martes",
  [Weekday.WEDNESDAY]: "Miércoles",
  [Weekday.THURSDAY]: "Jueves",
  [Weekday.FRIDAY]: "Viernes"
};

export const scheduleWeekdays = Object.values(Weekday);

export function WeeklyScheduleTable({
  template,
  onSubjectClick
}: {
  template: ScheduleTemplate;
  onSubjectClick?: (block: ScheduleTemplate["blocks"][number]) => void;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div className="grid gap-3 p-3 md:hidden">
        {scheduleWeekdays.map((day) => (
          <section
            key={day}
            className="overflow-hidden rounded-lg border border-[var(--color-border)]"
            aria-labelledby={`day-${day}`}
          >
            <h3
              id={`day-${day}`}
              className="bg-[var(--color-brand-900)] px-4 py-3 text-sm font-semibold text-white"
            >
              {dayLabels[day]}
            </h3>
            <div className="divide-y divide-[var(--color-border)]">
              {template.grid.periods.map((period) => {
                const block = template.blocks.find(
                  (item) => item.periodId === period.id && item.weekday === day
                );
                const isBreak = period.kind === SchedulePeriodKind.BREAK;
                const label =
                  block?.kind === ScheduleBlockKind.SUBJECT
                    ? block.subjectName
                    : block?.kind === ScheduleBlockKind.EMPTY
                      ? "Espacio libre"
                      : (block?.label ?? block?.kind ?? "Espacio libre");
                const clickable = Boolean(
                  onSubjectClick &&
                  block?.kind === ScheduleBlockKind.SUBJECT &&
                  block.classSubjectId
                );
                return (
                  <div
                    key={period.id}
                    className={`grid grid-cols-[6.5rem_1fr] ${isBreak ? "bg-[var(--color-warning-bg)]" : ""}`}
                  >
                    <time className="border-r border-[var(--color-border)] px-3 py-3 text-xs font-semibold tabular-nums text-[var(--color-text-secondary)]">
                      {period.startTime}–{period.endTime}
                    </time>
                    {isBreak ? (
                      <p className="px-3 py-3 text-sm font-semibold text-[var(--color-warning)]">
                        {period.label ?? "Descanso"}
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={!clickable}
                        onClick={() => block && onSubjectClick?.(block)}
                        className={`min-h-14 px-3 py-3 text-left ${clickable ? "hover:bg-[var(--color-brand-100)]" : "cursor-default"}`}
                        style={{
                          backgroundColor: block?.subjectColor
                            ? `${block.subjectColor}12`
                            : undefined
                        }}
                      >
                        <span className="block text-sm font-semibold text-[var(--color-text)]">
                          {label}
                        </span>
                        {block?.teacherName ? (
                          <span className="mt-1 block text-xs text-[var(--color-text-secondary)]">
                            {block.teacherName}
                          </span>
                        ) : null}
                        {clickable ? (
                          <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-[var(--color-info)]">
                            Consultar disponibilidad
                          </span>
                        ) : null}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[850px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#191970] text-white">
              <th className="border border-white/20 px-3 py-3 text-left">Hora</th>
              {scheduleWeekdays.map((day) => (
                <th key={day} className="border border-white/20 px-3 py-3">
                  {dayLabels[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {template.grid.periods.map((period) => {
              if (period.kind === SchedulePeriodKind.BREAK) {
                return (
                  <tr key={period.id}>
                    <td className="border px-3 py-4 font-semibold text-[#191970]">
                      {period.startTime}–{period.endTime}
                    </td>
                    <td
                      colSpan={5}
                      className="border bg-amber-50 px-3 py-4 text-center text-lg font-black tracking-[0.45em] text-amber-800"
                    >
                      {period.label ?? "BREAK"}
                    </td>
                  </tr>
                );
              }
              return (
                <tr key={period.id}>
                  <td className="border bg-slate-50 px-3 py-4 font-semibold text-[#191970]">
                    {period.startTime}–{period.endTime}
                  </td>
                  {scheduleWeekdays.map((day) => {
                    const block = template.blocks.find(
                      (item) => item.periodId === period.id && item.weekday === day
                    );
                    const label =
                      block?.kind === ScheduleBlockKind.SUBJECT
                        ? block.subjectName
                        : block?.kind === ScheduleBlockKind.EMPTY
                          ? ""
                          : (block?.label ?? block?.kind);
                    const clickable = Boolean(
                      onSubjectClick &&
                      block?.kind === ScheduleBlockKind.SUBJECT &&
                      block.classSubjectId
                    );
                    return (
                      <td
                        key={day}
                        className="border p-0 text-center"
                        style={{
                          backgroundColor: block?.subjectColor
                            ? `${block.subjectColor}18`
                            : undefined
                        }}
                      >
                        <button
                          type="button"
                          disabled={!clickable}
                          onClick={() => block && onSubjectClick?.(block)}
                          className={`min-h-20 w-full px-3 py-4 text-center ${clickable ? "cursor-pointer hover:bg-[var(--color-brand-100)]" : "cursor-default"}`}
                          title={clickable ? "Ver fechas disponibles con este profesor" : undefined}
                        >
                          <p className="font-semibold text-[#191970]">{label}</p>
                          {block?.teacherName ? (
                            <p className="mt-1 text-xs text-slate-500">{block.teacherName}</p>
                          ) : null}
                          {clickable ? (
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-[#078cc5]">
                              Solicitar asistencia
                            </p>
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
