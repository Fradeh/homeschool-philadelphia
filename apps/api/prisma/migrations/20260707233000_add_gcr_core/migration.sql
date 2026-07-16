CREATE TYPE "GcrReportStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED_ON_TIME',
    'SUBMITTED_LATE',
    'INCOMPLETE',
    'MODIFIED_POST_CLOSE',
    'VOIDED'
);

CREATE TYPE "GcrAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY');

CREATE TYPE "GcrTaskCompletionStatus" AS ENUM ('COMPLETED', 'NOT_COMPLETED');

CREATE TYPE "GcrAuditAction" AS ENUM (
    'CREATED',
    'UPDATED',
    'SUBMITTED',
    'POST_CLOSE_UPDATED',
    'VOIDED'
);

CREATE TABLE "GcrReport" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicTermId" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "responsibleTeacherId" TEXT NOT NULL,
    "status" "GcrReportStatus" NOT NULL DEFAULT 'DRAFT',
    "generalComment" TEXT,
    "missingFields" JSONB,
    "submittedAt" TIMESTAMP(3),
    "submittedById" TEXT,
    "firstSubmittedAt" TIMESTAMP(3),
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "hasPostCloseChanges" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidReason" TEXT,

    CONSTRAINT "GcrReport_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GcrReport_version_check" CHECK ("version" >= 1),
    CONSTRAINT "GcrReport_submission_actor_check" CHECK (
        ("submittedAt" IS NULL AND "submittedById" IS NULL) OR
        ("submittedAt" IS NOT NULL AND "submittedById" IS NOT NULL)
    ),
    CONSTRAINT "GcrReport_first_submission_check" CHECK (
        "firstSubmittedAt" IS NULL OR
        ("submittedAt" IS NOT NULL AND "firstSubmittedAt" <= "submittedAt")
    ),
    CONSTRAINT "GcrReport_void_check" CHECK (
        ("voidedAt" IS NULL AND "voidedById" IS NULL AND "voidReason" IS NULL) OR
        ("voidedAt" IS NOT NULL AND "voidedById" IS NOT NULL AND length(btrim("voidReason")) > 0)
    )
);

CREATE TABLE "GcrAttendance" (
    "reportId" TEXT NOT NULL,
    "status" "GcrAttendanceStatus" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "GcrAttendance_pkey" PRIMARY KEY ("reportId")
);

CREATE TABLE "GcrSubjectTask" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,
    "homeworkAssigned" BOOLEAN NOT NULL DEFAULT false,
    "completionStatus" "GcrTaskCompletionStatus",
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "GcrSubjectTask_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GcrSubjectTask_completion_check" CHECK (
        "homeworkAssigned" OR "completionStatus" IS NULL
    )
);

CREATE TABLE "GcrVerse" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicTermId" TEXT NOT NULL,
    "classSubjectId" TEXT,
    "slot" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "text" TEXT,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "GcrVerse_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GcrVerse_slot_check" CHECK ("slot" BETWEEN 1 AND 3),
    CONSTRAINT "GcrVerse_score_check" CHECK ("score" BETWEEN 0 AND 100),
    CONSTRAINT "GcrVerse_reference_check" CHECK (length(btrim("reference")) > 0)
);

CREATE TABLE "GcrMerit" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "benefit" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPostClose" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidReason" TEXT,

    CONSTRAINT "GcrMerit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GcrMerit_comment_check" CHECK (length(btrim("comment")) > 0),
    CONSTRAINT "GcrMerit_void_check" CHECK (
        ("voidedAt" IS NULL AND "voidedById" IS NULL AND "voidReason" IS NULL) OR
        ("voidedAt" IS NOT NULL AND "voidedById" IS NOT NULL AND length(btrim("voidReason")) > 0)
    )
);

CREATE TABLE "GcrDemerit" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPostClose" BOOLEAN NOT NULL DEFAULT false,
    "detentionRequired" BOOLEAN NOT NULL DEFAULT false,
    "detentionDate" DATE,
    "createdById" TEXT NOT NULL,
    "voidedAt" TIMESTAMP(3),
    "voidedById" TEXT,
    "voidReason" TEXT,

    CONSTRAINT "GcrDemerit_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GcrDemerit_ordinal_check" CHECK ("ordinal" BETWEEN 1 AND 3),
    CONSTRAINT "GcrDemerit_comment_check" CHECK (length(btrim("comment")) > 0),
    CONSTRAINT "GcrDemerit_detention_check" CHECK (
        (NOT "detentionRequired" AND "detentionDate" IS NULL) OR
        ("detentionRequired" AND "ordinal" = 3 AND "detentionDate" IS NOT NULL)
    ),
    CONSTRAINT "GcrDemerit_void_check" CHECK (
        ("voidedAt" IS NULL AND "voidedById" IS NULL AND "voidReason" IS NULL) OR
        ("voidedAt" IS NOT NULL AND "voidedById" IS NOT NULL AND length(btrim("voidReason")) > 0)
    )
);

