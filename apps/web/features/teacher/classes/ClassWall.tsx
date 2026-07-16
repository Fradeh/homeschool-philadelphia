"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AtSign,
  Bell,
  ImagePlus,
  Megaphone,
  Paperclip,
  Plus,
  SendHorizontal,
  SmilePlus,
  X
} from "lucide-react";
import type { ClassWallItem } from "./mock-teacher-classes";

export type CreateWallPostForm = {
  title: string;
  message: string;
};

export function ClassWall({
  wall,
  onPublish
}: {
  wall: ClassWallItem[];
  onPublish: (form: CreateWallPostForm) => void;
}) {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    feed.scrollTop = feed.scrollHeight;
  }, [wall.length, isComposerOpen]);

  function publishPost() {
    if (!title.trim() || !message.trim()) return;
    onPublish({ title: title.trim(), message: message.trim() });
    setTitle("");
    setMessage("");
    setIsComposerOpen(false);
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#dde3ef] bg-[#eef1f7]">
      <div ref={feedRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="mx-auto space-y-4">
          {wall.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-lg border border-[#dde3ef] bg-white shadow-sm">
              <div className="flex gap-4 p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#eef2ff] text-[#191970]">
                  <Megaphone size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span className="font-semibold text-[#191970]">{item.author}</span>
                    <span>{item.date}</span>
                  </div>

                  <div className="mt-4 rounded-lg border border-[#edf0f6] bg-white p-5">
                    <h4 className="text-lg font-semibold text-[#191970]">{item.title}</h4>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.message}</p>

                    {item.attachments?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.attachments.map((attachment) => (
                          <span
                            key={attachment}
                            className="inline-flex items-center gap-2 rounded-md bg-[#f6f8fc] px-3 py-2 text-xs font-semibold text-[#191970]"
                          >
                            <Paperclip size={14} />
                            {attachment}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="border-t border-[#edf0f6] bg-white px-5 py-3">
                <button className="text-sm font-semibold text-slate-500 hover:text-[#191970]">Responder</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#d9deea] bg-[#f7f8fb] px-5 py-4">
        {isComposerOpen ? (
          <section className="mx-auto rounded-lg border border-[#d8deeb] bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f75a8]">Nuevo aviso</p>
                <h3 className="mt-1 text-lg font-semibold text-[#191970]">Subir publicación al muro</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Cerrar editor"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[16rem_1fr]">
              <aside className="rounded-lg bg-[#f6f8fc] p-4">
                <p className="text-sm font-semibold text-[#191970]">Ana Garcia</p>
                <p className="mt-1 text-xs text-slate-500">Visible para esta clase</p>

                <div className="mt-4 space-y-2">
                  <ComposerOption icon={<Bell size={16} />} label="Aviso general" active />
                  <ComposerOption
                    icon={<Paperclip size={16} />}
                    label="Adjuntar archivo"
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <ComposerOption icon={<AtSign size={16} />} label="Mencionar alumno" />
                  <ComposerOption
                    icon={<ImagePlus size={16} />}
                    label="Agregar imagen"
                    onClick={() => imageInputRef.current?.click()}
                  />
                </div>
              </aside>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Asunto</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ej. Recordatorio para mañana"
                    className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] bg-white px-3 text-sm outline-none focus:border-[#191970]"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Mensaje</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Escribe el comunicado para tus estudiantes..."
                    rows={6}
                    className="mt-2 w-full resize-none rounded-md border border-[#d8deeb] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#191970]"
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-slate-600">
                    <ToolButton label="Emoji">
                      <SmilePlus size={18} />
                    </ToolButton>
                  </div>

                  <button
                    type="button"
                    onClick={publishPost}
                    disabled={!title.trim() || !message.trim()}
                    className="inline-flex items-center gap-2 rounded-md bg-[#191970] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#11115c] disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Subir al muro
                    <SendHorizontal size={17} />
                  </button>
                </div>
              </div>
            </div>

            <input ref={fileInputRef} type="file" className="hidden" />
            <input ref={imageInputRef} type="file" accept="image/*" capture="environment" className="hidden" />
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setIsComposerOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-[#5b5fc7] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#4d50b4]"
          >
            <Plus size={18} />
            Subir al muro
          </button>
        )}
      </div>
    </section>
  );
}

function ComposerOption({
  icon,
  label,
  active = false,
  onClick
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold ${
        active ? "bg-white text-[#191970] shadow-sm" : "text-slate-600 hover:bg-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ToolButton({ label, children }: { label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className="grid h-8 w-8 place-items-center rounded-md hover:bg-[#f4f6fb] hover:text-[#191970]"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
