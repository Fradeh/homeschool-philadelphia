"use client";

import type { AuthUser } from "@homeschool/shared";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { clearSession, subscribeSession } from "@/lib/session";

export interface PortalNavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  key: string;
}

export interface PortalShellProps {
  active: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  navigation: PortalNavigationItem[];
  storageKey: string;
  portalLabel: string;
  roleLabel: string;
  defaultUserName: string;
  brandIcon: LucideIcon;
  accent: "brand" | "accent";
  contentOverflow?: "auto" | "hidden";
}

export function PortalShell({
  active,
  eyebrow,
  title,
  children,
  navigation,
  storageKey,
  portalLabel,
  roleLabel,
  defaultUserName,
  brandIcon: BrandIcon,
  accent,
  contentOverflow = "auto"
}: PortalShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCollapsed(localStorage.getItem(storageKey) === "true");
    return subscribeSession(setSessionUser);
  }, [storageKey]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileOpen]);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(storageKey, String(next));
      return next;
    });
  }

  function closeMobileNavigation() {
    setMobileOpen(false);
  }

  const userName = sessionUser
    ? `${sessionUser.firstName} ${sessionUser.lastName}`
    : defaultUserName;
  const initials = sessionUser
    ? `${sessionUser.firstName.at(0) ?? ""}${sessionUser.lastName.at(0) ?? ""}`
    : defaultUserName
        .split(" ")
        .slice(0, 2)
        .map((part) => part.at(0))
        .join("");

  return (
    <div className="h-dvh overflow-hidden bg-[var(--color-canvas)] text-[var(--color-text)]">
      <a
        href="#portal-content"
        className="fixed left-4 top-4 z-[70] -translate-y-24 rounded-[var(--radius-control)] bg-[var(--color-brand-900)] px-4 py-2 text-sm font-semibold text-white transition-transform focus:translate-y-0"
      >
        Saltar al contenido
      </a>

      <div
        className={`grid h-full ${collapsed ? "lg:grid-cols-[5.5rem_minmax(0,1fr)]" : "lg:grid-cols-[17.5rem_minmax(0,1fr)]"}`}
      >
        <DesktopSidebar
          active={active}
          accent={accent}
          collapsed={collapsed}
          navigation={navigation}
          portalLabel={portalLabel}
          roleLabel={roleLabel}
          userName={userName}
          initials={initials}
          BrandIcon={BrandIcon}
          onToggle={toggleSidebar}
        />

        <section className="flex min-h-0 min-w-0 flex-col">
          <header className="z-20 shrink-0 border-b border-[var(--color-border-soft)] bg-[rgb(255_255_255/0.92)] px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8 lg:py-4">
            <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  ref={menuButtonRef}
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)] lg:hidden"
                  aria-label="Abrir menú principal"
                  aria-expanded={mobileOpen}
                  aria-controls="mobile-portal-navigation"
                >
                  <Menu size={21} aria-hidden="true" />
                </button>

                <div className="min-w-0">
                  <p className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-muted)] sm:block">
                    {eyebrow}
                  </p>
                  <h1 className="truncate text-xl font-semibold tracking-tight text-[var(--color-brand-950)] sm:mt-0.5 sm:text-2xl">
                    {title}
                  </h1>
                </div>
              </div>

              <Link
                href="/"
                onClick={clearSession}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-brand-900)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-soft)] sm:px-4"
                aria-label="Cerrar sesión"
              >
                <LogOut size={17} aria-hidden="true" />
                <span className="hidden sm:inline">Salir</span>
              </Link>
            </div>
          </header>

          <main
            id="portal-content"
            tabIndex={-1}
            className={`min-h-0 flex-1 ${contentOverflow === "hidden" ? "overflow-hidden" : "overflow-auto"}`}
          >
            {children}
          </main>
        </section>
      </div>

      {mobileOpen ? (
        <MobileNavigation
          active={active}
          accent={accent}
          navigation={navigation}
          portalLabel={portalLabel}
          roleLabel={roleLabel}
          userName={userName}
          initials={initials}
          BrandIcon={BrandIcon}
          closeButtonRef={closeButtonRef}
          onClose={closeMobileNavigation}
        />
      ) : null}
    </div>
  );
}

