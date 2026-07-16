import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException
} from "@nestjs/common";
import {
  ClassAssignmentStatus as SharedAssignmentStatus,
  ClassSubmissionStatus as SharedSubmissionStatus,
  UserRole,
  type AuthUser,
  type ClassroomClassSummary,
  type ClassroomWorkspace
} from "@homeschool/shared";
import { ClassAssignmentStatus, ClassMaterialKind, ClassSubmissionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StorageService } from "../files/storage.service";
import {
  CreateClassAssignmentDto,
  CreateClassMaterialDto,
  CreateWallCommentDto,
  CreateWallPostDto,
  GradeClassSubmissionDto,
  SubmitAssignmentDto
} from "./dto/classroom.dto";

const workspaceInclude = {
  gradeLevel: true,
  teachers: { include: { teacher: { include: { user: true } } } },
  enrollments: {
    where: { status: "ACTIVE" as const },
    include: { student: { include: { user: true } } }
  },
  subjects: { include: { subject: true } },
  wallPosts: {
    orderBy: { createdAt: "asc" as const },
    include: {
      author: true,
      comments: { orderBy: { createdAt: "asc" as const }, include: { author: true } }
    }
  },
  assignments: {
    orderBy: { createdAt: "desc" as const },
    include: {
      attachments: { orderBy: { createdAt: "asc" as const } },
      submissions: {
        include: {
          student: { include: { user: true } },
          attachments: { orderBy: { createdAt: "asc" as const } }
        }
      }
    }
  },
  materials: { orderBy: { createdAt: "desc" as const }, include: { uploadedBy: true } }
};

@Injectable()
export class ClassroomService {
  private readonly logger = new Logger(ClassroomService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService
  ) {}

