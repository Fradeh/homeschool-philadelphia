import type {
  ClassAssignmentStatus,
  ClassroomClassSummary,
  ClassroomWorkspace
} from "@homeschool/shared";
import { apiRequest } from "@/lib/api-client";

async function loadWorkspaces(path: string) {
  const classes = await apiRequest<ClassroomClassSummary[]>(path);
  return Promise.all(
    classes.map((item) => apiRequest<ClassroomWorkspace>(`/classroom/classes/${item.id}`))
  );
}

export const classroomApi = {
  teacherClasses: () => apiRequest<ClassroomClassSummary[]>("/classroom/teacher/classes"),
  studentClasses: () => apiRequest<ClassroomClassSummary[]>("/classroom/student/classes"),
  teacherWorkspaces: () => loadWorkspaces("/classroom/teacher/classes"),
  studentWorkspaces: () => loadWorkspaces("/classroom/student/classes"),
  workspace: (classId: string) => apiRequest<ClassroomWorkspace>(`/classroom/classes/${classId}`),
  post: (classId: string, payload: { title: string; content: string }) => apiRequest<ClassroomWorkspace>(`/classroom/classes/${classId}/wall`, { method: "POST", body: JSON.stringify(payload) }),
  comment: (postId: string, content: string) => apiRequest<ClassroomWorkspace>(`/classroom/wall/${postId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
  assignment: (classId: string, payload: { title: string; description: string; dueAt?: string; points?: number; submissionType?: string; status?: ClassAssignmentStatus }, files: File[] = []) => {
    const form = new FormData();
    form.set("title", payload.title);
    form.set("description", payload.description);
    if (payload.dueAt) form.set("dueAt", payload.dueAt);
    if (payload.points !== undefined) form.set("points", String(payload.points));
    if (payload.submissionType) form.set("submissionType", payload.submissionType);
    if (payload.status) form.set("status", payload.status);
    files.forEach((file) => form.append("files", file));
    return apiRequest<ClassroomWorkspace>(`/classroom/classes/${classId}/assignments`, { method: "POST", body: form });
  },
  material: (classId: string, form: FormData) => {
    if (!String(form.get("externalUrl") ?? "").trim()) form.delete("externalUrl");
    return apiRequest<ClassroomWorkspace>(`/classroom/classes/${classId}/materials`, { method: "POST", body: form });
  },
  submit: (assignmentId: string, form: FormData) => apiRequest<ClassroomWorkspace>(`/classroom/assignments/${assignmentId}/submission`, { method: "POST", body: form })
};
