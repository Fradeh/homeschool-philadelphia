import { apiRequest } from "@/lib/api-client";
import type { GcrAttendanceSession, GcrReport, GcrStudent, GcrWeek } from "./gcr-types";

const json = (body: unknown): Pick<RequestInit, "body"> => ({ body: JSON.stringify(body) });

export const gcrApi = {
  students: (date: string) =>
    apiRequest<GcrStudent[]>(`/gcr/teacher/filters/students?date=${encodeURIComponent(date)}`),
  classes: (date: string) =>
    apiRequest<Array<{ id: string; name: string; code: string; grade?: { name: string } | null }>>(
      `/gcr/teacher/filters/classes?date=${encodeURIComponent(date)}`
    ),
  attendanceSession: (classId: string, date: string) =>
    apiRequest<GcrAttendanceSession>(
      `/gcr/teacher/attendance-session?classId=${encodeURIComponent(classId)}&date=${encodeURIComponent(date)}`
    ),
  week: (studentId: string, date: string) =>
    apiRequest<GcrWeek>(`/gcr/teacher/students/${studentId}/week?date=${encodeURIComponent(date)}`),
  open: (studentId: string, reportDate: string, classId?: string) =>
    apiRequest<GcrReport>("/gcr/teacher/reports", {
      method: "POST",
      ...json({ studentId, reportDate, classId })
    }),
  comment: (reportId: string, body: object) =>
    apiRequest<GcrReport>(`/gcr/teacher/reports/${reportId}`, { method: "PATCH", ...json(body) }),
  attendance: (reportId: string, body: object) =>
    apiRequest<{ reportVersion: number }>(`/gcr/teacher/reports/${reportId}/attendance`, {
      method: "PUT",
      ...json(body)
    }),
  saveDraft: (reportId: string, body: object) =>
    apiRequest<GcrReport>(`/gcr/teacher/reports/${reportId}/draft`, {
      method: "PUT",
      ...json(body)
    }),
  task: (reportId: string, classSubjectId: string, body: object) =>
    apiRequest<{ reportVersion: number }>(
      `/gcr/teacher/reports/${reportId}/subject-tasks/${classSubjectId}`,
      { method: "PUT", ...json(body) }
    ),
  verse: (reportId: string, body: object) =>
    apiRequest<{ reportVersion: number }>(`/gcr/teacher/reports/${reportId}/verse`, {
      method: "PUT",
      ...json(body)
    }),
  merit: (reportId: string, body: object) =>
    apiRequest<{ reportVersion: number }>(`/gcr/teacher/reports/${reportId}/merits`, {
      method: "POST",
      ...json(body)
    }),
  demerits: (reportId: string, body: object) =>
    apiRequest<Array<{ reportVersion: number }>>(`/gcr/teacher/reports/${reportId}/demerits`, {
      method: "POST",
      ...json(body)
    }),
  submit: (reportId: string, version: number) =>
    apiRequest<GcrReport>(`/gcr/teacher/reports/${reportId}/submit`, {
      method: "POST",
      ...json({ version })
    })
};
