require("reflect-metadata");
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { plainToInstance } = require("class-transformer");
const { validate } = require("class-validator");
const { UpsertGcrVerseDto, UpsertGcrSubjectTaskDto } = require("../src/modules/gcr/dto/gcr.dto");
const { GcrService } = require("../src/modules/gcr/gcr.service");
const { isLateSubmission, panamaDeadline } = require("../src/modules/gcr/gcr-time");

test("GCR deadline uses 10:00 America/Panama", () => {
  assert.equal(panamaDeadline("2026-07-07").toISOString(), "2026-07-07T15:00:00.000Z");
  assert.equal(isLateSubmission("2026-07-07", new Date("2026-07-07T14:59:59.999Z")), false);
  assert.equal(isLateSubmission("2026-07-07", new Date("2026-07-07T15:00:00.001Z")), true);
});

test("GCR DTO rejects invalid verse slot and score", async () => {
  const dto = plainToInstance(UpsertGcrVerseDto, {
    version: 1,
    slot: 4,
    reference: "John 3:16",
    score: 101
  });
  const errors = await validate(dto);
  assert.deepEqual(new Set(errors.map((error) => error.property)), new Set(["slot", "score"]));
});

test("GCR task rejects completion when no homework is assigned", async () => {
  const service = new GcrService({});
  const dto = plainToInstance(UpsertGcrSubjectTaskDto, {
    homeworkAssigned: false,
    completionStatus: "COMPLETED"
  });
  await assert.rejects(
    () => service.upsertSubjectTask("user", "report", "subject", dto),
    /completionStatus must be null/
  );
});

const e2eEnabled = process.env.RUN_GCR_E2E === "1" && Boolean(process.env.TEST_DATABASE_URL);

