"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, CircleAlert, ClipboardCheck, Clock3, FileWarning, RotateCcw, Search } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { StatusBadge, type StatusBadgeTone } from "@/components/ui/status-badge";
import {
  getGcrCompliance,
  type GcrComplianceResponse,
  type GcrComplianceRow,
  type GcrComplianceTimingState
} from "./gcr-compliance-api";

const timingLabels: Record<GcrComplianceTimingState, string> = {
  ON_TIME: "A tiempo",
  LATE: "Enviado tarde",
  PENDING: "Pendiente",
  OVERDUE: "Vencido"
};
const timingTones: Record<GcrComplianceTimingState, StatusBadgeTone> = {
  ON_TIME: "success",
  LATE: "warning",
  PENDING: "info",
  OVERDUE: "danger"
};

type TimingFilter = "ALL" | GcrComplianceTimingState;

export function GcrCompliancePage() {
  const [date, setDate] = useState(() => todayInSchoolTimeZone());
  const [data, setData] = useState<GcrComplianceResponse | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [timing, setTiming] = useState<TimingFilter>("ALL");
  const [modifiedOnly, setModifiedOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    getGcrCompliance(date)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => { cancelled = true; };
  }, [date]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return (data?.rows ?? []).filter((row) => {
      const matchesTiming = timing === "ALL" || row.timingState === timing;
      const matchesModified = !modifiedOnly || row.hasPostCloseChanges;
      const haystack = `${row.teacher.displayName} ${row.student.displayName} ${row.class.name} ${row.class.code}`
        .toLocaleLowerCase("es");
      return matchesTiming && matchesModified && haystack.includes(normalized);
    });
  }, [data, modifiedOnly, query, timing]);

  const attentionCount = (data?.metrics.overdue ?? 0) + (data?.metrics.late ?? 0);
  const hasFilters = timing !== "ALL" || modifiedOnly || Boolean(query);

  function selectTiming(next: TimingFilter) {
    setTiming(next);
    if (next !== "ALL") setModifiedOnly(false);
  }

  function showModified() {
    setTiming("ALL");
    setModifiedOnly(true);
  }

  function clearFilters() {
    setQuery("");
    setTiming("ALL");
    setModifiedOnly(false);
  }

  if (state === "error") {
    return <div className="p-5 lg:p-8"><ErrorState description="No pudimos cargar el cumplimiento GCR. Revisa la conexion e intentalo nuevamente." /></div>;
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
        <div className="border-b border-[var(--color-border-soft)] bg-[var(--color-brand-950)] px-5 py-4 text-white sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-100">Revision diaria de Direccion</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Cumplimiento diario GCR</h2>
              <p className="mt-1 max-w-2xl text-sm text-blue-100">Prioriza los GCR vencidos y los enviados tarde; abre la trazabilidad cuando necesites revisar un caso.</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <button type="button" onClick={() => setDate(todayInSchoolTimeZone())} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-control)] border border-white/30 px-3 text-sm font-semibold hover:bg-white/10">
                <CalendarDays size={16} aria-hidden="true" /> Hoy
              </button>
              <label className="grid gap-1 text-sm font-semibold text-white">
                Fecha escolar
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="control min-w-48 bg-white text-[var(--color-text)]" />
              </label>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3 text-sm sm:px-6">
          <span className="font-semibold text-[var(--color-brand-950)]">{formatSchoolDate(date)}</span>
          <span className="text-[var(--color-text-secondary)]">{data?.deadlinePassed ? "El cierre ya paso: los no enviados estan vencidos." : "El cierre de hoy aun esta abierto."}</span>
        </div>
      </section>

      {data && !data.isInstructionalDay ? <InlineAlert title="Dia no lectivo" tone="info">No se generan GCR esperados durante sabado o domingo.</InlineAlert> : null}
      {data?.configurationIssues.map((issue) => <InlineAlert key={issue.classId} title={`Revisa ${issue.className}`} tone="warning">{issue.issue}</InlineAlert>)}
      {state === "ready" && attentionCount > 0 ? (
        <button type="button" onClick={() => selectTiming("OVERDUE")} className="flex w-full items-start gap-3 rounded-[var(--radius-card)] border border-red-200 bg-red-50 p-4 text-left text-red-900 transition hover:bg-red-100">
          <CircleAlert className="mt-0.5 shrink-0" size={20} aria-hidden="true" />
          <span><b>Hay {attentionCount} GCR que requieren seguimiento.</b><br /><span className="text-sm">Abre los vencidos para revisar primero los casos sin envio.</span></span>
        </button>
      ) : null}

      <section aria-label="Resumen de cumplimiento" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Metric label="Esperados" value={data?.metrics.expected} icon={<ClipboardCheck />} active={!hasFilters} onClick={() => clearFilters()} />
        <Metric label="A tiempo" value={data?.metrics.onTime} tone="success" active={timing === "ON_TIME"} onClick={() => selectTiming("ON_TIME")} />
        <Metric label="Tarde" value={data?.metrics.late} tone="warning" active={timing === "LATE"} onClick={() => selectTiming("LATE")} />
        <Metric label="Pendientes" value={data?.metrics.pending} tone="info" active={timing === "PENDING"} onClick={() => selectTiming("PENDING")} />
        <Metric label="Vencidos" value={data?.metrics.overdue} tone="danger" icon={<Clock3 />} active={timing === "OVERDUE"} onClick={() => selectTiming("OVERDUE")} />
        <Metric label="Modificados" value={data?.metrics.postCloseModified} tone="warning" icon={<FileWarning />} active={modifiedOnly} onClick={showModified} />
      </section>

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
        <header className="flex flex-col gap-4 border-b border-[var(--color-border)] p-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-semibold text-[var(--color-brand-950)]">Casos esperados</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Mostrando {filteredRows.length} de {data?.rows.length ?? 0} registros.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="grid gap-1 text-sm font-semibold text-[var(--color-text)]">
              Buscar
              <span className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Profesor, estudiante o clase" className="control w-full pl-9 sm:w-72" /></span>
            </label>
            <label className="grid gap-1 text-sm font-semibold text-[var(--color-text)]">
              Estado
              <select value={timing} onChange={(event) => { setModifiedOnly(false); setTiming(event.target.value as TimingFilter); }} className="control min-w-44">
                <option value="ALL">Todos los estados</option>
                {Object.entries(timingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            {hasFilters ? <button type="button" onClick={clearFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)]"><RotateCcw size={15} aria-hidden="true" /> Limpiar</button> : null}
          </div>
        </header>
        {modifiedOnly ? <p className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Mostrando GCR modificados despues del cierre.</p> : null}
        {state === "loading" ? <p className="p-8 text-sm text-[var(--color-text-muted)]">Cargando cumplimiento real...</p> : null}
        {state === "ready" && filteredRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-[var(--color-surface-soft)] text-xs uppercase tracking-wider text-[var(--color-text-muted)]"><tr><th className="p-4">Profesor</th><th className="p-4">Clase / estudiante</th><th className="p-4">Estado</th><th className="p-4">Hora de envio</th><th className="p-4">Trazabilidad</th></tr></thead><tbody className="divide-y divide-[var(--color-border-soft)]">{filteredRows.map((row) => <ComplianceRow key={`${row.class.id}:${row.student.id}:${row.teacher.id}`} row={row} />)}</tbody></table></div> : null}
        {state === "ready" && !filteredRows.length ? <div className="p-5"><EmptyState icon={<CheckCircle2 />} title="Sin resultados" description="No hay GCR esperados que coincidan con los filtros seleccionados." /></div> : null}
      </section>
    </div>
  );
}

function ComplianceRow({ row }: { row: GcrComplianceRow }) {
  const needsAttention = row.timingState === "OVERDUE" || row.timingState === "LATE";
  return <tr className={`align-top ${needsAttention ? "bg-red-50/30" : ""}`}><td className="p-4 font-semibold text-[var(--color-brand-950)]">{row.teacher.displayName}</td><td className="p-4"><p className="font-semibold">{row.class.name}</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{row.student.displayName} · {row.student.studentCode}</p></td><td className="p-4"><StatusBadge tone={timingTones[row.timingState]}>{timingLabels[row.timingState]}</StatusBadge>{row.hasPostCloseChanges ? <p className="mt-2 text-xs font-semibold text-amber-700">Modificado despues del cierre</p> : null}</td><td className="p-4 tabular-nums text-[var(--color-text-secondary)]">{row.submittedAt ? formatSchoolDateTime(row.submittedAt) : "—"}</td><td className="p-4">{row.audit.length ? <details><summary className="cursor-pointer font-semibold text-[var(--color-info)]">Ver {row.audit.length} eventos</summary><ol className="mt-2 space-y-2">{row.audit.map((event) => <li key={event.id} className="text-xs text-[var(--color-text-secondary)]"><b>{event.actorName}</b> · {event.action}<br />{formatSchoolDateTime(event.createdAt)}{event.reason ? ` · ${event.reason}` : ""}</li>)}</ol></details> : <span className="text-[var(--color-text-muted)]">Sin eventos</span>}</td></tr>;
}

function Metric({ label, value, tone = "neutral", icon, active, onClick }: { label: string; value?: number; tone?: StatusBadgeTone; icon?: React.ReactNode; active?: boolean; onClick: () => void }) {
  const toneClass = tone === "danger" ? "text-red-700" : tone === "warning" ? "text-amber-700" : tone === "success" ? "text-emerald-700" : tone === "info" ? "text-sky-700" : "text-[var(--color-brand-950)]";
  return <button type="button" onClick={onClick} aria-pressed={active} className={`rounded-[var(--radius-card)] border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--color-info)] ${active ? "border-[var(--color-info)] ring-1 ring-[var(--color-info)]" : "border-[var(--color-border)]"}`}><div className="flex items-center justify-between"><p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</p>{icon ? <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span> : null}</div><p className={`mt-2 text-3xl font-semibold tabular-nums ${toneClass}`}>{value ?? "—"}</p><p className="mt-1 text-xs text-[var(--color-text-muted)]">Ver casos</p></button>;
}

function todayInSchoolTimeZone() { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Panama", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
function formatSchoolDateTime(value: string) { return new Intl.DateTimeFormat("es-CO", { timeZone: "America/Panama", dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatSchoolDate(value: string) { return new Intl.DateTimeFormat("es-CO", { timeZone: "America/Panama", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00Z`)); }