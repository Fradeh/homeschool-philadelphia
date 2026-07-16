CREATE TABLE "StudentPaceGoal" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classSubjectId" TEXT NOT NULL,
    "academicTermId" TEXT NOT NULL,
    "targetPaces" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPaceGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentPaceGoal_studentId_classSubjectId_academicTermId_key"
ON "StudentPaceGoal"("studentId", "classSubjectId", "academicTermId");

CREATE INDEX "StudentPaceGoal_studentId_academicTermId_idx"
ON "StudentPaceGoal"("studentId", "academicTermId");

CREATE INDEX "StudentPaceGoal_classSubjectId_academicTermId_idx"
ON "StudentPaceGoal"("classSubjectId", "academicTermId");

ALTER TABLE "StudentPaceGoal"
ADD CONSTRAINT "StudentPaceGoal_studentId_fkey"
FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentPaceGoal"
ADD CONSTRAINT "StudentPaceGoal_classSubjectId_fkey"
FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentPaceGoal"
ADD CONSTRAINT "StudentPaceGoal_academicTermId_fkey"
FOREIGN KEY ("academicTermId") REFERENCES "AcademicTerm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "StudentPaceGoal" (
  "id", "studentId", "classSubjectId", "academicTermId", "targetPaces", "createdAt", "updatedAt"
)
SELECT
  md5("studentId" || ':' || "classSubjectId" || ':' || "academicTermId"),
  "studentId",
  "classSubjectId",
  "academicTermId",
  COUNT(*)::INTEGER,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "StudentPaceRecord"
GROUP BY "studentId", "classSubjectId", "academicTermId"
ON CONFLICT ("studentId", "classSubjectId", "academicTermId") DO NOTHING;
