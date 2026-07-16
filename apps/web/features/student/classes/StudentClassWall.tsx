"use client";

import { useState } from "react";
import { AlertCircle, Check, MessageCircle, Send, UserRound } from "lucide-react";
import type { ClassWallItem } from "@/features/teacher/classes/mock-teacher-classes";
import { studentUser } from "../mock-student-data";

type Comment = { id: string; postId: string; author: string; message: string; time: string; role: "student" | "teacher" };

const initialComments: Comment[] = [
  { id: "comment-1", postId: "wall-1", author: "Mateo Rivera", message: "Profesora, ¿también debemos llevar la rúbrica impresa?", time: "Hace 8 min", role: "student" },
  { id: "comment-2", postId: "wall-1", author: "Ana Garcia", message: "No es necesario, pueden consultarla desde Recursos.", time: "Hace 5 min", role: "teacher" }
];

export function StudentClassWall({ wall }: { wall: ClassWallItem[] }) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [reported, setReported] = useState<Record<string, number>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  function publish(postId: string) {
    const message = drafts[postId]?.trim();
    if (!message) return;
    setComments((current) => [...current, { id: `comment-${Date.now()}`, postId, author: `${studentUser.firstName} ${studentUser.lastName}`, message, time: "Ahora", role: "student" }]);
    setDrafts((current) => ({ ...current, [postId]: "" }));
  }

  function report(postId: string) {
    if (confirmed[postId]) return;
    setReported((current) => ({ ...current, [postId]: (current[postId] ?? 0) + 1 }));
    setConfirmed((current) => ({ ...current, [postId]: true }));
  }

  return (
    <section className="rounded-lg border border-[#dde3ef] bg-white">
      <header className="border-b border-[#edf0f6] p-5">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#6f75a8]">Muro de la clase</p>
        <h3 className="mt-1 text-lg font-semibold text-[#191970]">Novedades y comentarios</h3>
        <p className="mt-1 text-xs text-slate-500">Los anuncios son oficiales; los estudiantes pueden preguntar o señalar información desactualizada.</p>
      </header>

      <div className="divide-y divide-[#edf0f6]">
        {wall.map((post) => {
          const postComments = comments.filter((comment) => comment.postId === post.id);
          const reports = reported[post.id] ?? 0;
          return (
            <article key={post.id} className="p-5">
              <div className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#191970] text-white"><MessageCircle size={18} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#eef2ff] px-2 py-1 text-[10px] font-bold uppercase text-[#191970]">Anuncio oficial</span>
                    <span className="text-xs text-slate-400">{post.author} · {post.date}</span>
                  </div>
                  <h4 className="mt-2 font-semibold text-[#191970]">{post.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{post.message}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#edf0f6] pt-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><MessageCircle size={14} />{postComments.length} comentarios</span>
                    <button onClick={() => report(post.id)} disabled={confirmed[post.id]} className={`inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold ${confirmed[post.id] ? "bg-amber-50 text-amber-700" : "text-slate-500 hover:bg-amber-50 hover:text-amber-700"}`}><AlertCircle size={14} />{confirmed[post.id] ? "Reportado al profesor" : "Información desactualizada"}</button>
                    {reports ? <span className="text-xs text-amber-700">{reports} estudiante{reports === 1 ? "" : "s"} lo confirma{reports === 1 ? "" : "n"}</span> : null}
                  </div>

                  {postComments.length ? <div className="mt-4 space-y-3 rounded-lg bg-[#f8f9fc] p-3">{postComments.map((comment) => <div key={comment.id} className="flex gap-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${comment.role === "teacher" ? "bg-[#191970] text-white" : "bg-white text-slate-500"}`}><UserRound size={14} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold text-[#191970]">{comment.author}</p>{comment.role === "teacher" ? <span className="rounded bg-[#eef2ff] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#191970]">Profesor</span> : null}<span className="text-[10px] text-slate-400">{comment.time}</span></div><p className="mt-1 text-sm leading-5 text-slate-600">{comment.message}</p></div></div>)}</div> : null}

                  <div className="mt-3 flex gap-2">
                    <input value={drafts[post.id] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [post.id]: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") publish(post.id); }} placeholder="Escribe una duda o aclaración..." className="h-10 min-w-0 flex-1 rounded-md border border-[#d8deeb] px-3 text-sm outline-none focus:border-[#191970]" />
                    <button onClick={() => publish(post.id)} aria-label="Publicar comentario" className="grid h-10 w-10 place-items-center rounded-md bg-[#191970] text-white"><Send size={16} /></button>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-[10px] text-slate-400"><Check size={11} />Tu nombre será visible para el profesor y tus compañeros.</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
