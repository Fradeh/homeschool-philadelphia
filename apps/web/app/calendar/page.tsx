import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function CalendarPage() {
  return (
    <DashboardShell>
      <h1 className="text-3xl font-semibold text-school-navy">Calendario</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Base para eventos generales de la escuela y eventos asociados a grupos especificos.
      </p>
    </DashboardShell>
  );
}