  async workspace(user: AuthUser, classId: string): Promise<ClassroomWorkspace> {
    await this.assertClassAccess(user, classId);
    const item = await this.prisma.academicClass.findUnique({
      where: { id: classId },
      include: workspaceInclude
    });
    if (!item) throw new NotFoundException("Class not found");
    const student = user.roles.includes(UserRole.STUDENT)
      ? await this.prisma.studentProfile.findUnique({
          where: { userId: user.id },
          select: { id: true }
        })
      : null;
    return {
      id: item.id,
      name: item.name,
      code: item.code,
      description: item.description,
      color: item.color,
      gradeName: item.gradeLevel?.name ?? null,
      teachers: item.teachers.map((link) => person(link.teacher.user, link.teacher.id)),
      students: item.enrollments.map((link) => person(link.student.user, link.student.id)),
      subjects: item.subjects.map((link) => ({
        id: link.id,
        name: link.subject.name,
        shortName: link.subject.shortName,
        color: link.subject.color
      })),
      wall: item.wallPosts.map((post) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt.toISOString(),
        author: person(post.author),
        comments: post.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          author: person(comment.author)
        }))
      })),
      assignments: item.assignments
        .filter((assignment) => !student || assignment.status !== ClassAssignmentStatus.DRAFT)
        .map((assignment) => ({
          id: assignment.id,
          classId: item.id,
          className: item.name,
          classCode: item.code,
          title: assignment.title,
          description: assignment.description,
          dueAt: assignment.dueAt?.toISOString() ?? null,
          points: assignment.points,
          submissionType: assignment.submissionType,
          status: assignment.status as SharedAssignmentStatus,
          createdAt: assignment.createdAt.toISOString(),
          attachments: assignment.attachments.map((attachment) => ({
            id: attachment.id,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            createdAt: attachment.createdAt.toISOString(),
            downloadUrl: `/classroom/assignment-attachments/${attachment.id}/download`
          })),
          submissions: student ? [] : assignment.submissions.map(mapSubmission),
          mySubmission: student
            ? assignment.submissions.find((entry) => entry.studentId === student.id)
              ? mapSubmission(
                  assignment.submissions.find((entry) => entry.studentId === student.id)!
                )
              : null
            : null
        })),
      materials: item.materials
        .filter((material) => !student || material.visibleToStudents)
        .map((material) => ({
          id: material.id,
          classId: item.id,
          className: item.name,
          classCode: item.code,
          name: material.name,
          kind: material.kind,
          mimeType: material.mimeType,
          sizeBytes: material.sizeBytes,
          externalUrl: material.externalUrl,
          downloadUrl: material.storageKey ? `/classroom/materials/${material.id}/download` : null,
          visibleToStudents: material.visibleToStudents,
          isImportant: material.isImportant,
          createdAt: material.createdAt.toISOString(),
          uploadedBy: person(material.uploadedBy)
        }))
    };
  }

  async teacherClassSummaries(user: AuthUser): Promise<ClassroomClassSummary[]> {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { classLinks: true, subjectLinks: { include: { classSubject: true } } }
    });
    if (!teacher) throw new ForbiddenException("Teacher profile not found");
    const ids = [
      ...new Set([
        ...teacher.classLinks.map((x) => x.classId),
        ...teacher.subjectLinks.map((x) => x.classSubject.classId)
      ])
    ];
    const classes = await this.prisma.academicClass.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        color: true,
        gradeLevel: { select: { name: true } },
        teachers: {
          select: {
            teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } }
          }
        },
        subjects: {
          select: {
            id: true,
            subject: { select: { name: true, shortName: true, color: true } }
          }
        },
        _count: {
          select: {
            enrollments: { where: { status: "ACTIVE" } },
            assignments: true,
            materials: true,
            wallPosts: true
          }
        },
        wallPosts: { orderBy: { createdAt: "desc" }, take: 1, select: { title: true, createdAt: true } },
        assignments: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { title: true, createdAt: true }
        },
        materials: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { name: true, createdAt: true }
        }
      },
      orderBy: { name: "asc" }
    });

    return classes.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      description: item.description,
      color: item.color,
      gradeName: item.gradeLevel?.name ?? null,
      teachers: item.teachers.map((link) => ({
        id: link.teacher.id,
        displayName: `${link.teacher.user.firstName} ${link.teacher.user.lastName}`
      })),
      subjects: item.subjects.map((link) => ({
        id: link.id,
        name: link.subject.name,
        shortName: link.subject.shortName,
        color: link.subject.color
      })),
      studentCount: item._count.enrollments,
      assignmentCount: item._count.assignments,
      materialCount: item._count.materials,
      wallPostCount: item._count.wallPosts,
      pendingAssignmentsCount: 0,
      latestActivity: latestClassActivity(item)
    }));
  }

  async studentClassSummaries(user: AuthUser): Promise<ClassroomClassSummary[]> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });
    if (!student) throw new ForbiddenException("Student profile not found");
    const classes = await this.prisma.academicClass.findMany({
      where: { enrollments: { some: { studentId: student.id, status: "ACTIVE" } } },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        color: true,
        gradeLevel: { select: { name: true } },
        teachers: {
          select: {
            teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } }
          }
        },
        subjects: {
          select: {
            id: true,
            subject: { select: { name: true, shortName: true, color: true } }
          }
        },
        _count: {
          select: {
            enrollments: { where: { status: "ACTIVE" } },
            materials: { where: { visibleToStudents: true } },
            wallPosts: true
          }
        },
        assignments: {
          where: { status: { not: ClassAssignmentStatus.DRAFT } },
          select: {
            submissions: {
              where: { studentId: student.id },
              select: { status: true }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return classes.map((item) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      description: item.description,
      color: item.color,
      gradeName: item.gradeLevel?.name ?? null,
      teachers: item.teachers.map((link) => ({
        id: link.teacher.id,
        displayName: `${link.teacher.user.firstName} ${link.teacher.user.lastName}`
      })),
      subjects: item.subjects.map((link) => ({
        id: link.id,
        name: link.subject.name,
        shortName: link.subject.shortName,
        color: link.subject.color
      })),
      studentCount: item._count.enrollments,
      assignmentCount: item.assignments.length,
      materialCount: item._count.materials,
      wallPostCount: item._count.wallPosts,
      pendingAssignmentsCount: item.assignments.filter(
        (assignment) =>
          !assignment.submissions.some((submission) =>
            submission.status === ClassSubmissionStatus.SUBMITTED ||
            submission.status === ClassSubmissionStatus.GRADED
          )
      ).length,
      latestActivity: null
    }));
  }

  async createWallPost(user: AuthUser, classId: string, dto: CreateWallPostDto) {
    await this.assertClassAccess(user, classId);
    await this.prisma.classWallPost.create({
      data: { classId, authorId: user.id, title: dto.title.trim(), content: dto.content.trim() }
    });
    return this.workspace(user, classId);
  }

  async comment(user: AuthUser, postId: string, dto: CreateWallCommentDto) {
    const post = await this.prisma.classWallPost.findUnique({
      where: { id: postId },
      select: { classId: true }
    });
    if (!post) throw new NotFoundException("Post not found");
    await this.assertClassAccess(user, post.classId);
    await this.prisma.classWallComment.create({
      data: { postId, authorId: user.id, content: dto.content.trim() }
    });
    return this.workspace(user, post.classId);
  }

  async createAssignment(
    user: AuthUser,
    classId: string,
    dto: CreateClassAssignmentDto,
    files: Array<{ originalname: string; mimetype: string; size: number; buffer: Buffer }>
  ) {
    await this.assertTeacherAccess(user, classId);
    const uploaded: Array<{
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      storageKey: string;
    }> = [];
    for (const file of files) {
      if (!file.originalname.trim() || file.size === 0 || file.buffer.length === 0) {
        await this.deleteStoredObjectsWithoutThrowing(
          uploaded.map((item) => item.storageKey),
          "invalid assignment attachment rollback"
        );
        throw new BadRequestException("El archivo adjunto está vacío o no es válido");
      }
      try {
        uploaded.push({
          fileName: file.originalname,
          mimeType: file.mimetype || "application/octet-stream",
          sizeBytes: file.size,
          storageKey: await this.storage.store({
            originalName: file.originalname,
            mimeType: file.mimetype,
            buffer: file.buffer
          })
        });
      } catch (error) {
        await this.deleteStoredObjectsWithoutThrowing(
          uploaded.map((item) => item.storageKey),
          "partial assignment upload rollback"
        );
        throw error;
      }
    }
    try {
      await this.prisma.classAssignment.create({
        data: {
          classId,
          createdById: user.id,
          title: dto.title.trim(),
          description: dto.description.trim(),
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          points: dto.points,
          submissionType: dto.submissionType,
          status: (dto.status as ClassAssignmentStatus | undefined) ?? ClassAssignmentStatus.DRAFT,
          attachments: { create: uploaded }
        }
      });
    } catch (error) {
      await this.deleteStoredObjectsWithoutThrowing(
        uploaded.map((item) => item.storageKey),
        "assignment create rollback"
      );
      throw error;
    }
    return this.workspace(user, classId);
  }

  async createMaterial(
    user: AuthUser,
    classId: string,
    dto: CreateClassMaterialDto,
    file?: { originalname: string; mimetype: string; size: number; buffer: Buffer }
  ) {
    await this.assertTeacherAccess(user, classId);
    if (!file && !dto.externalUrl) {
      throw new BadRequestException("Selecciona un archivo o agrega un enlace externo");
    }
    if (file && dto.externalUrl) {
      throw new BadRequestException("Selecciona solo un archivo o un enlace externo, no ambos");
    }
    if (file && file.size === 0) {
      throw new BadRequestException("El archivo seleccionado está vacío");
    }
    let storageKey: string | undefined;
    if (file) {
      storageKey = await this.storage.store({
        originalName: file.originalname,
        mimeType: file.mimetype,
        buffer: file.buffer
      });
    }
    await this.prisma.classMaterial.create({
      data: {
        classId,
        uploadedById: user.id,
        name: dto.name?.trim() || file?.originalname || "Recurso",
        kind: dto.externalUrl ? ClassMaterialKind.LINK : ClassMaterialKind.FILE,
        mimeType: file?.mimetype,
        sizeBytes: file?.size,
        storageKey,
        externalUrl: dto.externalUrl,
        visibleToStudents: dto.visibleToStudents ?? true,
        isImportant: dto.isImportant ?? false
      }
    });
    return this.workspace(user, classId);
  }

  async submit(
    user: AuthUser,
    assignmentId: string,
    dto: SubmitAssignmentDto,
    files: Array<{ originalname: string; mimetype: string; size: number; buffer: Buffer }>
  ) {
    const assignment = await this.prisma.classAssignment.findUnique({
      where: { id: assignmentId },
      select: { classId: true, status: true }
    });
    if (!assignment || assignment.status !== ClassAssignmentStatus.PUBLISHED)
      throw new NotFoundException("Published assignment not found");
    await this.assertClassAccess(user, assignment.classId);
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true }
    });
    if (!student) throw new ForbiddenException("Student profile not found");
    const previousSubmission = await this.prisma.classSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
      include: { attachments: { select: { id: true } } }
    });
    if ((previousSubmission?.attachments.length ?? 0) + files.length > 5) {
      throw new BadRequestException("Cada entrega admite un máximo de 5 archivos");
    }
    const uploaded: Array<{
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      storageKey: string;
    }> = [];
    for (const file of files) {
      if (!file.originalname.trim() || file.size === 0 || file.buffer.length === 0) {
        await this.deleteStoredObjectsWithoutThrowing(
          uploaded.map((item) => item.storageKey),
          "invalid submission rollback"
        );
        throw new BadRequestException("El archivo seleccionado está vacío o no es válido");
      }
      try {
        uploaded.push({
          fileName: file.originalname,
          mimeType: file.mimetype || "application/octet-stream",
          sizeBytes: file.size,
          storageKey: await this.storage.store({
            originalName: file.originalname,
            mimeType: file.mimetype,
            buffer: file.buffer
          })
        });
      } catch (error) {
        await this.deleteStoredObjectsWithoutThrowing(
          uploaded.map((item) => item.storageKey),
          "partial upload rollback"
        );
        throw error;
      }
    }
    try {
      await this.prisma.$transaction(async (tx) => {
        const submission = await tx.classSubmission.upsert({
          where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
          create: {
            assignmentId,
            studentId: student.id,
            body: dto.body,
            status: ClassSubmissionStatus.SUBMITTED,
            submittedAt: new Date()
          },
          update: {
            body: dto.body,
            status: ClassSubmissionStatus.SUBMITTED,
            submittedAt: new Date()
          }
        });
        if (uploaded.length) {
          await tx.classSubmissionAttachment.createMany({
            data: uploaded.map((attachment) => ({ ...attachment, submissionId: submission.id }))
          });
        }
      });
    } catch (error) {
      await this.deleteStoredObjectsWithoutThrowing(
        uploaded.map((item) => item.storageKey),
        "new submission rollback"
      );
      throw error;
    }
    return this.workspace(user, assignment.classId);
  }

  async assignmentSubmissions(user: AuthUser, assignmentId: string) {
    const assignment = await this.prisma.classAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        submissions: {
          include: {
            student: { include: { user: true } },
            attachments: { orderBy: { createdAt: "asc" } }
          },
          orderBy: { submittedAt: "desc" }
        }
      }
    });
    if (!assignment) throw new NotFoundException("Assignment not found");
    await this.assertTeacherAccess(user, assignment.classId);
    return {
      id: assignment.id,
      title: assignment.title,
      points: assignment.points,
      submissions: assignment.submissions.map(mapSubmission)
    };
  }

  async gradeSubmission(user: AuthUser, submissionId: string, dto: GradeClassSubmissionDto) {
    const submission = await this.prisma.classSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { select: { id: true, classId: true, points: true } } }
    });
    if (!submission) throw new NotFoundException("Submission not found");
    await this.assertTeacherAccess(user, submission.assignment.classId);
    if (
      submission.status !== ClassSubmissionStatus.SUBMITTED &&
      submission.status !== ClassSubmissionStatus.GRADED
    ) {
      throw new BadRequestException("Only submitted work can be graded");
    }
    if (submission.assignment.points != null && dto.score > submission.assignment.points) {
      throw new BadRequestException("Score exceeds assignment points");
    }
    await this.prisma.classSubmission.update({
      where: { id: submissionId },
      data: {
        status: ClassSubmissionStatus.GRADED,
        score: dto.score,
        feedback: dto.feedback?.trim() || null
      }
    });
    return this.assignmentSubmissions(user, submission.assignment.id);
  }

  async submissionFile(user: AuthUser, submissionId: string) {
    const submission = await this.prisma.classSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { select: { classId: true } },
        student: { select: { userId: true } },
        attachments: { orderBy: { createdAt: "asc" }, take: 1 }
      }
    });
    if (!submission) throw new NotFoundException("Submission file not found");
    await this.assertSubmissionAccess(user, submission);
    const attachment = submission.attachments[0];
    const storageKey = attachment?.storageKey ?? submission.storageKey;
    if (!storageKey) throw new NotFoundException("Submission file not found");
    return {
      data: await this.storage.read(storageKey),
      name: attachment?.fileName ?? submission.fileName ?? "entrega",
      mimeType: attachment?.mimeType ?? submission.mimeType ?? "application/octet-stream"
    };
  }

  async submissionAttachmentFile(user: AuthUser, attachmentId: string) {
    const attachment = await this.prisma.classSubmissionAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        submission: {
          include: {
            assignment: { select: { classId: true } },
            student: { select: { userId: true } }
          }
        }
      }
    });
    if (!attachment) throw new NotFoundException("Submission file not found");
    await this.assertSubmissionAccess(user, attachment.submission);
    return {
      data: await this.storage.read(attachment.storageKey),
      name: attachment.fileName,
      mimeType: attachment.mimeType
    };
  }

  async assignmentAttachmentFile(user: AuthUser, attachmentId: string) {
    const attachment = await this.prisma.classAssignmentAttachment.findUnique({
      where: { id: attachmentId },
      include: { assignment: { select: { classId: true } } }
    });
    if (!attachment) throw new NotFoundException("Assignment file not found");
    await this.assertClassAccess(user, attachment.assignment.classId);
    return {
      data: await this.storage.read(attachment.storageKey),
      name: attachment.fileName,
      mimeType: attachment.mimeType
    };
  }

  async deleteOwnSubmission(user: AuthUser, submissionId: string) {
    const submission = await this.prisma.classSubmission.findUnique({
      where: { id: submissionId },
      include: {
        student: { select: { userId: true } },
        attachments: { select: { storageKey: true } }
      }
    });
    if (!submission || submission.student.userId !== user.id) {
      throw new NotFoundException("Submission not found");
    }
    if (submission.status === ClassSubmissionStatus.GRADED) {
      throw new BadRequestException("Una entrega calificada no se puede eliminar");
    }
    await this.prisma.classSubmission.delete({ where: { id: submission.id } });
    const storageKeys = new Set(submission.attachments.map((item) => item.storageKey));
    if (submission.storageKey) storageKeys.add(submission.storageKey);
    await this.deleteStoredObjectsWithoutThrowing([...storageKeys], "deleted submission cleanup");
    return { id: submission.id };
  }

  async deleteOwnSubmissionAttachment(user: AuthUser, attachmentId: string) {
    const attachment = await this.prisma.classSubmissionAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        submission: {
          include: { student: { select: { userId: true } } }
        }
      }
    });
    if (!attachment || attachment.submission.student.userId !== user.id) {
      throw new NotFoundException("Submission attachment not found");
    }
    if (attachment.submission.status === ClassSubmissionStatus.GRADED) {
      throw new BadRequestException("Los archivos de una entrega calificada no se pueden eliminar");
    }
    await this.prisma.classSubmissionAttachment.delete({ where: { id: attachment.id } });
    await this.deleteStoredObjectWithoutThrowing(
      attachment.storageKey,
      "deleted submission attachment cleanup"
    );
    return { id: attachment.id };
  }

  async materialFile(user: AuthUser, materialId: string) {
    const material = await this.prisma.classMaterial.findUnique({ where: { id: materialId } });
    if (!material?.storageKey) throw new NotFoundException("File not found");
    await this.assertClassAccess(user, material.classId);
    if (user.roles.includes(UserRole.STUDENT) && !material.visibleToStudents) {
      throw new NotFoundException("File not found");
    }
    return {
      data: await this.storage.read(material.storageKey),
      name: material.name,
      mimeType: material.mimeType ?? "application/octet-stream"
    };
  }

  async deleteMaterial(user: AuthUser, materialId: string) {
    const material = await this.prisma.classMaterial.findUnique({
      where: { id: materialId },
      select: { id: true, classId: true, storageKey: true }
    });
    if (!material) throw new NotFoundException("Material not found");
    await this.assertTeacherAccess(user, material.classId);
    if (material.storageKey) await this.storage.deleteObject(material.storageKey);
    await this.prisma.classMaterial.delete({ where: { id: material.id } });
    return { id: material.id };
  }

  private async deleteStoredObjectWithoutThrowing(storageKey: string, reason: string) {
    try {
      await this.storage.deleteObject(storageKey);
    } catch (error) {
      this.logger.warn(
        `Storage cleanup failed (${reason}): ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async deleteStoredObjectsWithoutThrowing(storageKeys: string[], reason: string) {
    for (const storageKey of storageKeys) {
      await this.deleteStoredObjectWithoutThrowing(storageKey, reason);
    }
  }

  private async assertSubmissionAccess(
    user: AuthUser,
    submission: { assignment: { classId: string }; student: { userId: string } }
  ) {
    if (user.roles.includes(UserRole.TEACHER) || user.roles.includes(UserRole.ADMIN)) {
      await this.assertTeacherAccess(user, submission.assignment.classId);
      return;
    }
    if (user.roles.includes(UserRole.STUDENT) && submission.student.userId === user.id) return;
    throw new NotFoundException("Submission file not found");
  }

  private async assertTeacherAccess(user: AuthUser, classId: string) {
    if (!user.roles.includes(UserRole.TEACHER) && !user.roles.includes(UserRole.ADMIN))
      throw new ForbiddenException("Teacher access required");
    await this.assertClassAccess(user, classId);
  }

  private async assertClassAccess(user: AuthUser, classId: string) {
    if (user.roles.includes(UserRole.ADMIN)) return;
    if (user.roles.includes(UserRole.TEACHER)) {
      const profile = await this.prisma.teacherProfile.findUnique({
        where: { userId: user.id },
        select: { id: true }
      });
      const found =
        profile &&
        (await this.prisma.academicClass.findFirst({
          where: {
            id: classId,
            OR: [
              { teachers: { some: { teacherId: profile.id } } },
              { subjects: { some: { teachers: { some: { teacherId: profile.id } } } } }
            ]
          },
          select: { id: true }
        }));
      if (found) return;
    }
    if (user.roles.includes(UserRole.STUDENT)) {
      const found = await this.prisma.classEnrollment.findFirst({
        where: { classId, status: "ACTIVE", student: { userId: user.id } },
        select: { classId: true }
      });
      if (found) return;
    }
    throw new ForbiddenException("Class is not assigned to this user");
  }
}

function person(
  user: { id: string; firstName: string; lastName: string; email: string },
  profileId?: string
) {
  return {
    id: user.id,
    profileId,
    displayName: `${user.firstName} ${user.lastName}`,
    email: user.email
  };
}

function latestClassActivity(item: {
  wallPosts: Array<{ title: string; createdAt: Date }>;
  assignments: Array<{ title: string; createdAt: Date }>;
  materials: Array<{ name: string; createdAt: Date }>;
}): ClassroomClassSummary["latestActivity"] {
  const latest = [
    ...item.wallPosts.map((entry) => ({
      kind: "WALL" as const,
      title: entry.title,
      createdAt: entry.createdAt
    })),
    ...item.assignments.map((entry) => ({
      kind: "ASSIGNMENT" as const,
      title: entry.title,
      createdAt: entry.createdAt
    })),
    ...item.materials.map((entry) => ({
      kind: "MATERIAL" as const,
      title: entry.name,
      createdAt: entry.createdAt
    }))
  ].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

  return latest
    ? { kind: latest.kind, title: latest.title, createdAt: latest.createdAt.toISOString() }
    : null;
}

function mapSubmission(entry: {
  id: string;
  status: ClassSubmissionStatus;
  body: string | null;
  fileName: string | null;
  submittedAt: Date | null;
  score: number | null;
  feedback: string | null;
  attachments: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number | null;
    storageKey: string;
    createdAt: Date;
  }>;
  student: { id: string; user: { id: string; firstName: string; lastName: string; email: string } };
}) {
  return {
    id: entry.id,
    status: entry.status as SharedSubmissionStatus,
    body: entry.body,
    fileName: entry.attachments[0]?.fileName ?? entry.fileName,
    submittedAt: entry.submittedAt?.toISOString() ?? null,
    score: entry.score,
    feedback: entry.feedback,
    attachments: entry.attachments.map((attachment) => ({
      id: attachment.id,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      createdAt: attachment.createdAt.toISOString(),
      downloadUrl: `/classroom/submission-attachments/${attachment.id}/download`
    })),
    student: person(entry.student.user, entry.student.id)
  };
}
