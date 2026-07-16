"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  MessageSquare,
  Plus,
  Search,
  Send,
  Trash2,
  UserRound,
  Users,
  X
} from "lucide-react";
import {
  ConversationStatus,
  type ConversationListItem as ConversationListItemData,
  type ConversationMessageSummary,
  type ConversationMutationResult
} from "@homeschool/shared";
import {
  closeConversation,
  deleteConversation,
  escalateConversation,
  getConversationMessages,
  getConversations,
  sendConversationMessage,
  updateConversationMessage
} from "./conversation-api";
import { NewConversationDialog } from "./NewConversationDialog";
import { getSessionUser } from "@/lib/session";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { Skeleton, SkeletonGroup } from "@/components/feedback/skeleton";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextInput } from "@/components/ui/text-input";

type ConversationWorkspaceRole = "student" | "teacher" | "administrative";

export function ConversationWorkspace({ role }: { role: ConversationWorkspaceRole }) {
  const [threads, setThreads] = useState<ConversationListItemData[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState<ConversationMessageSummary[]>([]);
  const [messageState, setMessageState] = useState<"loading" | "ready" | "error">("ready");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [messageReloadKey, setMessageReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const preparedConversationRef = useRef("");
  const user = getSessionUser();
  const administrativeMode = role === "administrative";

  useEffect(() => {
    getConversations()
      .then((items) => {
        const visibleItems = administrativeMode
          ? items.filter((item) => item.status !== ConversationStatus.OPEN)
          : items;
        setThreads(visibleItems);
        setSelectedId(visibleItems[0]?.id ?? "");
        setState("ready");
      })
      .catch(() => setState("error"));
  }, [administrativeMode]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setMessageState("ready");
      setNextCursor(null);
      setHasMoreMessages(false);
      return;
    }
    if (preparedConversationRef.current === selectedId) {
      preparedConversationRef.current = "";
      return;
    }

    let cancelled = false;
    setMessageState("loading");
    setMessages([]);
    getConversationMessages(selectedId)
      .then((page) => {
        if (cancelled) return;
        setMessages(page.items);
        setNextCursor(page.nextCursor);
        setHasMoreMessages(page.hasMore);
        setMessageState("ready");
      })
      .catch(() => {
        if (!cancelled) setMessageState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [messageReloadKey, selectedId]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("es");
    return threads.filter((thread) =>
      (!administrativeMode || thread.status !== ConversationStatus.OPEN) &&
      `${thread.subject} ${thread.participants.map((participant) => participant.user.displayName).join(" ")}`
        .toLocaleLowerCase("es")
        .includes(normalized)
    );
  }, [administrativeMode, query, threads]);
  const selected = threads.find((thread) => thread.id === selectedId);

  function replaceThread(item: ConversationListItemData) {
    setThreads((current) => [item, ...current.filter((thread) => thread.id !== item.id)]);
  }
  function applyMutation(result: ConversationMutationResult) {
    replaceThread(result.conversation);
    if (result.message) {
      setMessages((current) => mergeMessages(current, [result.message!]));
    }
  }
  function selectThread(id: string) {
    setSelectedId(id);
    setMobileThreadOpen(true);
    setNotice("");
  }
  async function send() {
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    try {
      applyMutation(await sendConversationMessage(selected.id, { body: draft.trim() }));
      setDraft("");
    } catch {
      setNotice("No pudimos enviar el mensaje. Inténtalo nuevamente.");
    } finally {
      setSending(false);
    }
  }
  async function saveEdit() {
    if (!selected || !editing?.body.trim()) return;
    try {
      applyMutation(await updateConversationMessage(selected.id, editing.id, editing.body.trim()));
      setEditing(null);
    } catch {
      setNotice("No pudimos editar el mensaje. Inténtalo nuevamente.");
    }
  }
  async function remove() {
    if (
      !selected ||
      !confirm(`¿Eliminar la conversación “${selected.subject}”? Esta acción no se puede deshacer.`)
    )
      return;
    try {
      await deleteConversation(selected.id);
      const next = threads.filter((thread) => thread.id !== selected.id);
      setThreads(next);
      setSelectedId(next[0]?.id ?? "");
      setMobileThreadOpen(false);
    } catch {
      setNotice("Solo la persona que inició esta conversación puede eliminarla.");
    }
  }
  async function escalate() {
    if (!selected) return;
    try {
      applyMutation(
        await escalateConversation(selected.id, {
          body: "Solicito acompañamiento de un directivo en esta conversación."
        })
      );
      setEscalating(false);
    } catch {
      setNotice("Todavía no hay un directivo activo disponible para esta conversación.");
      setEscalating(false);
    }
  }

  async function loadPreviousMessages() {
    if (!selected || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await getConversationMessages(selected.id, nextCursor);
      setMessages((current) => mergeMessages(page.items, current));
      setNextCursor(page.nextCursor);
      setHasMoreMessages(page.hasMore);
    } catch {
      setNotice("No pudimos cargar los mensajes anteriores.");
    } finally {
      setLoadingMore(false);
    }
  }

  async function closeEscalated() {
    if (!selected || selected.status !== ConversationStatus.ESCALATED) return;
    try {
      applyMutation(await closeConversation(selected.id, {
        body: "Caso revisado y cerrado por Dirección."
      }));
      setNotice("");
    } catch {
      setNotice("No pudimos cerrar el caso escalado. Inténtalo nuevamente.");
    }
  }

  if (state === "loading") return <ConversationSkeleton />;
  if (state === "error")
    return (
      <div className="p-5 lg:p-8">
        <ErrorState
          description="No pudimos cargar las conversaciones. Revisa tu conexión e inténtalo nuevamente."
          action={
            <button className="secondary" onClick={() => window.location.reload()}>
              Intentar de nuevo
            </button>
          }
        />
      </div>
    );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-3 sm:p-5 lg:p-8">
      <header className="shrink-0 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-info)]">Comunicación académica</p>
            <h1 className="mt-1 text-2xl font-semibold text-balance text-[var(--color-text)]">
              Conversaciones
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {administrativeMode
                ? "Revisa los casos escalados por docentes y deja trazabilidad de su cierre."
                : "Mensajes organizados con estudiantes, profesores y equipo académico."}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label
              className="grid flex-1 gap-2 text-sm font-semibold text-[var(--color-text)]"
              htmlFor="conversation-search"
            >
              Buscar conversaciones
              <span className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                  aria-hidden="true"
                />
                <TextInput
                  id="conversation-search"
                  name="conversationSearch"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ej. tarea o estudiante…"
                  className="pl-10 sm:w-72"
                  autoComplete="off"
                />
              </span>
            </label>
            {!administrativeMode ? (
              <Button leadingIcon={<Plus size={16} />} onClick={() => setCreating(true)}>
                Nueva conversación
              </Button>
            ) : null}
          </div>
        </div>
        {notice ? (
          <InlineAlert tone="warning" className="mt-4" title="Revisa esta acción">
            {notice}
          </InlineAlert>
        ) : null}
      </header>

      <section
        className="mt-4 grid min-h-0 flex-1 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] xl:grid-cols-[22rem_minmax(0,1fr)]"
        aria-label="Bandeja de conversaciones"
      >
        <aside
          className={`${mobileThreadOpen ? "hidden" : "flex"} min-h-0 flex-col border-[var(--color-border)] xl:flex xl:border-r`}
          aria-label="Lista de conversaciones"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--color-text)]">Bandeja</span>
            <span className="text-xs font-semibold tabular-nums text-[var(--color-text-muted)]">
              {filtered.length}
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filtered.map((thread) => (
              <ConversationListItem
                key={thread.id}
                thread={thread}
                currentUserId={user?.id}
                selected={selected?.id === thread.id}
                onSelect={() => selectThread(thread.id)}
              />
            ))}
            {!filtered.length ? (
              <EmptyState
                className="m-4"
                icon={<MessageSquare size={21} />}
                title={
                  threads.length ? "No encontramos conversaciones" : "Aún no tienes conversaciones"
                }
                description={
                  threads.length
                    ? "Prueba con otro asunto o participante."
                    : "Inicia una conversación con un contacto académico."
                }
                action={
                  !administrativeMode && !threads.length ? (
                    <Button
                      size="sm"
                      leadingIcon={<Plus size={15} />}
                      onClick={() => setCreating(true)}
                    >
                      Iniciar conversación
                    </Button>
                  ) : undefined
                }
              />
            ) : null}
          </div>
        </aside>

        <main
          className={`${mobileThreadOpen ? "flex" : "hidden"} min-h-0 min-w-0 flex-col xl:flex`}
        >
          {selected ? (
            <>
              <ConversationHeader
                conversation={selected}
                role={role}
                onBack={() => setMobileThreadOpen(false)}
                onParticipants={() => setParticipantsOpen(true)}
                onEscalate={() => setEscalating(true)}
                onClose={closeEscalated}
                onDelete={remove}
              />
              <MessageList
                messages={messages}
                state={messageState}
                hasMore={hasMoreMessages}
                loadingMore={loadingMore}
                currentUserId={user?.id}
                onEdit={(id, body) => setEditing({ id, body })}
                onLoadMore={loadPreviousMessages}
                onRetry={() => setMessageReloadKey((current) => current + 1)}
              />
              {selected.status === ConversationStatus.CLOSED ? (
                <InlineAlert className="m-4" tone="success" title="Caso cerrado">
                  La conversación queda disponible en modo de consulta para conservar su trazabilidad.
                </InlineAlert>
              ) : (
                <MessageComposer value={draft} onChange={setDraft} onSend={send} sending={sending} />
              )}
            </>
          ) : (
            <EmptyState
              className="m-auto max-w-md border-0"
              icon={<MessageSquare size={24} />}
              title="Selecciona una conversación"
              description="Elige una conversación de la bandeja o inicia una nueva."
              action={!administrativeMode ? (
                <Button leadingIcon={<Plus size={16} />} onClick={() => setCreating(true)}>
                  Nueva conversación
                </Button>
              ) : undefined}
            />
          )}
        </main>
      </section>

      {creating && !administrativeMode ? (
        <NewConversationDialog
          role={role === "student" ? "student" : "teacher"}
          onClose={() => setCreating(false)}
          onCreated={(result) => {
            preparedConversationRef.current = result.conversation.id;
            replaceThread(result.conversation);
            setMessages(result.message ? [result.message] : []);
            setNextCursor(null);
            setHasMoreMessages(false);
            setMessageState("ready");
            setSelectedId(result.conversation.id);
            setCreating(false);
            setNotice("");
            setMobileThreadOpen(true);
          }}
        />
      ) : null}
      {participantsOpen && selected ? (
        <Modal title="Participantes" onClose={() => setParticipantsOpen(false)}>
          <div className="space-y-3">
            {selected.participants.map((participant) => (
              <div
                key={participant.id}
                className="flex min-w-0 items-center gap-3 rounded-lg border border-[var(--color-border)] p-3"
              >
                <span
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
                  aria-hidden="true"
                >
                  <UserRound size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--color-text)]">
                    {participant.user.displayName}
                  </p>
                  <p className="truncate text-xs text-[var(--color-text-secondary)]">
                    {participantLabel(participant.type)} · {participant.user.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
      {editing ? (
        <Modal title="Editar mensaje" onClose={() => setEditing(null)}>
          <label
            className="grid gap-2 text-sm font-semibold text-[var(--color-text)]"
            htmlFor="edit-message"
          >
            Mensaje
            <textarea
              id="edit-message"
              name="editMessage"
              rows={6}
              value={editing.body}
              onChange={(event) => setEditing({ ...editing, body: event.target.value })}
              className="w-full resize-none rounded-[var(--radius-control)] border border-[var(--color-border)] p-3 text-sm font-normal"
            />
          </label>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={!editing.body.trim()}>
              Guardar cambios
            </Button>
          </div>
        </Modal>
      ) : null}
      {escalating ? (
        <Modal title="Agregar un directivo" onClose={() => setEscalating(false)}>
          <p className="text-sm leading-6 text-[var(--color-text-secondary)]">
            Se intentará agregar al directivo activo para que pueda revisar y participar en el caso.
            Si no existe uno activo, la conversación permanecerá sin cambios.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setEscalating(false)}>
              Cancelar
            </Button>
            <Button onClick={escalate}>Agregar y escalar</Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function ConversationListItem({
  thread,
  currentUserId,
  selected,
  onSelect
}: {
  thread: ConversationListItemData;
  currentUserId?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const names =
    thread.participants
      .filter((participant) => participant.user.id !== currentUserId)
      .map((participant) => participant.user.displayName)
      .join(", ") || "Equipo académico";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`w-full border-b border-[var(--color-border)] p-4 text-left hover:bg-[var(--color-surface-soft)] ${selected ? "bg-[var(--color-brand-100)]" : ""}`}
    >
      <div className="flex min-w-0 gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--color-brand-900)] text-white"
          aria-hidden="true"
        >
          <UserRound size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-[var(--color-text)]">{names}</p>
            {thread.status === ConversationStatus.ESCALATED ? (
              <StatusBadge tone="warning" className="shrink-0">
                Escalada
              </StatusBadge>
            ) : null}
          </div>
          <p className="mt-1 truncate text-sm font-medium text-[var(--color-text-secondary)]">
            {thread.subject}
          </p>
          <p className="mt-1 truncate text-xs text-[var(--color-text-muted)]">
            {thread.lastMessage?.body ?? "Sin mensajes"}
          </p>
        </div>
      </div>
    </button>
  );
}

function ConversationHeader({
  conversation,
  role,
  onBack,
  onParticipants,
  onEscalate,
  onClose,
  onDelete
}: {
  conversation: ConversationListItemData;
  role: ConversationWorkspaceRole;
  onBack: () => void;
  onParticipants: () => void;
  onEscalate: () => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <header className="flex shrink-0 flex-col gap-3 border-b border-[var(--color-border)] p-4 sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Volver a conversaciones"
          className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-md border border-[var(--color-border)] text-[var(--color-brand-900)] hover:bg-[var(--color-brand-100)] xl:hidden"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <div className="min-w-0 flex-1">
          <StatusBadge
            tone={conversation.status === ConversationStatus.ESCALATED ? "warning" : "success"}
          >
            {conversation.status === ConversationStatus.ESCALATED
              ? "Escalada"
              : conversation.status === ConversationStatus.CLOSED
                ? "Cerrada"
                : "Abierta"}
          </StatusBadge>
          <h2 className="mt-2 truncate text-lg font-semibold text-[var(--color-text)] sm:text-xl">
            {conversation.subject}
          </h2>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          leadingIcon={<Users size={16} />}
          onClick={onParticipants}
        >
          {conversation.participants.length} participantes
        </Button>
        {role === "teacher" ? (
          <Button
            size="sm"
            variant="secondary"
            leadingIcon={<AlertTriangle size={16} />}
            onClick={onEscalate}
            disabled={conversation.status === ConversationStatus.ESCALATED}
          >
            Escalar
          </Button>
        ) : null}
        {role === "administrative" && conversation.status === ConversationStatus.ESCALATED ? (
          <Button size="sm" leadingIcon={<CheckCircle2 size={16} />} onClick={onClose}>
            Cerrar caso
          </Button>
        ) : null}
        {role !== "administrative" ? <button
          type="button"
          onClick={onDelete}
          aria-label="Eliminar conversación"
          className="grid min-h-10 min-w-10 place-items-center rounded-md border border-[var(--color-danger-border)] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button> : null}
      </div>
    </header>
  );
}

function MessageList({
  messages,
  state,
  hasMore,
  loadingMore,
  currentUserId,
  onEdit,
  onLoadMore,
  onRetry
}: {
  messages: ConversationMessageSummary[];
  state: "loading" | "ready" | "error";
  hasMore: boolean;
  loadingMore: boolean;
  currentUserId?: string;
  onEdit: (id: string, body: string) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  if (state === "loading") {
    return (
      <div className="min-h-0 flex-1 p-5">
        <Skeleton className="h-full min-h-48" rounded="lg" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="min-h-0 flex-1 p-5">
        <ErrorState
          description="No pudimos cargar los mensajes de esta conversación."
          action={
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Intentar de nuevo
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <div
      className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--color-page)] p-4 sm:p-5"
      aria-live="polite"
    >
      {hasMore ? (
        <div className="flex justify-center">
          <Button size="sm" variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Cargando…" : "Cargar mensajes anteriores"}
          </Button>
        </div>
      ) : null}
      {messages.length ? (
        messages.map((message) => {
          const mine = message.sender.id === currentUserId;
          return (
            <article key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`group max-w-[min(42rem,88%)] rounded-2xl px-4 py-3 shadow-sm ${mine ? "rounded-br-md bg-[var(--color-brand-900)] text-white" : "rounded-bl-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]"}`}
              >
                <div className="flex items-center justify-between gap-5">
                  <p className="truncate text-xs font-bold">
                    {mine ? "Tú" : message.sender.displayName}
                  </p>
                  {mine ? (
                    <button
                      type="button"
                      onClick={() => onEdit(message.id, message.body)}
                      aria-label="Editar mensaje"
                      className="grid min-h-7 min-w-7 place-items-center rounded opacity-70 hover:bg-white/10 hover:opacity-100"
                    >
                      <Edit3 size={13} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">
                  {message.body}
                </p>
                <div className="mt-2 flex justify-end gap-2 text-[10px] opacity-65">
                  <time dateTime={message.createdAt}>
                    {new Intl.DateTimeFormat("es-CO", {
                      hour: "numeric",
                      minute: "2-digit"
                    }).format(new Date(message.createdAt))}
                  </time>
                  {message.updatedAt !== message.createdAt ? <span>· Editado</span> : null}
                </div>
              </div>
            </article>
          );
        })
      ) : (
        <EmptyState
          className="border-0 bg-transparent"
          icon={<MessageSquare size={22} />}
          title="No hay mensajes todavía"
          description="Escribe el primer mensaje para comenzar la conversación."
        />
      )}
    </div>
  );
}

function MessageComposer({
  value,
  onChange,
  onSend,
  sending
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  return (
    <footer className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4">
      <label className="sr-only" htmlFor="conversation-message">
        Escribir mensaje
      </label>
      <div className="flex items-end gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-soft)] p-2 focus-within:border-[var(--color-focus)]">
        <textarea
          id="conversation-message"
          name="conversationMessage"
          rows={2}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder="Escribe un mensaje…"
          className="min-h-12 min-w-0 flex-1 resize-none border-0 bg-transparent p-2 text-base text-[var(--color-text)] outline-none sm:text-sm"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!value.trim() || sending}
          aria-label={sending ? "Enviando mensaje" : "Enviar mensaje"}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[var(--color-brand-900)] text-white hover:bg-[var(--color-brand-800)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={18} aria-hidden="true" />
        </button>
      </div>
      <p className="mt-2 hidden text-xs text-[var(--color-text-muted)] sm:block">
        Enter para enviar · Shift + Enter para nueva línea
      </p>
    </footer>
  );
}

function Modal({
  title,
  onClose,
  children
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overscroll-contain bg-slate-950/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="w-full max-w-lg rounded-[var(--radius-card)] bg-[var(--color-surface)] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border)] p-5">
          <h2 id="dialog-title" className="text-lg font-semibold text-[var(--color-text)]">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={`Cerrar ${title.toLocaleLowerCase("es")}`}
            className="grid min-h-11 min-w-11 place-items-center rounded-md text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-soft)]"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
function participantLabel(type: string) {
  return (
    (
      {
        STUDENT: "Estudiante",
        TEACHER: "Profesor",
        PARENT: "Acudiente",
        DIRECTOR: "Directivo"
      } as Record<string, string>
    )[type] ?? type
  );
}
function mergeMessages(
  first: ConversationMessageSummary[],
  second: ConversationMessageSummary[]
) {
  return [...new Map([...first, ...second].map((message) => [message.id, message])).values()].sort(
    (left, right) =>
      left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)
  );
}
function ConversationSkeleton() {
  return (
    <SkeletonGroup label="Cargando conversaciones">
      <div className="flex h-full flex-col gap-4 p-5 lg:p-8">
        <Skeleton className="h-32 shrink-0" rounded="lg" />
        <div className="grid min-h-0 flex-1 xl:grid-cols-[22rem_1fr]">
          <Skeleton className="h-full" rounded="lg" />
          <Skeleton className="hidden h-full xl:block" rounded="lg" />
        </div>
      </div>
    </SkeletonGroup>
  );
}
