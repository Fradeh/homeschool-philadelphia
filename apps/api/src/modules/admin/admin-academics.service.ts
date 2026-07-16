import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AcademicStatus,
  AdminAcademicOverview,
  AdminAcademicYearSummary,
  AdminClassSummary,
  AdminFamilyLinkSummary,
  AdminSubjectSummary,
  AdminUserSummary,
  UserRole
} from "@homeschool/shared";
import { RoleName } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import {
  AssignClassSubjectDto,
  AssignClassTeacherDto,
  CreateAcademicTermDto,
  CreateAcademicYearDto,
  CreateAdminClassDto,
  CreateAdminSubjectDto,
  CreateAdminUserDto,
  EnrollClassStudentDto,
  UpdateAdminSubjectDto,
  UpdateFamilyLinkDto,
  UpsertFamilyLinkDto
} from "./dto/admin-academics.dto";

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  isActive: true,
  createdAt: true,
  roles: { include: { role: true } },
  studentProfile: { select: { id: true, gradeLevelId: true } },
  teacherProfile: { select: { id: true } },
  parentProfile: { select: { id: true } },
  directorProfile: { select: { id: true } }
};

type AdminUserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  roles: Array<{ role: { name: RoleName } }>;
  studentProfile?: { id: string; gradeLevelId: string | null } | null;
  teacherProfile?: { id: string } | null;
  parentProfile?: { id: string } | null;
  directorProfile?: { id: string } | null;
};

@Injectable()
export class AdminAcademicsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(): Promise<AdminAcademicOverview> {
    const [users, classes, activeClasses, subjects, activeSubjects, familyLinks] = await this.prisma.$transaction([
      this.prisma.user.findMany({ select: { roles: { include: { role: true } } } }),
      this.prisma.academicClass.count(),
      this.prisma.academicClass.count({ where: { status: AcademicStatus.ACTIVE } }),
      this.prisma.subject.count(),
      this.prisma.subject.count({ where: { status: AcademicStatus.ACTIVE } }),
      this.prisma.studentParent.count()
    ]);

