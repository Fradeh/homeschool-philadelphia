CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY');
CREATE TYPE "SchedulePeriodKind" AS ENUM ('INSTRUCTIONAL', 'BREAK');
CREATE TYPE "ScheduleTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "ScheduleBlockKind" AS ENUM ('SUBJECT', 'PACES', 'ACTIVITY', 'EMPTY');
CREATE TYPE "PhysicalBookingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "GradeLevel" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GradeLevel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClassSubjectTeacher" (
  "classSubjectId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClassSubjectTeacher_pkey" PRIMARY KEY ("classSubjectId", "teacherId")
);

CREATE TABLE "ScheduleGrid" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduleGrid_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchedulePeriod" (
  "id" TEXT NOT NULL,
  "gridId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "kind" "SchedulePeriodKind" NOT NULL DEFAULT 'INSTRUCTIONAL',
  "label" TEXT,
  CONSTRAINT "SchedulePeriod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduleTemplate" (
  "id" TEXT NOT NULL,
  "academicYearId" TEXT NOT NULL,
  "gradeLevelId" TEXT NOT NULL,
  "gridId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "status" "ScheduleTemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduleTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduleTemplateBlock" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "periodId" TEXT NOT NULL,
  "weekday" "Weekday" NOT NULL,
  "kind" "ScheduleBlockKind" NOT NULL,
  "label" TEXT,
  "classSubjectId" TEXT,
  "teacherId" TEXT,
  CONSTRAINT "ScheduleTemplateBlock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeacherAvailabilitySlot" (
  "id" TEXT NOT NULL,
  "classSubjectId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "weekday" "Weekday" NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "location" TEXT,
  "instructions" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TeacherAvailabilitySlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentPhysicalBooking" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "classSubjectId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "availabilitySlotId" TEXT NOT NULL,
  "scheduledDate" DATE NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "status" "PhysicalBookingStatus" NOT NULL DEFAULT 'PENDING',
  "studentNote" TEXT,
  "teacherResponse" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentPhysicalBooking_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "StudentProfile" ADD COLUMN "gradeLevelId" TEXT;
ALTER TABLE "AcademicClass" ADD COLUMN "gradeLevelId" TEXT;

CREATE UNIQUE INDEX "GradeLevel_code_key" ON "GradeLevel"("code");
CREATE UNIQUE INDEX "GradeLevel_sortOrder_key" ON "GradeLevel"("sortOrder");
CREATE INDEX "GradeLevel_isActive_idx" ON "GradeLevel"("isActive");
CREATE INDEX "StudentProfile_gradeLevelId_idx" ON "StudentProfile"("gradeLevelId");
CREATE INDEX "AcademicClass_gradeLevelId_idx" ON "AcademicClass"("gradeLevelId");
CREATE INDEX "ClassSubjectTeacher_teacherId_idx" ON "ClassSubjectTeacher"("teacherId");
CREATE UNIQUE INDEX "ScheduleGrid_version_key" ON "ScheduleGrid"("version");
CREATE INDEX "ScheduleGrid_isActive_idx" ON "ScheduleGrid"("isActive");
CREATE UNIQUE INDEX "SchedulePeriod_gridId_order_key" ON "SchedulePeriod"("gridId", "order");
CREATE UNIQUE INDEX "SchedulePeriod_gridId_startTime_endTime_key" ON "SchedulePeriod"("gridId", "startTime", "endTime");
CREATE UNIQUE INDEX "ScheduleTemplate_academicYearId_gradeLevelId_key" ON "ScheduleTemplate"("academicYearId", "gradeLevelId");
CREATE INDEX "ScheduleTemplate_status_idx" ON "ScheduleTemplate"("status");
CREATE UNIQUE INDEX "ScheduleTemplateBlock_templateId_weekday_periodId_key" ON "ScheduleTemplateBlock"("templateId", "weekday", "periodId");
CREATE INDEX "ScheduleTemplateBlock_teacherId_weekday_periodId_idx" ON "ScheduleTemplateBlock"("teacherId", "weekday", "periodId");
CREATE INDEX "ScheduleTemplateBlock_classSubjectId_idx" ON "ScheduleTemplateBlock"("classSubjectId");
CREATE UNIQUE INDEX "TeacherAvailabilitySlot_classSubjectId_teacherId_weekday_startTime_endTime_key" ON "TeacherAvailabilitySlot"("classSubjectId", "teacherId", "weekday", "startTime", "endTime");
CREATE INDEX "TeacherAvailabilitySlot_teacherId_isActive_idx" ON "TeacherAvailabilitySlot"("teacherId", "isActive");
CREATE UNIQUE INDEX "StudentPhysicalBooking_studentId_classSubjectId_scheduledDate_startTime_key" ON "StudentPhysicalBooking"("studentId", "classSubjectId", "scheduledDate", "startTime");
CREATE INDEX "StudentPhysicalBooking_studentId_status_idx" ON "StudentPhysicalBooking"("studentId", "status");
CREATE INDEX "StudentPhysicalBooking_teacherId_status_idx" ON "StudentPhysicalBooking"("teacherId", "status");
CREATE INDEX "StudentPhysicalBooking_scheduledDate_idx" ON "StudentPhysicalBooking"("scheduledDate");

ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "GradeLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AcademicClass" ADD CONSTRAINT "AcademicClass_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "GradeLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ClassSubjectTeacher" ADD CONSTRAINT "ClassSubjectTeacher_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClassSubjectTeacher" ADD CONSTRAINT "ClassSubjectTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SchedulePeriod" ADD CONSTRAINT "SchedulePeriod_gridId_fkey" FOREIGN KEY ("gridId") REFERENCES "ScheduleGrid"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplate" ADD CONSTRAINT "ScheduleTemplate_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplate" ADD CONSTRAINT "ScheduleTemplate_gradeLevelId_fkey" FOREIGN KEY ("gradeLevelId") REFERENCES "GradeLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplate" ADD CONSTRAINT "ScheduleTemplate_gridId_fkey" FOREIGN KEY ("gridId") REFERENCES "ScheduleGrid"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplateBlock" ADD CONSTRAINT "ScheduleTemplateBlock_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ScheduleTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplateBlock" ADD CONSTRAINT "ScheduleTemplateBlock_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "SchedulePeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplateBlock" ADD CONSTRAINT "ScheduleTemplateBlock_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduleTemplateBlock" ADD CONSTRAINT "ScheduleTemplateBlock_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeacherAvailabilitySlot" ADD CONSTRAINT "TeacherAvailabilitySlot_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherAvailabilitySlot" ADD CONSTRAINT "TeacherAvailabilitySlot_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentPhysicalBooking" ADD CONSTRAINT "StudentPhysicalBooking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentPhysicalBooking" ADD CONSTRAINT "StudentPhysicalBooking_classSubjectId_fkey" FOREIGN KEY ("classSubjectId") REFERENCES "ClassSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentPhysicalBooking" ADD CONSTRAINT "StudentPhysicalBooking_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "TeacherProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentPhysicalBooking" ADD CONSTRAINT "StudentPhysicalBooking_availabilitySlotId_fkey" FOREIGN KEY ("availabilitySlotId") REFERENCES "TeacherAvailabilitySlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve existing free-text student grades while new records use normalized relations.
INSERT INTO "GradeLevel" ("id", "code", "name", "sortOrder", "updatedAt")
SELECT 'legacy-grade-' || md5(source.code), source.code, source.name, row_number() OVER (ORDER BY source.code), CURRENT_TIMESTAMP
FROM (
  SELECT upper(trim("gradeLevel")) AS code, min(trim("gradeLevel")) AS name
  FROM "StudentProfile"
  WHERE "gradeLevel" IS NOT NULL AND trim("gradeLevel") <> ''
  GROUP BY upper(trim("gradeLevel"))
) source;

UPDATE "StudentProfile" student
SET "gradeLevelId" = grade."id"
FROM "GradeLevel" grade
WHERE student."gradeLevel" IS NOT NULL AND upper(trim(student."gradeLevel")) = grade."code";

INSERT INTO "ScheduleGrid" ("id", "name", "version", "isActive", "updatedAt")
VALUES ('institutional-grid-v1', 'Horario institucional', 1, true, CURRENT_TIMESTAMP);

INSERT INTO "SchedulePeriod" ("id", "gridId", "order", "startTime", "endTime", "kind", "label") VALUES
('period-01', 'institutional-grid-v1', 1, '07:30', '07:50', 'INSTRUCTIONAL', NULL),
('period-02', 'institutional-grid-v1', 2, '07:50', '08:30', 'INSTRUCTIONAL', NULL),
('period-03', 'institutional-grid-v1', 3, '08:30', '09:10', 'INSTRUCTIONAL', NULL),
('period-04', 'institutional-grid-v1', 4, '09:10', '09:50', 'INSTRUCTIONAL', NULL),
('period-05', 'institutional-grid-v1', 5, '09:50', '10:30', 'BREAK', 'BREAK'),
('period-06', 'institutional-grid-v1', 6, '10:30', '11:10', 'INSTRUCTIONAL', NULL),
('period-07', 'institutional-grid-v1', 7, '11:10', '11:50', 'INSTRUCTIONAL', NULL),
('period-08', 'institutional-grid-v1', 8, '11:50', '12:30', 'INSTRUCTIONAL', NULL),
('period-09', 'institutional-grid-v1', 9, '12:30', '13:20', 'BREAK', 'BREAK'),
('period-10', 'institutional-grid-v1', 10, '13:20', '14:00', 'INSTRUCTIONAL', NULL),
('period-11', 'institutional-grid-v1', 11, '14:00', '14:30', 'INSTRUCTIONAL', NULL);
