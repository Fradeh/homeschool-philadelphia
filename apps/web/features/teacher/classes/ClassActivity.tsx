import { Activity } from "lucide-react";
import type { ClassActivityItem } from "./mock-teacher-classes";

export function ClassActivity({ activity }: { activity: ClassActivityItem[] }) {
  return (
    <section className="rounded-lg border border-[#dde3ef] bg-white shadow-sm">
      <div className="border-b border-[#edf0f6] p-5">
        <h3 className="text-xl font-semibold text-[#191970]">Actividad</h3>
        <p className="mt-1 text-sm text-slate-600">Registro reciente de acciones dentro de esta clase.</p>
      </div>

      <div className="divide-y divide-[#edf0f6]">
        {activity.map((item) => (
          <article key={item.id} className="flex gap-4 p-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#eef2ff] text-[#191970]">
              <Activity size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold text-[#191970]">{item.label}</h4>
                <span className="text-xs font-semibold text-slate-400">{item.time}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
