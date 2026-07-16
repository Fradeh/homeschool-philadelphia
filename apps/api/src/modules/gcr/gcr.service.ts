import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { GcrAuditAction, GcrReportStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CreateGcrDemeritsDto,
  CreateGcrMeritDto,
  CreateGcrReportDto,
  SaveGcrDraftDto,
  UpdateGcrReportDto,
  UpsertGcrAttendanceDto,
  UpsertGcrSubjectTaskDto,
  UpsertGcrVerseDto
} from "./dto/gcr.dto";
import {
  addDays,
  formatDateOnly,
  isLateSubmission,
  isRapidAttendanceClosed,
  mondayOfWeek,
  parseDateOnly,
  weekNumberWithinTerm
} from "./gcr-time";

const submittedStatuses = new Set<GcrReportStatus>([
  GcrReportStatus.SUBMITTED_ON_TIME,
  GcrReportStatus.SUBMITTED_LATE,
  GcrReportStatus.MODIFIED_POST_CLOSE
]);

type GcrMissingField = {
  code: "ATTENDANCE_REQUIRED";
};

@Injectable()
export class GcrService {
  constructor(private readonly prisma: PrismaService) {}

  async administrativeCompliance(dateValue: string) {
    const date = this.datePoint(dateValue, "date");
    const isInstructionalDay = date.getUTCDay() >= 1 && date.getUTCDay() <= 5;
    const deadlinePassed = isRapidAttendanceClosed(dateValue, new Date());

    const classes = isInstructionalDay
      ? await this.prisma.academicClass.findMany({
          where: {
            status: "ACTIVE",
            academicYear: { startsAt: { lte: date }, endsAt: { gte: date } }
          },
          select: {
            id: true,
            name: true,
            code: true,
            gradeLevel: { select: { name: true } },
            teachers: {
              where: { isPrimary: true },
              select: {
                teacher: {
                  select: {
                    id: true,
                    user: { select: { id: true, firstName: true, lastName: true } }
                  }
                }
              }
            },
            enrollments: {
              where: { status: "ACTIVE", student: { status: "ACTIVE" } },
              select: {
                student: {
                  select: {
                    id: true,
                    studentCode: true,
                    user: { select: { firstName: true, lastName: true } }
                  }
                }
              }
            }
          },
          orderBy: [{ gradeLevel: { sortOrder: "asc" } }, { name: "asc" }]
        })
      : [];

    const reports = await this.prisma.gcrReport.findMany({
      where: { reportDate: parseDateOnly(dateValue), voidedAt: null },
      select: {
        id: true,
        studentId: true,
        classId: true,
        responsibleTeacherId: true,
        status: true,
        submittedAt: true,
        firstSubmittedAt: true,
        isLate: true,
        hasPostCloseChanges: true,
        updatedAt: true,
        missingFields: true,
        auditEvents: {
          select: {
            id: true,
            action: true,
            entityType: true,
            reason: true,
            createdAt: true,
            actor: { select: { firstName: true, lastName: true } }
          },
          orderBy: { createdAt: "desc" },
          take: 20
        }
      }
    });
    const reportsByExpected = new Map(
      reports.map((report) => [
        `${report.classId}:${report.studentId}:${report.responsibleTeacherId}`,
        report
      ])
    );
    const configurationIssues: Array<{ classId: string; className: string; issue: string }> = [];
    const rows = classes.flatMap((schoolClass) => {
      if (schoolClass.teachers.length !== 1) {
        configurationIssues.push({
          classId: schoolClass.id,
          className: schoolClass.name,
          issue: schoolClass.teachers.length
            ? "La clase tiene más de un profesor principal."
            : "La clase no tiene profesor principal."
        });
        return [];
      }

      const teacher = schoolClass.teachers[0].teacher;
      return schoolClass.enrollments.map(({ student }) => {
        const report = reportsByExpected.get(`${schoolClass.id}:${student.id}:${teacher.id}`);
        const timingState = report?.submittedAt
          ? report.isLate
            ? "LATE"
            : "ON_TIME"
          : deadlinePassed
            ? "OVERDUE"
            : "PENDING";
        return {
          reportId: report?.id ?? null,
          date: dateValue,
          timingState,
          status: report?.status ?? null,
          submittedAt: report?.submittedAt?.toISOString() ?? null,
          firstSubmittedAt: report?.firstSubmittedAt?.toISOString() ?? null,
          updatedAt: report?.updatedAt.toISOString() ?? null,
          isLate: report?.isLate ?? false,
          hasPostCloseChanges: report?.hasPostCloseChanges ?? false,
          missingFields: report ? this.readMissingFields(report.missingFields) : [],
          teacher: {
            id: teacher.id,
            userId: teacher.user.id,
            displayName: `${teacher.user.firstName} ${teacher.user.lastName}`
          },
          class: {
            id: schoolClass.id,
            name: schoolClass.name,
            code: schoolClass.code,
            gradeName: schoolClass.gradeLevel?.name ?? null
          },
          student: {
            id: student.id,
            studentCode: student.studentCode,
            displayName: `${student.user.firstName} ${student.user.lastName}`
          },
          audit: report?.auditEvents.map((event) => ({
            id: event.id,
            action: event.action,
            entityType: event.entityType,
            reason: event.reason,
            createdAt: event.createdAt.toISOString(),
            actorName: `${event.actor.firstName} ${event.actor.lastName}`
          })) ?? []
        };
      });
    });

    return {
      date: dateValue,
      generatedAt: new Date().toISOString(),
      deadlinePassed,
      isInstructionalDay,
      metrics: {
        expected: rows.length,
        onTime: rows.filter((row) => row.timingState === "ON_TIME").length,
        late: rows.filter((row) => row.timingState === "LATE").length,
        pending: rows.filter((row) => row.timingState === "PENDING").length,
        overdue: rows.filter((row) => row.timingState === "OVERDUE").length,
        postCloseModified: rows.filter((row) => row.hasPostCloseChanges).length
      },
      configurationIssues,
      rows
    };
  }

