export enum Weekday {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY"
}

export enum SchedulePeriodKind {
  INSTRUCTIONAL = "INSTRUCTIONAL",
  BREAK = "BREAK"
}

export enum ScheduleTemplateStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED"
}

export enum ScheduleAudienceType {
  GRADE = "GRADE",
  CLASS = "CLASS",
  TEACHER = "TEACHER"
}

export enum ScheduleBlockKind {
  SUBJECT = "SUBJECT",
  PACES = "PACES",
  ACTIVITY = "ACTIVITY",
  EMPTY = "EMPTY"
}

export enum PhysicalBookingStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED"
}

export interface GradeLevel {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SchedulePeriod {
  id: string;
  order: number;
  startTime: string;
  endTime: string;
  kind: SchedulePeriodKind;
  label?: string | null;
}

export interface SchedulePeriodInput { startTime: string; endTime: string; suggestedBreak: boolean; }

export interface ScheduleGrid {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  periods: SchedulePeriod[];
}

export interface ClassSubjectTeacher {
  classSubjectId: string;
  teacherId: string;
  teacherName: string;
}

export interface ScheduleTemplateBlock {
  id: string;
  periodId: string;
  weekday: Weekday;
  kind: ScheduleBlockKind;
  label?: string | null;
  classSubjectId?: string | null;
  subjectName?: string | null;
  subjectShortName?: string | null;
  subjectColor?: string | null;
  className?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
}

export interface ScheduleTemplateSubjectScope {
  classSubjectId: string;
  classId: string;
  className: string;
  subjectName: string;
  subjectShortName: string;
  subjectColor?: string | null;
}

export interface ScheduleTemplate {
  id: string;
  academicYearId: string;
  audienceType: ScheduleAudienceType;
  gradeLevel?: GradeLevel | null;
  targetClass?: { id: string; name: string; code: string } | null;
  targetTeacher?: { id: string; name: string; email: string } | null;
  allowedSubjects: ScheduleTemplateSubjectScope[];
  grid: ScheduleGrid;
  name: string;
  status: ScheduleTemplateStatus;
  publishedAt?: string | null;
  blocks: ScheduleTemplateBlock[];
}

export interface CreateScheduleTemplateRequest {
  academicYearId: string;
  audienceType: ScheduleAudienceType.CLASS | ScheduleAudienceType.TEACHER;
  classId?: string;
  teacherId?: string;
  classSubjectIds?: string[];
  name: string;
}

export interface ScheduleTemplateBlockInput {
  periodId: string;
  weekday: Weekday;
  kind: ScheduleBlockKind;
  label?: string;
  classSubjectId?: string;
  teacherId?: string;
}

export interface TeacherAvailabilitySlot {
  id: string;
  classSubjectId: string;
  className: string;
  subjectName: string;
  subjectShortName: string;
  teacherId: string;
  teacherName: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  location?: string | null;
  instructions?: string | null;
  isActive: boolean;
}

export interface StudentPhysicalBooking {
  id: string;
  studentId: string;
  studentName: string;
  classSubjectId: string;
  className: string;
  subjectName: string;
  subjectShortName: string;
  teacherId: string;
  teacherName: string;
  availabilitySlotId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  status: PhysicalBookingStatus;
  studentNote?: string | null;
  teacherResponse?: string | null;
  isChangeProposal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicClassOption {
  id: string;
  name: string;
  code: string;
  gradeLevel?: GradeLevel | null;
  subjects: Array<{
    id: string;
    name: string;
    shortName: string;
    color?: string | null;
    teachers: ClassSubjectTeacher[];
  }>;
}

export interface ClassPersonSummary {
  id: string;
  profileId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
}

export interface StudentClassDetail extends AcademicClassOption {
  description?: string | null;
  color?: string | null;
  teachers: ClassPersonSummary[];
  paceProgress: Array<{
    recordId: string;
    classSubjectId: string;
    paceNumber: number;
    paceTitle?: string | null;
    status: string;
    score?: number | null;
  }>;
  scheduleBlocks: ScheduleTemplateBlock[];
}

export interface TeacherClassDetail extends AcademicClassOption {
  description?: string | null;
  color?: string | null;
  students: ClassPersonSummary[];
  bookings: StudentPhysicalBooking[];
  scheduleBlocks: ScheduleTemplateBlock[];
}

export interface StudentDashboardSummary {
  student: ClassPersonSummary & { gradeLevel?: GradeLevel | null };
  classes: AcademicClassOption[];
  currentPaces: number;
  completedPaces: number;
  gradedPaces: number;
  pendingBookings: number;
  upcomingBookings: StudentPhysicalBooking[];
  conversations: number;
  unreadNotifications: number;
  hasPublishedSchedule: boolean;
}

export interface TeacherDashboardSummary {
  teacher: ClassPersonSummary;
  classes: AcademicClassOption[];
  students: number;
  pendingBookings: number;
  upcomingBookings: StudentPhysicalBooking[];
  availabilitySlots: number;
  paceRecordsToGrade: number;
  conversations: number;
  unreadNotifications: number;
  scheduleBlocks: number;
}
