-- Keep existing progress while moving PACE numbering from the admin catalog to each student plan.
ALTER TABLE "StudentPaceGoal"
ADD COLUMN "startingPaceNumber" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "StudentPaceRecord"
ADD COLUMN "paceNumber" INTEGER;

UPDATE "StudentPaceRecord" AS record
SET "paceNumber" = pace."number"
FROM "Pace" AS pace
WHERE record."paceId" = pace."id";

ALTER TABLE "StudentPaceRecord"
ALTER COLUMN "paceNumber" SET NOT NULL,
ALTER COLUMN "paceId" DROP NOT NULL;

ALTER TABLE "StudentPaceRecord"
DROP CONSTRAINT "StudentPaceRecord_paceId_fkey";

ALTER TABLE "StudentPaceRecord"
ADD CONSTRAINT "StudentPaceRecord_paceId_fkey"
FOREIGN KEY ("paceId") REFERENCES "Pace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

DROP INDEX "StudentPaceRecord_studentId_classSubjectId_paceId_academicTermId_key";

CREATE UNIQUE INDEX "StudentPaceRecord_studentId_classSubjectId_paceNumber_academicTermId_key"
ON "StudentPaceRecord"("studentId", "classSubjectId", "paceNumber", "academicTermId");

-- Existing goals inherit the first PACE already assigned to the student when available.
UPDATE "StudentPaceGoal" AS goal
SET "startingPaceNumber" = first_record."paceNumber"
FROM (
  SELECT "studentId", "classSubjectId", "academicTermId", MIN("paceNumber") AS "paceNumber"
  FROM "StudentPaceRecord"
  GROUP BY "studentId", "classSubjectId", "academicTermId"
) AS first_record
WHERE goal."studentId" = first_record."studentId"
  AND goal."classSubjectId" = first_record."classSubjectId"
  AND goal."academicTermId" = first_record."academicTermId";
