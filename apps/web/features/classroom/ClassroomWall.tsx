"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Megaphone, Plus, SendHorizontal, SmilePlus, Video, X } from "lucide-react";
import type { ClassroomWorkspace } from "@homeschool/shared";
import { classroomApi } from "./classroom-api";
import { getYouTubeEmbedUrl, getYouTubeVideoId, withoutYouTubeUrl } from "./youtube";

export function ClassroomWall({ workspace, onChange, canPost = false }: { workspace: ClassroomWorkspace; onChange: (workspace: ClassroomWorkspace) => void; canPost?: boolean }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [workspace.wall.length, composerOpen]);

  async function publish() {
    const videoId = getYouTubeVideoId(videoUrl);
    if (!title.trim() || (!content.trim() && !videoUrl.trim()) || busy) return;
    if (videoUrl.trim() && !videoId) { setMessage("Agrega un enlace válido de YouTube para publicar el video."); return; }
    setBusy(true); setMessage("");
    try {
      const postContent = [content.trim(), videoUrl.trim()].filter(Boolean).join("\n\n");
      onChange(await classroomApi.post(workspace.id, { title: title.trim(), content: postContent }));
      setTitle(""); setContent(""); setVideoUrl(""); setComposerOpen(false);
    } catch { setMessage("No fue posible publicar en el muro."); } finally { setBusy(false); }
  }

  async function reply(postId: string) {
    const value = drafts[postId]?.trim();
    if (!value || busy) return;
    setBusy(true); setMessage("");
    try { onChange(await classroomApi.comment(postId, value)); setDrafts((current) => ({ ...current, [postId]: "" })); setReplyingTo(null); }
    catch { setMessage("No fue posible publicar la respuesta."); } finally { setBusy(false); }
  }

  return <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#d8deeb] bg-[#eef1f7]">
    <div ref={feedRef} className={composerOpen ? "hidden" : "min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-5"}><div className="mx-auto max-w-5xl space-y-4">
      {workspace.wall.map((post) => <WallPost key={post.id} post={post} replyingTo={replyingTo} drafts={drafts} busy={busy} onReplyingTo={setReplyingTo} onDraftChange={(value) => setDrafts((current) => ({ ...current, [post.id]: value }))} onReply={() => reply(post.id)} />)}
      {!workspace.wall.length ? <div className="rounded-lg border border-dashed border-[#cbd3e1] bg-white/70 p-10 text-center"><Megaphone className="mx-auto text-slate-300"/><p className="mt-3 font-semibold text-[#191970]">El muro está listo</p><p className="mt-1 text-sm text-slate-500">Publica el primer aviso, pregunta o video para esta clase.</p></div> : null}
    </div></div>
    {canPost ? <div className={composerOpen ? "min-h-0 flex-1 overflow-y-auto border-t border-[#d8deeb] bg-[#f7f8fb] px-4 py-4 sm:px-5" : "shrink-0 border-t border-[#d8deeb] bg-[#f7f8fb] px-4 py-4 sm:px-5"}>
      {composerOpen ? <section className="mx-auto max-w-5xl rounded-lg border border-[#d8deeb] bg-white p-5 shadow-xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#6f75a8]">Nuevo aviso</p><h3 className="mt-1 text-lg font-semibold text-[#191970]">Subir publicación al muro</h3></div><button onClick={() => setComposerOpen(false)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={19}/></button></div><div className="mt-5 grid gap-5 md:grid-cols-[13rem_minmax(0,1fr)]"><aside className="rounded-lg bg-[#f6f8fc] p-3"><p className="px-2 py-2 text-sm font-semibold text-[#191970]">Visible para esta clase</p><Choice active icon={<Bell size={16}/>} label="Aviso general"/><Choice icon={<Video size={16}/>} label="Video de YouTube"/></aside><div><label className="block text-sm font-semibold text-slate-700">Asunto<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Repaso de la lección" className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 text-sm outline-none focus:border-[#191970]"/></label><label className="mt-4 block text-sm font-semibold text-slate-700">Mensaje <span className="font-normal text-slate-400">(opcional si agregas un video)</span><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} placeholder="Escribe el comunicado para tu clase…" className="mt-2 w-full resize-none rounded-md border border-[#d8deeb] p-3 text-sm outline-none focus:border-[#191970]"/></label><label className="mt-4 block text-sm font-semibold text-slate-700">Enlace de YouTube<input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." inputMode="url" className="mt-2 h-11 w-full rounded-md border border-[#d8deeb] px-3 text-sm outline-none focus:border-[#191970]"/></label>{getYouTubeVideoId(videoUrl) ? <YouTubePlayer videoId={getYouTubeVideoId(videoUrl)!} title="Vista previa del video" className="mt-4" /> : null}<div className="mt-3 flex items-center justify-between"><SmilePlus size={18} className="text-slate-400"/><button onClick={publish} disabled={!title.trim() || (!content.trim() && !videoUrl.trim()) || busy} className="inline-flex items-center gap-2 rounded-md bg-[#191970] px-4 py-2.5 text-sm font-semibold text-white disabled:bg-slate-300">Subir al muro<SendHorizontal size={16}/></button></div></div></div>{message ? <p className="mt-3 text-sm font-semibold text-rose-700">{message}</p> : null}</section> : <div className="mx-auto max-w-5xl"><button onClick={() => setComposerOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-[#5756d9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4443bf]"><Plus size={17}/>Subir al muro</button>{message ? <p className="mt-2 text-sm font-semibold text-rose-700">{message}</p> : null}</div>}
    </div> : null}
  </section>;
}

function WallPost({ post, replyingTo, drafts, busy, onReplyingTo, onDraftChange, onReply }: { post: ClassroomWorkspace["wall"][number]; replyingTo: string | null; drafts: Record<string, string>; busy: boolean; onReplyingTo: (id: string | null) => void; onDraftChange: (value: string) => void; onReply: () => void }) {
  const videoId = getYouTubeVideoId(post.content);
  const text = withoutYouTubeUrl(post.content);
  return <article className="overflow-hidden rounded-lg border border-[#d8deeb] bg-white shadow-sm"><div className="flex gap-3 p-4 sm:gap-4 sm:p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#eef2ff] text-[#191970]"><Megaphone size={18}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2 text-sm"><span className="font-semibold text-[#191970]">{post.author.displayName}</span><span className="text-slate-400">{formatDate(post.createdAt)}</span></div><div className="mt-4 rounded-lg border border-[#e7eaf1] p-4 sm:p-5"><h4 className="text-lg font-semibold text-[#191970]">{post.title}</h4>{text ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{text}</p> : null}{videoId ? <YouTubePlayer videoId={videoId} title={post.title} className="mt-4" /> : null}</div>{post.comments.length ? <div className="mt-3 space-y-2">{post.comments.map((comment) => <div key={comment.id} className="rounded-lg bg-[#f6f8fc] px-4 py-3"><div className="flex flex-wrap gap-2 text-xs"><b className="text-[#191970]">{comment.author.displayName}</b><span className="text-slate-400">{formatDate(comment.createdAt)}</span></div><p className="mt-1 text-sm leading-5 text-slate-600">{comment.content}</p></div>)}</div> : null}</div></div><div className="border-t border-[#edf0f6] px-5 py-3">{replyingTo === post.id ? <div className="flex gap-2"><input autoFocus value={drafts[post.id] ?? ""} onChange={(event) => onDraftChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onReply(); }} placeholder="Escribe una respuesta…" className="h-10 min-w-0 flex-1 rounded-md border border-[#d8deeb] px-3 text-sm outline-none focus:border-[#191970]"/><button onClick={onReply} disabled={busy} className="grid h-10 w-10 place-items-center rounded-md bg-[#191970] text-white disabled:opacity-50"><SendHorizontal size={16}/></button><button onClick={() => onReplyingTo(null)} className="rounded-md border px-3 text-slate-500"><X size={16}/></button></div> : <button onClick={() => onReplyingTo(post.id)} className="text-sm font-semibold text-slate-500 hover:text-[#191970]">Responder{post.comments.length ? ` · ${post.comments.length}` : ""}</button>}</div></article>;
}

function YouTubePlayer({ videoId, title, className = "" }: { videoId: string; title: string; className?: string }) {
  return <div className={`aspect-video overflow-hidden rounded-lg bg-slate-950 ${className}`}><iframe className="h-full w-full" src={getYouTubeEmbedUrl(videoId)} title={title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>;
}

function Choice({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) { return <div className={`mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-semibold ${active ? "bg-white text-[#191970] shadow-sm" : "text-slate-600"}`}>{icon}{label}</div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
