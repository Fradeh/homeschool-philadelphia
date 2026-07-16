import type { ClassroomWorkspace } from "@homeschool/shared";
import type { ClassColor, TeacherClass } from "@/features/teacher/classes/mock-teacher-classes";

export function workspaceToTeacherClass(item: ClassroomWorkspace): TeacherClass {
  return {
    id: item.id,
    name: item.name,
    code: item.code,
    description: item.description ?? `Espacio académico de ${item.gradeName ?? "la institución"}.`,
    color: colorName(item.color),
    students: item.students.map((student) => ({
      id: student.profileId ?? student.id,
      name: student.displayName,
      email: student.email,
      status: "Activo"
    })),
    assignments: item.assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueAt
        ? new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(
            new Date(assignment.dueAt)
          )
        : "Sin fecha",
      status:
        assignment.status === "PUBLISHED"
          ? "Publicada"
          : assignment.status === "CLOSED"
            ? "Cerrada"
            : "Borrador",
      submissionsCount: assignment.submissions.length,
      totalStudents: item.students.length,
      points: assignment.points ?? undefined,
      submissionType:
        (assignment.submissionType as "Archivo" | "Texto" | "Enlace" | "Sin entrega") ?? "Archivo",
      attachments: assignment.attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.fileName,
        downloadUrl: attachment.downloadUrl
      }))
    })),
    materials: item.materials.map((material) => ({
      id: material.id,
      name: material.name,
      type:
        material.kind === "LINK"
          ? "Enlace"
          : material.mimeType === "application/pdf"
            ? "PDF"
            : "Documento",
      uploadedAt: new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(
        new Date(material.createdAt)
      ),
      externalUrl: material.externalUrl ?? undefined,
      downloadUrl: material.downloadUrl ?? undefined
    })),
    wall: item.wall.map((post) => ({
      id: post.id,
      kind: "post",
      title: post.title,
      message: post.content,
      date: relative(post.createdAt),
      author: post.author.displayName
    })),
    activity: [
      ...item.wall.map((post) => ({
        id: `wall-${post.id}`,
        label: "Comunicado publicado",
        detail: post.title,
        time: relative(post.createdAt)
      })),
      ...item.assignments.map((assignment) => ({
        id: `assignment-${assignment.id}`,
        label: "Tarea creada",
        detail: assignment.title,
        time: relative(assignment.createdAt)
      })),
      ...item.materials.map((material) => ({
        id: `material-${material.id}`,
        label: "Archivo subido",
        detail: material.name,
        time: relative(material.createdAt)
      }))
    ],
    physicalSchedule: {
      location: "Según disponibilidad docente",
      durationMinutes: 40,
      minimumNoticeDays: 0,
      instructions: "Las solicitudes presenciales se gestionan desde Mi horario.",
      availability: [],
      requests: []
    },
    lastActivity: latestActivity(item)
  };
}

function colorName(value?: string | null): ClassColor {
  if (value?.toLowerCase().includes("078") || value?.toLowerCase().includes("blue")) return "blue";
  if (value?.toLowerCase().includes("3949") || value?.toLowerCase().includes("indigo"))
    return "indigo";
  if (value?.toLowerCase().includes("168") || value?.toLowerCase().includes("teal")) return "teal";
  return "navy";
}

function latestActivity(item: ClassroomWorkspace) {
  const records = [
    ...item.wall.map((x) => ({ date: x.createdAt, text: `Publicación: ${x.title}` })),
    ...item.assignments.map((x) => ({ date: x.createdAt, text: `Tarea: ${x.title}` })),
    ...item.materials.map((x) => ({ date: x.createdAt, text: `Recurso: ${x.name}` }))
  ].sort((a, b) => b.date.localeCompare(a.date));
  return records[0] ? `${records[0].text} · ${relative(records[0].date)}` : "Sin actividad todavía";
}

function relative(value: string) {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return "Ahora";
  if (diff < 3_600_000) return `Hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)} h`;
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(date);
}
