import {
  AdminAcademicOverview,
  AdminAcademicYearSummary,
  AdminClassSummary,
  AdminFamilyLinkSummary,
  AdminSubjectSummary,
  AdminUserSummary,
  AssignClassSubjectRequest,
  AssignClassTeacherRequest,
  CreateAdminAcademicTermRequest,
  CreateAdminAcademicYearRequest,
  CreateAdminClassRequest,
  CreateAdminSubjectRequest,
  CreateAdminUserRequest,
  EnrollClassStudentRequest,
  UpdateAdminSubjectRequest,
  UpdateFamilyLinkRequest,
  UpsertFamilyLinkRequest,
  UserRole
} from "@homeschool/shared";
import { apiRequest } from "@/lib/api-client";

function adminPath(path: string) {
  return `/admin${path}`;
}

export function getAdminOverview() {
  return apiRequest<AdminAcademicOverview>(adminPath("/overview"));
}

export function getAdminAcademicYears() {
  return apiRequest<AdminAcademicYearSummary[]>(adminPath("/academic-years"));
}

export function createAdminAcademicYear(payload: CreateAdminAcademicYearRequest) {
  return apiRequest<AdminAcademicYearSummary>(adminPath("/academic-years"), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function activateAdminAcademicYear(academicYearId: string) {
  return apiRequest<AdminAcademicYearSummary>(adminPath(`/academic-years/${academicYearId}/activate`), {
    method: "PATCH"
  });
}

export function createAdminAcademicTerm(academicYearId: string, payload: CreateAdminAcademicTermRequest) {
  return apiRequest<AdminAcademicYearSummary>(adminPath(`/academic-years/${academicYearId}/terms`), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getAdminUsers(role?: UserRole) {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";

  return apiRequest<AdminUserSummary[]>(adminPath(`/academic-users${query}`));
}

export function createAdminUser(payload: CreateAdminUserRequest) {
  return apiRequest<AdminUserSummary>(adminPath("/academic-users"), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function configureAdministrativeUser(userId: string) {
  return apiRequest<AdminUserSummary>(adminPath(`/academic-users/${userId}/administrative`), {
    method: "PATCH"
  });
}

export function getAdminClasses() {
  return apiRequest<AdminClassSummary[]>(adminPath("/classes"));
}

export function createAdminClass(payload: CreateAdminClassRequest) {
  return apiRequest<AdminClassSummary>(adminPath("/classes"), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function assignAdminClassTeacher(classId: string, payload: AssignClassTeacherRequest) {
  return apiRequest<AdminClassSummary>(adminPath(`/classes/${classId}/teachers`), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function removeAdminClassTeacher(classId: string, teacherProfileId: string) {
  return apiRequest<AdminClassSummary>(adminPath(`/classes/${classId}/teachers/${teacherProfileId}`), { method: "DELETE" });
}

export function enrollAdminClassStudent(classId: string, payload: EnrollClassStudentRequest) {
  return apiRequest<AdminClassSummary>(adminPath(`/classes/${classId}/students`), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function unenrollAdminClassStudent(classId: string, studentProfileId: string) {
  return apiRequest<AdminClassSummary>(adminPath(`/classes/${classId}/students/${studentProfileId}`), { method: "DELETE" });
}

export function assignAdminClassSubject(classId: string, payload: AssignClassSubjectRequest) {
  return apiRequest<AdminClassSummary>(adminPath(`/classes/${classId}/subjects`), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getAdminSubjects() {
  return apiRequest<AdminSubjectSummary[]>(adminPath("/subjects"));
}

export function createAdminSubject(payload: CreateAdminSubjectRequest) {
  return apiRequest<AdminSubjectSummary>(adminPath("/subjects"), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminSubject(subjectId: string, payload: UpdateAdminSubjectRequest) {
  return apiRequest<AdminSubjectSummary>(adminPath(`/subjects/${subjectId}`), {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export function getAdminFamilyLinks() {
  return apiRequest<AdminFamilyLinkSummary[]>(adminPath("/family-links"));
}

export function upsertAdminFamilyLink(payload: UpsertFamilyLinkRequest) {
  return apiRequest<AdminFamilyLinkSummary>(adminPath("/family-links"), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminFamilyLink(studentProfileId: string, parentProfileId: string, payload: UpdateFamilyLinkRequest) {
  return apiRequest<AdminFamilyLinkSummary>(adminPath(`/family-links/${studentProfileId}/${parentProfileId}`), {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
