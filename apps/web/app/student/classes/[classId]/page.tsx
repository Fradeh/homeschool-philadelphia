import { StudentPortalShell } from "@/features/student/StudentPortalShell";
import {
  StudentClassWorkspacePage,
  type StudentClassTab
} from "@/features/student/classes/StudentClassWorkspacePage";

const validTabs: StudentClassTab[] = ["wall", "paces", "assignments", "resources"];

export default async function StudentClassRoute({
  params,
  searchParams
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { classId } = await params;
  const { tab } = await searchParams;
  const initialTab = validTabs.includes(tab as StudentClassTab) ? (tab as StudentClassTab) : "wall";

  return (
    <StudentPortalShell
      active="classes"
      eyebrow="Portal del estudiante"
      title="Detalle de clase"
      contentOverflow="hidden"
    >
      <StudentClassWorkspacePage classId={classId} initialTab={initialTab} />
    </StudentPortalShell>
  );
}
