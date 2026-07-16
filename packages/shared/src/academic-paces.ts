import { PaceGradeStatus, PaceProgressStatus } from "./academics";

export interface PaceRecordPersonSummary {
  id: string;
  profileId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  gradeLevel?: string | null;
}

export interface PaceRecordClassSummary {
  id: string;
  name: string;
  code: string;
}

export interface PaceRecordSubjectSummary {
  id: string;
  classSubjectId: string;
  name: string;
  shortName: string;
  color?: string | null;
  targetPaces: number;
}

export interface PaceRecordPaceSummary {
  id: string;
  number: number;
  title?: string | null;
}

export interface PaceRecordTermSummary {
  id: string;
  name: string;
  order: number;
  academicYearName: string;
}

export interface PaceRecordGradeSummary {
  id: string;
  score: number;
  feedback?: string | null;
  status: PaceGradeStatus;
  gradedAt: string;
  updatedAt: string;
}

export interface PaceRecordSummary {
  id: string;
  student: PaceRecordPersonSummary;
  class: PaceRecordClassSummary;
  subject: PaceRecordSubjectSummary;
  pace: PaceRecordPaceSummary;
  academicTerm: PaceRecordTermSummary;
  status: PaceProgressStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  grade?: PaceRecordGradeSummary | null;
}

export interface TeacherPaceWorkspace {
  activeTerm?: PaceRecordTermSummary | null;
  records: PaceRecordSummary[];
  needsReconcile: boolean;
  missingRecordsCount: number;
  goals: TeacherPaceGoalSummary[];
  availableGoals: TeacherPaceGoalCandidate[];
}

export interface TeacherPaceGoalSummary {
  student: PaceRecordPersonSummary;
  class: PaceRecordClassSummary;
  subject: PaceRecordSubjectSummary;
  targetPaces: number;
  startingPaceNumber: number;
  availablePaces: number;
}

export interface TeacherPaceGoalCandidate {
  student: PaceRecordPersonSummary;
  class: PaceRecordClassSummary;
  subject: PaceRecordSubjectSummary;
  availablePaces: number;
}

export interface SetStudentPaceGoalRequest {
  studentId: string;
  classSubjectId: string;
  targetPaces: number;
  startingPaceNumber: number;
}

export interface PaceReconciliationResult {
  createdCount: number;
  existingCount: number;
  skippedCount: number;
}

export interface UpdatePaceStatusRequest {
  status: PaceProgressStatus;
}

export interface GradePaceRequest {
  score: number;
  feedback?: string;
}

export interface UpdatePaceGradeRequest {
  score?: number;
  feedback?: string;
  status?: PaceGradeStatus;
}
