"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import type { Notification } from "@homeschool/shared";
import { apiRequest } from "@/lib/api-client";

export function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]); const [message, setMessage] = useState("Cargando notificaciones…");
  async function load() { const response = await apiRequest<{ items: Notification[] }>("/notifications"); setItems(response.items); setMessage(response.items.length ? "" : "No tienes notificaciones."); }
  useEffect(() => { load().catch(() => setMessage("No fue posible cargar las notificaciones.")); }, []);
  async function markRead(id: string) { await apiRequest(`/notifications/${id}/read`, { method: "PATCH" }); await load(); }
  return <div className="mx-auto max-w-4xl space-y-4 p-5 lg:p-8">{message ? <p className="text-sm text-slate-500">{message}</p> : null}{items.map((item) => <article key={item.id} className={`flex gap-4 rounded-xl border bg-white p-5 ${item.readAt ? "opacity-70" : "shadow-sm"}`}><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef2ff] text-[#191970]"><Bell size={18}/></span><div className="min-w-0 flex-1"><h3 className="font-semibold text-[#191970]">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.body}</p><p className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("es-CO")}</p></div>{!item.readAt ? <button onClick={() => markRead(item.id)} aria-label="Marcar como leída" className="grid h-9 w-9 place-items-center rounded border text-emerald-700"><Check size={16}/></button> : null}</article>)}</div>;
}
