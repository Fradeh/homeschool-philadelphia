import { TeacherPortalShell } from "@/features/teacher/classes/TeacherPortalShell";
import { TeacherClassWorkspacePage } from "@/features/teacher/classes/TeacherClassWorkspacePage";
import type { ClassTab } from "@/features/teacher/classes/ClassDetailPage";

const validTabs: ClassTab[] = [
  "wall",
  "paces",
  "assignments",
  "content",
  "students",
  "schedule",
  "activity"
];

export default async function TeacherClassRoute({
  params,
  searchParams
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { classId } = await params;
  const { tab } = await searchParams;
  const initialTab = validTabs.includes(tab as ClassTab) ? (tab as ClassTab) : "wall";

  return (
    <TeacherPortalShell
      active="classes"
      eyebrow="Portal del profesor"
      title="Detalle de clase"
      contentOverflow="hidden"
    >
      <TeacherClassWorkspacePage classId={classId} initialTab={initialTab} />
    </TeacherPortalShell>
  );
}
