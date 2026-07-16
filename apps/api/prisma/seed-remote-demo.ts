import {
  ClassAssignmentStatus,
  ClassSubmissionStatus,
  PaceGradeStatus,
  PaceProgressStatus,
  Prisma,
  PrismaClient,
  RoleName,
  ScheduleAudienceType,
  ScheduleBlockKind,
  ScheduleTemplateStatus,
  Weekday
} from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const DEMO_CONFIRMATION = "CREATE_CLEAN_PHILADELPHIA_DEMO";
const DEMO_PASSWORD = "PhiladelphiaDemo2026!";
const ADMIN_EMAIL = "admin@philadelphia.demo";
const DEMO_EMAILS = [
  "direc.gabriela@philadelphia.demo",
  "laura.teacher@philadelphia.demo",
  "jose.teacher@philadelphia.demo",
  "student.sofia@philadelphia.demo",
  "student.daniel@philadelphia.demo",
  ADMIN_EMAIL
] as const;
const weekdays = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY
];

function assertRemoteDemoTarget() {
  if (process.env.DEMO_SEED_CONFIRM !== DEMO_CONFIRMATION) {
    throw new Error(`Set DEMO_SEED_CONFIRM=${DEMO_CONFIRMATION} to create the remote demo`);
  }

  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  if (!url.hostname.endsWith(".supabase.com")) {
    throw new Error("Remote demo seed only accepts a Supabase DATABASE_URL");
  }
}

async function createUser(
  tx: Prisma.TransactionClient,
  input: {
    email: string;
    firstName: string;
    lastName: string;
    roles: RoleName[];
    passwordHash: string;
  }
) {
  const roles = await tx.role.findMany({ where: { name: { in: input.roles } } });
  if (roles.length !== input.roles.length) {
    throw new Error(`Missing roles while creating ${input.email}`);
  }

  return tx.user.create({
    data: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: input.passwordHash,
      roles: { create: roles.map((role) => ({ roleId: role.id })) }
    }
  });
}

async function ensureGabrielaRoles(tx: Prisma.TransactionClient) {
  const user = await tx.user.findUnique({
    where: { email: DEMO_EMAILS[0] }
  });
  if (!user) throw new Error(`Demo user ${DEMO_EMAILS[0]} was not found`);

  const roles = await tx.role.findMany({
    where: { name: { in: [RoleName.TEACHER, RoleName.ADMINISTRATIVE] } }
  });
  if (roles.length !== 2) {
    throw new Error("TEACHER and ADMINISTRATIVE roles are required");
  }

  await tx.userRole.deleteMany({ where: { userId: user.id } });
  await tx.userRole.createMany({
    data: roles.map((role) => ({ userId: user.id, roleId: role.id }))
  });
}

async function ensureAdminUser(tx: Prisma.TransactionClient, passwordHash: string) {
  const existing = await tx.user.findUnique({ where: { email: ADMIN_EMAIL } });
  const admin =
    existing ??
    (await createUser(tx, {
      email: ADMIN_EMAIL,
      firstName: "Administrador",
      lastName: "Philadelphia",
      roles: [RoleName.ADMIN],
      passwordHash
    }));

  const adminRole = await tx.role.findUnique({ where: { name: RoleName.ADMIN } });
  if (!adminRole) throw new Error("ADMIN role is required");

  await tx.userRole.deleteMany({ where: { userId: admin.id } });
  await tx.userRole.create({
    data: { userId: admin.id, roleId: adminRole.id }
  });
}