function DesktopSidebar({
  active,
  accent,
  collapsed,
  navigation,
  portalLabel,
  roleLabel,
  userName,
  initials,
  BrandIcon,
  onToggle
}: {
  active: string;
  accent: PortalShellProps["accent"];
  collapsed: boolean;
  navigation: PortalNavigationItem[];
  portalLabel: string;
  roleLabel: string;
  userName: string;
  initials: string;
  BrandIcon: LucideIcon;
  onToggle: () => void;
}) {
  return (
    <aside className="hidden min-h-0 border-r border-[var(--color-border-soft)] bg-[var(--color-surface)] lg:flex lg:flex-col">
      <div
        className={`border-b border-[var(--color-border-soft)] ${collapsed ? "px-3 py-5" : "px-5 py-5"}`}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <BrandMark accent={accent} BrandIcon={BrandIcon} />
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-[var(--color-brand-950)]">
                Philadelphia
              </p>
              <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                {portalLabel}
              </p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-brand-900)] ${collapsed ? "px-0" : "border border-[var(--color-border)] px-3"}`}
          aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
          title={collapsed ? "Expandir barra lateral" : undefined}
        >
          {collapsed ? (
            <PanelLeftOpen size={18} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={17} aria-hidden="true" />
          )}
          {!collapsed ? <span>Contraer menú</span> : null}
        </button>
      </div>

      <PortalNavigation active={active} collapsed={collapsed} items={navigation} />

      <div
        className={`mt-auto border-t border-[var(--color-border-soft)] ${collapsed ? "p-3" : "p-4"}`}
      >
        <UserSummary
          collapsed={collapsed}
          initials={initials}
          roleLabel={roleLabel}
          userName={userName}
        />
      </div>
    </aside>
  );
}

function PortalNavigation({
  active,
  collapsed,
  items,
  onNavigate
}: {
  active: string;
  collapsed: boolean;
  items: PortalNavigationItem[];
  onNavigate?: () => void;
}) {
  return (
    <nav
      aria-label="Navegación principal"
      className={`min-h-0 flex-1 space-y-1 overflow-y-auto py-4 ${collapsed ? "px-3" : "px-3"}`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const selected = active === item.key;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={selected ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={`group flex min-h-11 items-center rounded-[var(--radius-control)] text-sm font-semibold transition-colors ${
              selected
                ? "bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-brand-900)]"
            } ${collapsed ? "justify-center" : "gap-3 px-3"}`}
          >
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${
                selected
                  ? "bg-[var(--color-surface)] text-[var(--color-brand-900)] shadow-sm"
                  : "text-[var(--color-text-muted)] group-hover:text-[var(--color-brand-900)]"
              }`}
            >
              <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
            </span>
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
            {selected && !collapsed ? (
              <span
                className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--color-accent-500)]"
                aria-hidden="true"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavigation({
  active,
  accent,
  navigation,
  portalLabel,
  roleLabel,
  userName,
  initials,
  BrandIcon,
  closeButtonRef,
  onClose
}: {
  active: string;
  accent: PortalShellProps["accent"];
  navigation: PortalNavigationItem[];
  portalLabel: string;
  roleLabel: string;
  userName: string;
  initials: string;
  BrandIcon: LucideIcon;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="presentation">
      <button
        className="absolute inset-0 bg-[rgb(16_20_61/0.46)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Cerrar menú principal"
      />
      <aside
        id="mobile-portal-navigation"
        className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col overflow-hidden border-r border-[var(--color-border-soft)] bg-[var(--color-surface)] shadow-[var(--shadow-popover)]"
        role="dialog"
        aria-modal="true"
        aria-label="Menú principal"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark accent={accent} BrandIcon={BrandIcon} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--color-brand-950)]">
                Philadelphia
              </p>
              <p className="truncate text-xs text-[var(--color-text-muted)]">{portalLabel}</p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-[var(--radius-control)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-brand-900)]"
            aria-label="Cerrar menú principal"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <PortalNavigation
          active={active}
          collapsed={false}
          items={navigation}
          onNavigate={onClose}
        />

        <div className="border-t border-[var(--color-border-soft)] p-4">
          <UserSummary
            collapsed={false}
            initials={initials}
            roleLabel={roleLabel}
            userName={userName}
          />
        </div>
      </aside>
    </div>
  );
}

function BrandMark({
  accent,
  BrandIcon
}: {
  accent: PortalShellProps["accent"];
  BrandIcon: LucideIcon;
}) {
  return (
    <span
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white shadow-sm ${
        accent === "accent" ? "bg-[var(--color-accent-500)]" : "bg-[var(--color-brand-900)]"
      }`}
      aria-hidden="true"
    >
      <BrandIcon size={22} strokeWidth={1.8} />
    </span>
  );
}

function UserSummary({
  collapsed,
  initials,
  roleLabel,
  userName
}: {
  collapsed: boolean;
  initials: string;
  roleLabel: string;
  userName: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] bg-[var(--color-surface-soft)] ${collapsed ? "grid h-12 place-items-center" : "flex items-center gap-3 p-3"}`}
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-brand-100)] text-xs font-bold uppercase text-[var(--color-brand-900)]"
        title={collapsed ? userName : undefined}
      >
        {initials || "PH"}
      </span>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--color-brand-950)]">{userName}</p>
          <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
            {roleLabel}
          </p>
        </div>
      ) : null}
    </div>
  );
}
