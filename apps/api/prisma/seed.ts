import {
  ClassAssignmentStatus,
  ClassMaterialKind,
  ClassSubmissionStatus,
  ConversationParticipantType,
  ConversationStatus,
  PaceGradeStatus,
  PaceProgressStatus,
  PhysicalBookingStatus,
  PrismaClient,
  RoleName,
  ScheduleBlockKind,
  SchedulePeriodKind,
  ScheduleTemplateStatus,
  Weekday
} from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "DemoPassword2026!";

function assertLocalDemoDatabase() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seed is disabled in production");
  }
  if (process.env.DEMO_SEED_CONFIRM !== "RESET_LOCAL_DEMO") {
    throw new Error("Set DEMO_SEED_CONFIRM=RESET_LOCAL_DEMO to replace local demo data");
  }

  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("DATABASE_URL is required");
  const databaseUrl = new URL(value);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "postgres"]);
  const databaseName = databaseUrl.pathname.replace(/^\//, "");
  const allowedDatabase =
    databaseName === "homeschool_platform" || /(?:demo|local|test)/i.test(databaseName);
  if (!localHosts.has(databaseUrl.hostname) || !allowedDatabase) {
    throw new Error(
      `Refusing to reset non-local database ${databaseUrl.hostname}/${databaseName}`
    );
  }
}

async function clearDemoData() {
  await prisma.$transaction([
    prisma.paceGrade.deleteMany(),
    prisma.studentPaceRecord.deleteMany(),
    prisma.conversationMessage.deleteMany(),
    prisma.conversationParticipant.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.studentPhysicalBooking.deleteMany(),
    prisma.teacherAvailabilitySlot.deleteMany(),
    prisma.scheduleTemplateBlock.deleteMany(),
    prisma.scheduleTemplate.deleteMany(),
    prisma.classSubmissionAttachment.deleteMany(),
    prisma.classSubmission.deleteMany(),
    prisma.classAssignmentAttachment.deleteMany(),
    prisma.classAssignment.deleteMany(),
    prisma.classWallComment.deleteMany(),
    prisma.classWallPost.deleteMany(),
    prisma.classMaterial.deleteMany(),
    prisma.classSubjectTeacher.deleteMany(),
    prisma.classTeacher.deleteMany(),
    prisma.classEnrollment.deleteMany(),
    prisma.classSubject.deleteMany(),
    prisma.academicClass.deleteMany(),
    prisma.pace.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.academicTerm.deleteMany(),
    prisma.academicYear.deleteMany(),
    prisma.studentParent.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.fileAttachment.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.groupMember.deleteMany(),
    prisma.event.deleteMany(),
    prisma.group.deleteMany(),
    prisma.studentProfile.deleteMany(),
    prisma.teacherProfile.deleteMany(),
    prisma.parentProfile.deleteMany(),
    prisma.directorProfile.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany(),
    prisma.gradeLevel.deleteMany()
  ]);
}

async function createUser(input: {
  email: string;
  firstName: string;
  lastName: string;
  roles: RoleName[];
  passwordHash: string;
}) {
  const roles = await prisma.role.findMany({ where: { name: { in: input.roles } } });
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roles: { create: roles.map((role) => ({ roleId: role.id })) }
    }
  });
}

