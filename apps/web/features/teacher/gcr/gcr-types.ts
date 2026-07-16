export type GcrState =
  | "PENDING"
  | "DRAFT"
  | "SUBMITTED_ON_TIME"
  | "SUBMITTED_LATE"
  | "INCOMPLETE"
  | "MODIFIED_POST_CLOSE"
  | "NOT_EXPECTED";
export type GcrMissingField = {
  code: "ATTENDANCE_REQUIRED";
};
export type GcrClass = { id: string; name: string; code: string; grade?: { name: string } | null };
export type GcrStudent = { id: string; displayName: string; studentCode: string };
export type GcrAttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
export type GcrAttendanceSession = {
  class: { id: string; name: string; code: string };
  date: string;
  students: Array<{
    id: string;
    studentCode: string | null;
    displayName: string;
    grade: { code: string; name: string } | null;
    report: {
      id: string;
      version: number;
      attendance: { status: GcrAttendanceStatus; comment: string | null } | null;
    } | null;
  }>;
};
export type GcrSubject = {
  classSubjectId: string;
  id: string;
  name: string;
  shortName: string;
  color: string | null;
};
export type GcrTermVerse = {
  reportId: string;
  slot: number;
  reference: string;
  text: string | null;
  score: number;
};
export type GcrReport = {
  id: string;
  reportId: string;
  reportDate: string;
  status: GcrState;
  version: number;
  submittedAt: string | null;
  isLate: boolean;
  hasPostCloseChanges: boolean;
  missingFields: GcrMissingField[] | null;
  generalComment: string;
  attendance: { status: string; comment: string | null } | null;
  subjectTasks: Array<{
    id: string;
    classSubjectId: string;
    homeworkAssigned: boolean;
    completionStatus: "COMPLETED" | "NOT_COMPLETED" | null;
    comment: string | null;
  }>;
  verse: {
    slot: number;
    reference: string;
    text: string | null;
    score: number;
    classSubjectId: string | null;
  } | null;
  merits: Array<{ id: string; comment: string; benefit: string | null; isPostClose: boolean }>;
  demerits: Array<{
    id: string;
    ordinal: number;
    comment: string;
    isPostClose: boolean;
    detentionRequired: boolean;
    detentionDate: string | null;
  }>;
  detention: { required: true; date: string } | null;
};
export type GcrWeek = {
  student: GcrStudent;
  class: { id: string; name: string; code: string };
  grade: { name: string; code: string } | null;
  academicTerm: { id: string; name: string } | null;
  weekNumber: number | null;
  weekStart: string;
  weekEnd: string;
  subjects: GcrSubject[];
  termVerses: GcrTermVerse[];
  days: Array<{ date: string; state: GcrState; report: GcrReport | null }>;
};
