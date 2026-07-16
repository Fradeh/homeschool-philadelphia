import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  PaceGradeStatus,
  PaceProgressStatus,
  PaceReconciliationResult,
  PaceRecordSummary,
  TeacherPaceWorkspace,
  UserRole
} from "@homeschool/shared";
import { Prisma, RoleName } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { GradePaceDto, SetStudentPaceGoalDto, UpdatePaceGradeDto, UpdatePaceStatusDto } from "./dto/academic-paces.dto";

const paceRecordInclude = {
  student: { include: { user: true } },
  classSubject: {
    include: {
      class: true,
      subject: true
    }
  },
  pace: true,
  academicTerm: { include: { academicYear: true } },
  grade: true
} satisfies Prisma.StudentPaceRecordInclude;

type PaceRecordWithRelations = Prisma.StudentPaceRecordGetPayload<{ include: typeof paceRecordInclude }>;
type PaceRecordCandidate = Prisma.StudentPaceRecordCreateManyInput;

@Injectable()
export class AcademicPacesService {
  constructor(private readonly prisma: PrismaService) {}

  async teacherWorkspace(userId: string, roles: UserRole[]): Promise<TeacherPaceWorkspace> {
    const activeTerm = await this.getActiveTerm();
    if (!activeTerm) {
      return { activeTerm: null, records: [], needsReconcile: false, missingRecordsCount: 0, goals: [], availableGoals: [] };
    }

    const teacherId = await this.getTeacherProfileId(userId, roles);
    const candidatePlan = await this.getTeacherRecordCandidates(teacherId, activeTerm.id);

    const records = await this.prisma.studentPaceRecord.findMany({
      where: {
        academicTermId: activeTerm.id,
        classSubject: {
          teachers: { some: { teacherId } },
          subject: { paceEnabled: true }
        }
      },
      include: paceRecordInclude,
      orderBy: [
        { student: { user: { lastName: "asc" } } },
        { student: { user: { firstName: "asc" } } },
        { classSubject: { subject: { name: "asc" } } },
        { paceNumber: "asc" }
      ]
    });

    const existingKeys = new Set(records.map((record) => paceRecordKey(record)));
    const missingRecordsCount = candidatePlan.candidates.filter(
      (candidate) => !existingKeys.has(paceRecordKey(candidate))
    ).length;

    const goalData = await this.getTeacherGoalData(teacherId, activeTerm.id);
    const goalByRecord = new Map(
      goalData.goals.map((goal) => [`${goal.student.profileId}:${goal.subject.classSubjectId}`, goal.targetPaces])
    );
    return {
      activeTerm: {
        id: activeTerm.id,
        name: activeTerm.name,
        order: activeTerm.order,
        academicYearName: activeTerm.academicYear.name
      },
      records: records.map((record) => this.mapRecord(record, goalByRecord.get(`${record.studentId}:${record.classSubjectId}`))),
      needsReconcile: missingRecordsCount > 0,
      missingRecordsCount,
      goals: goalData.goals,
      availableGoals: goalData.availableGoals
    };
  }

