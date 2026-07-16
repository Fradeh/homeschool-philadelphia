import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { PhysicalBookingStatus, ScheduleAudienceType, ScheduleBlockKind, Weekday } from "@homeschool/shared";
import {
  PhysicalBookingStatus as PrismaBookingStatus,
  Prisma,
  ScheduleAudienceType as PrismaAudienceType,
  ScheduleBlockKind as PrismaBlockKind,
  SchedulePeriodKind,
  ScheduleTemplateStatus,
  Weekday as PrismaWeekday
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  AssignClassSubjectTeacherDto,
  CreateAvailabilityDto,
  CreateBookingDto,
  CreateGradeLevelDto,
  CreateScheduleTemplateDto,
  ReplaceScheduleGridDto,
  ReplaceScheduleBlocksDto,
  UpdateAvailabilityDto,
  UpdateBookingStatusDto,
  UpdateScheduleTemplateDto
} from "./dto/schedules.dto";

const weekdays = [Weekday.MONDAY, Weekday.TUESDAY, Weekday.WEDNESDAY, Weekday.THURSDAY, Weekday.FRIDAY];

const templateInclude = {
  academicYear: true,
  gradeLevel: true,
  class: true,
  teacher: { include: { user: true } },
  subjectScopes: { include: { classSubject: { include: { subject: true, class: true } } } },
  grid: { include: { periods: { orderBy: { order: "asc" as const } } } },
  blocks: {
    include: {
      period: true,
      teacher: { include: { user: true } },
      classSubject: { include: { subject: true, class: true } }
    },
    orderBy: [{ period: { order: "asc" as const } }, { weekday: "asc" as const }]
  }
} satisfies Prisma.ScheduleTemplateInclude;

const bookingInclude = {
  student: { include: { user: true } },
  teacher: { include: { user: true } },
  classSubject: { include: { subject: true, class: true } },
  availabilitySlot: true
} satisfies Prisma.StudentPhysicalBookingInclude;

const classInclude = {
  gradeLevel: true,
  subjects: {
    include: {
      subject: true,
      teachers: { include: { teacher: { include: { user: true } } } }
    }
  }
} satisfies Prisma.AcademicClassInclude;

const availabilityInclude = {
  teacher: { include: { user: true } },
  classSubject: { include: { class: true, subject: true } }
} satisfies Prisma.TeacherAvailabilitySlotInclude;