test(
  "Teacher GCR API enforces assignments and persists idempotent drafts and submissions",
  { skip: !e2eEnabled, timeout: 120_000 },
  async () => {
    const schemaName = `gcr_api_${process.pid}_${Date.now()}`;
    const databaseUrl = withSchema(process.env.TEST_DATABASE_URL, schemaName);
    migrateEmptySchema(databaseUrl);
    process.env.DATABASE_URL = databaseUrl;
    process.env.JWT_SECRET ||= "gcr-test-secret-with-at-least-32-characters";
    process.env.WEB_ORIGIN ||= "http://localhost:3000";
    process.env.NODE_ENV ||= "test";

    const { NestFactory } = require("@nestjs/core");
    const { ValidationPipe } = require("@nestjs/common");
    const { AppModule } = require("../src/app.module");
    const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
    const app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
    );
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address();
    const base = `http://127.0.0.1:${address.port}/api`;

    try {
      const fixture = await createFixture(prisma);
      const login = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: fixture.teacherEmail, password: fixture.password })
      });
      assert.equal(login.status, 201);
      const cookie = login.headers.get("set-cookie").split(";")[0];
      const request = (route, init = {}) =>
        fetch(`${base}${route}`, {
          ...init,
          headers: { "content-type": "application/json", cookie, ...init.headers }
        });

      const classesResponse = await request("/gcr/teacher/filters/classes?date=2026-07-07");
      assert.equal(classesResponse.status, 200);
      const classes = await classesResponse.json();
      assert.deepEqual(
        classes.map((item) => item.id),
        [fixture.assignedClass.id]
      );

      const studentsResponse = await request("/gcr/teacher/filters/students?date=2026-07-07");
      assert.equal(studentsResponse.status, 200);
      const students = await studentsResponse.json();
      assert.deepEqual(
        students.map((item) => item.id),
        [fixture.assignedStudent.id]
      );

      const reportsBefore = await prisma.gcrReport.count();
      const weekResponse = await request(
        `/gcr/teacher/students/${fixture.assignedStudent.id}/week?date=2026-07-07`
      );
      assert.equal(weekResponse.status, 200);
      const week = await weekResponse.json();
      assert.equal(week.days.length, 5);
      assert.ok(week.days.every((day) => day.state === "PENDING"));
      assert.equal(await prisma.gcrReport.count(), reportsBefore);

      const createBody = {
        studentId: fixture.assignedStudent.id,
        reportDate: "2026-07-07"
      };
      const firstCreate = await request("/gcr/teacher/reports", {
        method: "POST",
        body: JSON.stringify(createBody)
      });
      assert.equal(firstCreate.status, 201);
      const firstReport = await firstCreate.json();
      const secondCreate = await request("/gcr/teacher/reports", {
        method: "POST",
        body: JSON.stringify(createBody)
      });
      assert.equal(secondCreate.status, 201);
      assert.equal((await secondCreate.json()).id, firstReport.id);
      assert.equal(
        await prisma.gcrReport.count({
          where: {
            studentId: createBody.studentId,
            classId: fixture.assignedClass.id,
            reportDate: new Date(`${createBody.reportDate}T00:00:00.000Z`)
          }
        }),
        1
      );

      const service = app.get(GcrService);
      await assert.rejects(
        () =>
          service.submit(
            fixture.teacherUser.id,
            firstReport.id,
            firstReport.version,
            new Date("2026-07-07T14:00:00.000Z")
          ),
        (error) => {
          const missing = error.getResponse().missingFields;
          assert.deepEqual(
            missing.map((item) => item.code),
            ["ATTENDANCE_REQUIRED"]
          );
          return true;
        }
      );
      let reportVersion = firstReport.version + 1;

      const attendanceResponse = await request(
        `/gcr/teacher/reports/${firstReport.id}/attendance`,
        {
          method: "PUT",
          body: JSON.stringify({
            status: "PRESENT",
            comment: "On time",
            version: reportVersion,
            postCloseReason: "E2E historical fixture"
          })
        }
      );
      assert.equal(attendanceResponse.status, 200);
      assert.equal((await attendanceResponse.json()).status, "PRESENT");
      reportVersion += 1;

      const foreignReport = await prisma.gcrReport.create({
        data: {
          studentId: fixture.foreignStudent.id,
          classId: fixture.foreignClass.id,
          academicTermId: fixture.term.id,
          reportDate: new Date("2026-07-07T00:00:00.000Z"),
          responsibleTeacherId: fixture.foreignTeacher.id,
          createdById: fixture.foreignTeacherUser.id,
          updatedById: fixture.foreignTeacherUser.id
        }
      });
      const unauthorizedAttendance = await request(
        `/gcr/teacher/reports/${foreignReport.id}/attendance`,
        { method: "PUT", body: JSON.stringify({ status: "PRESENT", version: 1 }) }
      );
      assert.equal(unauthorizedAttendance.status, 403);

      const foreignSubjectTask = await request(
        `/gcr/teacher/reports/${firstReport.id}/subject-tasks/${fixture.foreignClassSubject.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            homeworkAssigned: false,
            version: reportVersion,
            postCloseReason: "E2E historical fixture"
          })
        }
      );
      assert.equal(foreignSubjectTask.status, 403);
      const invalidTask = await request(
        `/gcr/teacher/reports/${firstReport.id}/subject-tasks/${fixture.assignedClassSubject.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            homeworkAssigned: false,
            completionStatus: "COMPLETED",
            version: reportVersion,
            postCloseReason: "E2E historical fixture"
          })
        }
      );
      assert.equal(invalidTask.status, 400);
      const taskResponse = await request(
        `/gcr/teacher/reports/${firstReport.id}/subject-tasks/${fixture.assignedClassSubject.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            homeworkAssigned: true,
            completionStatus: null,
            version: reportVersion,
            postCloseReason: "E2E historical fixture"
          })
        }
      );
      assert.equal(taskResponse.status, 200);
      reportVersion += 1;

      const completedTask = await service.upsertSubjectTask(
        fixture.teacherUser.id,
        firstReport.id,
        fixture.assignedClassSubject.id,
        {
          homeworkAssigned: true,
          completionStatus: "COMPLETED",
          version: reportVersion,
          postCloseReason: "E2E historical fixture"
        }
      );
      assert.equal(completedTask.reportVersion, reportVersion + 1);
      reportVersion += 1;

      const invalidVerseScore = await request(`/gcr/teacher/reports/${firstReport.id}/verse`, {
        method: "PUT",
        body: JSON.stringify({
          slot: 1,
          reference: "John 3:16",
          score: 101,
          version: reportVersion,
          postCloseReason: "E2E historical fixture"
        })
      });
      assert.equal(invalidVerseScore.status, 400);
      const invalidVerseSlot = await request(`/gcr/teacher/reports/${firstReport.id}/verse`, {
        method: "PUT",
        body: JSON.stringify({
          slot: 4,
          reference: "John 3:16",
          score: 95,
          version: reportVersion,
          postCloseReason: "E2E historical fixture"
        })
      });
      assert.equal(invalidVerseSlot.status, 400);
      const verseResponse = await request(`/gcr/teacher/reports/${firstReport.id}/verse`, {
        method: "PUT",
        body: JSON.stringify({
          slot: 1,
          reference: "John 3:16",
          score: 95,
          classSubjectId: fixture.assignedClassSubject.id,
          version: reportVersion,
          postCloseReason: "E2E historical fixture"
        })
      });
      assert.equal(verseResponse.status, 200);
      reportVersion += 1;

      for (const verse of [
        { slot: 2, reference: "Psalm 23:1", score: 96 },
        { slot: 3, reference: "Proverbs 3:5", score: 97 }
      ]) {
        const response = await request(`/gcr/teacher/reports/${firstReport.id}/draft`, {
          method: "PUT",
          body: JSON.stringify({ version: reportVersion, verse })
        });
        assert.equal(response.status, 200);
        reportVersion = (await response.json()).version;
      }
      assert.deepEqual(
        (
          await prisma.gcrVerse.findMany({
            where: { reportId: firstReport.id },
            select: { slot: true, reference: true, score: true },
            orderBy: { slot: "asc" }
          })
        ),
        [
          { slot: 1, reference: "John 3:16", score: 95 },
          { slot: 2, reference: "Psalm 23:1", score: 96 },
          { slot: 3, reference: "Proverbs 3:5", score: 97 }
        ]
      );

      const commentResponse = await request(`/gcr/teacher/reports/${firstReport.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          generalComment: "Good day",
          version: reportVersion,
          postCloseReason: "E2E historical fixture"
        })
      });
      assert.equal(commentResponse.status, 200);
      reportVersion += 1;

      for (const comment of ["First merit", "Second merit"]) {
        const meritResponse = await request(`/gcr/teacher/reports/${firstReport.id}/merits`, {
          method: "POST",
          body: JSON.stringify({
            comment,
            version: reportVersion,
            occurredAt: "2026-07-07T14:00:00.000Z"
          })
        });
        assert.equal(meritResponse.status, 201);
        reportVersion += 1;
      }
      assert.equal(await prisma.gcrMerit.count({ where: { reportId: firstReport.id } }), 2);

      const demeritsResponse = await request(`/gcr/teacher/reports/${firstReport.id}/demerits`, {
        method: "POST",
        body: JSON.stringify({
          occurredAt: "2026-07-07T14:00:00.000Z",
          version: reportVersion,
          demerits: [
            { ordinal: 1, comment: "First warning" },
            { ordinal: 2, comment: "Second warning" }
          ]
        })
      });
      assert.equal(demeritsResponse.status, 201);
      assert.equal((await demeritsResponse.json()).length, 2);
      reportVersion += 1;
      const duplicateDemerit = await request(`/gcr/teacher/reports/${firstReport.id}/demerits`, {
        method: "POST",
        body: JSON.stringify({
          version: reportVersion,
          demerits: [{ ordinal: 1, comment: "Duplicate" }]
        })
      });
      assert.equal(duplicateDemerit.status, 409);

      const wrongStudent = await request("/gcr/teacher/reports", {
        method: "POST",
        body: JSON.stringify({ ...createBody, studentId: fixture.foreignStudent.id })
      });
      assert.equal(wrongStudent.status, 403);
      const onTime = await service.submit(
        fixture.teacherUser.id,
        firstReport.id,
        reportVersion,
        new Date("2026-07-07T14:59:00.000Z")
      );
      reportVersion += 1;
      assert.equal(onTime.status, "SUBMITTED_ON_TIME");
      assert.equal(onTime.isLate, false);
      const originalSubmission = await prisma.gcrReport.findUniqueOrThrow({
        where: { id: firstReport.id },
        select: { submittedAt: true, isLate: true }
      });

      const postCloseAttendance = await service.upsertAttendance(
        fixture.teacherUser.id,
        firstReport.id,
        { status: "LATE", version: reportVersion },
        new Date("2026-07-07T15:01:00.000Z")
      );
      assert.equal(postCloseAttendance.status, "LATE");
      reportVersion += 1;
      const postCloseReport = await prisma.gcrReport.findUniqueOrThrow({
        where: { id: firstReport.id }
      });
      assert.equal(postCloseReport.hasPostCloseChanges, true);
      assert.equal(postCloseReport.status, "MODIFIED_POST_CLOSE");

      const lateMerit = await service.createMerit(fixture.teacherUser.id, firstReport.id, {
        comment: "Late merit",
        version: reportVersion,
        occurredAt: "2026-07-07T15:01:00.000Z"
      });
      assert.equal(lateMerit.isPostClose, true);
      reportVersion += 1;
      const thirdDemerit = await service.createDemerits(fixture.teacherUser.id, firstReport.id, {
        occurredAt: "2026-07-07T15:01:00.000Z",
        version: reportVersion,
        demerits: [{ ordinal: 3, comment: "Third warning" }]
      });
      reportVersion += 1;
      assert.equal(thirdDemerit[0].isPostClose, true);
      assert.equal(thirdDemerit[0].detentionRequired, true);
      assert.equal(thirdDemerit[0].detentionDate.toISOString().slice(0, 10), "2026-07-08");
      const afterEvents = await prisma.gcrReport.findUniqueOrThrow({
        where: { id: firstReport.id },
        select: { submittedAt: true, isLate: true }
      });
      assert.equal(
        afterEvents.submittedAt.toISOString(),
        originalSubmission.submittedAt.toISOString()
      );
      assert.equal(afterEvents.isLate, originalSubmission.isLate);
      assert.ok(await prisma.gcrAuditEvent.count({ where: { reportId: firstReport.id } }));

      const completeWeekResponse = await request(
        `/gcr/teacher/students/${fixture.assignedStudent.id}/week?date=2026-07-07`
      );
      const completeWeek = await completeWeekResponse.json();
      const completeDay = completeWeek.days.find((day) => day.date === "2026-07-07");
      assert.equal(completeDay.report.generalComment, "Good day");
      assert.equal(completeDay.report.attendance.status, "LATE");
      assert.equal(completeDay.report.subjectTasks.length, 1);
      assert.equal(completeDay.report.verse.reference, "John 3:16");
      assert.deepEqual(
        completeWeek.termVerses.map(({ slot, reference, score }) => ({ slot, reference, score })),
        [
          { slot: 1, reference: "John 3:16", score: 95 },
          { slot: 2, reference: "Psalm 23:1", score: 96 },
          { slot: 3, reference: "Proverbs 3:5", score: 97 }
        ]
      );
      assert.equal(completeDay.report.merits.length, 3);
      assert.equal(completeDay.report.demerits.length, 3);
      assert.equal(completeDay.report.detention.required, true);

      const unchanged = await service.upsertAttendance(
        fixture.teacherUser.id,
        firstReport.id,
        { status: "LATE", version: reportVersion },
        new Date("2026-07-07T15:02:00.000Z")
      );
      assert.equal(unchanged.reportVersion, reportVersion);
      await assert.rejects(
        () =>
          service.upsertAttendance(
            fixture.teacherUser.id,
            firstReport.id,
            { status: "PRESENT", version: reportVersion - 1, postCloseReason: "Stale edit" },
            new Date("2026-07-07T15:02:00.000Z")
          ),
        /version conflict/
      );

      const lateDraft = await service.openDraft(fixture.teacherUser.id, {
        ...createBody,
        reportDate: "2026-07-08"
      });
      let lateVersion = lateDraft.version;
      await service.upsertAttendance(
        fixture.teacherUser.id,
        lateDraft.id,
        { status: "PRESENT", version: lateVersion, postCloseReason: "Historical fixture" },
        new Date("2026-07-08T15:00:01.000Z")
      );
      lateVersion += 1;
      const late = await service.submit(
        fixture.teacherUser.id,
        lateDraft.id,
        lateVersion,
        new Date("2026-07-08T15:01:00.000Z")
      );
      assert.equal(late.status, "SUBMITTED_LATE");
      assert.equal(late.isLate, true);

      const endpointDraft = await service.openDraft(fixture.teacherUser.id, {
        ...createBody,
        reportDate: "2026-07-09"
      });
      let endpointVersion = endpointDraft.version;
      const saveDraftResponse = await request(`/gcr/teacher/reports/${endpointDraft.id}/draft`, {
        method: "PUT",
        body: JSON.stringify({
          version: endpointVersion,
          generalComment: "Saved together",
          attendance: { status: "PRESENT" },
          postCloseReason: "Historical fixture"
        })
      });
      assert.equal(saveDraftResponse.status, 200);
      const savedDraft = await saveDraftResponse.json();
      assert.equal(savedDraft.generalComment, "Saved together");
      assert.equal(savedDraft.version, endpointVersion + 1);
      assert.equal(await prisma.gcrAttendance.count({ where: { reportId: endpointDraft.id } }), 1);
      endpointVersion = savedDraft.version;
      const noOpDraft = await request(`/gcr/teacher/reports/${endpointDraft.id}/draft`, {
        method: "PUT",
        body: JSON.stringify({
          version: endpointVersion,
          generalComment: "Saved together",
          attendance: { status: "PRESENT" }
        })
      });
      assert.equal((await noOpDraft.json()).version, endpointVersion);
      const submitOnceResponse = await request(`/gcr/teacher/reports/${endpointDraft.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ version: endpointVersion })
      });
      assert.equal(submitOnceResponse.status, 201);
      const submitOnce = await submitOnceResponse.json();
      const submitTwiceResponse = await request(`/gcr/teacher/reports/${endpointDraft.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ version: endpointVersion })
      });
      assert.equal(submitTwiceResponse.status, 201);
      const submitTwice = await submitTwiceResponse.json();
      assert.equal(submitTwice.id, submitOnce.id);
      assert.equal(submitTwice.firstSubmittedAt, submitOnce.firstSubmittedAt);
      assert.equal(submitTwice.version, submitOnce.version);
      assert.equal(
        await prisma.gcrAuditEvent.count({
          where: { reportId: endpointDraft.id, action: "SUBMITTED" }
        }),
        1
      );
    } finally {
      await app.close();
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      await prisma.$disconnect();
    }
  }
);

