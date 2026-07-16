import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/groups", label: "Grupos" },
  { href: "/calendar", label: "Calendario" },
  { href: "/admin", label: "Admin" }
];

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="font-semibold text-school-navy">
            Homeschool Platform
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-school-blue">
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="rounded-md bg-school-navy px-4 py-2 text-sm font-semibold text-white hover:bg-school-blue"
          >
            Portal
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