type TemplateRecord = Prisma.ScheduleTemplateGetPayload<{ include: typeof templateInclude }>;
type BookingRecord = Prisma.StudentPhysicalBookingGetPayload<{ include: typeof bookingInclude }>;
type ClassRecord = Prisma.AcademicClassGetPayload<{ include: typeof classInclude }>;
type AvailabilityRecord = Prisma.TeacherAvailabilitySlotGetPayload<{ include: typeof availabilityInclude }>;

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  gradeLevels() {
    return this.prisma.gradeLevel.findMany({ orderBy: { sortOrder: "asc" } });
  }

  createGradeLevel(dto: CreateGradeLevelDto) {
    return this.prisma.gradeLevel.create({
      data: { code: dto.code.trim().toUpperCase(), name: dto.name.trim(), sortOrder: dto.sortOrder }
    });
  }

  async activeGrid() {
    const grid = await this.prisma.scheduleGrid.findFirst({
      where: { isActive: true },
      include: { periods: { orderBy: { order: "asc" } } },
      orderBy: { version: "desc" }
    });
    if (!grid) throw new NotFoundException("Active schedule grid not found");
    return grid;
  }

  async templates() {
    const items = await this.prisma.scheduleTemplate.findMany({
      include: templateInclude,
      orderBy: [{ academicYear: { startsAt: "desc" } }, { createdAt: "desc" }]
    });
    return items.map((item) => this.mapTemplate(item));
  }

  async createTemplate(dto: CreateScheduleTemplateDto) {
    if (dto.audienceType === ScheduleAudienceType.GRADE) {
      throw new BadRequestException("New schedules must target a class or a teacher");
    }
    const grid = await this.activeGrid();
    let gradeLevelId: string | null = null;
    let classId: string | null = null;
    let teacherId: string | null = null;
    let scopeIds: string[] = [];

    if (dto.audienceType === ScheduleAudienceType.CLASS) {
      if (!dto.classId) throw new BadRequestException("Class schedules require a class");
      const schoolClass = await this.prisma.academicClass.findUnique({
        where: { id: dto.classId },
        include: { subjects: { select: { id: true } } }
      });
      if (!schoolClass || schoolClass.academicYearId !== dto.academicYearId) {
        throw new BadRequestException("The class does not belong to the selected academic year");
      }
      classId = schoolClass.id;
      gradeLevelId = schoolClass.gradeLevelId;
      scopeIds = schoolClass.subjects.map((subject) => subject.id);
    } else {
      if (!dto.teacherId) throw new BadRequestException("Teacher schedules require a teacher");
      scopeIds = [...new Set(dto.classSubjectIds ?? [])];
      if (!scopeIds.length) throw new BadRequestException("Select at least one subject for the teacher");
      const teacher = await this.prisma.teacherProfile.findUnique({ where: { id: dto.teacherId } });
      if (!teacher) throw new NotFoundException("Teacher not found");
      const allowed = await this.prisma.classSubject.findMany({
        where: {
          id: { in: scopeIds },
          class: { academicYearId: dto.academicYearId, teachers: { some: { teacherId: teacher.id } } }
        },
        select: { id: true }
      });
      if (allowed.length !== scopeIds.length) {
        throw new BadRequestException("The teacher must belong to every class for the selected subjects");
      }
      teacherId = teacher.id;
    }

    const template = await this.prisma.$transaction(async (tx) => {
      if (teacherId) {
        for (const classSubjectId of scopeIds) {
          await tx.classSubjectTeacher.upsert({
            where: { classSubjectId_teacherId: { classSubjectId, teacherId } },
            update: {},
            create: { classSubjectId, teacherId }
          });
        }
      }

      const existing = teacherId
        ? await tx.scheduleTemplate.findUnique({
            where: { academicYearId_teacherId: { academicYearId: dto.academicYearId, teacherId } },
            select: { id: true }
          })
        : await tx.scheduleTemplate.findUnique({
            where: { academicYearId_classId: { academicYearId: dto.academicYearId, classId: classId! } },
            select: { id: true }
          });

      if (existing) {
        return tx.scheduleTemplate.update({
          where: { id: existing.id },
          data: {
            name: dto.name.trim(),
            subjectScopes: {
              createMany: {
                data: scopeIds.map((classSubjectId) => ({ classSubjectId })),
                skipDuplicates: true
              }
            }
          },
          include: templateInclude
        });
      }

      return tx.scheduleTemplate.create({
        data: {
          academicYearId: dto.academicYearId,
          audienceType: dto.audienceType as PrismaAudienceType,
          gradeLevelId,
          classId,
          teacherId,
          gridId: grid.id,
          name: dto.name.trim(),
          subjectScopes: { create: scopeIds.map((classSubjectId) => ({ classSubjectId })) }
        },
        include: templateInclude
      });
    });
    return this.mapTemplate(template);
  }
  async updateTemplate(id: string, dto: UpdateScheduleTemplateDto) {
    const template = await this.prisma.scheduleTemplate.update({
      where: { id },
      data: { ...(dto.name ? { name: dto.name.trim() } : {}) },
      include: templateInclude
    });
    return this.mapTemplate(template);
  }

  async replaceTemplateGrid(templateId: string, dto: ReplaceScheduleGridDto) {
    this.validatePeriods(dto.periods);
    const template = await this.prisma.scheduleTemplate.findUnique({ where: { id: templateId }, include: templateInclude });
    if (!template) throw new NotFoundException("Schedule template not found");

    const updated = await this.prisma.$transaction(async (tx) => {
      const { _max } = await tx.scheduleGrid.aggregate({ _max: { version: true } });
      const nextGrid = await tx.scheduleGrid.create({
        data: {
          name: `${template.name} schedule`,
          version: (_max.version ?? 0) + 1,
          isActive: false,
          periods: { create: dto.periods.map((period, index) => ({
            order: index + 1,
            startTime: period.startTime,
            endTime: period.endTime,
            kind: period.suggestedBreak ? SchedulePeriodKind.BREAK : SchedulePeriodKind.INSTRUCTIONAL,
            label: period.suggestedBreak ? "RECESS SUGGESTED" : null
          })) }
        },
        include: { periods: { orderBy: { order: "asc" } } }
      });
      const periodByOldId = new Map(template.grid.periods.map((period, index) => [period.id, nextGrid.periods[index].id]));
      await tx.scheduleTemplateBlock.deleteMany({ where: { templateId } });
      if (template.blocks.length) {
        await tx.scheduleTemplateBlock.createMany({ data: template.blocks.map((block) => ({
          templateId,
          periodId: periodByOldId.get(block.periodId)!,
          weekday: block.weekday,
          kind: block.kind,
          label: block.label,
          classSubjectId: block.classSubjectId,
          teacherId: block.teacherId
        })) });
      }
      return tx.scheduleTemplate.update({
        where: { id: templateId },
        data: { gridId: nextGrid.id, status: ScheduleTemplateStatus.DRAFT, publishedAt: null },
        include: templateInclude
      });
    });
    return this.mapTemplate(updated);
  }

  async assignSubjectTeacher(classSubjectId: string, dto: AssignClassSubjectTeacherDto) {
    const subject = await this.prisma.classSubject.findUnique({
      where: { id: classSubjectId },
      include: { class: { select: { academicYearId: true } } }
    });
    if (!subject) throw new NotFoundException("Class subject not found");
    const classTeacher = await this.prisma.classTeacher.findUnique({
      where: { classId_teacherId: { classId: subject.classId, teacherId: dto.teacherProfileId } }
    });
    if (!classTeacher) throw new BadRequestException("Teacher must first be assigned to the class");
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.classSubjectTeacher.upsert({
        where: { classSubjectId_teacherId: { classSubjectId, teacherId: dto.teacherProfileId } },
        update: {},
        create: { classSubjectId, teacherId: dto.teacherProfileId },
        include: { teacher: { include: { user: true } } }
      });
      const template = await tx.scheduleTemplate.findUnique({
        where: {
          academicYearId_teacherId: {
            academicYearId: subject.class.academicYearId,
            teacherId: dto.teacherProfileId
          }
        },
        select: { id: true }
      });
      if (template) {
        await tx.scheduleTemplateSubject.upsert({
          where: { templateId_classSubjectId: { templateId: template.id, classSubjectId } },
          update: {},
          create: { templateId: template.id, classSubjectId }
        });
      }
      return assignment;
    });
  }

  async replaceBlocks(templateId: string, dto: ReplaceScheduleBlocksDto) {
    const template = await this.prisma.scheduleTemplate.findUnique({
      where: { id: templateId },
      include: { grid: { include: { periods: true } }, subjectScopes: true }
    });
    if (!template) throw new NotFoundException("Schedule template not found");

    const allowedPeriods = new Map(template.grid.periods.map((period) => [period.id, period]));
    const keys = new Set<string>();
    for (const block of dto.blocks) {
      const period = allowedPeriods.get(block.periodId);
      if (!period) {
        throw new BadRequestException("The period does not belong to this schedule template");
      }
      const key = `${block.weekday}:${block.periodId}`;
      if (keys.has(key)) throw new ConflictException("A period can only contain one block per weekday");
      keys.add(key);
      await this.validateBlock(template, block);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.scheduleTemplateBlock.deleteMany({ where: { templateId } });
      if (dto.blocks.length) {
        await tx.scheduleTemplateBlock.createMany({
          data: dto.blocks.map((block) => ({
            templateId,
            periodId: block.periodId,
            weekday: block.weekday as PrismaWeekday,
            kind: block.kind as PrismaBlockKind,
            label: block.label?.trim() || null,
            classSubjectId: block.kind === ScheduleBlockKind.SUBJECT ? block.classSubjectId : null,
            teacherId: block.kind === ScheduleBlockKind.SUBJECT || block.kind === ScheduleBlockKind.PACES ? block.teacherId ?? null : null
          }))
        });
      }
      await tx.scheduleTemplate.update({
        where: { id: templateId },
        data: { status: ScheduleTemplateStatus.DRAFT, publishedAt: null }
      });
    });

    return this.templateById(templateId);
  }

  async publish(templateId: string) {
    const template = await this.prisma.scheduleTemplate.findUnique({ where: { id: templateId }, include: templateInclude });
    if (!template) throw new NotFoundException("Schedule template not found");
    const expected = template.grid.periods.length * weekdays.length;
    if (template.blocks.length !== expected) {
      throw new BadRequestException(`The weekly schedule requires ${expected} cells, including EMPTY cells`);
    }

    for (const block of template.blocks.filter((item) => item.teacherId)) {
      const conflict = await this.prisma.scheduleTemplateBlock.findFirst({
        where: {
          teacherId: block.teacherId,
          weekday: block.weekday,
          period: {
            startTime: { lt: block.period.endTime },
            endTime: { gt: block.period.startTime }
          },
          templateId: { not: template.id },
          ...(block.classSubjectId ? { NOT: { classSubjectId: block.classSubjectId } } : {}),
          template: { academicYearId: template.academicYearId, status: ScheduleTemplateStatus.PUBLISHED }
        },
        include: { template: { include: { gradeLevel: true, class: true } }, period: true }
      });
      if (conflict) {
        const target = conflict.template.class?.name ?? conflict.template.gradeLevel?.name ?? conflict.template.name;
        throw new ConflictException(`Teacher conflict with ${target} on ${block.weekday}`);
      }
    }

    const published = await this.prisma.scheduleTemplate.update({
      where: { id: templateId },
      data: { status: ScheduleTemplateStatus.PUBLISHED, publishedAt: new Date() },
      include: templateInclude
    });
    return this.mapTemplate(published);
  }

  async studentSchedule(userId: string) {
    const student = await this.studentByUser(userId);
    const template = await this.findPublishedStudentTemplate(student.id, student.gradeLevelId);
    if (!template) throw new NotFoundException("Published schedule not found for this student");
    return this.mapTemplate(template);
  }
  async studentDashboard(userId: string) {
    const student = await this.studentByUser(userId);
    const [classes, currentPaces, completedPaces, gradedPaces, pendingBookings, upcoming, conversations, unreadNotifications, schedule] = await Promise.all([
      this.studentClasses(userId),
      this.prisma.studentPaceRecord.count({ where: { studentId: student.id, status: "CURRENT" } }),
      this.prisma.studentPaceRecord.count({ where: { studentId: student.id, status: "COMPLETED" } }),
      this.prisma.paceGrade.count({ where: { studentPaceRecord: { studentId: student.id } } }),
      this.prisma.studentPhysicalBooking.count({ where: { studentId: student.id, status: "PENDING" } }),
      this.prisma.studentPhysicalBooking.findMany({ where: { studentId: student.id, status: { in: ["PENDING", "APPROVED"] }, scheduledDate: { gte: this.bogotaToday() } }, include: bookingInclude, orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }], take: 5 }),
      this.prisma.conversation.count({ where: { participants: { some: { userId } } } }),
      this.prisma.notification.count({ where: { userId, status: "UNREAD" } }),
      this.findPublishedStudentTemplate(student.id, student.gradeLevelId)
    ]);
    return {
      student: { ...this.mapPerson(student.user, student.id), gradeLevel: student.grade },
      classes,
      currentPaces,
      completedPaces,
      gradedPaces,
      pendingBookings,
      upcomingBookings: upcoming.map((item) => this.mapBooking(item)),
      conversations,
      unreadNotifications,
      hasPublishedSchedule: Boolean(schedule)
    };
  }

  async teacherSchedule(userId: string) {
    const teacher = await this.teacherByUser(userId);
    const direct = await this.prisma.scheduleTemplate.findFirst({
      where: { audienceType: PrismaAudienceType.TEACHER, teacherId: teacher.id, status: ScheduleTemplateStatus.PUBLISHED, academicYear: { isActive: true } },
      include: templateInclude,
      orderBy: { createdAt: "desc" }
    });
    if (direct) return [this.mapTemplate(direct)];

    const templates = await this.prisma.scheduleTemplate.findMany({
      where: {
        audienceType: { in: [PrismaAudienceType.CLASS, PrismaAudienceType.GRADE] },
        status: ScheduleTemplateStatus.PUBLISHED,
        academicYear: { isActive: true },
        blocks: { some: { teacherId: teacher.id } }
      },
      include: templateInclude,
      orderBy: { createdAt: "asc" }
    });
    return templates.map((template) => {
      const mapped = this.mapTemplate(template);
      return { ...mapped, blocks: mapped.blocks.filter((block) => block.teacherId === teacher.id) };
    });
  }
  async teacherDashboard(userId: string) {
    const teacher = await this.teacherByUser(userId);
    const classes = await this.teacherClasses(userId);
    const classIds = classes.map((item) => item.id);
    const [studentRows, pendingBookings, upcoming, availabilitySlots, paceRecordsToGrade, conversations, unreadNotifications, scheduleBlocks] = await Promise.all([
      this.prisma.classEnrollment.findMany({ where: { classId: { in: classIds }, status: "ACTIVE" }, distinct: ["studentId"], select: { studentId: true } }),
      this.prisma.studentPhysicalBooking.count({ where: { teacherId: teacher.id, status: "PENDING" } }),
      this.prisma.studentPhysicalBooking.findMany({ where: { teacherId: teacher.id, status: { in: ["PENDING", "APPROVED"] }, scheduledDate: { gte: this.bogotaToday() } }, include: bookingInclude, orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }], take: 5 }),
      this.prisma.teacherAvailabilitySlot.count({ where: { teacherId: teacher.id, isActive: true } }),
      this.prisma.studentPaceRecord.count({ where: { classSubject: { teachers: { some: { teacherId: teacher.id } } }, status: "COMPLETED", grade: null } }),
      this.prisma.conversation.count({ where: { participants: { some: { userId } } } }),
      this.prisma.notification.count({ where: { userId, status: "UNREAD" } }),
      this.prisma.scheduleTemplateBlock.count({ where: { OR: [{ teacherId: teacher.id }, { template: { audienceType: PrismaAudienceType.TEACHER, teacherId: teacher.id } }], template: { status: "PUBLISHED", academicYear: { isActive: true } } } })
    ]);
    return {
      teacher: this.mapPerson(teacher.user, teacher.id),
      classes,
      students: studentRows.length,
      pendingBookings,
      upcomingBookings: upcoming.map((item) => this.mapBooking(item)),
      availabilitySlots,
      paceRecordsToGrade,
      conversations,
      unreadNotifications,
      scheduleBlocks
    };
  }

  async studentClasses(userId: string) {
    const student = await this.studentByUser(userId);
    const classes = await this.prisma.academicClass.findMany({
      where: { enrollments: { some: { studentId: student.id, status: "ACTIVE" } } },
      include: classInclude,
      orderBy: { name: "asc" }
    });
    return classes.map((item) => this.mapClass(item));
  }

  async teacherClasses(userId: string) {
    const teacher = await this.teacherByUser(userId);
    const classes = await this.prisma.academicClass.findMany({
      where: { subjects: { some: { teachers: { some: { teacherId: teacher.id } } } } },
      include: classInclude,
      orderBy: { name: "asc" }
    });
    return classes.map((item) => this.mapClass(item));
  }

  async studentClassDetail(userId: string, classId: string) {
    const student = await this.studentByUser(userId);
    const schoolClass = await this.prisma.academicClass.findFirst({
      where: { id: classId, enrollments: { some: { studentId: student.id, status: "ACTIVE" } } },
      include: { ...classInclude, teachers: { include: { teacher: { include: { user: true } } } } }
    });
    if (!schoolClass) throw new NotFoundException("Class not found or not assigned to this student");
    const [paceProgress, scheduleBlocks] = await Promise.all([
      this.prisma.studentPaceRecord.findMany({ where: { studentId: student.id, classSubject: { classId } }, include: { pace: true, grade: true }, orderBy: { paceNumber: "asc" } }),
      this.classScheduleBlocks(classId, schoolClass.gradeLevelId)
    ]);
    return {
      ...this.mapClass(schoolClass),
      description: schoolClass.description,
      color: schoolClass.color,
      teachers: schoolClass.teachers.map(({ teacher }) => this.mapPerson(teacher.user, teacher.id)),
      paceProgress: paceProgress.map((record) => ({ recordId: record.id, classSubjectId: record.classSubjectId, paceNumber: record.paceNumber, paceTitle: record.pace?.title ?? null, status: record.status, score: record.grade?.score ?? null })),
      scheduleBlocks
    };
  }

  async teacherClassDetail(userId: string, classId: string) {
    const teacher = await this.teacherByUser(userId);
    const schoolClass = await this.prisma.academicClass.findFirst({
      where: { id: classId, subjects: { some: { teachers: { some: { teacherId: teacher.id } } } } },
      include: { ...classInclude, enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: true } } } } }
    });
    if (!schoolClass) throw new NotFoundException("Class not found or not assigned to this teacher");
    const [bookings, scheduleBlocks] = await Promise.all([
      this.prisma.studentPhysicalBooking.findMany({ where: { teacherId: teacher.id, classSubject: { classId } }, include: bookingInclude, orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }] }),
      this.classScheduleBlocks(classId, schoolClass.gradeLevelId)
    ]);
    return {
      ...this.mapClass(schoolClass),
      description: schoolClass.description,
      color: schoolClass.color,
      students: schoolClass.enrollments.map(({ student }) => this.mapPerson(student.user, student.id)),
      bookings: bookings.map((item) => this.mapBooking(item)),
      scheduleBlocks
    };
  }

  async studentAvailability(userId: string, classSubjectId: string) {
    const student = await this.ensureStudentSubject(userId, classSubjectId);
    const items = await this.prisma.teacherAvailabilitySlot.findMany({
      where: { classSubjectId, isActive: true, classSubject: { class: { enrollments: { some: { studentId: student.id, status: "ACTIVE" } } } } },
      include: availabilityInclude,
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }]
    });
    return items.map((item) => this.mapAvailability(item));
  }

  async teacherAvailability(userId: string) {
    const teacher = await this.teacherByUser(userId);
    const items = await this.prisma.teacherAvailabilitySlot.findMany({
      where: { teacherId: teacher.id },
      include: availabilityInclude,
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }]
    });
    return items.map((item) => this.mapAvailability(item));
  }

  async createAvailability(userId: string, dto: CreateAvailabilityDto) {
    if (dto.startTime >= dto.endTime) throw new BadRequestException("End time must be after start time");
    const teacher = await this.teacherByUser(userId);
    await this.ensureTeacherSubject(teacher.id, dto.classSubjectId);
    const created = await this.prisma.teacherAvailabilitySlot.create({
      data: {
        classSubjectId: dto.classSubjectId,
        teacherId: teacher.id,
        weekday: dto.weekday as PrismaWeekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location?.trim() || null,
        instructions: dto.instructions?.trim() || null
      },
      include: availabilityInclude
    });
    return this.mapAvailability(created);
  }

  async updateAvailability(userId: string, slotId: string, dto: UpdateAvailabilityDto) {
    const teacher = await this.teacherByUser(userId);
    const slot = await this.prisma.teacherAvailabilitySlot.findFirst({ where: { id: slotId, teacherId: teacher.id } });
    if (!slot) throw new NotFoundException("Availability slot not found");
    const start = dto.startTime ?? slot.startTime;
    const end = dto.endTime ?? slot.endTime;
    if (start >= end) throw new BadRequestException("End time must be after start time");
    const updated = await this.prisma.teacherAvailabilitySlot.update({
      where: { id: slotId },
      data: {
        ...dto,
        weekday: dto.weekday as PrismaWeekday | undefined,
        location: dto.location?.trim(),
        instructions: dto.instructions?.trim()
      },
      include: availabilityInclude
    });
    return this.mapAvailability(updated);
  }

  async createBooking(userId: string, classSubjectId: string, dto: CreateBookingDto) {
    const student = await this.ensureStudentSubject(userId, classSubjectId);
    const slot = await this.prisma.teacherAvailabilitySlot.findFirst({
      where: { id: dto.availabilitySlotId, classSubjectId, isActive: true },
      include: { teacher: { include: { user: true } }, classSubject: { include: { subject: true } } }
    });
    if (!slot) throw new NotFoundException("Available slot not found");
    const date = this.validateBookingDate(dto.scheduledDate, slot.weekday);
    const duplicate = await this.prisma.studentPhysicalBooking.findUnique({
      where: { studentId_classSubjectId_scheduledDate_startTime: { studentId: student.id, classSubjectId, scheduledDate: date, startTime: slot.startTime } }
    });
    if (duplicate) throw new ConflictException("A booking already exists for this date and time");

    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.studentPhysicalBooking.create({
        data: {
          studentId: student.id,
          classSubjectId,
          teacherId: slot.teacherId,
          availabilitySlotId: slot.id,
          scheduledDate: date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          studentNote: dto.studentNote?.trim() || null
        },
        include: bookingInclude
      });
      await tx.notification.create({
        data: {
          userId: slot.teacher.userId,
          title: "Nueva reserva presencial",
          body: `${student.user.firstName} ${student.user.lastName} solicitó ${slot.classSubject.subject.name} para ${dto.scheduledDate} a las ${slot.startTime}.`
        }
      });
      return created;
    });
    return this.mapBooking(booking);
  }

  async studentBookings(userId: string) {
    const student = await this.studentByUser(userId);
    const bookings = await this.prisma.studentPhysicalBooking.findMany({
      where: { studentId: student.id }, include: bookingInclude, orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }]
    });
    return bookings.map((item) => this.mapBooking(item));
  }

  async cancelStudentBooking(userId: string, bookingId: string) {
    const student = await this.studentByUser(userId);
    const booking = await this.prisma.studentPhysicalBooking.findFirst({ where: { id: bookingId, studentId: student.id }, include: bookingInclude });
    if (!booking) throw new NotFoundException("Booking not found");
    if (booking.status !== PrismaBookingStatus.PENDING && booking.status !== PrismaBookingStatus.APPROVED) {
      throw new ConflictException("This booking can no longer be cancelled");
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.studentPhysicalBooking.update({ where: { id: booking.id }, data: { status: PrismaBookingStatus.CANCELLED }, include: bookingInclude });
      await tx.notification.create({ data: { userId: booking.teacher.userId, title: "Reserva cancelada", body: `${booking.student.user.firstName} canceló la reserva de ${booking.classSubject.subject.name}.` } });
      return item;
    });
    return this.mapBooking(updated);
  }

  async teacherBookings(userId: string) {
    const teacher = await this.teacherByUser(userId);
    const bookings = await this.prisma.studentPhysicalBooking.findMany({
      where: { teacherId: teacher.id }, include: bookingInclude, orderBy: [{ scheduledDate: "asc" }, { startTime: "asc" }]
    });
    return bookings.map((item) => this.mapBooking(item));
  }

  async updateBookingStatus(userId: string, bookingId: string, dto: UpdateBookingStatusDto) {
    const teacher = await this.teacherByUser(userId);
    const booking = await this.prisma.studentPhysicalBooking.findFirst({ where: { id: bookingId, teacherId: teacher.id }, include: bookingInclude });
    if (!booking) throw new NotFoundException("Booking not found");
    const target = dto.status as PrismaBookingStatus;
    const proposingChange =
      target === PrismaBookingStatus.PENDING &&
      Boolean(dto.availabilitySlotId || dto.scheduledDate);
    const allowed: PrismaBookingStatus[] = booking.status === PrismaBookingStatus.PENDING
      ? [PrismaBookingStatus.APPROVED, PrismaBookingStatus.CANCELLED]
      : booking.status === PrismaBookingStatus.APPROVED ? [PrismaBookingStatus.CANCELLED] : [];
    if (!allowed.includes(target) && !proposingChange) {
      throw new ConflictException("Invalid booking status transition");
    }
    let proposed:
      | { availabilitySlotId: string; scheduledDate: Date; startTime: string; endTime: string }
      | undefined;
    if (proposingChange) {
      if (!dto.availabilitySlotId || !dto.scheduledDate || !dto.teacherResponse?.trim()) {
        throw new BadRequestException(
          "A new availability, date and explanation are required when proposing a change"
        );
      }
      const slot = await this.prisma.teacherAvailabilitySlot.findFirst({
        where: {
          id: dto.availabilitySlotId,
          teacherId: teacher.id,
          classSubjectId: booking.classSubjectId,
          isActive: true
        }
      });
      if (!slot) throw new BadRequestException("Selected availability is not valid for this booking");
      const date = this.validateBookingDate(dto.scheduledDate, slot.weekday);
      const duplicate = await this.prisma.studentPhysicalBooking.findFirst({
        where: {
          id: { not: booking.id },
          studentId: booking.studentId,
          classSubjectId: booking.classSubjectId,
          scheduledDate: date,
          startTime: slot.startTime
        },
        select: { id: true }
      });
      if (duplicate) throw new ConflictException("A booking already exists for the proposed date");
      proposed = {
        availabilitySlotId: slot.id,
        scheduledDate: date,
        startTime: slot.startTime,
        endTime: slot.endTime
      };
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const item = await tx.studentPhysicalBooking.update({
        where: { id: booking.id },
        data: {
          status: target,
          teacherResponse: dto.teacherResponse?.trim() || null,
          ...proposed
        },
        include: bookingInclude
      });
      await tx.notification.create({
        data: {
          userId: booking.student.userId,
          title: proposingChange
            ? "Nueva fecha propuesta"
            : target === PrismaBookingStatus.APPROVED
              ? "Reserva aprobada"
              : "Reserva cancelada",
          body: proposingChange
            ? `Tu profesor propuso ${dto.scheduledDate} para la asistencia de ${booking.classSubject.subject.name}. ${dto.teacherResponse?.trim()}`
            : `Tu reserva de ${booking.classSubject.subject.name} para ${booking.scheduledDate.toISOString().slice(0, 10)} ahora está ${target}.`
        }
      });
      return item;
    });
    return this.mapBooking(updated);
  }

  private validatePeriods(periods: ReplaceScheduleGridDto["periods"]) {
    const ordered = [...periods].sort((left, right) => left.startTime.localeCompare(right.startTime));
    for (const period of ordered) {
      if (period.startTime >= period.endTime) throw new BadRequestException("Each end time must be later than its start time");
    }
    for (let index = 1; index < ordered.length; index += 1) {
      if (ordered[index].startTime < ordered[index - 1].endTime) {
        throw new BadRequestException("Schedule periods cannot overlap");
      }
    }
  }

  private async validateBlock(
    template: { audienceType: PrismaAudienceType; gradeLevelId: string | null; classId: string | null; teacherId: string | null; subjectScopes: Array<{ classSubjectId: string }> },
    block: ReplaceScheduleBlocksDto["blocks"][number]
  ) {
    if (block.kind === ScheduleBlockKind.SUBJECT) {
      if (!block.classSubjectId || !block.teacherId) throw new BadRequestException("Subject blocks require a subject and teacher");
      if (template.audienceType !== PrismaAudienceType.GRADE && !template.subjectScopes.some((scope) => scope.classSubjectId === block.classSubjectId)) {
        throw new BadRequestException("The subject is not enabled for this schedule");
      }
      const link = await this.prisma.classSubjectTeacher.findUnique({
        where: { classSubjectId_teacherId: { classSubjectId: block.classSubjectId, teacherId: block.teacherId } },
        include: { classSubject: { include: { class: true } } }
      });
      if (!link) throw new BadRequestException("Teacher is not assigned to this class subject");
      if (template.audienceType === PrismaAudienceType.CLASS && link.classSubject.classId !== template.classId) {
        throw new BadRequestException("Subject does not belong to the target class");
      }
      if (template.audienceType === PrismaAudienceType.TEACHER && block.teacherId !== template.teacherId) {
        throw new BadRequestException("Teacher schedules can only contain the selected teacher");
      }
      if (template.audienceType === PrismaAudienceType.GRADE && link.classSubject.class.gradeLevelId !== template.gradeLevelId) {
        throw new BadRequestException("Subject does not belong to the template grade");
      }
    }
    if (block.kind === ScheduleBlockKind.ACTIVITY && !block.label?.trim()) throw new BadRequestException("Activity blocks require a label");
  }
  private async templateById(id: string) {
    const template = await this.prisma.scheduleTemplate.findUniqueOrThrow({ where: { id }, include: templateInclude });
    return this.mapTemplate(template);
  }

  private mapTemplate(template: TemplateRecord) {
    return {
      id: template.id,
      academicYearId: template.academicYearId,
      audienceType: template.audienceType,
      gradeLevel: template.gradeLevel,
      targetClass: template.class ? { id: template.class.id, name: template.class.name, code: template.class.code } : null,
      targetTeacher: template.teacher ? { id: template.teacher.id, name: `${template.teacher.user.firstName} ${template.teacher.user.lastName}`, email: template.teacher.user.email } : null,
      allowedSubjects: template.subjectScopes.map((scope) => ({
        classSubjectId: scope.classSubjectId,
        classId: scope.classSubject.classId,
        className: scope.classSubject.class.name,
        subjectName: scope.classSubject.subject.name,
        subjectShortName: scope.classSubject.subject.shortName,
        subjectColor: scope.classSubject.subject.color
      })),
      grid: template.grid,
      name: template.name,
      status: template.status,
      publishedAt: template.publishedAt?.toISOString() ?? null,
      blocks: template.blocks.map((block) => ({
        id: block.id,
        periodId: block.periodId,
        weekday: block.weekday,
        kind: block.kind,
        label: block.label,
        classSubjectId: block.classSubjectId,
        subjectName: block.classSubject?.subject.name ?? null,
        subjectShortName: block.classSubject?.subject.shortName ?? null,
        subjectColor: block.classSubject?.subject.color ?? null,
        className: block.classSubject?.class.name ?? null,
        teacherId: block.teacherId,
        teacherName: block.teacher ? `${block.teacher.user.firstName} ${block.teacher.user.lastName}` : null
      }))
    };
  }

  private mapClass(item: ClassRecord) {
    return {
      id: item.id,
      name: item.name,
      code: item.code,
      gradeLevel: item.gradeLevel,
      subjects: item.subjects.map((link) => ({
        id: link.id,
        name: link.subject.name,
        shortName: link.subject.shortName,
        color: link.subject.color,
        teachers: link.teachers.map(({ teacher }) => ({
          classSubjectId: link.id,
          teacherId: teacher.id,
          teacherName: `${teacher.user.firstName} ${teacher.user.lastName}`
        }))
      }))
    };
  }

  private mapBooking(item: BookingRecord) {
    return {
      id: item.id,
      studentId: item.studentId,
      studentName: `${item.student.user.firstName} ${item.student.user.lastName}`,
      classSubjectId: item.classSubjectId,
      className: item.classSubject.class.name,
      subjectName: item.classSubject.subject.name,
      subjectShortName: item.classSubject.subject.shortName,
      teacherId: item.teacherId,
      teacherName: `${item.teacher.user.firstName} ${item.teacher.user.lastName}`,
      availabilitySlotId: item.availabilitySlotId,
      scheduledDate: item.scheduledDate.toISOString().slice(0, 10),
      startTime: item.startTime,
      endTime: item.endTime,
      status: item.status as PhysicalBookingStatus,
      studentNote: item.studentNote,
      teacherResponse: item.teacherResponse,
      isChangeProposal:
        item.status === PrismaBookingStatus.PENDING && Boolean(item.teacherResponse?.trim()),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    };
  }

  private mapAvailability(item: AvailabilityRecord) {
    return {
      id: item.id,
      classSubjectId: item.classSubjectId,
      className: item.classSubject.class.name,
      subjectName: item.classSubject.subject.name,
      subjectShortName: item.classSubject.subject.shortName,
      teacherId: item.teacherId,
      teacherName: `${item.teacher.user.firstName} ${item.teacher.user.lastName}`,
      weekday: item.weekday,
      startTime: item.startTime,
      endTime: item.endTime,
      location: item.location,
      instructions: item.instructions,
      isActive: item.isActive
    };
  }

  private mapPerson(user: { id: string; firstName: string; lastName: string; email: string }, profileId: string) {
    return { id: user.id, profileId, firstName: user.firstName, lastName: user.lastName, displayName: `${user.firstName} ${user.lastName}`, email: user.email };
  }

  private async classScheduleBlocks(classId: string, gradeLevelId: string | null) {
    const classTemplate = await this.prisma.scheduleTemplate.findFirst({
      where: { audienceType: PrismaAudienceType.CLASS, classId, status: "PUBLISHED", academicYear: { isActive: true } },
      include: templateInclude
    });
    if (classTemplate) return this.mapTemplate(classTemplate).blocks;
    if (!gradeLevelId) return [];
    const legacy = await this.prisma.scheduleTemplate.findFirst({
      where: { audienceType: PrismaAudienceType.GRADE, gradeLevelId, status: "PUBLISHED", academicYear: { isActive: true } },
      include: templateInclude
    });
    if (!legacy) return [];
    return this.mapTemplate(legacy).blocks.filter((block) => block.classSubjectId && legacy.blocks.find((source) => source.id === block.id)?.classSubject?.classId === classId);
  }

  private async findPublishedStudentTemplate(studentId: string, gradeLevelId: string | null) {
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { studentId, status: "ACTIVE" },
      select: { classId: true }
    });
    const classIds = enrollments.map((item) => item.classId);
    if (classIds.length) {
      const classTemplate = await this.prisma.scheduleTemplate.findFirst({
        where: { audienceType: PrismaAudienceType.CLASS, classId: { in: classIds }, status: "PUBLISHED", academicYear: { isActive: true } },
        include: templateInclude,
        orderBy: { createdAt: "asc" }
      });
      if (classTemplate) return classTemplate;
    }
    if (!gradeLevelId) return null;
    return this.prisma.scheduleTemplate.findFirst({
      where: { audienceType: PrismaAudienceType.GRADE, gradeLevelId, status: "PUBLISHED", academicYear: { isActive: true } },
      include: templateInclude
    });
  }

  private async studentByUser(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({ where: { userId }, include: { user: true, grade: true } });
    if (!student) throw new ForbiddenException("Student profile not found");
    return student;
  }

  private async teacherByUser(userId: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({ where: { userId }, include: { user: true } });
    if (!teacher) throw new ForbiddenException("Teacher profile not found");
    return teacher;
  }

  private async ensureStudentSubject(userId: string, classSubjectId: string) {
    const student = await this.studentByUser(userId);
    const subject = await this.prisma.classSubject.findFirst({
      where: { id: classSubjectId, class: { enrollments: { some: { studentId: student.id, status: "ACTIVE" } } } },
      select: { id: true }
    });
    if (!subject) throw new ForbiddenException("Subject is not assigned to this student");
    return student;
  }

  private async ensureTeacherSubject(teacherId: string, classSubjectId: string) {
    const link = await this.prisma.classSubjectTeacher.findUnique({ where: { classSubjectId_teacherId: { classSubjectId, teacherId } } });
    if (!link) throw new ForbiddenException("Subject is not assigned to this teacher");
    return link;
  }

  private validateBookingDate(value: string, weekday: PrismaWeekday) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequestException("scheduledDate must use YYYY-MM-DD");
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new BadRequestException("Invalid booking date");
    const today = this.bogotaToday();
    const max = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 2, 0));
    if (date < today || date > max) throw new BadRequestException("Bookings are limited to the current and next month");
    const expected: Partial<Record<number, PrismaWeekday>> = {
      1: PrismaWeekday.MONDAY, 2: PrismaWeekday.TUESDAY, 3: PrismaWeekday.WEDNESDAY, 4: PrismaWeekday.THURSDAY, 5: PrismaWeekday.FRIDAY
    };
    if (expected[date.getUTCDay()] !== weekday) throw new BadRequestException("Selected date does not match the availability weekday");
    return date;
  }

  private bogotaToday() {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
    return new Date(`${part("year")}-${part("month")}-${part("day")}T00:00:00.000Z`);
  }
}