async function main() {
  assertLocalDemoDatabase();
  await clearDemoData();

  await prisma.role.createMany({
    data: Object.values(RoleName).map((name) => ({ name }))
  });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const gabrielaUser = await createUser({
    email: "directora.gabriela@philadelphia.demo",
    firstName: "Gabriela",
    lastName: "Mendoza",
    roles: [RoleName.TEACHER, RoleName.ADMINISTRATIVE],
    passwordHash
  });
  const joseUser = await createUser({
    email: "jose.pablo@philadelphia.demo",
    firstName: "José Pablo",
    lastName: "Ramírez",
    roles: [RoleName.TEACHER],
    passwordHash
  });
  const lauraUser = await createUser({
    email: "teacher.laura@philadelphia.demo",
    firstName: "Laura",
    lastName: "Gómez",
    roles: [RoleName.TEACHER],
    passwordHash
  });
  const juanUser = await createUser({
    email: "teacher.juan@philadelphia.demo",
    firstName: "Juan",
    lastName: "Herrera",
    roles: [RoleName.TEACHER],
    passwordHash
  });
  const sofiaUser = await createUser({
    email: "sofia.martinez@philadelphia.demo",
    firstName: "Sofía",
    lastName: "Martínez",
    roles: [RoleName.STUDENT],
    passwordHash
  });
  const danielUser = await createUser({
    email: "daniel.rodriguez@philadelphia.demo",
    firstName: "Daniel",
    lastName: "Rodríguez",
    roles: [RoleName.STUDENT],
    passwordHash
  });
  const andreaUser = await createUser({
    email: "andrea.lopez@philadelphia.demo",
    firstName: "Andrea",
    lastName: "López",
    roles: [RoleName.STUDENT],
    passwordHash
  });

  const director = await prisma.directorProfile.create({
    data: { userId: gabrielaUser.id, title: "Directora general" }
  });
  await prisma.teacherProfile.create({
    data: { userId: gabrielaUser.id, employeeCode: "DOC-DIR-001" }
  });
  const jose = await prisma.teacherProfile.create({
    data: { userId: joseUser.id, employeeCode: "DOC-DEMO-001" }
  });
  const laura = await prisma.teacherProfile.create({
    data: { userId: lauraUser.id, employeeCode: "DOC-DEMO-002" }
  });
  const juan = await prisma.teacherProfile.create({
    data: { userId: juanUser.id, employeeCode: "DOC-DEMO-003" }
  });

  const year = await prisma.academicYear.create({
    data: {
      name: "2026",
      startsAt: new Date("2026-01-01T00:00:00Z"),
      endsAt: new Date("2026-12-31T23:59:59Z"),
      isActive: true
    }
  });
  const term = await prisma.academicTerm.create({
    data: {
      academicYearId: year.id,
      name: "Segundo periodo",
      order: 2,
      startsAt: new Date("2026-07-01T00:00:00Z"),
      endsAt: new Date("2026-09-30T23:59:59Z"),
      isActive: true
    }
  });
  const grade = await prisma.gradeLevel.create({
    data: { code: "8", name: "Octavo", sortOrder: 8, isActive: true }
  });
  const students = await Promise.all(
    [
      [sofiaUser.id, "EST-DEMO-001"],
      [danielUser.id, "EST-DEMO-002"],
      [andreaUser.id, "EST-DEMO-003"]
    ].map(([userId, studentCode]) =>
      prisma.studentProfile.create({
        data: { userId, studentCode, gradeLevelId: grade.id, gradeLevel: "8°" }
      })
    )
  );
  const [sofia, daniel, andrea] = students;

  const subjects = await Promise.all(
    [
      ["English", "ENG", "#2563EB"],
      ["Mathematics", "MATH", "#4F46E5"],
      ["Geography", "GEO", "#0F766E"],
      ["World Building", "WORLD", "#9333EA"]
    ].map(([name, shortName, color]) =>
      prisma.subject.create({ data: { name, shortName, color, paceEnabled: true } })
    )
  );
  const [english, mathematics, geography, worldBuilding] = subjects;
  for (const subject of subjects) {
    await prisma.pace.createMany({
      data: Array.from({ length: subject.id === worldBuilding.id ? 2 : 4 }, (_, index) => ({
        subjectId: subject.id,
        number: index + 1,
        sequence: index + 1,
        title: `${subject.name} PACE ${index + 1}`
      }))
    });
  }

  const classDefinitions = [
    {
      name: "English 8th Grade",
      code: "ENG-8-DEMO",
      description: "Reading, writing and communication practice for eighth grade.",
      color: "#2563EB",
      teacher: laura,
      teacherUser: lauraUser,
      subjects: [english],
      task: "Reading comprehension activity"
    },
    {
      name: "Mathematics 8th Grade",
      code: "MATH-8-DEMO",
      description: "Reasoning, fractions and practical problem solving.",
      color: "#4F46E5",
      teacher: jose,
      teacherUser: joseUser,
      subjects: [mathematics],
      task: "Fractions and problem solving practice"
    },
    {
      name: "Geography 8th Grade",
      code: "GEO-8-DEMO",
      description: "Maps, regions and geographic thinking through projects.",
      color: "#0F766E",
      teacher: juan,
      teacherUser: juanUser,
      subjects: [geography, worldBuilding],
      task: "Map analysis and location activity"
    }
  ];

  const demoClasses: Array<{
    id: string;
    code: string;
    teacherId: string;
    teacherUserId: string;
    classSubjects: Array<{ id: string; subjectId: string }>;
  }> = [];

  for (const definition of classDefinitions) {
    const schoolClass = await prisma.academicClass.create({
      data: {
        academicYearId: year.id,
        gradeLevelId: grade.id,
        name: definition.name,
        code: definition.code,
        description: definition.description,
        color: definition.color,
        teachers: {
          create: { teacherId: definition.teacher.id, isPrimary: true }
        },
        enrollments: {
          create: students.map((student) => ({ studentId: student.id, status: "ACTIVE" }))
        }
      }
    });
    const classSubjects = [];
    for (const subject of definition.subjects) {
      const classSubject = await prisma.classSubject.create({
        data: {
          classId: schoolClass.id,
          subjectId: subject.id,
          targetPaces: subject.id === worldBuilding.id ? 2 : 4,
          teachers: { create: { teacherId: definition.teacher.id } }
        }
      });
      classSubjects.push(classSubject);
    }

    await prisma.classWallPost.create({
      data: {
        classId: schoolClass.id,
        authorId: definition.teacherUser.id,
        title: `Welcome to ${definition.name}`,
        content:
          "This week we will review our learning goals, resources and upcoming activities. Please bring your questions to class."
      }
    });
    await prisma.classMaterial.createMany({
      data: [
        {
          classId: schoolClass.id,
          uploadedById: definition.teacherUser.id,
          name: `${definition.code} learning guide.pdf`,
          kind: ClassMaterialKind.LINK,
          externalUrl: "https://www.unicef.org/education",
          visibleToStudents: true
        },
        {
          classId: schoolClass.id,
          uploadedById: definition.teacherUser.id,
          name: `${definition.code} activity rubric.pdf`,
          kind: ClassMaterialKind.LINK,
          externalUrl: "https://www.edutopia.org/",
          visibleToStudents: true
        },
        {
          classId: schoolClass.id,
          uploadedById: definition.teacherUser.id,
          name: `${definition.name} educational resource`,
          kind: ClassMaterialKind.LINK,
          externalUrl: "https://www.khanacademy.org/",
          visibleToStudents: true
        }
      ]
    });

    const pending = await prisma.classAssignment.create({
      data: {
        classId: schoolClass.id,
        createdById: definition.teacherUser.id,
        title: definition.task,
        description: "Complete the activity and explain the reasoning used in your answers.",
        dueAt: new Date("2026-07-17T23:59:00Z"),
        points: 100,
        submissionType: "Text",
        status: ClassAssignmentStatus.PUBLISHED
      }
    });
    const submitted = await prisma.classAssignment.create({
      data: {
        classId: schoolClass.id,
        createdById: definition.teacherUser.id,
        title: `${definition.task} — first draft`,
        description: "Submit a first draft for teacher review.",
        dueAt: new Date("2026-07-08T23:59:00Z"),
        points: 100,
        submissionType: "Text",
        status: ClassAssignmentStatus.PUBLISHED
      }
    });
    const graded = await prisma.classAssignment.create({
      data: {
        classId: schoolClass.id,
        createdById: definition.teacherUser.id,
        title: `${definition.task} — checkpoint`,
        description: "Short checkpoint completed during the previous learning session.",
        dueAt: new Date("2026-07-02T23:59:00Z"),
        points: 100,
        submissionType: "Text",
        status: ClassAssignmentStatus.CLOSED
      }
    });
    await prisma.classSubmission.create({
      data: {
        assignmentId: submitted.id,
        studentId: sofia.id,
        body: "I completed the first draft and included the steps I followed.",
        status: ClassSubmissionStatus.SUBMITTED,
        submittedAt: new Date("2026-07-07T15:30:00Z")
      }
    });
    await prisma.classSubmission.create({
      data: {
        assignmentId: graded.id,
        studentId: daniel.id,
        body: "Checkpoint response with examples and a brief conclusion.",
        status: ClassSubmissionStatus.GRADED,
        submittedAt: new Date("2026-07-02T14:15:00Z"),
        score: 88,
        feedback: "Good progress. Add one more example and explain your conclusion more clearly."
      }
    });
    void pending;

    demoClasses.push({
      id: schoolClass.id,
      code: schoolClass.code,
      teacherId: definition.teacher.id,
      teacherUserId: definition.teacherUser.id,
      classSubjects
    });
  }

  const allPaces = await prisma.pace.findMany({ orderBy: [{ subjectId: "asc" }, { sequence: "asc" }] });
  for (const [studentIndex, student] of students.entries()) {
    for (const demoClass of demoClasses) {
      for (const classSubject of demoClass.classSubjects) {
        const subjectPaces = allPaces.filter((pace) => pace.subjectId === classSubject.subjectId);
        for (const [paceIndex, pace] of subjectPaces.entries()) {
          const completed = paceIndex < studentIndex;
          const current = paceIndex === studentIndex;
          const record = await prisma.studentPaceRecord.create({
            data: {
              studentId: student.id,
              classSubjectId: classSubject.id,
              paceId: pace.id,
              academicTermId: term.id,
              status: completed
                ? PaceProgressStatus.COMPLETED
                : current
                  ? PaceProgressStatus.CURRENT
                  : PaceProgressStatus.PLANNED,
              startedAt: completed || current ? new Date("2026-07-01T13:00:00Z") : undefined,
              completedAt: completed ? new Date("2026-07-03T16:00:00Z") : undefined
            }
          });
          if (completed) {
            await prisma.paceGrade.create({
              data: {
                studentPaceRecordId: record.id,
                score: 82 + studentIndex * 4 + paceIndex,
                feedback: "Solid understanding. Continue explaining each step with clear evidence.",
                status: PaceGradeStatus.GRADED,
                gradedById: demoClass.teacherUserId,
                gradedAt: new Date("2026-07-03T17:00:00Z")
              }
            });
          }
        }
      }
    }
  }

  await createConversation({
    subject: "Question about the English reading activity",
    createdById: sofiaUser.id,
    participants: [
      [sofiaUser.id, ConversationParticipantType.STUDENT],
      [lauraUser.id, ConversationParticipantType.TEACHER]
    ],
    messages: [
      [sofiaUser.id, "Teacher Laura, could you clarify the final question in the reading activity?"],
      [lauraUser.id, "Of course. Compare the main character’s decision with the evidence in paragraph four."]
    ]
  });
  await createConversation({
    subject: "Mathematics assignment submission",
    createdById: danielUser.id,
    participants: [
      [danielUser.id, ConversationParticipantType.STUDENT],
      [joseUser.id, ConversationParticipantType.TEACHER]
    ],
    messages: [
      [danielUser.id, "José Pablo, I submitted the fractions activity. Could you confirm it is visible?"],
      [joseUser.id, "Yes, Daniel. It is visible and ready for review. Thank you for the clear steps."]
    ]
  });
  await createConversation({
    subject: "Academic follow-up request",
    createdById: andreaUser.id,
    status: ConversationStatus.ESCALATED,
    escalatedAt: new Date("2026-07-03T14:00:00Z"),
    participants: [
      [andreaUser.id, ConversationParticipantType.STUDENT],
      [joseUser.id, ConversationParticipantType.TEACHER],
      [gabrielaUser.id, ConversationParticipantType.DIRECTOR]
    ],
    messages: [
      [andreaUser.id, "I would like support organizing my Mathematics study plan."],
      [joseUser.id, "I am escalating this request so we can coordinate a clear follow-up plan."],
      [gabrielaUser.id, "Thank you, Andrea. We will review your plan together this week."]
    ]
  });

  const bookingDefinitions = [
    {
      student: daniel,
      demoClass: demoClasses[2],
      classSubject: demoClasses[2].classSubjects[0],
      weekday: Weekday.MONDAY,
      date: new Date("2026-07-13T00:00:00Z"),
      startTime: "10:00",
      endTime: "10:45",
      status: PhysicalBookingStatus.PENDING,
      note: "I would like help reviewing map coordinates.",
      response: null
    },
    {
      student: sofia,
      demoClass: demoClasses[0],
      classSubject: demoClasses[0].classSubjects[0],
      weekday: Weekday.TUESDAY,
      date: new Date("2026-07-14T00:00:00Z"),
      startTime: "09:00",
      endTime: "09:45",
      status: PhysicalBookingStatus.APPROVED,
      note: "I want to practice the reading presentation.",
      response: "Approved. Please bring your reading notes."
    },
    {
      student: andrea,
      demoClass: demoClasses[1],
      classSubject: demoClasses[1].classSubjects[0],
      weekday: Weekday.WEDNESDAY,
      date: new Date("2026-07-22T00:00:00Z"),
      startTime: "11:00",
      endTime: "11:45",
      status: PhysicalBookingStatus.PENDING,
      note: "I need support with the fractions checkpoint.",
      response: "Wednesday at 11:00 works better for this review. Please confirm you can attend."
    }
  ];
  for (const booking of bookingDefinitions) {
    const slot = await prisma.teacherAvailabilitySlot.create({
      data: {
        classSubjectId: booking.classSubject.id,
        teacherId: booking.demoClass.teacherId,
        weekday: booking.weekday,
        startTime: booking.startTime,
        endTime: booking.endTime,
        location: "Philadelphia campus · Learning room",
        instructions: "Bring the current PACE and any questions."
      }
    });
    await prisma.studentPhysicalBooking.create({
      data: {
        studentId: booking.student.id,
        classSubjectId: booking.classSubject.id,
        teacherId: booking.demoClass.teacherId,
        availabilitySlotId: slot.id,
        scheduledDate: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        studentNote: booking.note,
        teacherResponse: booking.response
      }
    });
  }

  await createDemoSchedule(year.id, grade.id, demoClasses);

  const counts = await validateDemoData();
  process.stdout.write(`Demo seed complete: ${JSON.stringify(counts)}; director ${director.id}.\n`);
}

