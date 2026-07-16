import { classColorMap, type TeacherClass } from "./mock-teacher-classes";

export function ClassHeader({
  teacherClass,
  studentsCount
}: {
  teacherClass: TeacherClass;
  studentsCount: number;
}) {
  const color = classColorMap[teacherClass.color];

  return (
    <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 sm:px-5 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-md text-base font-semibold text-white ring-4 ${color.ring}`}
            style={{ backgroundColor: color.bg }}
          >
            {teacherClass.code.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold tracking-tight text-[#191970]">
                {teacherClass.name}
              </h2>
              <span className="rounded-full bg-[#f4f6fb] px-2.5 py-1 text-xs font-semibold text-slate-500">
                {teacherClass.code}
              </span>
            </div>
            <p className="mt-1 truncate text-sm text-slate-600">{teacherClass.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 rounded-full bg-[#eef2ff] px-3 py-2 text-sm font-semibold text-[#191970]">
            {studentsCount} alumnos
          </span>
        </div>
      </div>
    </section>
  );
}
