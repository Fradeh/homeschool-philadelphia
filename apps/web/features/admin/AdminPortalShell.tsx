"use client";

import { useEffect, useState, type ReactNode } from "react";
import { UserRole } from "@homeschool/shared";
import Link from "next/link";
import {
  BookOpenCheck,
  CalendarClock,
  GraduationCap,
  Home,
  LibraryBig,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings2,
  UserRoundCog,
  UsersRound,
  type LucideIcon
} from "lucide-react";
import { PortalAuthGate } from "@/components/auth/portal-auth-gate";
import { clearSession, subscribeSession } from "@/lib/session";

const navigation: Array<{ label: string; href: string; icon: LucideIcon; key: string }> = [
  { label: "Inicio", href: "/admin", icon: Home, key: "dashboard" },
  { label: "Usuarios", href: "/admin/users", icon: UserRoundCog, key: "users" },
  { label: "Clases", href: "/admin/classes", icon: GraduationCap, key: "classes" },
  { label: "Materias", href: "/admin/subjects", icon: LibraryBig, key: "subjects" },
  { label: "Horarios", href: "/admin/schedules", icon: CalendarClock, key: "schedules" },
  { label: "Familias", href: "/admin/families", icon: UsersRound, key: "families" },
  { label: "PACEs", href: "/admin/paces", icon: BookOpenCheck, key: "paces" },
  { label: "Configuración", href: "/admin/settings", icon: Settings2, key: "settings" }
];

export function AdminPortalShell({
  active,
  eyebrow,
  title,
  children,
  contentOverflow = "auto"
}: {
  active: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  contentOverflow?: "auto" | "hidden";
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [sessionName, setSessionName] = useState("Administrador Académico");

  useEffect(() => {
    setCollapsed(localStorage.getItem("admin-sidebar-collapsed") === "true");
    return subscribeSession((user) => setSessionName(user ? `${user.firstName} ${user.lastName}` : "Administrador Académico"));
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem("admin-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <PortalAuthGate role={UserRole.ADMIN}>
    <main className="h-screen overflow-hidden bg-[#f4f6fb] text-[#111827] [font-family:Arial,sans-serif]">
      <div className={`grid h-full ${collapsed ? "lg:grid-cols-[5.75rem_1fr]" : "lg:grid-cols-[18.5rem_1fr]"}`}>
        <aside className="hidden border-r border-[#dde3ef] bg-white lg:flex lg:flex-col">
          <div className={collapsed ? "border-b border-[#edf0f6] px-3 py-5" : "border-b border-[#edf0f6] px-6 py-6"}>
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-[#191970] text-white">
                <Settings2 size={24} strokeWidth={1.8} />
              </span>
              {!collapsed ? (
                <div>
                  <p className="font-bold uppercase tracking-[0.16em] text-[#191970]">Admin</p>
                  <p className="text-sm text-slate-500">Academic Setup</p>
                </div>
              ) : null}
            </div>
            <button
              onClick={toggleSidebar}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#d8deeb] text-sm font-semibold text-[#191970] hover:bg-[#eef2ff]"
              aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
              title={collapsed ? "Expandir" : "Contraer"}
            >
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              {!collapsed ? "Contraer" : null}
            </button>
          </div>

          <nav className={collapsed ? "space-y-2 px-3 py-5" : "space-y-2 px-4 py-5"}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const selected = active === item.key;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex min-h-14 items-center rounded-lg text-[15px] font-semibold transition ${
                    selected
                      ? "bg-[#eef2ff] text-[#191970] shadow-[inset_4px_0_0_#191970]"
                      : "text-slate-600 hover:bg-[#f6f8fc] hover:text-[#191970]"
                  } ${collapsed ? "justify-center" : "gap-4 px-4"}`}
                >
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${selected ? "bg-white text-[#191970]" : "bg-[#f4f6fb] text-slate-500"}`}>
                    <Icon size={21} strokeWidth={1.9} />
                  </span>
                  {!collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className={collapsed ? "mt-auto border-t border-[#edf0f6] p-3" : "mt-auto border-t border-[#edf0f6] p-5"}>
            <div className={`rounded-lg bg-[#f6f8fc] ${collapsed ? "grid h-12 place-items-center" : "p-4"}`}>
              {collapsed ? (
                <b className="text-sm text-[#191970]">AA</b>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#191970]">{sessionName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Configuración académica</p>
                </>
              )}
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col">
          <header className="z-10 shrink-0 border-b border-[#dde3ef] bg-[#f4f6fb]/95 px-5 py-4 backdrop-blur lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6f75a8]">{eyebrow}</p>
                <h1 className="mt-1 text-2xl font-semibold text-[#191970]">{title}</h1>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative hidden md:block">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    placeholder="Buscar usuario, clase o alumno"
                    className="h-11 w-[26rem] rounded-md border border-[#d8deeb] bg-white pl-10 pr-4 text-sm outline-none focus:border-[#191970]"
                  />
                </label>
                <Link href="/" onClick={clearSession} className="rounded-md border border-[#d8deeb] bg-white px-4 py-3 text-sm font-semibold text-[#191970] hover:bg-[#eef2ff]">
                  Salir
                </Link>
              </div>
            </div>
          </header>

          <div className={`min-h-0 flex-1 ${contentOverflow === "hidden" ? "overflow-hidden" : "overflow-auto"}`}>
            {children}
          </div>
        </section>
      </div>
    </main>
    </PortalAuthGate>
  );
}