async function validateDemoData() {
  const [users, classes, materials, assignments, submissions, conversations, bookings, paceRecords, paceGrades] =
    await Promise.all([
      prisma.user.count(),
      prisma.academicClass.count(),
      prisma.classMaterial.count(),
      prisma.classAssignment.count(),
      prisma.classSubmission.count(),
      prisma.conversation.count(),
      prisma.studentPhysicalBooking.count(),
      prisma.studentPaceRecord.count(),
      prisma.paceGrade.count()
    ]);
  const counts = {
    users,
    classes,
    materials,
    assignments,
    submissions,
    conversations,
    bookings,
    paceRecords,
    paceGrades
  };
  const expected = {
    users: 7,
    classes: 3,
    materials: 9,
    assignments: 9,
    submissions: 6,
    conversations: 3,
    bookings: 3,
    paceRecords: 42,
    paceGrades: 12
  };
  for (const [key, value] of Object.entries(expected)) {
    if (counts[key as keyof typeof counts] !== value) {
      throw new Error(
        `Demo seed validation failed for ${key}: expected ${value}, received ${counts[key as keyof typeof counts]}`
      );
    }
  }
  return counts;
}

async function createConversation(input: {
  subject: string;
  createdById: string;
  status?: ConversationStatus;
  escalatedAt?: Date;
  participants: Array<[string, ConversationParticipantType]>;
  messages: Array<[string, string]>;
}) {
  await prisma.conversation.create({
    data: {
      subject: input.subject,
      createdById: input.createdById,
      status: input.status ?? ConversationStatus.OPEN,
      escalatedAt: input.escalatedAt,
      participants: {
        create: input.participants.map(([userId, type]) => ({ userId, type }))
      },
      messages: {
        create: input.messages.map(([senderId, body], index) => ({
          senderId,
          body,
          createdAt: new Date(Date.UTC(2026, 6, 3, 13, index * 10))
        }))
      }
    }
  });
}

