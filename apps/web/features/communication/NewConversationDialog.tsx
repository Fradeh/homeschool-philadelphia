"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, UserRound, X } from "lucide-react";
import type { ConversationContact, ConversationMutationResult } from "@homeschool/shared";
import { createConversation, getConversationContacts } from "./conversation-api";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Skeleton } from "@/components/feedback/skeleton";
import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";

export function NewConversationDialog({
  role,
  onClose,
  onCreated
}: {
  role: "teacher" | "student";
  onClose: () => void;
  onCreated: (result: ConversationMutationResult) => void;
}) {
  const [contacts, setContacts] = useState<ConversationContact[]>([]);
  const [contact, setContact] = useState("");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    getConversationContacts()
      .then((items) => {
        setContacts(items);
        setState("ready");
      })
      .catch(() => setState("error"));
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return contacts.filter((item) =>
      `${item.displayName} ${item.classNames.join(" ")}`
        .toLocaleLowerCase("es")
        .includes(normalized)
    );
  }, [contacts, query]);

  async function submit() {
    if (!contact || !subject.trim() || !body.trim() || sending) return;
    setSending(true);
    setMessage("");
    try {
      onCreated(
        await createConversation({
          subject: subject.trim(),
          body: body.trim(),
          ...(role === "teacher" ? { studentProfileId: contact } : { teacherProfileId: contact })
        })
      );
    } catch {
      setMessage("No pudimos iniciar la conversación con este contacto. Inténtalo nuevamente.");
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overscroll-contain bg-slate-950/50 p-3 sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-conversation-title"
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-info)]">
              Nuevo mensaje
            </p>
            <h2
              id="new-conversation-title"
              className="mt-1 text-xl font-semibold text-[var(--color-text)]"
            >
              Iniciar conversación
            </h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Elige el contacto y escribe el primer mensaje.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar nueva conversación"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)]"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-5 p-5">
          <section aria-labelledby="contact-heading">
            <h3 id="contact-heading" className="text-sm font-semibold text-[var(--color-text)]">
              1. Contacto académico
            </h3>
            <label className="relative mt-2 block" htmlFor="contact-search">
              <span className="sr-only">Buscar contacto</span>
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
              <TextInput
                id="contact-search"
                name="contactSearch"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o clase…"
                className="pl-10"
                autoComplete="off"
              />
            </label>
            <div
              className="mt-3 grid max-h-52 gap-2 overflow-y-auto overscroll-contain sm:grid-cols-2"
              role="listbox"
              aria-label="Contactos disponibles"
            >
              {state === "loading" ? (
                <>
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </>
              ) : null}
              {state === "ready"
                ? filtered.map((item) => (
                    <button
                      key={item.profileId}
                      type="button"
                      role="option"
                      aria-selected={contact === item.profileId}
                      onClick={() => setContact(item.profileId)}
                      className={`flex min-h-16 min-w-0 items-center gap-3 rounded-lg border p-3 text-left ${contact === item.profileId ? "border-[var(--color-brand-900)] bg-[var(--color-brand-100)]" : "border-[var(--color-border)] hover:bg-[var(--color-surface-soft)]"}`}
                    >
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[var(--color-brand-900)]"
                        aria-hidden="true"
                      >
                        <UserRound size={17} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm text-[var(--color-text)]">
                          {item.displayName}
                        </strong>
                        <small className="block truncate text-[var(--color-text-secondary)]">
                          {item.classNames.join(", ") || "Contacto académico"}
                        </small>
                      </span>
                      {contact === item.profileId ? (
                        <Check
                          size={17}
                          className="shrink-0 text-[var(--color-brand-900)]"
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  ))
                : null}
            </div>
            {state === "error" ? (
              <InlineAlert tone="danger" className="mt-3" title="No pudimos cargar los contactos">
                Cierra este formulario e inténtalo nuevamente.
              </InlineAlert>
            ) : null}
            {state === "ready" && !filtered.length ? (
              <EmptyState
                className="mt-3 py-6"
                title={contacts.length ? "No encontramos contactos" : "No hay contactos asignados"}
                description={
                  contacts.length
                    ? "Prueba con otro nombre o clase."
                    : "Necesitas un contacto académico asignado para iniciar una conversación."
                }
              />
            ) : null}
          </section>

          <section className="space-y-4" aria-labelledby="message-heading">
            <h3 id="message-heading" className="text-sm font-semibold text-[var(--color-text)]">
              2. Mensaje inicial
            </h3>
            <label
              className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
              htmlFor="conversation-subject"
            >
              Asunto
              <TextInput
                id="conversation-subject"
                name="conversationSubject"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Ej. Duda sobre la tarea de matemáticas…"
                autoComplete="off"
              />
            </label>
            <label
              className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
              htmlFor="conversation-body"
            >
              Primer mensaje
              <textarea
                id="conversation-body"
                name="conversationBody"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={5}
                className="w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 text-base font-normal text-[var(--color-text)] sm:text-sm"
                placeholder="Escribe el contexto de la conversación…"
              />
            </label>
          </section>
          {message ? (
            <InlineAlert tone="danger" title="No se creó la conversación">
              {message}
            </InlineAlert>
          ) : null}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-[var(--color-border)] p-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={!contact || !subject.trim() || !body.trim()}
            loading={sending}
            loadingLabel="Creando…"
          >
            Iniciar conversación
          </Button>
        </footer>
      </section>
    </div>
  );
}
