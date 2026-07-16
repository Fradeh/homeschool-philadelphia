"use client";

import { useState } from "react";
import { Download, ExternalLink, Plus, Trash2 } from "lucide-react";
import type { TeacherMaterial } from "./mock-teacher-classes";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/inline-alert";
import { apiRequest, buildApiUrl } from "@/lib/api-client";

type TeacherMaterialLink = TeacherMaterial & {
  externalUrl?: string;
  downloadUrl?: string;
};

export function ClassContent({
  materials,
  onUploadContent
}: {
  materials: TeacherMaterialLink[];
  onUploadContent: () => void;
}) {
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const visibleMaterials = materials.filter((material) => !removedIds.includes(material.id));

  async function deleteMaterial(material: TeacherMaterialLink) {
    if (!window.confirm(`¿Eliminar “${material.name}”? Esta acción no se puede deshacer.`)) return;
    setDeletingId(material.id);
    setError("");
    try {
      await apiRequest<{ id: string }>(`/classroom/materials/${material.id}`, {
        method: "DELETE"
      });
      setRemovedIds((current) => [...current, material.id]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No pudimos eliminar el recurso. Inténtalo nuevamente."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-[#dde3ef] bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#edf0f6] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[#191970]">Contenido</h3>
          <p className="mt-1 text-sm text-slate-600">
            Materiales, documentos y enlaces de apoyo para la clase.
          </p>
        </div>
        <Button onClick={onUploadContent} leadingIcon={<Plus size={17} />}>
          Subir contenido
        </Button>
      </div>

      {error ? (
        <InlineAlert className="m-5 mb-0" tone="danger" title="No se pudo eliminar el recurso">
          {error}
        </InlineAlert>
      ) : null}

      {visibleMaterials.length ? (
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleMaterials.map((material) => (
            <article key={material.id} className="rounded-lg border border-[#edf0f6] p-4">
              <span className="inline-flex rounded-full bg-[#f6f8fc] px-3 py-1 text-xs font-semibold text-[#191970]">
                {material.type}
              </span>
              <h4 className="mt-3 line-clamp-2 font-semibold text-[#191970]">{material.name}</h4>
              <p className="mt-2 text-sm text-slate-500">Subido el {material.uploadedAt}</p>
              <div className="mt-4 flex gap-2">
                {material.externalUrl ? (
                  <a
                    href={material.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#d8deeb] px-3 py-2 text-sm font-semibold text-[#191970] hover:bg-[#eef2ff]"
                  >
                    <ExternalLink size={15} aria-hidden="true" />
                    Ver enlace
                  </a>
                ) : null}
                {material.downloadUrl ? (
                  <a
                    href={buildApiUrl(material.downloadUrl)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#d8deeb] px-3 py-2 text-sm font-semibold text-[#191970] hover:bg-[#eef2ff]"
                  >
                    <Download size={15} aria-hidden="true" />
                    Descargar
                  </a>
                ) : null}
                {!material.externalUrl && !material.downloadUrl ? (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Recurso no disponible
                  </span>
                ) : null}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteMaterial(material)}
                  loading={deletingId === material.id}
                  loadingLabel="Eliminando…"
                  leadingIcon={<Trash2 size={15} aria-hidden="true" />}
                >
                  Eliminar
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          className="m-5"
          icon={<Download size={22} />}
          title="No hay materiales publicados"
          description="Sube el primer documento o enlace de apoyo para esta clase."
          action={
            <Button onClick={onUploadContent} leadingIcon={<Plus size={16} />}>
              Subir contenido
            </Button>
          }
        />
      )}
    </section>
  );
}
