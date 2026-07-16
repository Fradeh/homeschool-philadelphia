import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function GroupsPage() {
  return (
    <DashboardShell>
      <h1 className="text-3xl font-semibold text-school-navy">Grupos</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Espacio reservado para grupos por grado, materia, familia o equipo administrativo.
      </p>
    </DashboardShell>
  );
}
