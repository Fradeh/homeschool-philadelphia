export enum AcademicStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED"
}

export enum EnrollmentStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  WITHDRAWN = "WITHDRAWN",
  COMPLETED = "COMPLETED"
}

export enum ParentRelationship {
  MOTHER = "MOTHER",
  FATHER = "FATHER",
  GUARDIAN = "GUARDIAN",
  TUTOR = "TUTOR",
  OTHER = "OTHER"
}

export enum PaceProgressStatus {
  PLANNED = "PLANNED",
  CURRENT = "CURRENT",
  COMPLETED = "COMPLETED",
  NEEDS_REVIEW = "NEEDS_REVIEW"
}

export enum PaceGradeStatus {
  PENDING = "PENDING",
  GRADED = "GRADED",
  REVISED = "REVISED"
}

export interface AcademicYear {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface AcademicTerm {
  id: string;
  academicYearId: string;
  name: string;
  order: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

export interface AcademicClass {
  id: string;
  academicYearId: string;
  name: string;
  code: string;
  description?: string | null;
  color?: string | null;
  status: AcademicStatus;
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  color?: string | null;
  status: AcademicStatus;
}

export interface ClassSubject {
  id: string;
  classId: string;
  subjectId: string;
  targetPaces: number;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentCode?: string | null;
  gradeLevel?: string | null;
  status: AcademicStatus;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  employeeCode?: string | null;
  status: AcademicStatus;
}

export interface ParentProfile {
  id: string;
  userId: string;
  phone?: string | null;
  status: AcademicStatus;
}

export interface DirectorProfile {
  id: string;
  userId: string;
  title?: string | null;
  status: AcademicStatus;
}

export interface StudentParentLink {
  studentId: string;
  parentId: string;
  relationship: ParentRelationship;
  isPrimary: boolean;
  receivesAcademicEmails: boolean;
  receivesBehaviorEmails: boolean;
  receivesBillingEmails: boolean;
  canViewGrades: boolean;
  canMessageTeachers: boolean;
}

export interface Pace {
  id: string;
  subjectId: string;
  number: number;
  title?: string | null;
  sequence: number;
}

export interface StudentPaceRecord {
  id: string;
  studentId: string;
  classSubjectId: string;
  paceId: string;
  academicTermId: string;
  status: PaceProgressStatus;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface PaceGrade {
  id: string;
  studentPaceRecordId: string;
  score: number;
  feedback?: string | null;
  status: PaceGradeStatus;
  gradedById?: string | null;
  gradedAt: string;
  updatedAt: string;
}
