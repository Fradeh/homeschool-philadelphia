import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OverviewCards } from "@/features/dashboard/overview-cards";
import { RecentActivity } from "@/features/dashboard/recent-activity";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <section className="space-y-6">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-school-blue">
            Plataforma escolar colaborativa
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-school-navy md:text-5xl">
            Comunicacion, grupos y seguimiento academico en un solo lugar.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Base inicial para una escuela privada o Home School: usuarios, permisos,
            comunicados, archivos, calendario y notificaciones.
          </p>
        </div>

        <OverviewCards />
        <RecentActivity />
      </section>
    </DashboardShell>
  );
}
