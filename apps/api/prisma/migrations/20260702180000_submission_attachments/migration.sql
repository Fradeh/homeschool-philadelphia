CREATE TABLE "ClassSubmissionAttachment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassSubmissionAttachment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassSubmissionAttachment_storageKey_key"
ON "ClassSubmissionAttachment"("storageKey");

CREATE INDEX "ClassSubmissionAttachment_submissionId_createdAt_idx"
ON "ClassSubmissionAttachment"("submissionId", "createdAt");

ALTER TABLE "ClassSubmissionAttachment"
ADD CONSTRAINT "ClassSubmissionAttachment_submissionId_fkey"
FOREIGN KEY ("submissionId") REFERENCES "ClassSubmission"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ClassSubmissionAttachment" (
    "id", "submissionId", "fileName", "mimeType", "storageKey", "createdAt"
)
SELECT
    (
      substr(md5("id" || "storageKey"), 1, 8) || '-' ||
      substr(md5("id" || "storageKey"), 9, 4) || '-' ||
      substr(md5("id" || "storageKey"), 13, 4) || '-' ||
      substr(md5("id" || "storageKey"), 17, 4) || '-' ||
      substr(md5("id" || "storageKey"), 21, 12)
    ),
    "id",
    COALESCE("fileName", 'entrega'),
    COALESCE("mimeType", 'application/octet-stream'),
    "storageKey",
    COALESCE("submittedAt", "createdAt")
FROM "ClassSubmission"
WHERE "storageKey" IS NOT NULL;