async function createDemoSchedule(
  academicYearId: string,
  gradeLevelId: string,
  classes: Array<{
    teacherId: string;
    classSubjects: Array<{ id: string }>;
  }>
) {
  const grid = await prisma.scheduleGrid.findFirst({
    where: { isActive: true },
    include: { periods: { orderBy: { order: "asc" } } }
  });
  if (!grid) return;

  const template = await prisma.scheduleTemplate.create({
    data: {
      academicYearId,
      gradeLevelId,
      gridId: grid.id,
      name: "Eighth Grade Demo Schedule",
      status: ScheduleTemplateStatus.PUBLISHED,
      publishedAt: new Date("2026-07-01T12:00:00Z")
    }
  });
  const weekdays = [
    Weekday.MONDAY,
    Weekday.TUESDAY,
    Weekday.WEDNESDAY,
    Weekday.THURSDAY,
    Weekday.FRIDAY
  ];
  const instructional = grid.periods.filter(
    (period) => period.kind === SchedulePeriodKind.INSTRUCTIONAL
  );
  await prisma.scheduleTemplateBlock.createMany({
    data: instructional.flatMap((period) =>
      weekdays.map((weekday, dayIndex) => {
        const current = classes[(period.order + dayIndex) % classes.length];
        const classSubject = current.classSubjects[0];
        if (period.order === 1) {
          return {
            templateId: template.id,
            periodId: period.id,
            weekday,
            kind: ScheduleBlockKind.ACTIVITY,
            label: "Opening and daily goals"
          };
        }
        if (period.order % 3 === 0) {
          return {
            templateId: template.id,
            periodId: period.id,
            weekday,
            kind: ScheduleBlockKind.PACES,
            label: "PACE workshop",
            teacherId: current.teacherId
          };
        }
        return {
          templateId: template.id,
          periodId: period.id,
          weekday,
          kind: ScheduleBlockKind.SUBJECT,
          classSubjectId: classSubject.id,
          teacherId: current.teacherId
        };
      })
    )
  });
}

main()
  .catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