  async setStudentPaceGoal(userId: string, roles: UserRole[], dto: SetStudentPaceGoalDto) {
    const activeTerm = await this.getActiveTerm();
    if (!activeTerm) throw new BadRequestException("No hay un período académico activo");
    const classSubject = await this.prisma.classSubject.findUnique({
      where: { id: dto.classSubjectId },
      include: {
        class: { include: { enrollments: { where: { studentId: dto.studentId, status: "ACTIVE" } } } },
        teachers: true,
        subject: { include: { paces: { orderBy: { sequence: "asc" } } } }
      }
    });
    if (!classSubject || !classSubject.class.enrollments.length) {
      throw new NotFoundException("El estudiante no está matriculado en esta materia");
    }
    if (!classSubject.subject.paceEnabled) {
      throw new BadRequestException("Esta materia no está habilitada para trabajar con PACEs");
    }
    if (!roles.includes(UserRole.ADMIN)) {
      const teacher = await this.getTeacherProfileId(userId, roles);
      if (!classSubject.teachers.some((item) => item.teacherId === teacher)) {
        throw new ForbiddenException("No puedes definir la meta de esta materia");
      }
    }
    const goalKey = { studentId: dto.studentId, classSubjectId: dto.classSubjectId, academicTermId: activeTerm.id };
    const [existingRecords, existingGoal] = await Promise.all([
      this.prisma.studentPaceRecord.findMany({
        where: goalKey,
        select: { id: true, paceNumber: true, status: true, grade: { select: { id: true } } },
        orderBy: { paceNumber: "asc" }
      }),
      this.prisma.studentPaceGoal.findUnique({ where: { studentId_classSubjectId_academicTermId: goalKey } })
    ]);
    const removable = existingRecords.filter((record) => record.status === PaceProgressStatus.PLANNED && !record.grade);
    const recordsToRemove = existingRecords.length > dto.targetPaces
      ? removable.slice().sort((left, right) => right.paceNumber - left.paceNumber).slice(0, existingRecords.length - dto.targetPaces)
      : [];
    if (existingRecords.length - recordsToRemove.length > dto.targetPaces) {
      throw new BadRequestException("La cantidad no puede ser menor que los PACEs en curso, completados o calificados");
    }
    const mustRenumber = existingGoal?.startingPaceNumber !== dto.startingPaceNumber;
    if (recordsToRemove.length || (existingRecords.length && mustRenumber)) {
      return this.prisma.$transaction(async (tx) => {
        if (recordsToRemove.length) {
          await tx.studentPaceRecord.deleteMany({ where: { id: { in: recordsToRemove.map((record) => record.id) } } });
        }
        if (mustRenumber) {
          await tx.studentPaceRecord.updateMany({ where: goalKey, data: { paceNumber: { increment: 100000 } } });
          const records = await tx.studentPaceRecord.findMany({ where: goalKey, orderBy: { paceNumber: "asc" }, select: { id: true } });
          await Promise.all(records.map((record, index) => tx.studentPaceRecord.update({ where: { id: record.id }, data: { paceNumber: dto.startingPaceNumber + index } })));
        }
        return tx.studentPaceGoal.upsert({
          where: { studentId_classSubjectId_academicTermId: goalKey },
          update: { targetPaces: dto.targetPaces, startingPaceNumber: dto.startingPaceNumber },
          create: { ...goalKey, targetPaces: dto.targetPaces, startingPaceNumber: dto.startingPaceNumber }
        });
      });
    }
    return this.prisma.studentPaceGoal.upsert({
      where: { studentId_classSubjectId_academicTermId: goalKey },
      update: { targetPaces: dto.targetPaces, startingPaceNumber: dto.startingPaceNumber },
      create: { ...goalKey, targetPaces: dto.targetPaces, startingPaceNumber: dto.startingPaceNumber }
    });
  }

  async reconcileTeacherWorkspace(
    userId: string,
    roles: UserRole[]
  ): Promise<PaceReconciliationResult> {
    const activeTerm = await this.getActiveTerm();
    if (!activeTerm) return { createdCount: 0, existingCount: 0, skippedCount: 0 };

    const teacherId = await this.getTeacherProfileId(userId, roles);
    const plan = await this.getTeacherRecordCandidates(teacherId, activeTerm.id);
    if (!plan.candidates.length) {
      return { createdCount: 0, existingCount: 0, skippedCount: plan.skippedCount };
    }

    const existing = await this.prisma.studentPaceRecord.findMany({
      where: {
        academicTermId: activeTerm.id,
        studentId: { in: [...new Set(plan.candidates.map((item) => item.studentId))] },
        classSubjectId: { in: [...new Set(plan.candidates.map((item) => item.classSubjectId))] },
        paceNumber: { in: [...new Set(plan.candidates.map((item) => item.paceNumber))] }
      },
      select: { studentId: true, classSubjectId: true, paceNumber: true, academicTermId: true }
    });
    const existingKeys = new Set(existing.map((record) => paceRecordKey(record)));
    const missing = plan.candidates.filter((candidate) => !existingKeys.has(paceRecordKey(candidate)));
    const created = missing.length
      ? await this.prisma.studentPaceRecord.createMany({ data: missing, skipDuplicates: true })
      : { count: 0 };

    return {
      createdCount: created.count,
      existingCount: plan.candidates.length - missing.length + (missing.length - created.count),
      skippedCount: plan.skippedCount
    };
  }

