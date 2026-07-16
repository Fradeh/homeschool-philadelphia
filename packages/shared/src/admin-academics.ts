import { AcademicStatus, ParentRelationship } from "./academics";
import { UserRole } from "./auth";

export interface AdminUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: UserRole[];
  studentProfileId?: string | null;
  gradeLevelId?: string | null;
  teacherProfileId?: string | null;
  parentProfileId?: string | null;
  directorProfileId?: string | null;
  createdAt: string;
}

export interface CreateAdminUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  studentCode?: string;
  employeeCode?: string;
  gradeLevel?: string;
  gradeLevelId?: string;
  parentPhone?: string;
  directorTitle?: string;
}

export interface AdminClassSummary {
  id: string;
  academicYearId: string;
  academicYearName: string;
  name: string;
  code: string;
  description?: string | null;
  color?: string | null;
  status: AcademicStatus;
  gradeLevelId?: string | null;
  gradeLevelName?: string | null;
  teachers: AdminUserSummary[];
  students: AdminUserSummary[];
  subjects: AdminClassSubjectSummary[];
}

export interface CreateAdminClassRequest {
  academicYearId?: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  gradeLevelId?: string;
}

export interface AssignClassTeacherRequest {
  teacherProfileId: string;
  isPrimary?: boolean;
}

export interface EnrollClassStudentRequest {
  studentProfileId: string;
}

export interface AdminSubjectSummary {
  id: string;
  name: string;
  shortName: string;
  color?: string | null;
  status: AcademicStatus;
  paceEnabled: boolean;
  paceCount: number;
  classCount: number;
}

export interface AdminClassSubjectSummary {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectShortName: string;
  targetPaces: number;
  paceCount: number;
  paceEnabled: boolean;
  color?: string | null;
  teachers?: Array<{ teacherId: string; teacherName: string }>;
}

export interface CreateAdminSubjectRequest {
  name: string;
  shortName: string;
  color?: string;
  paceEnabled?: boolean;
}

export interface UpdateAdminSubjectRequest {
  name?: string;
  shortName?: string;
  color?: string;
  status?: AcademicStatus;
  paceEnabled?: boolean;
}

export interface AssignClassSubjectRequest {
  subjectId: string;
}

export interface AdminFamilyLinkSummary {
  studentId: string;
  parentId: string;
  student: AdminUserSummary;
  parent: AdminUserSummary;
  relationship: ParentRelationship;
  isPrimary: boolean;
  receivesAcademicEmails: boolean;
  receivesBehaviorEmails: boolean;
  receivesBillingEmails: boolean;
  canViewGrades: boolean;
  canMessageTeachers: boolean;
}

export interface UpsertFamilyLinkRequest {
  studentProfileId: string;
  parentProfileId: string;
  relationship: ParentRelationship;
  isPrimary?: boolean;
  receivesAcademicEmails?: boolean;
  receivesBehaviorEmails?: boolean;
  receivesBillingEmails?: boolean;
  canViewGrades?: boolean;
  canMessageTeachers?: boolean;
}

export interface UpdateFamilyLinkRequest {
  relationship?: ParentRelationship;
  isPrimary?: boolean;
  receivesAcademicEmails?: boolean;
  receivesBehaviorEmails?: boolean;
  receivesBillingEmails?: boolean;
  canViewGrades?: boolean;
  canMessageTeachers?: boolean;
}

export interface AdminAcademicOverview {
  users: {
    total: number;
    teachers: number;
    students: number;
    parents: number;
    directors: number;
  };
  classes: {
    total: number;
    active: number;
  };
  subjects: {
    total: number;
    active: number;
  };
  familyLinks: {
    total: number;
  };
}

export interface AdminAcademicTermSummary {
  id: string;
  academicYearId: string;
  name: string;
  order: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface AdminAcademicYearSummary {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  terms: AdminAcademicTermSummary[];
}

export interface CreateAdminAcademicYearRequest {
  name: string;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}

export interface CreateAdminAcademicTermRequest {
  name: string;
  order: number;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}
