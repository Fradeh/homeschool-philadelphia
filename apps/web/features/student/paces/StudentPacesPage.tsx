"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpenCheck } from "lucide-react";
import { PaceProgressStatus, PaceRecordSummary } from "@homeschool/shared";
import { getStudentPaces } from "@/features/paces/pace-api";

export function StudentPacesPage() {
  const [records, setRecords] = useState<PaceRecordSummary[]>([]);
  const [message, setMessage] = useState("Cargando tus PACEs...");

  useEffect(() => {
    let ignore = false;

    getStudentPaces()
      .then((items) => {
        if (ignore) return;
        setRecords(items);
        setMessage(items.length ? "" : "Aún no tienes PACEs vinculados.");
      })
      .catch(() => setMessage("No pudimos cargar tus PACEs desde la API."));

    return () => {
      ignore = true;
    };
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, PaceRecordSummary[]>();
    records.forEach((record) => {
      const key = record.subject.classSubjectId;
      map.set(key, [...(map.get(key) ?? []), record]);
    });
    return Array.from(map.values()).map((items) => items.sort((a, b) => a.pace.number - b.pace.number));
  }, [records]);
  const completed = records.filter((item) => item.status === PaceProgressStatus.COMPLETED).length;
  const current = records.filter((item) => item.status === PaceProgressStatus.CURRENT).length;
  const term = records[0]?.academicTerm;

  if (!records.length && message) {
    return <div className="grid h-full place-items-center text-sm text-slate-500">{message}</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-5 lg:px-8">
      <section className="flex shrink-0 items-center justify-between rounded-lg bg-[#191970] p-5 text-white">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-white/55">{term ? `${term.name} · ${term.academicYearName}` : "Periodo activo"}</p>
          <h2 className="mt-2 text-2xl font-semibold">Mi ruta de PACEs</h2>
          <p className="mt-2 text-sm text-white/70">Avanza un libro a la vez y continúa con el siguiente número.</p>
        </div>
        <div className="flex gap-6 text-center">
          <Hero value={completed} label="Completados" />
          <Hero value={current} label="En curso" />
        </div>
      </section>

      <section className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-lg border bg-white p-4">
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {groups.map((items) => {
            const first = items[0];
            const active = items.find((item) => item.status === PaceProgressStatus.CURRENT);
            return (
              <article key={first.subject.classSubjectId} className="overflow-hidden rounded-lg border">
                <div className="h-2" style={{ backgroundColor: first.subject.color ?? "#191970" }} />
                <div className="p-5">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold" style={{ color: first.subject.color ?? "#191970" }}>{first.subject.shortName}</p>
                      <h3 className="mt-1 font-semibold text-[#191970]">{first.subject.name}</h3>
                      <p className="mt-1 text-xs text-slate-400">{first.class.name}</p>
                    </div>
                    <BookOpenCheck style={{ color: first.subject.color ?? "#191970" }} />
                  </div>
                  <div className="mt-4 rounded-md bg-[#f8f9fc] p-3">
                    <p className="text-xs text-slate-400">PACE actual</p>
                    <strong className="text-3xl text-[#191970]">{active?.pace.number ?? "—"}</strong>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">{items.map((item) => <Chip key={item.id} item={item} />)}</div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Chip({ item }: { item: PaceRecordSummary }) {
  const css =
    item.status === PaceProgressStatus.COMPLETED
      ? "bg-emerald-500 text-white"
      : item.status === PaceProgressStatus.CURRENT
        ? "bg-[#078cc5] text-white"
        : "bg-slate-100 text-slate-500";
  return <span className={`rounded-md px-3 py-2 text-xs font-bold ${css}`}>{item.pace.number}</span>;
}

function Hero({ value, label }: { value: number; label: string }) {
  return <div><strong className="block text-2xl">{value}</strong><span className="text-[10px] uppercase text-white/55">{label}</span></div>;
}
