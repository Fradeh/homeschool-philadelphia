"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Play,
  Search,
  UsersRound,
  X
} from "lucide-react";
import { PaceProgressStatus, type PaceRecordSummary, type TeacherPaceGoalCandidate, type TeacherPaceGoalSummary } from "@homeschool/shared";
import {
  getTeacherPaceWorkspace,
  gradeTeacherPace,
  reconcileTeacherPaceWorkspace,
  setTeacherPaceGoal,
  updateTeacherPaceStatus
} from "@/features/paces/pace-api";

export function TeacherPacesPage() {
  const [records, setRecords] = useState<PaceRecordSummary[]>([]);
  const [term, setTerm] = useState("Periodo activo");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("ALL");
  const [message, setMessage] = useState("Cargando PACEs…");
  const [selected, setSelected] = useState<PaceRecordSummary | null>(null);
  const [needsReconcile, setNeedsReconcile] = useState(false);
  const [missingRecordsCount, setMissingRecordsCount] = useState(0);
  const [preparing, setPreparing] = useState(false);
  const [preparationMessage, setPreparationMessage] = useState("");
  const [goals, setGoals] = useState<TeacherPaceGoalSummary[]>([]);
  const [availableGoals, setAvailableGoals] = useState<TeacherPaceGoalCandidate[]>([]);
  const [goalValues, setGoalValues] = useState<Record<string, number>>({});
  const [startingPaceValues, setStartingPaceValues] = useState<Record<string, number>>({});
  const [savingGoal, setSavingGoal] = useState("");
  const [goalError, setGoalError] = useState("");

  async function loadWorkspace() {
    const workspace = await getTeacherPaceWorkspace();
    setRecords(workspace.records);
    setNeedsReconcile(workspace.needsReconcile);
    setMissingRecordsCount(workspace.missingRecordsCount);
    setGoals(workspace.goals);
    setAvailableGoals(workspace.availableGoals);
    setTerm(
      workspace.activeTerm
        ? `${workspace.activeTerm.name} · ${workspace.activeTerm.academicYearName}`
        : "Sin periodo activo"
    );
    setMessage(workspace.records.length ? "" : "No hay PACEs preparados todavía.");
  }

  useEffect(() => {
    loadWorkspace().catch(() => setMessage("No se pudo cargar el seguimiento de PACEs."));
  }, []);

  async function preparePaces() {
    if (preparing) return;
    setPreparing(true);
    setPreparationMessage("");
    try {
      const result = await reconcileTeacherPaceWorkspace();
      setPreparationMessage(
        result.createdCount
          ? `Se prepararon ${result.createdCount} PACEs correctamente.`
          : "Los PACEs ya estaban preparados."
      );
      await loadWorkspace();
    } catch {
      setPreparationMessage("No fue posible preparar los PACEs. Inténtalo nuevamente.");
    } finally {
      setPreparing(false);
    }
  }

  const subjects = Array.from(
    new Map(records.map((record) => [record.subject.id, record.subject])).values()
  );
  const filtered = useMemo(
    () =>
      records.filter(
        (record) =>
          (subject === "ALL" || record.subject.id === subject) &&
          `${record.student.displayName} ${record.subject.name} ${record.class.name} ${record.pace.number}`
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [records, query, subject]
  );
  const students = Array.from(
    new Map(filtered.map((record) => [record.student.profileId, record.student])).values()
  );
  const recordsByStudent = useMemo(() => {
    const groups = new Map<string, PaceRecordSummary[]>();
    for (const record of filtered)
      groups.set(record.student.profileId, [
        ...(groups.get(record.student.profileId) ?? []),
        record
      ]);
    for (const group of groups.values())
      group.sort(
        (a, b) => a.subject.name.localeCompare(b.subject.name) || a.pace.number - b.pace.number
      );
    return groups;
  }, [filtered]);

  function replace(updated: PaceRecordSummary) {
    setRecords((current) => current.map((record) => (record.id === updated.id ? updated : record)));
  }

  async function action(record: PaceRecordSummary) {
    if (record.status === PaceProgressStatus.PLANNED)
      replace(await updateTeacherPaceStatus(record.id, { status: PaceProgressStatus.CURRENT }));
    else setSelected(record);
  }

  async function reset(record: PaceRecordSummary) {
    if (!record.grade)
      replace(await updateTeacherPaceStatus(record.id, { status: PaceProgressStatus.PLANNED }));
  }

  async function saveGoal(goal: TeacherPaceGoalCandidate | TeacherPaceGoalSummary) {
    const key = `${goal.student.profileId}:${goal.subject.classSubjectId}`;
    const targetPaces = goalValues[key] ?? Math.min(3, goal.availablePaces);
    const startingPaceNumber = startingPaceValues[key] ?? ("startingPaceNumber" in goal ? goal.startingPaceNumber : 1);
    await savePlan(goal, targetPaces, startingPaceNumber);
  }

  async function savePlan(goal: TeacherPaceGoalCandidate | TeacherPaceGoalSummary, targetPaces: number, startingPaceNumber: number) {
    const key = `${goal.student.profileId}:${goal.subject.classSubjectId}`;
    setSavingGoal(key);
    setGoalError("");
    try {
      await setTeacherPaceGoal({ studentId: goal.student.profileId, classSubjectId: goal.subject.classSubjectId, targetPaces, startingPaceNumber });
      await reconcileTeacherPaceWorkspace();
      await loadWorkspace();
    } catch (error) {
      setGoalError(error instanceof Error ? error.message : "No se pudo guardar el plan de PACEs.");
    } finally {
      setSavingGoal("");
    }
  }

  return (
    <>
      <div className="h-full overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-[1440px] space-y-3 p-4 lg:p-5">
          <section className="rounded-[var(--radius-panel)] bg-[linear-gradient(120deg,var(--color-brand-900),var(--color-brand-700))] px-5 py-4 text-white shadow-sm">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.18em] text-white/65">
                  Seguimiento académico · {term}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  PACEs de mis estudiantes
                </h2>
              </div>
              <p className="max-w-xl text-xs leading-5 text-white/75 lg:text-right">
                Inicia, completa y califica cada PACE desde su acción principal.
              </p>
            </div>
          </section>

          {needsReconcile || preparationMessage ? (
            <section
              className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-warning-border)] bg-[var(--color-warning-bg)] p-4 sm:flex-row sm:items-center sm:justify-between"
              role="status"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {needsReconcile
                    ? "Hay estudiantes, materias o PACEs pendientes de preparar."
                    : preparationMessage}
                </p>
                {needsReconcile ? (
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {missingRecordsCount} registros pendientes. Esta acción solo crea los faltantes.
                  </p>
                ) : null}
                {needsReconcile && preparationMessage ? (
                  <p className="mt-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                    {preparationMessage}
                  </p>
                ) : null}
              </div>
              {needsReconcile ? (
                <button
                  type="button"
                  onClick={preparePaces}
                  disabled={preparing}
                  className="primary min-h-10 shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {preparing ? "Preparando…" : "Preparar PACEs"}
                </button>
              ) : null}
            </section>
          ) : null}

          {false && availableGoals.length ? (
            <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-brand-900)]">Metas de PACEs por acordar</h3>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Define el número de PACE donde va el alumno y cuántos trabajará.</p>
                </div>
                <span className="rounded-full bg-[var(--color-warning-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-warning)]">{availableGoals.length} pendientes</span>
              </div>
              {goalError ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{goalError}</p> : null}
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {availableGoals.map((goal) => {
                  const key = `${goal.student.profileId}:${goal.subject.classSubjectId}`;
                  const value = goalValues[key] ?? Math.min(3, goal.availablePaces);
                  return <article key={key} className="rounded-xl border border-slate-200 p-3"><p className="font-semibold text-[var(--color-brand-900)]">{goal.student.displayName}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{goal.subject.name} · {goal.class.name}</p><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-[var(--color-text-secondary)]">PACE actual<input type="number" min={1} max={9999} value={startingPaceValues[key] ?? 1} onChange={(event) => setStartingPaceValues((current) => ({ ...current, [key]: Number(event.target.value) }))} className="input mt-1 w-full" /></label><label className="text-xs font-semibold text-[var(--color-text-secondary)]">Cantidad<select value={value} onChange={(event) => setGoalValues((current) => ({ ...current, [key]: Number(event.target.value) }))} className="input mt-1 w-full">{Array.from({ length: goal.availablePaces }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} PACEs</option>)}</select></label></div><button type="button" onClick={() => void saveGoal(goal)} disabled={savingGoal === key} className="primary mt-3 min-h-10 w-full px-3 text-xs">{savingGoal === key ? "Guardando…" : "Asignar PACEs"}</button></article>;
                })}
              </div>
            </section>
          ) : null}

          {false && goals.length ? (
            <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-brand-900)]">Gestionar planes de PACEs</h3>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Aquí gestionas el número actual y la cantidad de PACEs de cada alumno.</p>
                </div>
                <span className="rounded-full bg-[var(--color-brand-100)] px-2.5 py-1 text-xs font-semibold text-[var(--color-brand-900)]">{goals.length} asignados</span>
              </div>
              {goalError ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{goalError}</p> : null}
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {goals.map((goal) => {
                  const key = `${goal.student.profileId}:${goal.subject.classSubjectId}`;
                  const startingPaceNumber = startingPaceValues[key] ?? goal.startingPaceNumber;
                  const targetPaces = goalValues[key] ?? goal.targetPaces;
                  return <article key={key} className="rounded-xl border border-slate-200 p-3"><p className="font-semibold text-[var(--color-brand-900)]">{goal.student.displayName}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">{goal.subject.name} · {goal.class.name}</p><div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs font-semibold text-[var(--color-text-secondary)]">PACE actual<input type="number" min={1} max={9999} value={startingPaceNumber} onChange={(event) => setStartingPaceValues((current) => ({ ...current, [key]: Number(event.target.value) }))} className="input mt-1 w-full" /></label><label className="text-xs font-semibold text-[var(--color-text-secondary)]">Cantidad<select value={targetPaces} onChange={(event) => setGoalValues((current) => ({ ...current, [key]: Number(event.target.value) }))} className="input mt-1 w-full">{Array.from({ length: goal.availablePaces }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} PACEs</option>)}</select></label></div><button type="button" onClick={() => void saveGoal(goal)} disabled={savingGoal === key} className="primary mt-3 min-h-10 w-full px-3 text-xs">{savingGoal === key ? "Guardando…" : "Guardar cambios"}</button></article>;
                })}
              </div>
            </section>
          ) : null}

          {goals.length || availableGoals.length ? <PacePlanManager plans={[...goals, ...availableGoals]} savingKey={savingGoal} error={goalError} onSave={savePlan} /> : null}

          <section className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            <Metric icon={<BookOpenCheck />} value={records.length} label="PACEs" />
            <Metric
              icon={<Play />}
              value={
                records.filter((record) => record.status === PaceProgressStatus.CURRENT).length
              }
              label="En curso"
            />
            <Metric
              icon={<CheckCircle2 />}
              value={records.filter((record) => record.grade).length}
              label="Calificados"
            />
            <Metric
              icon={<UsersRound />}
              value={new Set(records.map((record) => record.student.profileId)).size}
              label="Estudiantes"
            />
          </section>

          <section className="sticky top-0 z-10 flex flex-col gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[rgb(255_255_255/0.94)] p-3 shadow-sm backdrop-blur sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Buscar estudiante, curso o PACE</span>
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar estudiante, curso o PACE…"
                className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white pl-9 pr-3 text-sm text-[var(--color-text)]"
              />
            </label>
            <select
              aria-label="Filtrar por materia"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="h-10 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)] sm:w-52"
            >
              <option value="ALL">Todas las materias</option>
              {subjects.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </section>

          <div className="space-y-3 pb-2">
            {students.map((student) => (
              <section
                key={student.profileId}
                className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm"
              >
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border-soft)] bg-[var(--color-surface-soft)] px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-brand-900)]">
                      {student.displayName}
                    </h3>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      {student.gradeLevel || "Sin grado asignado"}
                    </p>
                  </div>
                  <span className="rounded-full bg-[var(--color-brand-100)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-brand-900)]">
                    {recordsByStudent.get(student.profileId)?.length ?? 0} PACEs
                  </span>
                </header>
                <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {(recordsByStudent.get(student.profileId) ?? []).map((record) => (
                    <PaceCard
                      key={record.id}
                      record={record}
                      onAction={() => action(record)}
                      onReset={() => reset(record)}
                    />
                  ))}
                </div>
              </section>
            ))}
            {!filtered.length && !message ? (
              <p className="rounded-xl border border-dashed bg-white p-8 text-center text-sm text-slate-500">
                No hay PACEs que coincidan con los filtros.
              </p>
            ) : null}
            {message ? (
              <p className="p-6 text-center text-sm text-slate-500" role="status">
                {message}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {selected ? (
        <GradeDialog
          record={selected}
          onClose={() => setSelected(null)}
          onSave={async (score, feedback) => {
            replace(await gradeTeacherPace(selected.id, { score, feedback }));
            setSelected(null);
          }}
        />
      ) : null}
    </>
  );
}

