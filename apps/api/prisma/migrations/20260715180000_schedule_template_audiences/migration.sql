CREATE TYPE "ScheduleAudienceType" AS ENUM ('GRADE', 'CLASS', 'TEACHER');

ALTER TABLE "ScheduleTemplate"
  ADD COLUMN "audienceType" "ScheduleAudienceType" NOT NULL DEFAULT 'GRADE',
  ADD COLUMN "classId" TEXT,
  ADD COLUMN "teacherId" TEXT,
  ALTER COLUMN "gradeLevelId" DROP NOT NULL;

CREATE TABLE "ScheduleTemplateSubject" (
  "templateId" TEXT NOT NULL,
  "classSubjectId" TEXT NOT NULL,
  CONSTRAINT "ScheduleTemplateSubject_pkey" PRIMARY KEY ("templateId", "classSubjectId")
);

CREATE UNIQUE INDEX "ScheduleTemplate_academicYearId_classId_key" ON "ScheduleTemplate"("academicYearId", "classId");
CREATE UNIQUE INDEX "ScheduleTemplate_academicYearId_teacherId_key" ON "ScheduleTemplate"("academicYearId", "teacherId");
CREATE INDEX "ScheduleTemplate_audienceType_idx" ON "ScheduleTemplate"("audienceType");
CREATE INDEX "ScheduleTemplateSubject_classSubjectId_idx" ON "ScheduleTemplateSubject"("classSubjectId");

ALTER TABLE "ScheduleTemplate" ADD CONSTRAINT "ScheduleTemplate_classId_fkey" FOREIGN KEY ("classId") REFERENCES "AcademicClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplate" ADD CONSTRAINT "ScheduleTemplate_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplateSubject" ADD CONSTRAINT "ScheduleTemplateSubject_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ScheduleTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplateSubject" ADD CONSTRAINT "ScheduleTemplateSubject_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;