CREATE TYPE "ClassAssignmentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TYPE "ClassSubmissionStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'RETURNED', 'GRADED');
CREATE TYPE "ClassMaterialKind" AS ENUM ('FILE', 'LINK');

CREATE TABLE "ClassWallPost" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassWallPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassWallComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassWallComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassAssignment" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3),
  "points" INTEGER,
  "submissionType" TEXT,
  "status" "ClassAssignmentStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassSubmission" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "body" TEXT,
  "fileName" TEXT,
  "mimeType" TEXT,
  "storageKey" TEXT,
  "status" "ClassSubmissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "submittedAt" TIMESTAMP(3),
  "score" DOUBLE PRECISION,
  "feedback" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassSubmission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassMaterial" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "ClassMaterialKind" NOT NULL DEFAULT 'FILE',
  "mimeType" TEXT,
  "sizeBytes" INTEGER,
  "storageKey" TEXT,
  "externalUrl" TEXT,
  "visibleToStudents" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClassMaterial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClassWallPost_classId_createdAt_idx" ON "ClassWallPost"("classId", "createdAt");
CREATE INDEX "ClassWallComment_postId_createdAt_idx" ON "ClassWallComment"("postId", "createdAt");
CREATE INDEX "ClassAssignment_classId_status_dueAt_idx" ON "ClassAssignment"("classId", "status", "dueAt");
CREATE UNIQUE INDEX "ClassSubmission_assignmentId_studentId_key" ON "ClassSubmission"("assignmentId", "studentId");
CREATE INDEX "ClassSubmission_studentId_status_idx" ON "ClassSubmission"("studentId", "status");
CREATE INDEX "ClassMaterial_classId_createdAt_idx" ON "ClassMaterial"("classId", "createdAt");

ALTER TABLE "ClassWallPost" ADD CONSTRAINT "ClassWallPost_classId_fkey" FOREIGN KEY ("classId") REFERENCES "AcademicClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassWallPost" ADD CONSTRAINT "ClassWallPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassWallComment" ADD CONSTRAINT "ClassWallComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ClassWallPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassWallComment" ADD CONSTRAINT "ClassWallComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "AcademicClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassAssignment" ADD CONSTRAINT "ClassAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSubmission" ADD CONSTRAINT "ClassSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ClassAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSubmission" ADD CONSTRAINT "ClassSubmission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassMaterial" ADD CONSTRAINT "ClassMaterial_classId_fkey" FOREIGN KEY ("classId") REFERENCES "AcademicClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassMaterial" ADD CONSTRAINT "ClassMaterial_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