    return {
      users: {
        total: users.length,
        teachers: users.filter((user) => user.roles.some(({ role }) => role.name === RoleName.TEACHER)).length,
        students: users.filter((user) => user.roles.some(({ role }) => role.name === RoleName.STUDENT)).length,
        parents: users.filter((user) => user.roles.some(({ role }) => role.name === RoleName.PARENT)).length,
        directors: users.filter((user) => user.roles.some(({ role }) =>
          role.name === RoleName.ADMINISTRATIVE || role.name === RoleName.DIRECTOR
        )).length
      },
      classes: { total: classes, active: activeClasses },
      subjects: { total: subjects, active: activeSubjects },
      familyLinks: { total: familyLinks }
    };
  }

  async academicYears(): Promise<AdminAcademicYearSummary[]> {
    const years = await this.prisma.academicYear.findMany({
      include: { terms: { orderBy: { order: "asc" } } },
      orderBy: [{ isActive: "desc" }, { startsAt: "desc" }]
    });

    return years.map((year) => ({
      id: year.id,
      name: year.name,
      startsAt: year.startsAt.toISOString(),
      endsAt: year.endsAt.toISOString(),
      isActive: year.isActive,
      terms: year.terms.map((term) => ({
        id: term.id,
        academicYearId: term.academicYearId,
        name: term.name,
        order: term.order,
        startsAt: term.startsAt.toISOString(),
        endsAt: term.endsAt.toISOString(),
        isActive: term.isActive
      }))
    }));
  }

  async createAcademicYear(dto: CreateAcademicYearDto): Promise<AdminAcademicYearSummary> {
    const year = await this.prisma.$transaction(async (tx) => {
      if (dto.isActive) {
        await tx.academicYear.updateMany({ where: { isActive: true }, data: { isActive: false } });
      }

      return tx.academicYear.create({
        data: {
          name: dto.name,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          isActive: dto.isActive ?? false
        },
        include: { terms: { orderBy: { order: "asc" } } }
      });
    });

    return (await this.academicYears()).find((item) => item.id === year.id)!;
  }

  async activateAcademicYear(academicYearId: string): Promise<AdminAcademicYearSummary> {
    await this.prisma.$transaction([
      this.prisma.academicYear.updateMany({ where: { isActive: true }, data: { isActive: false } }),
      this.prisma.academicYear.update({ where: { id: academicYearId }, data: { isActive: true } })
    ]);

    const year = (await this.academicYears()).find((item) => item.id === academicYearId);
    if (!year) {
      throw new NotFoundException("Academic year not found");
    }

    return year;
  }

  async createAcademicTerm(academicYearId: string, dto: CreateAcademicTermDto): Promise<AdminAcademicYearSummary> {
    await this.prisma.$transaction(async (tx) => {
      if (dto.isActive) {
        await tx.academicTerm.updateMany({
          where: { academicYearId, isActive: true },
          data: { isActive: false }
        });
      }

      await tx.academicTerm.create({
        data: {
          academicYearId,
          name: dto.name,
          order: dto.order,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          isActive: dto.isActive ?? false
        }
      });
    });

    const year = (await this.academicYears()).find((item) => item.id === academicYearId);
    if (!year) {
      throw new NotFoundException("Academic year not found");
    }

    return year;
  }

  async users(role?: UserRole): Promise<AdminUserSummary[]> {
    const users = await this.prisma.user.findMany({
      where: role ? { roles: { some: { role: { name: role as RoleName } } } } : undefined,
      select: userSelect,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    });

    return users.map((user) => this.mapUser(user));
  }

  async createUser(dto: CreateAdminUserDto): Promise<AdminUserSummary> {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.upsert({
        where: { name: dto.role as RoleName },
        update: {},
        create: { name: dto.role as RoleName }
      });
      const teacherRole = dto.role === UserRole.ADMINISTRATIVE
        ? await tx.role.upsert({
            where: { name: RoleName.TEACHER },
            update: {},
            create: { name: RoleName.TEACHER }
          })
        : null;

      const created = await tx.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash,
          roles: {
            create: [role, teacherRole]
              .filter((item): item is typeof role => Boolean(item))
              .map((item) => ({ roleId: item.id }))
          }
        },
        select: userSelect
      });

      if (dto.role === UserRole.STUDENT) {
        await tx.studentProfile.create({
          data: {
            userId: created.id,
            studentCode: dto.studentCode,
            gradeLevel: dto.gradeLevel,
            gradeLevelId: dto.gradeLevelId
          }
        });
      }

      if (dto.role === UserRole.TEACHER || dto.role === UserRole.ADMINISTRATIVE) {
        await tx.teacherProfile.create({
          data: {
            userId: created.id,
            employeeCode: dto.employeeCode
          }
        });
      }

      if (dto.role === UserRole.PARENT) {
        await tx.parentProfile.create({
          data: {
            userId: created.id,
            phone: dto.parentPhone
          }
        });
      }

      if (dto.role === UserRole.DIRECTOR || dto.role === UserRole.ADMINISTRATIVE) {
        await tx.directorProfile.create({
          data: {
            userId: created.id,
            title: dto.directorTitle
          }
        });
      }

      return tx.user.findUniqueOrThrow({ where: { id: created.id }, select: userSelect });
    });

    return this.mapUser(user);
  }

  async configureAdministrative(userId: string, actorId: string): Promise<AdminUserSummary> {
    if (userId === actorId) {
      throw new BadRequestException("You cannot remove your own administrator access");
    }
    const user = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
      if (!existing) throw new NotFoundException("User not found");

      const roles = await Promise.all(
        [RoleName.TEACHER, RoleName.ADMINISTRATIVE].map((name) =>
          tx.role.upsert({ where: { name }, update: {}, create: { name } })
        )
      );
      await tx.userRole.deleteMany({
        where: { userId, role: { name: { in: [RoleName.ADMIN, RoleName.DIRECTOR] } } }
      });
      await Promise.all(roles.map((role) => tx.userRole.upsert({
        where: { userId_roleId: { userId, roleId: role.id } },
        update: {},
        create: { userId, roleId: role.id }
      })));
      await tx.teacherProfile.upsert({
        where: { userId },
        update: { status: "ACTIVE" },
        create: { userId }
      });
      await tx.directorProfile.upsert({
        where: { userId },
        update: { status: "ACTIVE" },
        create: { userId, title: "Dirección" }
      });
      return tx.user.findUniqueOrThrow({ where: { id: userId }, select: userSelect });
    });
    return this.mapUser(user);
  }

  async classes(): Promise<AdminClassSummary[]> {
    const classes = await this.prisma.academicClass.findMany({
      include: {
        academicYear: true,
        gradeLevel: true,
        teachers: {
          include: {
            teacher: {
              include: {
                user: { select: userSelect }
              }
            }
          }
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: { select: userSelect }
              }
            }
          }
        },
        subjects: {
          include: {
            subject: { include: { paces: true } },
            teachers: { include: { teacher: { include: { user: true } } } }
          }
        }
      },
      orderBy: [{ status: "asc" }, { name: "asc" }]
    });

    return classes.map((schoolClass) => ({
      id: schoolClass.id,
      academicYearId: schoolClass.academicYearId,
      academicYearName: schoolClass.academicYear.name,
      name: schoolClass.name,
      code: schoolClass.code,
      description: schoolClass.description,
      color: schoolClass.color,
      status: schoolClass.status as AcademicStatus,
      gradeLevelId: schoolClass.gradeLevelId,
      gradeLevelName: schoolClass.gradeLevel?.name ?? null,
      teachers: schoolClass.teachers.map(({ teacher }) => this.mapUser(teacher.user)),
      students: schoolClass.enrollments.map(({ student }) => this.mapUser(student.user)),
      subjects: schoolClass.subjects.map((classSubject) => ({
        id: classSubject.id,
        subjectId: classSubject.subjectId,
        subjectName: classSubject.subject.name,
        subjectShortName: classSubject.subject.shortName,
        targetPaces: classSubject.targetPaces,
        paceCount: classSubject.subject.paces.length,
        paceEnabled: classSubject.subject.paceEnabled,
        color: classSubject.subject.color,
        teachers: classSubject.teachers.map(({ teacher }) => ({
          teacherId: teacher.id,
          teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`
        }))
      }))
    }));
  }

  async createClass(dto: CreateAdminClassDto): Promise<AdminClassSummary> {
    const academicYearId = dto.academicYearId ?? (await this.getActiveAcademicYearId());
    const schoolClass = await this.prisma.academicClass.create({
      data: {
        academicYearId,
        gradeLevelId: dto.gradeLevelId,
        name: dto.name,
        code: dto.code,
        description: dto.description,
        color: dto.color
      }
    });

    const classes = await this.classes();
    const created = classes.find((item) => item.id === schoolClass.id);

    if (!created) {
      throw new NotFoundException("Class was created but could not be loaded");
    }

    return created;
  }

  async assignTeacher(classId: string, dto: AssignClassTeacherDto): Promise<AdminClassSummary> {
    await this.ensureClass(classId);
    await this.prisma.classTeacher.upsert({
      where: { classId_teacherId: { classId, teacherId: dto.teacherProfileId } },
      update: { isPrimary: dto.isPrimary ?? false },
      create: {
        classId,
        teacherId: dto.teacherProfileId,
        isPrimary: dto.isPrimary ?? false
      }
    });

    return this.getClass(classId);
  }

  async removeTeacher(classId: string, teacherProfileId: string): Promise<AdminClassSummary> {
    await this.prisma.classTeacher.deleteMany({ where: { classId, teacherId: teacherProfileId } });
    return this.getClass(classId);
  }

  async enrollStudent(classId: string, dto: EnrollClassStudentDto): Promise<AdminClassSummary> {
    const schoolClass = await this.prisma.academicClass.findUniqueOrThrow({ where: { id: classId } });
    const student = await this.prisma.studentProfile.findUniqueOrThrow({ where: { id: dto.studentProfileId } });
    if (schoolClass.gradeLevelId && student.gradeLevelId && schoolClass.gradeLevelId !== student.gradeLevelId) {
      throw new NotFoundException("Student and class belong to different grade levels");
    }
    await this.prisma.$transaction(async (tx) => {
      if (schoolClass.gradeLevelId && !student.gradeLevelId) {
        await tx.studentProfile.update({ where: { id: student.id }, data: { gradeLevelId: schoolClass.gradeLevelId } });
      }
      await tx.classEnrollment.upsert({
        where: { classId_studentId: { classId, studentId: dto.studentProfileId } },
        update: { status: "ACTIVE" },
        create: { classId, studentId: dto.studentProfileId, status: "ACTIVE" }
      });
    });

    return this.getClass(classId);
  }

  async unenrollStudent(classId: string, studentProfileId: string): Promise<AdminClassSummary> {
    await this.prisma.classEnrollment.deleteMany({ where: { classId, studentId: studentProfileId } });
    return this.getClass(classId);
  }

  async assignSubject(classId: string, dto: AssignClassSubjectDto): Promise<AdminClassSummary> {
    await this.ensureClass(classId);
    await this.prisma.classSubject.upsert({
      where: { classId_subjectId: { classId, subjectId: dto.subjectId } },
      update: {},
      create: {
        classId,
        subjectId: dto.subjectId
      }
    });

    return this.getClass(classId);
  }

  async subjects(): Promise<AdminSubjectSummary[]> {
    const subjects = await this.prisma.subject.findMany({
      include: { paces: true, _count: { select: { classes: true } } },
      orderBy: { name: "asc" }
    });

    return subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      shortName: subject.shortName,
      color: subject.color,
      status: subject.status as AcademicStatus,
      paceEnabled: subject.paceEnabled,
      paceCount: subject.paces.length,
      classCount: subject._count.classes
    }));
  }

  async createSubject(dto: CreateAdminSubjectDto): Promise<AdminSubjectSummary> {
    const subject = await this.prisma.subject.create({
      data: {
        name: dto.name,
        shortName: dto.shortName,
        color: dto.color,
        paceEnabled: dto.paceEnabled
      }
    });

    return this.getSubject(subject.id);
  }

  async updateSubject(subjectId: string, dto: UpdateAdminSubjectDto): Promise<AdminSubjectSummary> {
    if (dto.paceEnabled === false) {
      const [plans, records] = await Promise.all([
        this.prisma.studentPaceGoal.count({ where: { classSubject: { subjectId } } }),
        this.prisma.studentPaceRecord.count({ where: { classSubject: { subjectId } } })
      ]);
      if (plans > 0 || records > 0) {
        throw new BadRequestException("No puedes deshabilitar PACEs porque esta materia tiene planes o avances de alumnos");
      }
    }

    await this.prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: dto.name,
        shortName: dto.shortName,
        color: dto.color,
        status: dto.status,
        paceEnabled: dto.paceEnabled
      }
    });

    return this.getSubject(subjectId);
  }

  async familyLinks(): Promise<AdminFamilyLinkSummary[]> {
    const links = await this.prisma.studentParent.findMany({
      include: {
        student: { include: { user: { select: userSelect } } },
        parent: { include: { user: { select: userSelect } } }
      },
      orderBy: [{ createdAt: "desc" }]
    });

    return links.map((link) => ({
      studentId: link.studentId,
      parentId: link.parentId,
      student: this.mapUser(link.student.user),
      parent: this.mapUser(link.parent.user),
      relationship: link.relationship as AdminFamilyLinkSummary["relationship"],
      isPrimary: link.isPrimary,
      receivesAcademicEmails: link.receivesAcademicEmails,
      receivesBehaviorEmails: link.receivesBehaviorEmails,
      receivesBillingEmails: link.receivesBillingEmails,
      canViewGrades: link.canViewGrades,
      canMessageTeachers: link.canMessageTeachers
    }));
  }

  async upsertFamilyLink(dto: UpsertFamilyLinkDto): Promise<AdminFamilyLinkSummary> {
    await this.prisma.studentParent.upsert({
      where: { studentId_parentId: { studentId: dto.studentProfileId, parentId: dto.parentProfileId } },
      update: this.familyLinkData(dto),
      create: {
        studentId: dto.studentProfileId,
        parentId: dto.parentProfileId,
        ...this.familyLinkData(dto)
      }
    });

    return this.getFamilyLink(dto.studentProfileId, dto.parentProfileId);
  }

  async updateFamilyLink(
    studentProfileId: string,
    parentProfileId: string,
    dto: UpdateFamilyLinkDto
  ): Promise<AdminFamilyLinkSummary> {
    await this.prisma.studentParent.update({
      where: { studentId_parentId: { studentId: studentProfileId, parentId: parentProfileId } },
      data: this.familyLinkData(dto)
    });

    return this.getFamilyLink(studentProfileId, parentProfileId);
  }

  private async getClass(classId: string): Promise<AdminClassSummary> {
    const schoolClass = (await this.classes()).find((item) => item.id === classId);

    if (!schoolClass) {
      throw new NotFoundException("Class not found");
    }

    return schoolClass;
  }

  private async getActiveAcademicYearId(): Promise<string> {
    const activeYear = await this.prisma.academicYear.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { startsAt: "desc" }
    });

    if (!activeYear) {
      throw new NotFoundException("Active academic year not found");
    }

    return activeYear.id;
  }

  private async ensureClass(classId: string) {
    const exists = await this.prisma.academicClass.findUnique({ where: { id: classId }, select: { id: true } });

    if (!exists) {
      throw new NotFoundException("Class not found");
    }
  }

  private async getSubject(subjectId: string): Promise<AdminSubjectSummary> {
    const subject = await this.prisma.subject.findUnique({
      where: { id: subjectId },
      include: { paces: true, _count: { select: { classes: true } } }
    });

    if (!subject) {
      throw new NotFoundException("Subject not found");
    }

    return {
      id: subject.id,
      name: subject.name,
      shortName: subject.shortName,
      color: subject.color,
      status: subject.status as AcademicStatus,
      paceEnabled: subject.paceEnabled,
      paceCount: subject.paces.length,
      classCount: subject._count.classes
    };
  }

  private async getFamilyLink(studentProfileId: string, parentProfileId: string): Promise<AdminFamilyLinkSummary> {
    const link = (await this.familyLinks()).find(
      (item) => item.studentId === studentProfileId && item.parentId === parentProfileId
    );

    if (!link) {
      throw new NotFoundException("Family link not found");
    }

    return link;
  }

  private familyLinkData(dto: UpdateFamilyLinkDto) {
    return {
      relationship: dto.relationship,
      isPrimary: dto.isPrimary,
      receivesAcademicEmails: dto.receivesAcademicEmails,
      receivesBehaviorEmails: dto.receivesBehaviorEmails,
      receivesBillingEmails: dto.receivesBillingEmails,
      canViewGrades: dto.canViewGrades,
      canMessageTeachers: dto.canMessageTeachers
    };
  }

  private mapUser(user: AdminUserRecord): AdminUserSummary {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles: user.roles.map(({ role }) => role.name as UserRole),
      studentProfileId: user.studentProfile?.id ?? null,
      gradeLevelId: user.studentProfile?.gradeLevelId ?? null,
      teacherProfileId: user.teacherProfile?.id ?? null,
      parentProfileId: user.parentProfile?.id ?? null,
      directorProfileId: user.directorProfile?.id ?? null,
      createdAt: user.createdAt.toISOString()
    };
  }
}