function migrateEmptySchema(databaseUrl) {
  const packageManager = process.env.npm_execpath;
  const command = packageManager ? process.execPath : "pnpm";
  const args = packageManager
    ? [packageManager, "exec", "prisma", "migrate", "deploy"]
    : ["exec", "prisma", "migrate", "deploy"];
  const migration = spawnSync(command, args, {
    cwd: path.resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: "utf8",
    shell: !packageManager
  });
  assert.equal(
    migration.status,
    0,
    `Migration from empty failed:\n${migration.stdout}\n${migration.stderr}\n${migration.error ?? ""}`
  );
}

function withSchema(value, schemaName) {
  const url = new URL(value);
  url.searchParams.set("schema", schemaName);
  return url.toString();
}

async function createFixture(prisma) {
  const suffix = Date.now();
  const password = "GcrApiTest123!";
  const passwordHash = await bcrypt.hash(password, 4);
  const teacherRole = await prisma.role.create({ data: { name: "TEACHER" } });
  const teacherUser = await prisma.user.create({
    data: {
      email: `gcr-teacher-${suffix}@test.local`,
      passwordHash,
      firstName: "Assigned",
      lastName: "Teacher",
      roles: { create: { roleId: teacherRole.id } },
      teacherProfile: { create: { employeeCode: `GT-${suffix}` } }
    },
    include: { teacherProfile: true }
  });
  const foreignTeacher = await prisma.user.create({
    data: {
      email: `gcr-foreign-teacher-${suffix}@test.local`,
      passwordHash,
      firstName: "Foreign",
      lastName: "Teacher",
      teacherProfile: { create: { employeeCode: `GTF-${suffix}` } }
    },
    include: { teacherProfile: true }
  });
  const assignedStudentUser = await prisma.user.create({
    data: {
      email: `gcr-student-${suffix}@test.local`,
      passwordHash,
      firstName: "Assigned",
      lastName: "Student",
      studentProfile: { create: { studentCode: `GS-${suffix}` } }
    },
    include: { studentProfile: true }
  });
  const foreignStudentUser = await prisma.user.create({
    data: {
      email: `gcr-foreign-student-${suffix}@test.local`,
      passwordHash,
      firstName: "Foreign",
      lastName: "Student",
      studentProfile: { create: { studentCode: `GSF-${suffix}` } }
    },
    include: { studentProfile: true }
  });
  const year = await prisma.academicYear.create({
    data: {
      name: `GCR API ${suffix}`,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: new Date("2026-12-31T23:59:59.000Z")
    }
  });
  const term = await prisma.academicTerm.create({
    data: {
      academicYearId: year.id,
      name: "Term 1",
      order: 1,
      startsAt: new Date("2026-07-01T00:00:00.000Z"),
      endsAt: new Date("2026-09-30T23:59:59.000Z")
    }
  });
  const assignedClass = await prisma.academicClass.create({
    data: {
      academicYearId: year.id,
      name: "Assigned Class",
      code: `GC-A-${suffix}`,
      teachers: { create: { teacherId: teacherUser.teacherProfile.id, isPrimary: true } },
      enrollments: { create: { studentId: assignedStudentUser.studentProfile.id } }
    }
  });
  const foreignClass = await prisma.academicClass.create({
    data: {
      academicYearId: year.id,
      name: "Foreign Class",
      code: `GC-F-${suffix}`,
      teachers: { create: { teacherId: foreignTeacher.teacherProfile.id, isPrimary: true } },
      enrollments: { create: { studentId: foreignStudentUser.studentProfile.id } }
    }
  });
  const subject = await prisma.subject.create({
    data: { name: `GCR Math ${suffix}`, shortName: `GM${String(suffix).slice(-6)}` }
  });
  const assignedClassSubject = await prisma.classSubject.create({
    data: { classId: assignedClass.id, subjectId: subject.id }
  });
  const foreignClassSubject = await prisma.classSubject.create({
    data: { classId: foreignClass.id, subjectId: subject.id }
  });
  return {
    password,
    teacherEmail: teacherUser.email,
    teacherUser,
    foreignTeacherUser: foreignTeacher,
    foreignTeacher: foreignTeacher.teacherProfile,
    assignedClass,
    foreignClass,
    term,
    assignedClassSubject,
    foreignClassSubject,
    assignedStudent: assignedStudentUser.studentProfile,
    foreignStudent: foreignStudentUser.studentProfile
  };
}
