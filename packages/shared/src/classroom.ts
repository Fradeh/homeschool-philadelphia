export enum ClassAssignmentStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CLOSED = "CLOSED"
}

export enum ClassSubmissionStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
  RETURNED = "RETURNED",
  GRADED = "GRADED"
}

export interface ClassroomPerson {
  id: string;
  profileId?: string;
  displayName: string;
  email: string;
}

export interface ClassWallCommentSummary {
  id: string;
  content: string;
  createdAt: string;
  author: ClassroomPerson;
}

export interface ClassWallPostSummary {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: ClassroomPerson;
  comments: ClassWallCommentSummary[];
}

export interface ClassSubmissionSummary {
  id: string;
  status: ClassSubmissionStatus;
  body?: string | null;
  fileName?: string | null;
  submittedAt?: string | null;
  score?: number | null;
  feedback?: string | null;
  attachments: ClassSubmissionAttachmentSummary[];
  student: ClassroomPerson;
}

export interface ClassSubmissionAttachmentSummary {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes?: number | null;
  createdAt: string;
  downloadUrl: string;
}

export interface GradeClassSubmissionRequest {
  score: number;
  feedback?: string;
}

export interface ClassAssignmentSummary {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  title: string;
  description: string;
  dueAt?: string | null;
  points?: number | null;
  submissionType?: string | null;
  status: ClassAssignmentStatus;
  attachments: ClassAssignmentAttachmentSummary[];
  submissions: ClassSubmissionSummary[];
  mySubmission?: ClassSubmissionSummary | null;
  createdAt: string;
}

export interface ClassAssignmentAttachmentSummary {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes?: number | null;
  createdAt: string;
  downloadUrl: string;
}

export interface ClassMaterialSummary {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  name: string;
  kind: "FILE" | "LINK";
  mimeType?: string | null;
  sizeBytes?: number | null;
  externalUrl?: string | null;
  downloadUrl?: string | null;
  visibleToStudents: boolean;
  isImportant: boolean;
  createdAt: string;
  uploadedBy: ClassroomPerson;
}

export interface ClassroomWorkspace {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  color?: string | null;
  gradeName?: string | null;
  teachers: ClassroomPerson[];
  students: ClassroomPerson[];
  subjects: Array<{ id: string; name: string; shortName: string; color?: string | null }>;
  wall: ClassWallPostSummary[];
  assignments: ClassAssignmentSummary[];
  materials: ClassMaterialSummary[];
}

export interface ClassroomClassSummary {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  color?: string | null;
  gradeName?: string | null;
  teachers: Array<{ id: string; displayName: string }>;
  subjects: Array<{ id: string; name: string; shortName: string; color?: string | null }>;
  studentCount: number;
  assignmentCount: number;
  materialCount: number;
  wallPostCount: number;
  pendingAssignmentsCount: number;
  latestActivity?: {
    kind: "WALL" | "ASSIGNMENT" | "MATERIAL";
    title: string;
    createdAt: string;
  } | null;
}

export interface ConversationContact {
  profileId: string;
  userId: string;
  displayName: string;
  email: string;
  type: "STUDENT" | "TEACHER";
  classNames: string[];
}
