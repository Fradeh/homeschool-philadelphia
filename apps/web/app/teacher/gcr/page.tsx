import { Suspense } from "react";
import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { GcrTeacherPage } from "@/features/teacher/gcr/GcrTeacherPage";

export default function TeacherGcrRoute() {
  return (
    <TeacherPortalShell active="gcr" eyebrow="Portal del profesor" title="Goal Check Report">
      <Suspense fallback={<div className="p-8 text-sm text-slate-500">Cargando GCR…</div>}>
        <GcrTeacherPage />
      </Suspense>
    </TeacherPortalShell>
  );
}
