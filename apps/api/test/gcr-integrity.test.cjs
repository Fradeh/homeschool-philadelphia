const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");

const enabled = process.env.RUN_DB_INTEGRITY === "1" && Boolean(process.env.TEST_DATABASE_URL);

test(
  "GCR migrations apply from empty and database constraints preserve integrity",
  { skip: !enabled, timeout: 120_000 },
  async () => {
    const schemaName = `gcr_integrity_${process.pid}_${Date.now()}`;
    const databaseUrl = withSchema(process.env.TEST_DATABASE_URL, schemaName);
    const packageManager = process.env.npm_execpath;
    const command = packageManager ? process.execPath : process.platform === "win32" ? "pnpm.cmd" : "pnpm";
    const args = packageManager
      ? [packageManager, "exec", "prisma", "migrate", "deploy"]
      : ["exec", "prisma", "migrate", "deploy"];
    const migration = spawnSync(command, args, {
      cwd: require("node:path").resolve(__dirname, ".."),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      encoding: "utf8"
    });

    assert.equal(
      migration.status,
      0,
      `Migration from empty failed:\n${migration.stdout}\n${migration.stderr}\n${migration.error ?? ""}`
    );

    const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
    try {
      const fixture = await createFixture(prisma);
      const report = await createReport(prisma, fixture, "2026-07-07");

      await assertUnique(() => createReport(prisma, fixture, "2026-07-07"));

      const attendance = {
        reportId: report.id,
        status: "PRESENT",
        createdById: fixture.teacherUser.id,
        updatedById: fixture.teacherUser.id
      };
      await prisma.gcrAttendance.create({ data: attendance });
      await assertUnique(() => prisma.gcrAttendance.create({ data: attendance }));

      const task = {
        reportId: report.id,
        classSubjectId: fixture.classSubject.id,
        homeworkAssigned: true,
        completionStatus: "COMPLETED",
        createdById: fixture.teacherUser.id,
        updatedById: fixture.teacherUser.id
      };
      await prisma.gcrSubjectTask.create({ data: task });
      await assertUnique(() => prisma.gcrSubjectTask.create({ data: task }));

      const verse = {
        reportId: report.id,
        studentId: fixture.student.id,
        academicTermId: fixture.term.id,
        classSubjectId: fixture.classSubject.id,
        slot: 1,
        reference: "John 3:16",
        score: 95,
        createdById: fixture.teacherUser.id,
        updatedById: fixture.teacherUser.id
      };
      await prisma.gcrVerse.create({ data: verse });
      const secondReport = await createReport(prisma, fixture, "2026-07-08");
      await assertUnique(() =>
        prisma.gcrVerse.create({ data: { ...verse, reportId: secondReport.id } })
      );

      const demerit = {
        reportId: report.id,
        ordinal: 1,
        comment: "Documented behavior",
        createdById: fixture.teacherUser.id
      };
      await prisma.gcrDemerit.create({ data: demerit });
      await assertUnique(() => prisma.gcrDemerit.create({ data: demerit }));

      await prisma.gcrMerit.createMany({
        data: [
          { reportId: report.id, comment: "First merit", createdById: fixture.teacherUser.id },
          { reportId: report.id, comment: "Second merit", createdById: fixture.teacherUser.id }
        ]
      });
      assert.equal(await prisma.gcrMerit.count({ where: { reportId: report.id } }), 2);

      const loaded = await prisma.gcrReport.findUniqueOrThrow({
        where: { id: report.id },
        include: {
          student: true,
          class: true,
          academicTerm: true,
          responsibleTeacher: true,
          createdBy: true
        }
      });
      assert.equal(loaded.student.id, fixture.student.id);
      assert.equal(loaded.class.id, fixture.schoolClass.id);
      assert.equal(loaded.academicTerm.id, fixture.term.id);
      assert.equal(loaded.responsibleTeacher.id, fixture.teacher.id);
      assert.equal(loaded.createdBy.id, fixture.teacherUser.id);

      await assertCheck(() =>
        prisma.gcrVerse.create({ data: { ...verse, slot: 4, reportId: secondReport.id } })
      );
      await assertCheck(() =>
        prisma.gcrDemerit.create({
          data: { ...demerit, ordinal: 3, detentionRequired: true }
        })
      );

      const audit = await prisma.gcrAuditEvent.create({
        data: {
          reportId: report.id,
          entityType: "GcrReport",
          entityId: report.id,
          action: "CREATED",
          actorId: fixture.teacherUser.id
        }
      });
      await assert.rejects(
        () => prisma.gcrAuditEvent.update({ where: { id: audit.id }, data: { reason: "mutate" } }),
        /append-only/
      );
      await assert.rejects(
        () => prisma.gcrAuditEvent.delete({ where: { id: audit.id } }),
        /append-only/
      );
    } finally {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
      await prisma.$disconnect();
    }
  }
);

function withSchema(value, schemaName) {
  const url = new URL(value);
  url.searchParams.set("schema", schemaName);
  return url.toString();
}

async function createFixture(prisma) {
  const teacherUser = await prisma.user.create({
    data: {
      email: `gcr-teacher-${Date.now()}@test.local`,
      passwordHash: "not-used",
      firstName: "GCR",
      lastName: "Teacher",
      teacherProfile: { create: { employeeCode: `GCR-T-${Date.now()}` } }
    },
    include: { teacherProfile: true }
  });
  const studentUser = await prisma.user.create({
    data: {
      email: `gcr-student-${Date.now()}@test.local`,
      passwordHash: "not-used",
      firstName: "GCR",
      lastName: "Student",
      studentProfile: { create: { studentCode: `GCR-S-${Date.now()}` } }
    },
    include: { studentProfile: true }
  });
  const year = await prisma.academicYear.create({
    data: {
      name: `GCR Year ${Date.now()}`,
      startsAt: new Date("2026-01-01T00:00:00.000Z"),
      endsAt: new Date("2026-12-31T00:00:00.000Z")
    }
  });
  const term = await prisma.academicTerm.create({
    data: {
      academicYearId: year.id,
      name: "GCR Term",
      order: 1,
      startsAt: new Date("2026-07-01T00:00:00.000Z"),
      endsAt: new Date("2026-09-30T00:00:00.000Z")
    }
  });
  const schoolClass = await prisma.academicClass.create({
    data: { academicYearId: year.id, name: "GCR Class", code: `GCR-${Date.now()}` }
  });
  const subject = await prisma.subject.create({
    data: { name: `GCR Subject ${Date.now()}`, shortName: `G${String(Date.now()).slice(-7)}` }
  });
  const classSubject = await prisma.classSubject.create({
    data: { classId: schoolClass.id, subjectId: subject.id }
  });

  return {
    teacherUser,
    teacher: teacherUser.teacherProfile,
    student: studentUser.studentProfile,
    term,
    schoolClass,
    classSubject
  };
}

function createReport(prisma, fixture, date) {
  return prisma.gcrReport.create({
    data: {
      studentId: fixture.student.id,
      classId: fixture.schoolClass.id,
      academicTermId: fixture.term.id,
      reportDate: new Date(`${date}T00:00:00.000Z`),
      responsibleTeacherId: fixture.teacher.id,
      createdById: fixture.teacherUser.id,
      updatedById: fixture.teacherUser.id
    }
  });
}

async function assertUnique(operation) {
  await assert.rejects(operation, (error) => error?.code === "P2002");
}

async function assertCheck(operation) {
  await assert.rejects(
    operation,
    (error) => error?.code === "P2004" || /23514|violates check constraint/.test(String(error))
  );
}