type PacePlan = TeacherPaceGoalCandidate | TeacherPaceGoalSummary;

function PacePlanManager({ plans, savingKey, error, onSave }: { plans: PacePlan[]; savingKey: string; error: string; onSave: (goal: PacePlan, targetPaces: number, startingPaceNumber: number) => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [values, setValues] = useState<Record<string, { targetPaces: number; startingPaceNumber: string }>>({});
  const filteredPlans = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return plans;
    return plans.filter((plan) => `${plan.student.displayName} ${plan.subject.name} ${plan.class.name}`.toLowerCase().includes(term));
  }, [plans, query]);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const visiblePlans = filteredPlans.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const keyFor = (plan: PacePlan) => `${plan.student.profileId}:${plan.subject.classSubjectId}`;

  return <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><h3 className="text-sm font-semibold text-[var(--color-brand-900)]">Gestionar planes de PACEs</h3><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Busca al alumno, corrige su PACE actual o ajusta la cantidad. Se muestran 10 planes por página.</p></div>
      <span className="rounded-full bg-[var(--color-brand-100)] px-2.5 py-1 text-xs font-semibold text-[var(--color-brand-900)]">{plans.length} planes</span>
    </div>
    <label className="relative mt-4 block"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true" /><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Buscar alumno, materia o clase" className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-white pl-9 pr-3 text-sm" /></label>
    {error ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700" role="alert">{error}</p> : null}
    <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wide text-[var(--color-text-muted)]"><tr><th className="px-3 py-2">Alumno</th><th className="px-3 py-2">Materia</th><th className="px-3 py-2">PACE actual</th><th className="px-3 py-2">Cantidad</th><th className="px-3 py-2"><span className="sr-only">Guardar</span></th></tr></thead><tbody>{visiblePlans.map((plan) => { const key = keyFor(plan); const current = values[key] ?? { targetPaces: "targetPaces" in plan ? plan.targetPaces : Math.min(3, plan.availablePaces), startingPaceNumber: String("startingPaceNumber" in plan ? plan.startingPaceNumber : 1) }; const isValidPaceNumber = /^\d+$/.test(current.startingPaceNumber) && Number(current.startingPaceNumber) >= 1; return <tr key={key} className="border-b last:border-0"><td className="px-3 py-3 font-semibold text-[var(--color-brand-900)]">{plan.student.displayName}</td><td className="px-3 py-3"><span className="block">{plan.subject.name}</span><span className="text-xs text-[var(--color-text-muted)]">{plan.class.name}</span></td><td className="px-3 py-3"><input aria-label={`PACE actual de ${plan.student.displayName}`} type="number" min={1} max={9999} value={current.startingPaceNumber} onChange={(event) => setValues((previous) => ({ ...previous, [key]: { ...current, startingPaceNumber: event.target.value } }))} className="input h-10 w-28" /></td><td className="px-3 py-3"><select aria-label={`Cantidad de PACEs de ${plan.student.displayName}`} value={current.targetPaces} onChange={(event) => setValues((previous) => ({ ...previous, [key]: { ...current, targetPaces: Number(event.target.value) } }))} className="input h-10 w-32">{Array.from({ length: plan.availablePaces }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} PACEs</option>)}</select></td><td className="px-3 py-3 text-right"><button type="button" onClick={() => void onSave(plan, current.targetPaces, Number(current.startingPaceNumber))} disabled={savingKey === key || !isValidPaceNumber} className="primary min-h-10 px-3 text-xs">{savingKey === key ? "Guardando…" : "Guardar"}</button></td></tr>; })}</tbody></table></div>
    {!visiblePlans.length ? <p className="p-6 text-center text-sm text-[var(--color-text-muted)]">No hay planes que coincidan con la búsqueda.</p> : null}
    <footer className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-[var(--color-text-secondary)]"><span>{filteredPlans.length ? `${currentPage * pageSize + 1}–${Math.min((currentPage + 1) * pageSize, filteredPlans.length)} de ${filteredPlans.length}` : "0 resultados"}</span><div className="flex gap-2"><button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={!currentPage} className="secondary px-3 py-1.5 text-xs disabled:opacity-50">Anterior</button><button type="button" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={currentPage >= totalPages - 1} className="secondary px-3 py-1.5 text-xs disabled:opacity-50">Siguiente</button></div></footer>
  </section>;
}

