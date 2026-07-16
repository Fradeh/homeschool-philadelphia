const cards = [
  { label: "Grupos activos", value: "0", description: "Espacios por grado, curso o equipo" },
  { label: "Comunicados", value: "0", description: "Publicaciones pendientes de cargar" },
  { label: "Eventos", value: "0", description: "Calendario escolar por configurar" },
  { label: "Usuarios", value: "0", description: "Alta inicial desde el panel admin" }
];

export function OverviewCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <strong className="mt-3 block text-3xl font-semibold text-school-navy">{card.value}</strong>
          <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
        </article>
      ))}
    </div>
  );
}