async function main() {
  assertRemoteDemoTarget();

  const result = await prisma.$transaction(
    async (tx) => {
      await tx.role.createMany({
        data: Object.values(RoleName).map((name) => ({ name })),
        skipDuplicates: true
      });

      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
      const existingDemoUsers = await tx.user.findMany({
        where: { email: { in: [...DEMO_EMAILS] } },
        select: { email: true }
      });
      const existingEmails = new Set(existingDemoUsers.map((user) => user.email));
      const originalDemoExists = DEMO_EMAILS.slice(0, 5).every((email) =>
        existingEmails.has(email)
      );
      const existingUsers = await tx.user.count();

      if (existingDemoUsers.length === DEMO_EMAILS.length) {
        await ensureGabrielaRoles(tx);
        await ensureAdminUser(tx, passwordHash);
        return { skipped: true, adminCreated: false };
      }

      if (originalDemoExists && existingUsers === 5 && !existingEmails.has(ADMIN_EMAIL)) {
        await ensureGabrielaRoles(tx);
        await ensureAdminUser(tx, passwordHash);
        return { skipped: true, adminCreated: true };
      }

      if (existingUsers > 0) {
        throw new Error(
          "The remote database already contains users. The clean demo seed will not overwrite them."
        );
      }

      const gabrielaUser = await createUser(tx, {
        email: DEMO_EMAILS[0],
        firstName: "Gabriela",
        lastName: "Mendoza",
        roles: [RoleName.TEACHER, RoleName.ADMINISTRATIVE],
        passwordHash
      });
      const lauraUser = await createUser(tx, {
        email: DEMO_EMAILS[1],
        firstName: "Laura",
        lastName: "Gómez",
        roles: [RoleName.TEACHER],
        passwordHash
      });
      const joseUser = await createUser(tx, {
        email: DEMO_EMAILS[2],
        firstName: "José",
        lastName: "Ramírez",
        roles: [RoleName.TEACHER],
        passwordHash
      });
      const sofiaUser = await createUser(tx, {
        email: DEMO_EMAILS[3],
        firstName: "Sofía",
        lastName: "Martínez",
        roles: [RoleName.STUDENT],
        passwordHash
      });
      const danielUser = await createUser(tx, {
        email: DEMO_EMAILS[4],
        firstName: "Daniel",
        lastName: "Rodríguez",
        roles: [RoleName.STUDENT],
        passwordHash
      });
      await ensureAdminUser(tx, passwordHash);

      await tx.directorProfile.create({
        data: { userId: gabrielaUser.id, title: "Directora general" }
      });
      await tx.teacherProfile.create({
        data: { userId: gabrielaUser.id, employeeCode: "DIR-DEMO-001" }
      });
      const laura = await tx.teacherProfile.create({
        data: { userId: lauraUser.id, employeeCode: "DOC-DEMO-001" }
      });
      const jose = await tx.teacherProfile.create({
        data: { userId: joseUser.id, employeeCode: "DOC-DEMO-002" }
      });

      const year = await tx.academicYear.create({
        data: {
          name: "2026",
          startsAt: new Date("2026-01-01T00:00:00.000Z"),
          endsAt: new Date("2026-12-31T23:59:59.999Z"),
          isActive: true
        }
      });
      const term = await tx.academicTerm.create({
        data: {
          academicYearId: year.id,
          name: "Segundo periodo",
          order: 2,
          startsAt: new Date("2026-07-01T00:00:00.000Z"),
          endsAt: new Date("2026-09-30T23:59:59.999Z"),
          isActive: true
        }
      });

      const gradeDefinitions = [
        { code: "3", name: "Tercer grado", sortOrder: 3 },
        { code: "4", name: "Cuarto grado", sortOrder: 4 },
        { code: "5", name: "Quinto grado", sortOrder: 5 },
        { code: "6", name: "Sexto grado", sortOrder: 6 }
      ];
      const grades = [];
      for (const definition of gradeDefinitions) {
        grades.push(await tx.gradeLevel.create({ data: definition }));
      }

      const sofia = await tx.studentProfile.create({
        data: {
          userId: sofiaUser.id,
          studentCode: "EST-DEMO-003",
          gradeLevelId: grades[0].id,
          gradeLevel: "3°"
        }
      });
      const daniel = await tx.studentProfile.create({
        data: {
          userId: danielUser.id,
          studentCode: "EST-DEMO-004",
          gradeLevelId: grades[1].id,
          gradeLevel: "4°"
        }
      });

      const subjectDefinitions = [
        { name: "SMART MONEY", shortName: "SMART", color: "#0F766E" },
        { name: "OUTDOOR SCIENCE", shortName: "OUTSCI", color: "#15803D" },
        { name: "PHYSICAL EDUCATION", shortName: "PE", color: "#DC2626" },
        { name: "ESPAÑOL", shortName: "ESP", color: "#7C3AED" },
        { name: "MATH", shortName: "MATH", color: "#2563EB" },
        { name: "MÚSICA", shortName: "MUS", color: "#DB2777" },
        { name: "ART", shortName: "ART", color: "#EA580C" },
        { name: "INFORMÁTICA", shortName: "INFO", color: "#0891B2" },
        { name: "CIENCIAS SOCIALES", shortName: "SOC", color: "#4F46E5" },
        { name: "E.C.A", shortName: "ECA", color: "#9333EA" }
      ];
      const subjects = [];
      for (const definition of subjectDefinitions) {
        const subject = await tx.subject.create({
          data: { ...definition, paceEnabled: true }
        });
        subjects.push(subject);
        await tx.pace.createMany({
          data: [101, 102, 103, 104].map((number, index) => ({
            subjectId: subject.id,
            number,
            sequence: index + 1,
            title: `${definition.name} · PACE ${number}`
          }))
        });
      }

      const teacherBySubjectIndex = subjects.map((_, index) => (index % 2 === 0 ? laura : jose));
      const classRows: Array<{
        id: string;
        gradeLevelId: string;
        gradeIndex: number;
        classSubjects: Array<{
          id: string;
          subjectId: string;
          subjectIndex: number;
          teacherId: string;
        }>;
      }> = [];

      for (const [gradeIndex, grade] of grades.entries()) {
        const primaryTeacher = gradeIndex % 2 === 0 ? laura : jose;
        const schoolClass = await tx.academicClass.create({
          data: {
            academicYearId: year.id,
            gradeLevelId: grade.id,
            name: `${grade.code}° · Grupo único`,
            code: `GRADO-${grade.code}-2026`,
            description: `Grupo demostrativo de ${grade.name} para el segundo periodo de 2026.`,
            color: ["#2563EB", "#7C3AED", "#0F766E", "#EA580C"][gradeIndex],
            teachers: {
              create: [
                { teacherId: laura.id, isPrimary: primaryTeacher.id === laura.id },
                { teacherId: jose.id, isPrimary: primaryTeacher.id === jose.id }
              ]
            }
          }
        });

        if (grade.code === "3") {
          await tx.classEnrollment.create({
            data: { classId: schoolClass.id, studentId: sofia.id }
          });
        }
        if (grade.code === "4") {
          await tx.classEnrollment.create({
            data: { classId: schoolClass.id, studentId: daniel.id }
          });
        }

        const classSubjects = [];
        for (const [subjectIndex, subject] of subjects.entries()) {
          const teacher = teacherBySubjectIndex[subjectIndex];
          const classSubject = await tx.classSubject.create({
            data: {
              classId: schoolClass.id,
              subjectId: subject.id,
              targetPaces: 4,
              teachers: { create: { teacherId: teacher.id } }
            }
          });
          classSubjects.push({
            id: classSubject.id,
            subjectId: subject.id,
            subjectIndex,
            teacherId: teacher.id
          });
        }

        const assignment = await tx.classAssignment.create({
          data: {
            classId: schoolClass.id,
            createdById: primaryTeacher.userId,
            title: "Actividad de seguimiento del segundo periodo",
            description:
              "Revisa los objetivos de la semana y entrega una breve evidencia de tu avance.",
            dueAt: new Date("2026-07-31T23:59:00.000Z"),
            points: 100,
            submissionType: "Texto",
            status: ClassAssignmentStatus.PUBLISHED
          }
        });
        if (grade.code === "3") {
          await tx.classSubmission.create({
            data: {
              assignmentId: assignment.id,
              studentId: sofia.id,
              body: "Completé la actividad y expliqué lo aprendido durante la semana.",
              status: ClassSubmissionStatus.GRADED,
              submittedAt: new Date("2026-07-14T15:00:00.000Z"),
              score: 94,
              feedback: "Excelente organización y explicación."
            }
          });
        }
        if (grade.code === "4") {
          await tx.classSubmission.create({
            data: {
              assignmentId: assignment.id,
              studentId: daniel.id,
              body: "Entregué la evidencia con los ejercicios y una conclusión.",
              status: ClassSubmissionStatus.GRADED,
              submittedAt: new Date("2026-07-14T16:00:00.000Z"),
              score: 89,
              feedback: "Buen avance. Continúa explicando cada procedimiento."
            }
          });
        }

        classRows.push({
          id: schoolClass.id,
          gradeLevelId: grade.id,
          gradeIndex,
          classSubjects
        });
      }

      const paces = await tx.pace.findMany({
        orderBy: [{ subjectId: "asc" }, { sequence: "asc" }]
      });
      const studentPlans = [
        { student: sofia, classRow: classRows[0], completedThrough: 101, current: 102 },
        { student: daniel, classRow: classRows[1], completedThrough: 102, current: 103 }
      ];

      for (const plan of studentPlans) {
        for (const classSubject of plan.classRow.classSubjects) {
          await tx.studentPaceGoal.create({
            data: {
              studentId: plan.student.id,
              classSubjectId: classSubject.id,
              academicTermId: term.id,
              targetPaces: 4,
              startingPaceNumber: 101
            }
          });
          const subjectPaces = paces.filter((pace) => pace.subjectId === classSubject.subjectId);
          for (const pace of subjectPaces) {
            const completed = pace.number <= plan.completedThrough;
            const current = pace.number === plan.current;
            const record = await tx.studentPaceRecord.create({
              data: {
                studentId: plan.student.id,
                classSubjectId: classSubject.id,
                paceId: pace.id,
                paceNumber: pace.number,
                academicTermId: term.id,
                status: completed
                  ? PaceProgressStatus.COMPLETED
                  : current
                    ? PaceProgressStatus.CURRENT
                    : PaceProgressStatus.PLANNED,
                startedAt: completed || current ? new Date("2026-07-01T13:00:00.000Z") : undefined,
                completedAt: completed ? new Date("2026-07-10T16:00:00.000Z") : undefined
              }
            });
            if (completed) {
              const grader = teacherBySubjectIndex[classSubject.subjectIndex];
              await tx.paceGrade.create({
                data: {
                  studentPaceRecordId: record.id,
                  score:
                    plan.student.id === sofia.id
                      ? 90 + (classSubject.subjectIndex % 6)
                      : 84 + ((classSubject.subjectIndex + pace.sequence) % 9),
                  feedback:
                    "Buen dominio de los objetivos. Continúa mostrando el procedimiento y revisando tus respuestas.",
                  status: PaceGradeStatus.GRADED,
                  gradedById: grader.userId,
                  gradedAt: new Date("2026-07-11T15:00:00.000Z")
                }
              });
            }
          }
        }
      }

      const grid = await tx.scheduleGrid.findFirst({
        where: { isActive: true },
        include: { periods: { orderBy: { order: "asc" } } }
      });
      if (!grid) throw new Error("The active schedule grid was not created by migrations");

      for (const classRow of classRows) {
        const template = await tx.scheduleTemplate.create({
          data: {
            academicYearId: year.id,
            audienceType: ScheduleAudienceType.GRADE,
            gradeLevelId: classRow.gradeLevelId,
            gridId: grid.id,
            name: `Horario ${gradeDefinitions[classRow.gradeIndex].name} · 2026`,
            status: ScheduleTemplateStatus.PUBLISHED,
            publishedAt: new Date("2026-07-01T12:00:00.000Z"),
            subjectScopes: {
              create: classRow.classSubjects.map((classSubject) => ({
                classSubjectId: classSubject.id
              }))
            }
          }
        });

        const blocks = grid.periods.flatMap((period) =>
          weekdays.map((weekday, dayIndex) => {
            if (period.kind === "BREAK") {
              return {
                templateId: template.id,
                periodId: period.id,
                weekday,
                kind: ScheduleBlockKind.ACTIVITY,
                label: period.label ?? "Receso"
              };
            }
            if (period.order === 1) {
              return {
                templateId: template.id,
                periodId: period.id,
                weekday,
                kind: ScheduleBlockKind.ACTIVITY,
                label: "Apertura y metas del día"
              };
            }

            const activeLauraGrade = (period.order + dayIndex) % classRows.length;
            const activeJoseGrade = (activeLauraGrade + 2) % classRows.length;
            if (
              classRow.gradeIndex !== activeLauraGrade &&
              classRow.gradeIndex !== activeJoseGrade
            ) {
              return {
                templateId: template.id,
                periodId: period.id,
                weekday,
                kind: ScheduleBlockKind.PACES,
                label: "Trabajo individual de PACEs"
              };
            }

            const teacherParity = classRow.gradeIndex === activeLauraGrade ? 0 : 1;
            const candidates = classRow.classSubjects.filter(
              (classSubject) => classSubject.subjectIndex % 2 === teacherParity
            );
            const classSubject =
              candidates[(period.order + dayIndex + classRow.gradeIndex) % candidates.length];
            return {
              templateId: template.id,
              periodId: period.id,
              weekday,
              kind: ScheduleBlockKind.SUBJECT,
              classSubjectId: classSubject.id,
              teacherId: classSubject.teacherId
            };
          })
        );
        await tx.scheduleTemplateBlock.createMany({ data: blocks });
      }

      return { skipped: false, adminCreated: true };
    },
    { maxWait: 20_000, timeout: 120_000 }
  );

  if (result.skipped) {
    process.stdout.write(
      result.adminCreated
        ? "Remote Philadelphia demo already exists; the ADMIN account was added and Gabriela roles were corrected.\n"
        : "Remote Philadelphia demo already exists; ADMIN and Gabriela roles were verified.\n"
    );
    return;
  }

  const [users, classes, subjects, schedules, paceRecords, paceGrades] = await Promise.all([
    prisma.user.count(),
    prisma.academicClass.count(),
    prisma.subject.count(),
    prisma.scheduleTemplate.count(),
    prisma.studentPaceRecord.count(),
    prisma.paceGrade.count()
  ]);
  process.stdout.write(
    `Remote Philadelphia demo created: ${JSON.stringify({
      users,
      classes,
      subjects,
      schedules,
      paceRecords,
      paceGrades
    })}\n`
  );
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