CREATE TABLE "GcrAuditEvent" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "GcrAuditAction" NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "actorId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "GcrAuditEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GcrAuditEvent_entity_check" CHECK (
        length(btrim("entityType")) > 0 AND length(btrim("entityId")) > 0
    )
);

CREATE UNIQUE INDEX "GcrReport_studentId_classId_reportDate_key"
ON "GcrReport"("studentId", "classId", "reportDate");
CREATE INDEX "GcrReport_reportDate_status_idx" ON "GcrReport"("reportDate", "status");
CREATE INDEX "GcrReport_responsibleTeacherId_reportDate_status_idx"
ON "GcrReport"("responsibleTeacherId", "reportDate", "status");
CREATE INDEX "GcrReport_classId_reportDate_idx" ON "GcrReport"("classId", "reportDate");

CREATE UNIQUE INDEX "GcrSubjectTask_reportId_classSubjectId_key"
ON "GcrSubjectTask"("reportId", "classSubjectId");
CREATE INDEX "GcrSubjectTask_classSubjectId_idx" ON "GcrSubjectTask"("classSubjectId");

CREATE UNIQUE INDEX "GcrVerse_studentId_academicTermId_slot_key"
ON "GcrVerse"("studentId", "academicTermId", "slot");
CREATE INDEX "GcrVerse_reportId_idx" ON "GcrVerse"("reportId");
CREATE INDEX "GcrVerse_classSubjectId_idx" ON "GcrVerse"("classSubjectId");

CREATE INDEX "GcrMerit_reportId_occurredAt_idx" ON "GcrMerit"("reportId", "occurredAt");
CREATE UNIQUE INDEX "GcrDemerit_reportId_ordinal_key" ON "GcrDemerit"("reportId", "ordinal");
CREATE INDEX "GcrAuditEvent_reportId_createdAt_idx" ON "GcrAuditEvent"("reportId", "createdAt");
CREATE INDEX "GcrAuditEvent_entityType_entityId_idx" ON "GcrAuditEvent"("entityType", "entityId");

ALTER TABLE "GcrReport" ADD CONSTRAINT "GcrReport_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrReport" ADD CONSTRAINT "GcrReport_classId_fkey"
FOREIGN KEY ("classId") REFERENCES "AcademicClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrReport" ADD CONSTRAINT "GcrReport_academicTermId_fkey"
FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrReport" ADD CONSTRAINT "GcrReport_responsibleTeacherId_fkey"
FOREIGN KEY ("responsibleTeacherId") REFERENCES "TeacherProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrReport" ADD CONSTRAINT "GcrReport_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrReport" ADD CONSTRAINT "GcrReport_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrReport" ADD CONSTRAINT "GcrReport_submittedById_fkey"
FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrReport" ADD CONSTRAINT "GcrReport_voidedById_fkey"
FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GcrAttendance" ADD CONSTRAINT "GcrAttendance_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "GcrReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrAttendance" ADD CONSTRAINT "GcrAttendance_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrAttendance" ADD CONSTRAINT "GcrAttendance_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GcrSubjectTask" ADD CONSTRAINT "GcrSubjectTask_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "GcrReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrSubjectTask" ADD CONSTRAINT "GcrSubjectTask_classSubjectId_fkey"
FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrSubjectTask" ADD CONSTRAINT "GcrSubjectTask_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrSubjectTask" ADD CONSTRAINT "GcrSubjectTask_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GcrVerse" ADD CONSTRAINT "GcrVerse_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "GcrReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrVerse" ADD CONSTRAINT "GcrVerse_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrVerse" ADD CONSTRAINT "GcrVerse_academicTermId_fkey"
FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrVerse" ADD CONSTRAINT "GcrVerse_classSubjectId_fkey"
FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrVerse" ADD CONSTRAINT "GcrVerse_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrVerse" ADD CONSTRAINT "GcrVerse_updatedById_fkey"
FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GcrMerit" ADD CONSTRAINT "GcrMerit_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "GcrReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrMerit" ADD CONSTRAINT "GcrMerit_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrMerit" ADD CONSTRAINT "GcrMerit_voidedById_fkey"
FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GcrDemerit" ADD CONSTRAINT "GcrDemerit_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "GcrReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrDemerit" ADD CONSTRAINT "GcrDemerit_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrDemerit" ADD CONSTRAINT "GcrDemerit_voidedById_fkey"
FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "GcrAuditEvent" ADD CONSTRAINT "GcrAuditEvent_reportId_fkey"
FOREIGN KEY ("reportId") REFERENCES "GcrReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GcrAuditEvent" ADD CONSTRAINT "GcrAuditEvent_actorId_fkey"
FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION "prevent_gcr_audit_event_mutation"() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'GcrAuditEvent is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "GcrAuditEvent_append_only"
BEFORE UPDATE OR DELETE ON "GcrAuditEvent"
FOR EACH ROW EXECUTE FUNCTION "prevent_gcr_audit_event_mutation"();
