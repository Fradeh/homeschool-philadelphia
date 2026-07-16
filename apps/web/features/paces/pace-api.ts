import {
  GradePaceRequest,
  PaceReconciliationResult,
  PaceRecordSummary,
  SetStudentPaceGoalRequest,
  TeacherPaceWorkspace,
  UpdatePaceGradeRequest,
  UpdatePaceStatusRequest
} from "@homeschool/shared";
import { apiRequest } from "@/lib/api-client";

export function getTeacherPaceWorkspace() {
  return apiRequest<TeacherPaceWorkspace>("/teacher/pace-workspace");
}

export function reconcileTeacherPaceWorkspace() {
  return apiRequest<PaceReconciliationResult>("/teacher/pace-workspace/reconcile", {
    method: "POST"
  });
}

export function setTeacherPaceGoal(payload: SetStudentPaceGoalRequest) {
  return apiRequest("/teacher/pace-goals", { method: "POST", body: JSON.stringify(payload) });
}

export function updateTeacherPaceStatus(recordId: string, payload: UpdatePaceStatusRequest) {
  return apiRequest<PaceRecordSummary>(`/teacher/pace-records/${recordId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function gradeTeacherPace(recordId: string, payload: GradePaceRequest) {
  return apiRequest<PaceRecordSummary>(`/teacher/pace-records/${recordId}/grade`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateTeacherPaceGrade(gradeId: string, payload: UpdatePaceGradeRequest) {
  return apiRequest<PaceRecordSummary>(`/teacher/grades/${gradeId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function getTeacherGrades() {
  return apiRequest<PaceRecordSummary[]>("/teacher/grades");
}

export function getStudentPaces() {
  return apiRequest<PaceRecordSummary[]>("/student/paces");
}

export function getStudentGrades() {
  return apiRequest<PaceRecordSummary[]>("/student/grades");
}