function PaceCard({
  record,
  onAction,
  onReset
}: {
  record: PaceRecordSummary;
  onAction: () => void;
  onReset: () => void;
}) {
  const graded = Boolean(record.grade);
  const current = record.status === PaceProgressStatus.CURRENT;
  const completed = record.status === PaceProgressStatus.COMPLETED;
  return (
    <article
      className={`flex min-h-[8.75rem] flex-col rounded-[var(--radius-card)] border p-3 ${graded ? "border-[var(--color-success-border)] bg-[var(--color-success-bg)]" : current ? "border-[var(--color-info-border)] bg-[var(--color-info-bg)]" : "border-[var(--color-border)] bg-white"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span
            className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              color: record.subject.color ?? "#191970",
              backgroundColor: `${record.subject.color ?? "#191970"}12`
            }}
          >
            {record.subject.shortName}
          </span>
          <h4 className="mt-2 text-sm font-semibold text-[var(--color-brand-900)]">
            PACE {record.pace.number}
          </h4>
          <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">
            {record.class.name}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-[var(--color-brand-900)]">
            Plan del alumno: {record.subject.targetPaces} PACEs
          </p>
        </div>
        {graded ? (
          <strong className="text-lg tabular-nums text-[var(--color-success)]">
            {record.grade?.score}%
          </strong>
        ) : null}
      </div>
      <button
        onClick={onAction}
        className={`mt-auto flex min-h-9 w-full items-center justify-between rounded-[var(--radius-control)] px-3 py-2 text-xs font-semibold ${graded ? "bg-white text-[var(--color-success)]" : current || completed ? "bg-[var(--color-brand-900)] text-white hover:bg-[var(--color-brand-800)]" : "bg-[var(--color-brand-100)] text-[var(--color-brand-900)] hover:bg-[#e2e5ff]"}`}
      >
        <span>
          {graded
            ? "Revisar nota"
            : current
              ? "Completar y calificar"
              : completed
                ? "Calificar PACE"
                : "Iniciar PACE"}
        </span>
        <ChevronRight size={15} aria-hidden="true" />
      </button>
      {!graded && record.status !== PaceProgressStatus.PLANNED ? (
        <button
          onClick={onReset}
          className="mt-1.5 w-full rounded-[var(--radius-control)] px-2 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)] hover:bg-white/70 hover:text-[var(--color-brand-900)]"
        >
          Volver a “No iniciado”
        </button>
      ) : null}
    </article>
  );
}

function GradeDialog({
  record,
  onClose,
  onSave
}: {
  record: PaceRecordSummary;
  onClose: () => void;
  onSave: (score: number, feedback?: string) => void;
}) {
  const [score, setScore] = useState(record.grade?.score ?? 90);
  const [feedback, setFeedback] = useState(record.grade?.feedback ?? "");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <section
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pace-grade-title"
      >
        <header className="flex justify-between border-b p-5">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--color-accent-700)]">
              Calificación
            </p>
            <h3
              id="pace-grade-title"
              className="mt-1 text-lg font-semibold text-[var(--color-brand-900)]"
            >
              {record.student.displayName} · PACE {record.pace.number}
            </h3>
            <p className="text-sm text-[var(--color-text-muted)]">{record.subject.name}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-lg hover:bg-slate-100"
            aria-label="Cerrar calificación"
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="space-y-4 p-5">
          <label className="block text-sm font-semibold">
            Nota final
            <input
              type="number"
              min="0"
              max="100"
              value={score}
              onChange={(event) => setScore(Number(event.target.value))}
              className="input mt-2"
            />
          </label>
          <label className="block text-sm font-semibold">
            Retroalimentación
            <textarea
              rows={4}
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              className="mt-2 w-full rounded-lg border p-3 text-sm"
            />
          </label>
        </div>
        <footer className="flex justify-end gap-2 border-t p-5">
          <button onClick={onClose} className="secondary">
            Cancelar
          </button>
          <button
            onClick={() => onSave(Math.max(0, Math.min(100, score)), feedback.trim() || undefined)}
            className="primary"
          >
            Guardar calificación
          </button>
        </footer>
      </section>
    </div>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <article className="flex min-h-16 items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white px-3 py-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-brand-100)] text-[var(--color-brand-900)] [&>svg]:h-[18px] [&>svg]:w-[18px]">
        {icon}
      </span>
      <div>
        <strong className="text-lg tabular-nums text-[var(--color-brand-900)]">{value}</strong>
        <p className="text-[11px] text-[var(--color-text-muted)]">{label}</p>
      </div>
    </article>
  );
}
