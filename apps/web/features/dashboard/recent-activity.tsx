const items = [
  "Configurar roles y permisos iniciales",
  "Crear los primeros grupos escolares",
  "Publicar comunicados por grupo",
  "Activar calendario y notificaciones internas"
];

export function RecentActivity() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-school-navy">Siguientes pasos</h2>
          <p className="mt-1 text-sm text-slate-500">
            La interfaz consumira la API del backend. Esta pantalla es solo el punto de partida.
          </p>
        </div>
      </div>
      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="rounded-md bg-school-paper px-4 py-3 text-sm text-slate-700">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
