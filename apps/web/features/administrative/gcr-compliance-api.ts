import { apiRequest } from "@/lib/api-client";

export type GcrComplianceTimingState = "ON_TIME" | "LATE" | "PENDING" | "OVERDUE";

export interface GcrComplianceRow {
  reportId: string | null;
  date: string;
  timingState: GcrComplianceTimingState;
  status: string | null;
  submittedAt: string | null;
  firstSubmittedAt: string | null;
  updatedAt: string | null;
  isLate: boolean;
  hasPostCloseChanges: boolean;
  missingFields: Array<{ code: string }>;
  teacher: { id: string; userId: string; displayName: string };
  class: { id: string; name: string; code: string; gradeName: string | null };
  student: { id: string; studentCode: string; displayName: string };
  audit: Array<{
    id: string;
    action: string;
    entityType: string;
    reason: string | null;
    createdAt: string;
    actorName: string;
  }>;
}

export interface GcrComplianceResponse {
  date: string;
  generatedAt: string;
  deadlinePassed: boolean;
  isInstructionalDay: boolean;
  metrics: {
    expected: number;
    onTime: number;
    late: number;
    pending: number;
    overdue: number;
    postCloseModified: number;
  };
  configurationIssues: Array<{ classId: string; className: string; issue: string }>;
  rows: GcrComplianceRow[];
}

export function getGcrCompliance(date: string) {
  return apiRequest<GcrComplianceResponse>(
    `/gcr/administrative/compliance?date=${encodeURIComponent(date)}`
  );
}