  async updatePaceStatus(userId: string, roles: UserRole[], recordId: string, dto: UpdatePaceStatusDto) {
    await this.ensureTeacherOwnsRecord(userId, roles, recordId);

    const updated = await this.prisma.studentPaceRecord.update({
      where: { id: recordId },
      data: {
        status: dto.status,
        startedAt: dto.status === PaceProgressStatus.CURRENT ? new Date() : dto.status === PaceProgressStatus.PLANNED ? null : undefined,
        completedAt: dto.status === PaceProgressStatus.COMPLETED ? new Date() : dto.status === PaceProgressStatus.PLANNED || dto.status === PaceProgressStatus.CURRENT ? null : undefined
      },
      include: paceRecordInclude
    });

    return this.mapRecord(updated);
  }

  async gradePace(userId: string, roles: UserRole[], recordId: string, dto: GradePaceDto) {
    await this.ensureTeacherOwnsRecord(userId, roles, recordId);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.studentPaceRecord.update({
        where: { id: recordId },
        data: {
          status: PaceProgressStatus.COMPLETED,
          completedAt: new Date()
        }
      });

      await tx.paceGrade.upsert({
        where: { studentPaceRecordId: recordId },
        update: {
          score: dto.score,
          feedback: dto.feedback,
          status: PaceGradeStatus.GRADED,
          gradedById: userId,
          gradedAt: new Date()
        },
        create: {
          studentPaceRecordId: recordId,
          score: dto.score,
          feedback: dto.feedback,
          status: PaceGradeStatus.GRADED,
          gradedById: userId
        }
      });

      return tx.studentPaceRecord.findUniqueOrThrow({
        where: { id: recordId },
        include: paceRecordInclude
      });
    });

    return this.mapRecord(updated);
  }

  async updateGrade(userId: string, roles: UserRole[], gradeId: string, dto: UpdatePaceGradeDto) {
    const grade = await this.prisma.paceGrade.findUnique({
      where: { id: gradeId },
      select: { studentPaceRecordId: true }
    });

    if (!grade) {
      throw new NotFoundException("Grade not found");
    }

    await this.ensureTeacherOwnsRecord(userId, roles, grade.studentPaceRecordId);

    const updated = await this.prisma.paceGrade.update({
      where: { id: gradeId },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        status: dto.status
      },
      select: { studentPaceRecordId: true }
    });

    const record = await this.prisma.studentPaceRecord.findUniqueOrThrow({
      where: { id: updated.studentPaceRecordId },
      include: paceRecordInclude
    });

    return this.mapRecord(record);
  }

  async teacherGrades(userId: string, roles: UserRole[]) {
    const workspace = await this.teacherWorkspace(userId, roles);
    return workspace.records.filter((record) => record.status === PaceProgressStatus.COMPLETED);
  }

  async studentPaces(userId: string, roles: UserRole[]) {
    const activeTerm = await this.getActiveTerm();
    if (!activeTerm) return [];

    const studentId = await this.getStudentProfileId(userId, roles);

    const records = await this.prisma.studentPaceRecord.findMany({
      where: { studentId, academicTermId: activeTerm.id },
      include: paceRecordInclude,
      orderBy: [
        { classSubject: { subject: { name: "asc" } } },
        { paceNumber: "asc" }
      ]
    });
    const goals = await this.prisma.studentPaceGoal.findMany({
      where: { studentId, academicTermId: activeTerm.id },
      select: { classSubjectId: true, targetPaces: true }
    });
    const targets = new Map(goals.map((goal) => [goal.classSubjectId, goal.targetPaces]));
    return records.map((record) => this.mapRecord(record, targets.get(record.classSubjectId)));
  }

  async studentGrades(userId: string, roles: UserRole[]) {
    const records = await this.studentPaces(userId, roles);
    return records.filter((record) => record.status === PaceProgressStatus.COMPLETED);
  }

  private async getTeacherRecordCandidates(teacherId: string, academicTermId: string) {
    const goals = await this.prisma.studentPaceGoal.findMany({
      where: { academicTermId, classSubject: { teachers: { some: { teacherId } }, subject: { paceEnabled: true } } },
      include: { classSubject: { include: { subject: true } } }
    });
    const candidates = new Map<string, PaceRecordCandidate>();
    let skippedCount = 0;
    for (const goal of goals) {
      for (let offset = 0; offset < goal.targetPaces; offset += 1) {
        const candidate: PaceRecordCandidate = {
          studentId: goal.studentId,
          classSubjectId: goal.classSubjectId,
          paceNumber: goal.startingPaceNumber + offset,
          academicTermId,
          status: offset === 0 ? PaceProgressStatus.CURRENT : PaceProgressStatus.PLANNED,
          startedAt: offset === 0 ? new Date() : null
        };
        candidates.set(paceRecordKey(candidate), candidate);
      }
    }

    return { candidates: [...candidates.values()], skippedCount };
  }

  private async getTeacherGoalData(teacherId: string, academicTermId: string) {
    const [goals, classes] = await Promise.all([
      this.prisma.studentPaceGoal.findMany({
        where: { academicTermId, classSubject: { teachers: { some: { teacherId } }, subject: { paceEnabled: true } } },
        include: { student: { include: { user: true } }, classSubject: { include: { class: true, subject: { include: { paces: true } } } } }
      }),
      this.prisma.academicClass.findMany({
        where: { subjects: { some: { teachers: { some: { teacherId } }, subject: { paceEnabled: true } } } },
        include: { enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: true } } } }, subjects: { where: { teachers: { some: { teacherId } }, subject: { paceEnabled: true } }, include: { subject: { include: { paces: true } } } } }
      })
    ]);
    const goalKeys = new Set(goals.map((goal) => `${goal.studentId}:${goal.classSubjectId}`));
    const person = (student: typeof goals[number]["student"]) => ({ id: student.user.id, profileId: student.id, firstName: student.user.firstName, lastName: student.user.lastName, displayName: `${student.user.firstName} ${student.user.lastName}`, email: student.user.email, gradeLevel: student.gradeLevel });
    const subject = (item: { id: string; subject: { id: string; name: string; shortName: string; color: string | null } }, targetPaces: number) => ({ id: item.subject.id, classSubjectId: item.id, name: item.subject.name, shortName: item.subject.shortName, color: item.subject.color, targetPaces });
    const goalSummaries = goals.map((goal) => ({ student: person(goal.student), class: { id: goal.classSubject.class.id, name: goal.classSubject.class.name, code: goal.classSubject.class.code }, subject: subject(goal.classSubject, goal.targetPaces), targetPaces: goal.targetPaces, startingPaceNumber: goal.startingPaceNumber, availablePaces: 20 }));
    const availableGoals = classes.flatMap((schoolClass) => schoolClass.subjects.flatMap((classSubject) => schoolClass.enrollments.flatMap((enrollment) => {
      const key = `${enrollment.studentId}:${classSubject.id}`;
      return goalKeys.has(key) ? [] : [{ student: person(enrollment.student), class: { id: schoolClass.id, name: schoolClass.name, code: schoolClass.code }, subject: subject(classSubject, 0), availablePaces: 20 }];
    })));
    return { goals: goalSummaries, availableGoals };
  }

  private async getActiveTerm() {
    return this.prisma.academicTerm.findFirst({
      where: { isActive: true },
      include: { academicYear: true },
      orderBy: [{ academicYear: { startsAt: "desc" } }, { order: "asc" }]
    });
  }

  private async getTeacherProfileId(userId: string, roles: UserRole[]) {
    if (roles.includes(UserRole.ADMIN)) {
      const teacher = await this.prisma.teacherProfile.findFirst({ select: { id: true } });
      if (teacher) return teacher.id;
    }

    const teacher = await this.prisma.teacherProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new ForbiddenException("Teacher profile not found");
    return teacher.id;
  }

  private async getStudentProfileId(userId: string, roles: UserRole[]) {
    if (roles.includes(UserRole.ADMIN)) {
      const student = await this.prisma.studentProfile.findFirst({ select: { id: true } });
      if (student) return student.id;
    }

    const student = await this.prisma.studentProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!student) throw new ForbiddenException("Student profile not found");
    return student.id;
  }

  private async ensureTeacherOwnsRecord(userId: string, roles: UserRole[], recordId: string) {
    if (roles.includes(UserRole.ADMIN)) {
      const exists = await this.prisma.studentPaceRecord.findUnique({ where: { id: recordId }, select: { id: true } });
      if (exists) return;
      throw new NotFoundException("PACE record not found");
    }

    const teacher = await this.prisma.teacherProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new ForbiddenException("Teacher profile not found");

    const record = await this.prisma.studentPaceRecord.findFirst({
      where: {
        id: recordId,
        classSubject: { teachers: { some: { teacherId: teacher.id } } }
      },
      select: { id: true }
    });

    if (!record) throw new ForbiddenException("PACE record is not assigned to this teacher");
  }

  private mapRecord(record: PaceRecordWithRelations, targetPaces = record.classSubject.targetPaces): PaceRecordSummary {
    return {
      id: record.id,
      student: {
        id: record.student.user.id,
        profileId: record.student.id,
        firstName: record.student.user.firstName,
        lastName: record.student.user.lastName,
        displayName: `${record.student.user.firstName} ${record.student.user.lastName}`,
        email: record.student.user.email,
        gradeLevel: record.student.gradeLevel
      },
      class: {
        id: record.classSubject.class.id,
        name: record.classSubject.class.name,
        code: record.classSubject.class.code
      },
      subject: {
        id: record.classSubject.subject.id,
        classSubjectId: record.classSubject.id,
        name: record.classSubject.subject.name,
        shortName: record.classSubject.subject.shortName,
        color: record.classSubject.subject.color,
        targetPaces
      },
      pace: {
        id: record.pace?.id ?? record.id,
        number: record.paceNumber,
        title: record.pace?.title
      },
      academicTerm: {
        id: record.academicTerm.id,
        name: record.academicTerm.name,
        order: record.academicTerm.order,
        academicYearName: record.academicTerm.academicYear.name
      },
      status: record.status as PaceProgressStatus,
      startedAt: record.startedAt?.toISOString() ?? null,
      completedAt: record.completedAt?.toISOString() ?? null,
      grade: record.grade
        ? {
            id: record.grade.id,
            score: record.grade.score,
            feedback: record.grade.feedback,
            status: record.grade.status as PaceGradeStatus,
            gradedAt: record.grade.gradedAt.toISOString(),
            updatedAt: record.grade.updatedAt.toISOString()
          }
        : null
    };
  }
}

function paceRecordKey(record: {
  studentId: string;
  classSubjectId: string;
  paceNumber: number;
  academicTermId: string;
}) {
  return `${record.studentId}:${record.classSubjectId}:${record.paceNumber}:${record.academicTermId}`;
}
