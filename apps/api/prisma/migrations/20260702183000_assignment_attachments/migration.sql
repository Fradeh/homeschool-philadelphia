CREATE TABLE "ClassAssignmentAttachment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassAssignmentAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassAssignmentAttachment_storageKey_key"
ON "ClassAssignmentAttachment"("storageKey");

CREATE INDEX "ClassAssignmentAttachment_assignmentId_createdAt_idx"
ON "ClassAssignmentAttachment"("assignmentId", "createdAt");

ALTER TABLE "ClassAssignmentAttachment"
ADD CONSTRAINT "ClassAssignmentAttachment_assignmentId_fkey"
FOREIGN KEY ("assignmentId") REFERENCES "ClassAssignment"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
