-- Subjects are registered independently; PACE management is enabled per subject.
ALTER TABLE "Subject"
ADD COLUMN "paceEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Preserve subjects registered through the previous PACEs catalog.
UPDATE "Subject" SET "paceEnabled" = true;

CREATE INDEX "Subject_paceEnabled_idx" ON "Subject"("paceEnabled");