  async teacherClasses(userId: string, dateValue: string) {
    const date = this.datePoint(dateValue, "date");
    const teacherId = await this.teacherId(userId);
    const classes = await this.prisma.academicClass.findMany({
      where: {
        status: "ACTIVE",
        academicYear: { startsAt: { lte: date }, endsAt: { gte: date } },
        OR: [
          { teachers: { some: { teacherId } } },
          { subjects: { some: { teachers: { some: { teacherId } } } } }
        ]
      },
      select: {
        id: true,
        name: true,
        code: true,
        gradeLevel: { select: { id: true, code: true, name: true } }
      },
      orderBy: [{ gradeLevel: { sortOrder: "asc" } }, { name: "asc" }]
    });

    return classes.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      grade: item.gradeLevel
    }));
  }

  async teacherStudents(userId: string, dateValue: string) {
    const date = this.datePoint(dateValue, "date");
    const teacherId = await this.teacherId(userId);
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: {
        status: "ACTIVE",
        student: { status: "ACTIVE" },
        class: {
          status: "ACTIVE",
          academicYear: { startsAt: { lte: date }, endsAt: { gte: date } },
          OR: [
            { teachers: { some: { teacherId } } },
            { subjects: { some: { teachers: { some: { teacherId } } } } }
          ]
        }
      },
      select: {
        student: {
          select: {
            id: true,
            studentCode: true,
            user: { select: { firstName: true, lastName: true } },
            grade: { select: { id: true, code: true, name: true } }
          }
        }
      },
      orderBy: [
        { student: { user: { lastName: "asc" } } },
        { student: { user: { firstName: "asc" } } }
      ]
    });

    const students = new Map(enrollments.map(({ student }) => [student.id, student]));
    return [...students.values()].map((student) => ({
      id: student.id,
      studentCode: student.studentCode,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      displayName: `${student.user.firstName} ${student.user.lastName}`,
      grade: student.grade
    }));
  }

  async attendanceSession(userId: string, classId: string, dateValue: string) {
    const date = this.datePoint(dateValue, "date");
    if (isRapidAttendanceClosed(dateValue, new Date())) {
      throw new ForbiddenException(
        "La asistencia rápida cerró a las 10:00 a. m. y ya no se puede enviar."
      );
    }
    const teacherId = await this.teacherId(userId);
    const schoolClass = await this.assignedClass(teacherId, classId, date);
    const [enrollments, reports] = await Promise.all([
      this.prisma.classEnrollment.findMany({
        where: { classId, status: "ACTIVE", student: { status: "ACTIVE" } },
        select: {
          student: {
            select: {
              id: true,
              studentCode: true,
              user: { select: { firstName: true, lastName: true } },
              grade: { select: { code: true, name: true } }
            }
          }
        },
        orderBy: [{ student: { user: { lastName: "asc" } } }, { student: { user: { firstName: "asc" } } }]
      }),
      this.prisma.gcrReport.findMany({
        where: { classId, reportDate: parseDateOnly(dateValue), student: { status: "ACTIVE" } },
        select: { id: true, studentId: true, version: true, attendance: { select: { status: true, comment: true } } }
      })
    ]);
    const reportsByStudent = new Map(reports.map((report) => [report.studentId, report]));
    return {
      class: { id: schoolClass.id, name: schoolClass.name, code: schoolClass.code },
      date: dateValue,
      students: enrollments.map(({ student }) => {
        const report = reportsByStudent.get(student.id);
        return {
          id: student.id,
          studentCode: student.studentCode,
          displayName: `${student.user.firstName} ${student.user.lastName}`,
          grade: student.grade,
          report: report ? { id: report.id, version: report.version, attendance: report.attendance } : null
        };
      })
    };
  }

  async studentWeek(userId: string, studentId: string, dateValue: string) {
    const selectedDate = this.datePoint(dateValue, "date");
    const selectedDateOnly = parseDateOnly(dateValue);
    const teacherId = await this.teacherId(userId);
    const schoolClass = await this.studentClass(teacherId, studentId, selectedDate);
    const enrollment = await this.activeEnrollment(studentId, schoolClass.id);
    const weekStart = mondayOfWeek(selectedDateOnly);
    const weekEnd = addDays(weekStart, 4);
    const term = await this.termForDate(schoolClass.academicYearId, selectedDate);

    const [reports, termVerses] = await Promise.all([
      this.prisma.gcrReport.findMany({
      where: {
        studentId,
        classId: schoolClass.id,
        reportDate: { gte: weekStart, lte: weekEnd }
      },
      select: {
        id: true,
        studentId: true,
        classId: true,
        academicTermId: true,
        responsibleTeacherId: true,
        reportDate: true,
        status: true,
        generalComment: true,
        missingFields: true,
        submittedAt: true,
        firstSubmittedAt: true,
        isLate: true,
        hasPostCloseChanges: true,
        version: true,
        createdAt: true,
        updatedAt: true,
        attendance: {
          select: { status: true, comment: true, createdAt: true, updatedAt: true }
        },
        subjectTasks: {
          select: {
            id: true,
            classSubjectId: true,
            homeworkAssigned: true,
            completionStatus: true,
            comment: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { classSubject: { subject: { name: "asc" } } }
        },
        verses: {
          select: {
            id: true,
            classSubjectId: true,
            slot: true,
            reference: true,
            text: true,
            score: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { slot: "asc" }
        },
        merits: {
          where: { voidedAt: null },
          select: {
            id: true,
            comment: true,
            benefit: true,
            occurredAt: true,
            isPostClose: true
          },
          orderBy: { occurredAt: "asc" }
        },
        demerits: {
          where: { voidedAt: null },
          select: {
            id: true,
            ordinal: true,
            comment: true,
            occurredAt: true,
            isPostClose: true,
            detentionRequired: true,
            detentionDate: true
          },
          orderBy: [{ ordinal: "asc" }, { occurredAt: "asc" }]
        }
      },
        orderBy: { reportDate: "asc" }
      }),
      term
        ? this.prisma.gcrVerse.findMany({
            where: { studentId, academicTermId: term.id },
            select: {
              reportId: true,
              slot: true,
              reference: true,
              text: true,
              score: true
            },
            orderBy: { slot: "asc" }
          })
        : Promise.resolve([])
    ]);
    const reportsByDate = new Map(
      reports.map((report) => [formatDateOnly(report.reportDate), report])
    );
    const classStart = formatDateOnly(schoolClass.academicYear.startsAt);
    const classEnd = formatDateOnly(schoolClass.academicYear.endsAt);
    const termStart = term ? formatDateOnly(term.startsAt) : null;
    const termEnd = term ? formatDateOnly(term.endsAt) : null;

    return {
      student: {
        id: enrollment.student.id,
        studentCode: enrollment.student.studentCode,
        firstName: enrollment.student.user.firstName,
        lastName: enrollment.student.user.lastName,
        displayName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`
      },
      class: {
        id: schoolClass.id,
        name: schoolClass.name,
        code: schoolClass.code
      },
      grade: schoolClass.gradeLevel,
      academicTerm: term
        ? {
            id: term.id,
            name: term.name,
            order: term.order,
            startsAt: termStart,
            endsAt: termEnd
          }
        : null,
      weekNumber: term ? weekNumberWithinTerm(weekStart, parseDateOnly(termStart!)) : null,
      weekStart: formatDateOnly(weekStart),
      weekEnd: formatDateOnly(weekEnd),
      subjects: schoolClass.subjects.map(({ id, subject }) => ({
        classSubjectId: id,
        id: subject.id,
        name: subject.name,
        shortName: subject.shortName,
        color: subject.color
      })),
      termVerses,
      days: Array.from({ length: 5 }, (_, index) => {
        const date = formatDateOnly(addDays(weekStart, index));
        const report = reportsByDate.get(date);
        const expected = Boolean(
          termStart &&
          termEnd &&
          date >= termStart &&
          date <= termEnd &&
          date >= classStart &&
          date <= classEnd
        );
        return report
          ? {
              date,
              state: report.status,
              report: this.mapFullReport(report)
            }
          : { date, state: expected ? "PENDING" : "NOT_EXPECTED", report: null };
      })
    };
  }

  async openDraft(userId: string, dto: CreateGcrReportDto) {
    const reportDate = this.datePoint(dto.reportDate, "reportDate");
    const dateOnly = parseDateOnly(dto.reportDate);
    if (dateOnly.getUTCDay() === 0 || dateOnly.getUTCDay() === 6) {
      throw new BadRequestException("A GCR draft can only be opened for Monday through Friday");
    }
    const teacherId = await this.teacherId(userId);
    const schoolClass = await this.studentClass(teacherId, dto.studentId, reportDate);
    await this.activeEnrollment(dto.studentId, schoolClass.id);
    const term = await this.termForDate(schoolClass.academicYearId, reportDate);
    if (!term) throw new BadRequestException("No academic term covers reportDate");
    const primaryTeachers = schoolClass.teachers.filter((link) => link.isPrimary);
    if (primaryTeachers.length !== 1) {
      throw new ConflictException(
        "The class must have exactly one primary teacher before opening GCR reports"
      );
    }

    const key = {
      studentId_classId_reportDate: {
        studentId: dto.studentId,
        classId: schoolClass.id,
        reportDate: dateOnly
      }
    };
    const existing = await this.prisma.gcrReport.findUnique({ where: key });
    if (existing) return this.mapReport(existing);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const report = await tx.gcrReport.create({
          data: {
            studentId: dto.studentId,
              classId: schoolClass.id,
            academicTermId: term.id,
            reportDate: dateOnly,
            responsibleTeacherId: primaryTeachers[0].teacherId,
            createdById: userId,
            updatedById: userId
          }
        });
        await tx.gcrAuditEvent.create({
          data: {
            reportId: report.id,
            entityType: "GcrReport",
            entityId: report.id,
            action: GcrAuditAction.CREATED,
            actorId: userId,
            newValue: {
              studentId: report.studentId,
              classId: report.classId,
              reportDate: dto.reportDate,
              status: report.status
            }
          }
        });
        return report;
      });
      return this.mapReport(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const concurrent = await this.prisma.gcrReport.findUnique({ where: key });
        if (concurrent) return this.mapReport(concurrent);
      }
      throw error;
    }
  }

  async updateReport(userId: string, reportId: string, dto: UpdateGcrReportDto, now = new Date()) {
    if (dto.generalComment === undefined) {
      throw new BadRequestException("generalComment is required");
    }
    const report = await this.editableReport(userId, reportId);
    this.assertVersion(report.version, dto.version);
    const generalComment = this.optionalText(dto.generalComment);
    if (report.generalComment === generalComment) return this.mapReport(report);
    const postClose = false;
    const reason = null;

    const updated = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.gcrReport.updateMany({
        where: { id: reportId, version: dto.version },
        data: {
          generalComment,
          updatedById: userId,
          hasPostCloseChanges: postClose ? true : undefined,
          status: postClose && report.submittedAt ? GcrReportStatus.MODIFIED_POST_CLOSE : undefined,
          version: { increment: 1 }
        }
      });
      if (changed.count !== 1) this.versionConflict();
      const saved = await tx.gcrReport.findUniqueOrThrow({ where: { id: reportId } });
      await tx.gcrAuditEvent.create({
        data: {
          reportId,
          entityType: "GcrReport",
          entityId: reportId,
          action: GcrAuditAction.UPDATED,
          actorId: userId,
          reason,
          oldValue: { generalComment: report.generalComment },
          newValue: { generalComment, postClose }
        }
      });
      return saved;
    });
    return this.mapReport(updated);
  }

  async saveDraft(userId: string, reportId: string, dto: SaveGcrDraftDto, now = new Date()) {
    const report = await this.editableReport(userId, reportId);
    this.assertVersion(report.version, dto.version);
    const generalComment =
      dto.generalComment === undefined
        ? report.generalComment
        : this.optionalText(dto.generalComment);
    const attendance = dto.attendance
      ? { status: dto.attendance.status, comment: this.optionalText(dto.attendance.comment) }
      : null;
    const tasks = (dto.subjectTasks ?? []).map((task) => ({
      classSubjectId: task.classSubjectId,
      homeworkAssigned: task.homeworkAssigned,
      completionStatus: task.homeworkAssigned ? (task.completionStatus ?? null) : null,
      comment: this.optionalText(task.comment)
    }));
    if (tasks.some((task) => !task.homeworkAssigned && task.completionStatus != null)) {
      throw new BadRequestException("completionStatus must be null when homeworkAssigned is false");
    }
    const subjectIds = tasks.map((task) => task.classSubjectId);
    if (subjectIds.length) {
      const validSubjects = await this.prisma.classSubject.count({
        where: { classId: report.classId, id: { in: subjectIds } }
      });
      if (validSubjects !== subjectIds.length) {
        throw new ForbiddenException("One or more subjects are not part of the GCR class");
      }
    }
    const verse = dto.verse
      ? {
          slot: dto.verse.slot,
          reference: dto.verse.reference.trim(),
          text: this.optionalText(dto.verse.text),
          score: dto.verse.score
        }
      : null;
    const [existingAttendance, existingTasks, existingVerse] = await Promise.all([
      this.prisma.gcrAttendance.findUnique({ where: { reportId } }),
      this.prisma.gcrSubjectTask.findMany({ where: { reportId } }),
      verse
        ? this.prisma.gcrVerse.findUnique({
            where: {
              studentId_academicTermId_slot: {
                studentId: report.studentId,
                academicTermId: report.academicTermId,
                slot: verse.slot
              }
            }
          })
        : Promise.resolve(null)
    ]);
    const taskBySubject = new Map(existingTasks.map((task) => [task.classSubjectId, task]));
    const attendanceChanged = Boolean(
      attendance &&
      (!existingAttendance ||
        existingAttendance.status !== attendance.status ||
        existingAttendance.comment !== attendance.comment)
    );
    const tasksChanged = tasks.some((task) => {
      const existing = taskBySubject.get(task.classSubjectId);
      return (
        !existing ||
        existing.homeworkAssigned !== task.homeworkAssigned ||
        existing.completionStatus !== task.completionStatus ||
        existing.comment !== task.comment
      );
    });
    const verseChanged = Boolean(
      verse &&
      (!existingVerse ||
        existingVerse.slot !== verse.slot ||
        existingVerse.reference !== verse.reference ||
        existingVerse.text !== verse.text ||
        existingVerse.score !== verse.score)
    );
    const commentChanged = report.generalComment !== generalComment;
    if (!commentChanged && !attendanceChanged && !tasksChanged && !verseChanged) {
      return this.mapReport(report);
    }
    const postClose = attendanceChanged
      ? report.hasPostCloseChanges
        ? isLateSubmission(formatDateOnly(report.reportDate), now)
        : this.requirePostCloseReason(report, now, dto.postCloseReason)
      : false;
    const reason = postClose ? this.optionalText(dto.postCloseReason) : null;

    const saved = await this.prisma.$transaction(async (tx) => {
      const changed = await tx.gcrReport.updateMany({
        where: { id: reportId, version: dto.version },
        data: {
          generalComment,
          updatedById: userId,
          hasPostCloseChanges: postClose ? true : undefined,
          status: postClose && report.submittedAt ? GcrReportStatus.MODIFIED_POST_CLOSE : undefined,
          version: { increment: 1 }
        }
      });
      if (changed.count !== 1) this.versionConflict();
      if (attendance) {
        await tx.gcrAttendance.upsert({
          where: { reportId },
          create: { reportId, ...attendance, createdById: userId, updatedById: userId },
          update: { ...attendance, updatedById: userId }
        });
      }
      for (const task of tasks) {
        await tx.gcrSubjectTask.upsert({
          where: { reportId_classSubjectId: { reportId, classSubjectId: task.classSubjectId } },
          create: { reportId, ...task, createdById: userId, updatedById: userId },
          update: { ...task, updatedById: userId }
        });
      }
      if (verse) {
        const occupied = await tx.gcrVerse.findUnique({
          where: {
            studentId_academicTermId_slot: {
              studentId: report.studentId,
              academicTermId: report.academicTermId,
              slot: verse.slot
            }
          }
        });
        if (occupied) {
          await tx.gcrVerse.update({
            where: { id: occupied.id },
            data: { ...verse, classSubjectId: null, updatedById: userId }
          });
        } else {
          await tx.gcrVerse.create({
            data: {
              reportId,
              studentId: report.studentId,
              academicTermId: report.academicTermId,
              classSubjectId: null,
              ...verse,
              createdById: userId,
              updatedById: userId
            }
          });
        }
      }
      await tx.gcrAuditEvent.create({
        data: {
          reportId,
          entityType: "GcrReport",
          entityId: reportId,
          action: GcrAuditAction.UPDATED,
          actorId: userId,
          reason,
          oldValue: { version: report.version },
          newValue: {
            version: report.version + 1,
            changed: {
              generalComment: commentChanged,
              attendance: attendanceChanged,
              subjectTaskIds: tasksChanged ? subjectIds : [],
              verse: verseChanged,
              postClose
            }
          }
        }
      });
      return tx.gcrReport.findUniqueOrThrow({ where: { id: reportId } });
    });
    return this.mapReport(saved);
  }

  async upsertAttendance(
    userId: string,
    reportId: string,
    dto: UpsertGcrAttendanceDto,
    now = new Date()
  ) {
    const report = await this.editableReport(userId, reportId);
    this.assertVersion(report.version, dto.version);
    const existing = await this.prisma.gcrAttendance.findUnique({ where: { reportId } });
    const comment = this.optionalText(dto.comment);
    if (existing && existing.status === dto.status && existing.comment === comment) {
      return { ...existing, reportVersion: report.version };
    }
    const postClose = report.hasPostCloseChanges
      ? isLateSubmission(formatDateOnly(report.reportDate), now)
      : this.requirePostCloseReason(report, now, dto.postCloseReason);
    const reason = postClose ? this.optionalText(dto.postCloseReason) : null;

    return this.prisma.$transaction(async (tx) => {
      const attendance = await tx.gcrAttendance.upsert({
        where: { reportId },
        create: { reportId, status: dto.status, comment, createdById: userId, updatedById: userId },
        update: { status: dto.status, comment, updatedById: userId }
      });
      await this.touchBaseReport(
        tx,
        reportId,
        userId,
        dto.version,
        postClose,
        Boolean(report.submittedAt)
      );
      await tx.gcrAuditEvent.create({
        data: {
          reportId,
          entityType: "GcrAttendance",
          entityId: reportId,
          action: existing ? GcrAuditAction.UPDATED : GcrAuditAction.CREATED,
          actorId: userId,
          reason,
          oldValue: existing ? { status: existing.status, comment: existing.comment } : undefined,
          newValue: { status: attendance.status, comment: attendance.comment, postClose }
        }
      });
      return { ...attendance, reportVersion: dto.version + 1 };
    });
  }

  async upsertSubjectTask(
    userId: string,
    reportId: string,
    classSubjectId: string,
    dto: UpsertGcrSubjectTaskDto,
    now = new Date()
  ) {
    if (!dto.homeworkAssigned && dto.completionStatus != null) {
      throw new BadRequestException("completionStatus must be null when homeworkAssigned is false");
    }
    const report = await this.editableReport(userId, reportId);
    this.assertVersion(report.version, dto.version);
    await this.classSubjectInReportClass(classSubjectId, report.classId);
    const existing = await this.prisma.gcrSubjectTask.findUnique({
      where: { reportId_classSubjectId: { reportId, classSubjectId } }
    });
    const completionStatus = dto.completionStatus ?? null;
    const comment = this.optionalText(dto.comment);
    if (
      existing &&
      existing.homeworkAssigned === dto.homeworkAssigned &&
      existing.completionStatus === completionStatus &&
      existing.comment === comment
    ) {
      return { ...existing, reportVersion: report.version };
    }
    const postClose = false;
    const reason = null;

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.gcrSubjectTask.upsert({
        where: { reportId_classSubjectId: { reportId, classSubjectId } },
        create: {
          reportId,
          classSubjectId,
          homeworkAssigned: dto.homeworkAssigned,
          completionStatus,
          comment,
          createdById: userId,
          updatedById: userId
        },
        update: {
          homeworkAssigned: dto.homeworkAssigned,
          completionStatus,
          comment,
          updatedById: userId
        }
      });
      await this.touchBaseReport(
        tx,
        reportId,
        userId,
        dto.version,
        postClose,
        Boolean(report.submittedAt)
      );
      await tx.gcrAuditEvent.create({
        data: {
          reportId,
          entityType: "GcrSubjectTask",
          entityId: task.id,
          action: existing ? GcrAuditAction.UPDATED : GcrAuditAction.CREATED,
          actorId: userId,
          reason,
          oldValue: existing
            ? {
                homeworkAssigned: existing.homeworkAssigned,
                completionStatus: existing.completionStatus,
                comment: existing.comment
              }
            : undefined,
          newValue: {
            classSubjectId,
            homeworkAssigned: task.homeworkAssigned,
            completionStatus: task.completionStatus,
            comment: task.comment,
            postClose
          }
        }
      });
      return { ...task, reportVersion: dto.version + 1 };
    });
  }

  async upsertVerse(userId: string, reportId: string, dto: UpsertGcrVerseDto, now = new Date()) {
    const report = await this.editableReport(userId, reportId);
    this.assertVersion(report.version, dto.version);
    if (dto.classSubjectId) {
      await this.classSubjectInReportClass(dto.classSubjectId, report.classId);
    }
    const existing = await this.prisma.gcrVerse.findUnique({
      where: {
        studentId_academicTermId_slot: {
          studentId: report.studentId,
          academicTermId: report.academicTermId,
          slot: dto.slot
        }
      }
    });
    const reference = dto.reference.trim();
    if (!reference) throw new BadRequestException("reference is required");
    const text = this.optionalText(dto.text);
    const classSubjectId = dto.classSubjectId ?? null;
    if (
      existing &&
      existing.reference === reference &&
      existing.text === text &&
      existing.score === dto.score &&
      existing.classSubjectId === classSubjectId
    ) {
      return { ...existing, reportVersion: report.version };
    }
    const postClose = false;
    const reason = null;

    return this.prisma.$transaction(async (tx) => {
      const verse = existing
        ? await tx.gcrVerse.update({
            where: { id: existing.id },
            data: { reference, text, score: dto.score, classSubjectId, updatedById: userId }
          })
        : await tx.gcrVerse.create({
            data: {
              reportId,
              studentId: report.studentId,
              academicTermId: report.academicTermId,
              classSubjectId,
              slot: dto.slot,
              reference,
              text,
              score: dto.score,
              createdById: userId,
              updatedById: userId
            }
          });
      await this.touchBaseReport(
        tx,
        reportId,
        userId,
        dto.version,
        postClose,
        Boolean(report.submittedAt)
      );
      await tx.gcrAuditEvent.create({
        data: {
          reportId,
          entityType: "GcrVerse",
          entityId: verse.id,
          action: existing ? GcrAuditAction.UPDATED : GcrAuditAction.CREATED,
          actorId: userId,
          reason,
          oldValue: existing
            ? {
                reference: existing.reference,
                text: existing.text,
                score: existing.score,
                classSubjectId: existing.classSubjectId
              }
            : undefined,
          newValue: {
            slot: verse.slot,
            reference: verse.reference,
            text: verse.text,
            score: verse.score,
            classSubjectId: verse.classSubjectId,
            postClose
          }
        }
      });
      return { ...verse, reportVersion: dto.version + 1 };
    });
  }

  async createMerit(userId: string, reportId: string, dto: CreateGcrMeritDto) {
    const report = await this.editableReport(userId, reportId);
    this.assertVersion(report.version, dto.version);
    const comment = dto.comment.trim();
    if (!comment) throw new BadRequestException("comment is required");
    const benefit = this.optionalText(dto.benefit);
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const isPostClose = isLateSubmission(formatDateOnly(report.reportDate), occurredAt);

    return this.prisma.$transaction(async (tx) => {
      await this.touchEventReport(tx, reportId, userId, dto.version);
      const merit = await tx.gcrMerit.create({
        data: { reportId, comment, benefit, occurredAt, isPostClose, createdById: userId }
      });
      await tx.gcrAuditEvent.create({
        data: {
          reportId,
          entityType: "GcrMerit",
          entityId: merit.id,
          action: GcrAuditAction.CREATED,
          actorId: userId,
          newValue: { comment, benefit, occurredAt: occurredAt.toISOString(), isPostClose }
        }
      });
      return { ...merit, reportVersion: dto.version + 1 };
    });
  }

  async createDemerits(userId: string, reportId: string, dto: CreateGcrDemeritsDto) {
    const report = await this.editableReport(userId, reportId);
    this.assertVersion(report.version, dto.version);
    const ordinals = dto.demerits.map((item) => item.ordinal);
    if (new Set(ordinals).size !== ordinals.length) {
      throw new BadRequestException("Demerit ordinals must be unique within the request");
    }
    const items = dto.demerits.map((item) => ({ ...item, comment: item.comment.trim() }));
    if (items.some((item) => !item.comment)) {
      throw new BadRequestException("Every demerit requires a comment");
    }
    const duplicates = await this.prisma.gcrDemerit.findMany({
      where: { reportId, ordinal: { in: ordinals } },
      select: { ordinal: true }
    });
    if (duplicates.length) {
      throw new ConflictException(
        `Demerit ordinal already exists: ${duplicates.map((item) => item.ordinal).join(", ")}`
      );
    }
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const isPostClose = isLateSubmission(formatDateOnly(report.reportDate), occurredAt);
    // TODO(GCR): replace next calendar day with the next instructional day when a school calendar exists.
    const detentionDate = addDays(report.reportDate, 1);

    try {
      return await this.prisma.$transaction(async (tx) => {
        await this.touchEventReport(tx, reportId, userId, dto.version);
        const created = [];
        for (const item of items) {
          const detentionRequired = item.ordinal === 3;
          const demerit = await tx.gcrDemerit.create({
            data: {
              reportId,
              ordinal: item.ordinal,
              comment: item.comment,
              occurredAt,
              isPostClose,
              detentionRequired,
              detentionDate: detentionRequired ? detentionDate : null,
              createdById: userId
            }
          });
          await tx.gcrAuditEvent.create({
            data: {
              reportId,
              entityType: "GcrDemerit",
              entityId: demerit.id,
              action: GcrAuditAction.CREATED,
              actorId: userId,
              newValue: {
                ordinal: demerit.ordinal,
                comment: demerit.comment,
                occurredAt: occurredAt.toISOString(),
                isPostClose,
                detentionRequired,
                detentionDate: demerit.detentionDate ? formatDateOnly(demerit.detentionDate) : null
              }
            }
          });
          created.push(demerit);
        }
        return created.map((item) => ({ ...item, reportVersion: dto.version + 1 }));
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("One or more demerit ordinals already exist for this GCR");
      }
      throw error;
    }
  }

  async submit(
    userId: string,
    reportId: string,
    expectedVersion: number,
    submittedAt = new Date()
  ) {
    const teacherId = await this.teacherId(userId);
    const report = await this.prisma.gcrReport.findUnique({
      where: { id: reportId },
      include: {
        attendance: { select: { reportId: true } }
      }
    });
    if (!report) throw new NotFoundException("GCR report not found");
    await this.assignedClass(teacherId, report.classId, report.reportDate);
    if (submittedStatuses.has(report.status) && report.submittedAt) return this.mapReport(report);
    this.assertVersion(report.version, expectedVersion);
    if (report.status === GcrReportStatus.VOIDED) {
      throw new ConflictException("A voided GCR report cannot be submitted");
    }

    const missingFields = this.calculateMissingFields(report);
    if (missingFields.length) {
      const currentMissing = this.readMissingFields(report.missingFields);
      const needsUpdate =
        report.status !== GcrReportStatus.INCOMPLETE ||
        JSON.stringify(currentMissing) !== JSON.stringify(missingFields);
      let version = report.version;
      if (needsUpdate) {
        await this.prisma.$transaction(async (tx) => {
          const changed = await tx.gcrReport.updateMany({
            where: { id: reportId, version: expectedVersion, submittedAt: null },
            data: {
              status: GcrReportStatus.INCOMPLETE,
              missingFields,
              updatedById: userId,
              version: { increment: 1 }
            }
          });
          if (changed.count !== 1) this.versionConflict();
          await tx.gcrAuditEvent.create({
            data: {
              reportId,
              entityType: "GcrReport",
              entityId: reportId,
              action: GcrAuditAction.UPDATED,
              actorId: userId,
              oldValue: { status: report.status, missingFields: currentMissing },
              newValue: { status: GcrReportStatus.INCOMPLETE, missingFields }
            }
          });
        });
        version += 1;
      }
      throw new BadRequestException({
        message: "GCR report is incomplete",
        code: "GCR_INCOMPLETE",
        reportId,
        version,
        missingFields
      });
    }

    const reportDate = formatDateOnly(report.reportDate);
    const late = isLateSubmission(reportDate, submittedAt);
    const status = late ? GcrReportStatus.SUBMITTED_LATE : GcrReportStatus.SUBMITTED_ON_TIME;
    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.gcrReport.updateMany({
        where: {
          id: reportId,
          version: expectedVersion,
          submittedAt: null,
          status: { in: [GcrReportStatus.DRAFT, GcrReportStatus.INCOMPLETE] }
        },
        data: {
          status,
          submittedAt,
          submittedById: userId,
          firstSubmittedAt: report.firstSubmittedAt ?? submittedAt,
          isLate: late,
          missingFields: [],
          updatedById: userId,
          version: { increment: 1 }
        }
      });
      if (updated.count === 0) {
        const concurrent = await tx.gcrReport.findUniqueOrThrow({ where: { id: reportId } });
        if (submittedStatuses.has(concurrent.status) && concurrent.submittedAt) return concurrent;
        this.versionConflict();
      }
      const saved = await tx.gcrReport.findUniqueOrThrow({ where: { id: reportId } });
      await tx.gcrAuditEvent.create({
        data: {
          reportId,
          entityType: "GcrReport",
          entityId: reportId,
          action: GcrAuditAction.SUBMITTED,
          actorId: userId,
          oldValue: {
            status: report.status,
            submittedAt: report.submittedAt?.toISOString() ?? null
          },
          newValue: { status, submittedAt: submittedAt.toISOString(), isLate: late }
        }
      });
      return saved;
    });

    return this.mapReport(result);
  }

  private async editableReport(userId: string, reportId: string) {
    const teacherId = await this.teacherId(userId);
    const report = await this.prisma.gcrReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException("GCR report not found");
    if (report.status === GcrReportStatus.VOIDED || report.voidedAt) {
      throw new ConflictException("A voided GCR report cannot be edited");
    }
    await this.assignedClass(teacherId, report.classId, report.reportDate);
    await this.activeEnrollment(report.studentId, report.classId);
    return report;
  }

  private requirePostCloseReason(
    report: { reportDate: Date; submittedAt: Date | null },
    now: Date,
    reason?: string
  ) {
    const postClose = isLateSubmission(formatDateOnly(report.reportDate), now);
    if (postClose && !reason?.trim()) {
      throw new BadRequestException(
        "postCloseReason is required to change attendance after 10:00 America/Panama"
      );
    }
    return postClose;
  }

  private touchBaseReport(
    tx: Prisma.TransactionClient,
    reportId: string,
    userId: string,
    expectedVersion: number,
    postClose: boolean,
    submitted: boolean
  ) {
    return tx.gcrReport
      .updateMany({
        where: { id: reportId, version: expectedVersion },
        data: {
          updatedById: userId,
          hasPostCloseChanges: postClose ? true : undefined,
          status: postClose && submitted ? GcrReportStatus.MODIFIED_POST_CLOSE : undefined,
          version: { increment: 1 }
        }
      })
      .then((result) => {
        if (result.count !== 1) this.versionConflict();
      });
  }

  private touchEventReport(
    tx: Prisma.TransactionClient,
    reportId: string,
    userId: string,
    expectedVersion: number
  ) {
    return tx.gcrReport
      .updateMany({
        where: { id: reportId, version: expectedVersion },
        data: { updatedById: userId, version: { increment: 1 } }
      })
      .then((result) => {
        if (result.count !== 1) this.versionConflict();
      });
  }

  private assertVersion(actual: number, expected: number) {
    if (actual !== expected) this.versionConflict();
  }

  private versionConflict(): never {
    throw new ConflictException("GCR report version conflict; refresh the report and retry");
  }

  private async classSubjectInReportClass(classSubjectId: string, classId: string) {
    const subject = await this.prisma.classSubject.findFirst({
      where: { id: classSubjectId, classId },
      select: { id: true }
    });
    if (!subject) throw new ForbiddenException("Subject is not part of the GCR class");
    return subject;
  }

  private optionalText(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private async teacherId(userId: string) {
    const profile = await this.prisma.teacherProfile.findUnique({
      where: { userId },
      select: { id: true, status: true }
    });
    if (!profile || profile.status !== "ACTIVE") {
      throw new ForbiddenException("Active teacher profile required");
    }
    return profile.id;
  }

  private async assignedClass(teacherId: string, classId: string, date: Date) {
    const schoolClass = await this.prisma.academicClass.findFirst({
      where: {
        id: classId,
        status: "ACTIVE",
        academicYear: { startsAt: { lte: date }, endsAt: { gte: date } },
        OR: [
          { teachers: { some: { teacherId } } },
          { subjects: { some: { teachers: { some: { teacherId } } } } }
        ]
      },
      select: {
        id: true,
        name: true,
        code: true,
        academicYearId: true,
        academicYear: { select: { startsAt: true, endsAt: true } },
        gradeLevel: { select: { id: true, code: true, name: true } },
        teachers: { select: { teacherId: true, isPrimary: true } },
        subjects: {
          select: {
            id: true,
            subject: { select: { id: true, name: true, shortName: true, color: true } }
          },
          orderBy: { subject: { name: "asc" } }
        }
      }
    });
    if (!schoolClass)
      throw new ForbiddenException("Class is not assigned to this teacher for the selected date");
    return schoolClass;
  }

  private async studentClass(teacherId: string, studentId: string, date: Date) {
    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: {
        studentId,
        status: "ACTIVE",
        student: { status: "ACTIVE" },
        class: {
          status: "ACTIVE",
          academicYear: { startsAt: { lte: date }, endsAt: { gte: date } },
          OR: [
            { teachers: { some: { teacherId } } },
            { subjects: { some: { teachers: { some: { teacherId } } } } }
          ]
        }
      },
      select: { classId: true },
      orderBy: { class: { name: "asc" } }
    });
    if (!enrollment) throw new ForbiddenException("Student is not assigned to this teacher");
    return this.assignedClass(teacherId, enrollment.classId, date);
  }

  private async activeEnrollment(studentId: string, classId: string) {
    const enrollment = await this.prisma.classEnrollment.findFirst({
      where: { studentId, classId, status: "ACTIVE", student: { status: "ACTIVE" } },
      select: {
        student: {
          select: {
            id: true,
            studentCode: true,
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });
    if (!enrollment) throw new ForbiddenException("Student is not actively enrolled in this class");
    return enrollment;
  }

  private termForDate(academicYearId: string, date: Date) {
    return this.prisma.academicTerm.findFirst({
      where: { academicYearId, startsAt: { lte: date }, endsAt: { gte: date } },
      orderBy: { order: "asc" }
    });
  }

  private datePoint(value: string, field: string) {
    try {
      return parseDateOnly(value);
    } catch {
      throw new BadRequestException(`${field} must be a valid date in YYYY-MM-DD format`);
    }
  }

  private calculateMissingFields(report: {
    attendance: { reportId: string } | null;
  }): GcrMissingField[] {
    return report.attendance ? [] : [{ code: "ATTENDANCE_REQUIRED" }];
  }

  private readMissingFields(value: Prisma.JsonValue | null): GcrMissingField[] {
    return Array.isArray(value) ? (value as GcrMissingField[]) : [];
  }

  private mapFullReport(
    report: Parameters<GcrService["mapReport"]>[0] & {
      generalComment: string | null;
      missingFields: Prisma.JsonValue | null;
      attendance: {
        status: string;
        comment: string | null;
        createdAt: Date;
        updatedAt: Date;
      } | null;
      subjectTasks: Array<{
        id: string;
        classSubjectId: string;
        homeworkAssigned: boolean;
        completionStatus: string | null;
        comment: string | null;
        createdAt: Date;
        updatedAt: Date;
      }>;
      verses: Array<{
        id: string;
        classSubjectId: string | null;
        slot: number;
        reference: string;
        text: string | null;
        score: number;
        createdAt: Date;
        updatedAt: Date;
      }>;
      merits: Array<{
        id: string;
        comment: string;
        benefit: string | null;
        occurredAt: Date;
        isPostClose: boolean;
      }>;
      demerits: Array<{
        id: string;
        ordinal: number;
        comment: string;
        occurredAt: Date;
        isPostClose: boolean;
        detentionRequired: boolean;
        detentionDate: Date | null;
      }>;
    }
  ) {
    const { attendance, subjectTasks, verses, merits, demerits, ...baseReport } = report;
    const currentMissingFields = this.calculateMissingFields({
      attendance: attendance ? { reportId: report.id } : null
    });
    return {
      ...this.mapReport(baseReport),
      reportId: report.id,
      generalComment: report.generalComment ?? "",
      missingFields: currentMissingFields,
      attendance: attendance
        ? {
            ...attendance,
            createdAt: attendance.createdAt.toISOString(),
            updatedAt: attendance.updatedAt.toISOString()
          }
        : null,
      subjectTasks: subjectTasks.map((task) => ({
        ...task,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString()
      })),
      verse: verses[0]
        ? {
            ...verses[0],
            createdAt: verses[0].createdAt.toISOString(),
            updatedAt: verses[0].updatedAt.toISOString()
          }
        : null,
      merits: merits.map((event) => ({
        ...event,
        occurredAt: event.occurredAt.toISOString()
      })),
      demerits: demerits.map((event) => ({
        ...event,
        occurredAt: event.occurredAt.toISOString(),
        detentionDate: event.detentionDate ? formatDateOnly(event.detentionDate) : null
      })),
      detention: demerits.find((event) => event.detentionRequired)
        ? {
            required: true,
            date: formatDateOnly(demerits.find((event) => event.detentionRequired)!.detentionDate!)
          }
        : null
    };
  }

  private mapReport(report: {
    id: string;
    studentId?: string;
    classId?: string;
    academicTermId?: string;
    responsibleTeacherId?: string;
    reportDate: Date;
    status: GcrReportStatus;
    submittedAt: Date | null;
    firstSubmittedAt: Date | null;
    isLate: boolean;
    hasPostCloseChanges: boolean;
    missingFields?: Prisma.JsonValue | null;
    generalComment?: string | null;
    version: number;
    createdAt?: Date;
    updatedAt: Date;
  }) {
    return {
      ...report,
      reportDate: formatDateOnly(report.reportDate),
      submittedAt: report.submittedAt?.toISOString() ?? null,
      firstSubmittedAt: report.firstSubmittedAt?.toISOString() ?? null,
      createdAt: report.createdAt?.toISOString(),
      updatedAt: report.updatedAt.toISOString()
    };
  }
}
