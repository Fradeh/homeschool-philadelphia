import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  AuthUser,
  ConversationListItem,
  ConversationMessagePage,
  ConversationMessageSummary,
  ConversationMutationResult,
  ConversationParticipantType,
  ConversationStatus,
  ConversationContact,
  UserRole
} from "@homeschool/shared";
import { ConversationParticipantType as PrismaParticipantType, ConversationStatus as PrismaConversationStatus, Prisma, RoleName } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CloseConversationDto, ConversationMessagesQueryDto, CreateConversationDto, EscalateConversationDto, SendConversationMessageDto, UpdateConversationMessageDto } from "./dto/conversations.dto";

const conversationListInclude = {
  participants: {
    include: { user: true },
    orderBy: { joinedAt: "asc" as const }
  },
  messages: {
    include: { sender: true },
    orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }],
    take: 1
  },
  _count: { select: { messages: true } }
} satisfies Prisma.ConversationInclude;

type ConversationListRecord = Prisma.ConversationGetPayload<{
  include: typeof conversationListInclude;
}>;
type ParticipantSeed = { userId: string; type: ConversationParticipantType };

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser): Promise<ConversationListItem[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: user.roles.includes(UserRole.ADMINISTRATIVE) || user.roles.includes(UserRole.DIRECTOR)
        ? {
            OR: [
              { participants: { some: { userId: user.id } } },
              { status: PrismaConversationStatus.ESCALATED }
            ]
          }
        : { participants: { some: { userId: user.id } } },
      include: conversationListInclude,
      orderBy: { updatedAt: "desc" }
    });

    return conversations.map((conversation) => this.mapConversationListItem(conversation));
  }

  async messages(
    user: AuthUser,
    conversationId: string,
    query: ConversationMessagesQueryDto
  ): Promise<ConversationMessagePage> {
    await this.ensureCanParticipate(user, conversationId);

    if (query.cursor) {
      const cursorExists = await this.prisma.conversationMessage.findFirst({
        where: { id: query.cursor, conversationId },
        select: { id: true }
      });
      if (!cursorExists) throw new NotFoundException("Message cursor not found");
    }

    const limit = query.limit ?? 30;
    const rows = await this.prisma.conversationMessage.findMany({
      where: { conversationId },
      include: { sender: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {})
    });
    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit);

    return {
      items: page.map((message) => this.mapMessage(message)).reverse(),
      nextCursor: hasMore ? page.at(-1)?.id ?? null : null,
      hasMore
    };
  }

  async contacts(user: AuthUser): Promise<ConversationContact[]> {
    if (user.roles.includes(UserRole.TEACHER)) {
      const teacher = await this.prisma.teacherProfile.findUnique({ where: { userId: user.id }, include: { classLinks: { include: { class: { include: { enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: true } } } } } } } }, subjectLinks: { include: { classSubject: { include: { class: { include: { enrollments: { where: { status: "ACTIVE" }, include: { student: { include: { user: true } } } } } } } } } } } });
      if (!teacher) return [];
      const rows = [...teacher.classLinks.map((x) => x.class), ...teacher.subjectLinks.map((x) => x.classSubject.class)];
      const map = new Map<string, ConversationContact>();
      for (const classroom of rows) for (const enrollment of classroom.enrollments) { const current = map.get(enrollment.student.id); if (current) { if (!current.classNames.includes(classroom.name)) current.classNames.push(classroom.name); } else map.set(enrollment.student.id, { profileId: enrollment.student.id, userId: enrollment.student.userId, displayName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`, email: enrollment.student.user.email, type: "STUDENT", classNames: [classroom.name] }); }
      return [...map.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    if (user.roles.includes(UserRole.STUDENT)) {
      const student = await this.prisma.studentProfile.findUnique({ where: { userId: user.id }, include: { enrollments: { where: { status: "ACTIVE" }, include: { class: { include: { teachers: { include: { teacher: { include: { user: true } } } }, subjects: { include: { teachers: { include: { teacher: { include: { user: true } } } } } } } } } } } });
      if (!student) return [];
      const map = new Map<string, ConversationContact>();
      for (const enrollment of student.enrollments) { const teachers = [...enrollment.class.teachers.map((x) => x.teacher), ...enrollment.class.subjects.flatMap((x) => x.teachers.map((y) => y.teacher))]; for (const teacher of teachers) { const current = map.get(teacher.id); if (current) { if (!current.classNames.includes(enrollment.class.name)) current.classNames.push(enrollment.class.name); } else map.set(teacher.id, { profileId: teacher.id, userId: teacher.userId, displayName: `${teacher.user.firstName} ${teacher.user.lastName}`, email: teacher.user.email, type: "TEACHER", classNames: [enrollment.class.name] }); } }
      return [...map.values()].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return [];
  }

  async create(user: AuthUser, dto: CreateConversationDto): Promise<ConversationMutationResult> {
    const participants = await this.resolveInitialParticipants(user, dto);
    const uniqueParticipants = this.uniqueParticipants([{ userId: user.id, type: this.typeForUser(user) }, ...participants]);

    const conversation = await this.prisma.conversation.create({
      data: {
        subject: dto.subject,
        createdById: user.id,
        participants: {
          create: uniqueParticipants.map((participant) => ({
            userId: participant.userId,
            type: participant.type as PrismaParticipantType
          }))
        },
        messages: {
          create: {
            senderId: user.id,
            body: dto.body
          }
        }
      },
      include: conversationListInclude
    });

    return {
      conversation: this.mapConversationListItem(conversation),
      message: conversation.messages[0] ? this.mapMessage(conversation.messages[0]) : null
    };
  }

  async sendMessage(user: AuthUser, conversationId: string, dto: SendConversationMessageDto): Promise<ConversationMutationResult> {
    await this.ensureCanParticipate(user, conversationId);
    const current = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { status: true }
    });
    if (!current) throw new NotFoundException("Conversation not found");
    if (current.status === PrismaConversationStatus.CLOSED) {
      throw new ForbiddenException("Closed conversations are read-only");
    }

    const message = await this.prisma.conversationMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        body: dto.body
      },
      include: { sender: true }
    });

    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
      include: conversationListInclude
    });

    return {
      conversation: this.mapConversationListItem(conversation),
      message: this.mapMessage(message)
    };
  }

  async updateMessage(user: AuthUser, conversationId: string, messageId: string, dto: UpdateConversationMessageDto): Promise<ConversationMutationResult> {
    await this.ensureCanParticipate(user, conversationId);
    const message = await this.prisma.conversationMessage.findFirst({ where: { id: messageId, conversationId } });
    if (!message) throw new NotFoundException("Message not found");
    if (message.senderId !== user.id && !user.roles.includes(UserRole.ADMIN)) throw new ForbiddenException("Only the author can edit this message");
    const updatedMessage = await this.prisma.conversationMessage.update({
      where: { id: messageId },
      data: { body: dto.body.trim() },
      include: { sender: true }
    });
    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
      include: conversationListInclude
    });
    return {
      conversation: this.mapConversationListItem(conversation),
      message: this.mapMessage(updatedMessage)
    };
  }

  async remove(user: AuthUser, conversationId: string) {
    await this.ensureCanParticipate(user, conversationId);
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId }, select: { createdById: true } });
    if (!conversation) throw new NotFoundException("Conversation not found");
    if (conversation.createdById !== user.id && !user.roles.includes(UserRole.ADMIN)) throw new ForbiddenException("Only the creator can delete this conversation");
    await this.prisma.conversation.delete({ where: { id: conversationId } });
    return { deleted: true };
  }

  async escalate(user: AuthUser, conversationId: string, dto: EscalateConversationDto): Promise<ConversationMutationResult> {
    await this.ensureCanParticipate(user, conversationId);

    const eligibleDirector = {
      status: "ACTIVE" as const,
      user: {
        isActive: true,
        roles: {
          some: { role: { name: { in: [RoleName.ADMINISTRATIVE, RoleName.DIRECTOR] } } }
        }
      }
    } satisfies Prisma.DirectorProfileWhereInput;
    const director = dto.directorProfileId
      ? await this.prisma.directorProfile.findFirst({
          where: { id: dto.directorProfileId, ...eligibleDirector },
          include: { user: true }
        })
      : await this.prisma.directorProfile.findFirst({
          where: eligibleDirector,
          include: { user: true },
          orderBy: { createdAt: "asc" }
        });

    if (!director) {
      throw new NotFoundException("Director profile not found");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          status: PrismaConversationStatus.ESCALATED,
          escalatedAt: new Date()
        }
      });

      await tx.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId, userId: director.userId } },
        update: { type: PrismaParticipantType.DIRECTOR },
        create: {
          conversationId,
          userId: director.userId,
          type: PrismaParticipantType.DIRECTOR
        }
      });

      if (dto.body?.trim()) {
        await tx.conversationMessage.create({
          data: {
            conversationId,
            senderId: user.id,
            body: dto.body.trim()
          }
        });
      }

    });

    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: conversationListInclude
    });
    return {
      conversation: this.mapConversationListItem(conversation),
      message:
        dto.body?.trim() && conversation.messages[0]
          ? this.mapMessage(conversation.messages[0])
          : null
    };
  }

  async close(
    user: AuthUser,
    conversationId: string,
    dto: CloseConversationDto
  ): Promise<ConversationMutationResult> {
    if (
      !user.roles.includes(UserRole.ADMINISTRATIVE) &&
      !user.roles.includes(UserRole.DIRECTOR) &&
      !user.roles.includes(UserRole.ADMIN)
    ) {
      throw new ForbiddenException("Only administrative staff can close escalated conversations");
    }
    await this.ensureCanParticipate(user, conversationId);
    const existing = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { status: true }
    });
    if (!existing) throw new NotFoundException("Conversation not found");
    if (existing.status !== PrismaConversationStatus.ESCALATED) {
      throw new ForbiddenException("Only escalated conversations can be closed here");
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.body?.trim()) {
        await tx.conversationMessage.create({
          data: { conversationId, senderId: user.id, body: dto.body.trim() }
        });
      }
      await tx.conversation.update({
        where: { id: conversationId },
        data: { status: PrismaConversationStatus.CLOSED, closedAt: new Date() }
      });
    });

    const conversation = await this.prisma.conversation.findUniqueOrThrow({
      where: { id: conversationId },
      include: conversationListInclude
    });
    return {
      conversation: this.mapConversationListItem(conversation),
      message: dto.body?.trim() && conversation.messages[0]
        ? this.mapMessage(conversation.messages[0])
        : null
    };
  }

  private async resolveInitialParticipants(user: AuthUser, dto: CreateConversationDto): Promise<ParticipantSeed[]> {
    if (user.roles.includes(UserRole.TEACHER) || user.roles.includes(UserRole.ADMIN)) {
      return this.resolveTeacherTargets(user, dto);
    }

    if (user.roles.includes(UserRole.STUDENT)) {
      return this.resolveStudentTargets(user, dto);
    }

    if (user.roles.includes(UserRole.PARENT)) {
      return this.resolveParentTargets(user, dto);
    }

    if (user.roles.includes(UserRole.ADMINISTRATIVE) || user.roles.includes(UserRole.DIRECTOR)) {
      throw new ForbiddenException("Director can join escalated conversations only");
    }

    throw new ForbiddenException("Unsupported conversation role");
  }

  private async resolveTeacherTargets(user: AuthUser, dto: CreateConversationDto): Promise<ParticipantSeed[]> {
    if (!dto.studentProfileId) {
      throw new ForbiddenException("Teacher conversations require a student");
    }

    const teacherProfile = user.roles.includes(UserRole.ADMIN)
      ? null
      : await this.prisma.teacherProfile.findUnique({ where: { userId: user.id }, select: { id: true } });

    const student = await this.prisma.studentProfile.findFirst({
      where: {
        id: dto.studentProfileId,
        enrollments: teacherProfile
          ? {
              some: {
                class: { teachers: { some: { teacherId: teacherProfile.id } } }
              }
            }
          : undefined
      },
      include: {
        user: true,
        parents: {
          where: { canMessageTeachers: true },
          include: { parent: { include: { user: true } } },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
        }
      }
    });

    if (!student) {
      throw new ForbiddenException("Student is not assigned to this teacher");
    }

    if (dto.parentProfileId) {
      const parentLink = student.parents.find((link) => link.parentId === dto.parentProfileId);
      if (!parentLink) {
        throw new ForbiddenException("Parent is not linked to this student for messaging");
      }
      return [{ userId: parentLink.parent.userId, type: ConversationParticipantType.PARENT }];
    }

    return [{ userId: student.userId, type: ConversationParticipantType.STUDENT }];
  }

  private async resolveStudentTargets(user: AuthUser, dto: CreateConversationDto): Promise<ParticipantSeed[]> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            class: {
              include: {
                teachers: {
                  include: { teacher: { include: { user: true } } },
                  orderBy: { createdAt: "asc" }
                }
              }
            }
          }
        }
      }
    });

    if (!student) {
      throw new ForbiddenException("Student profile not found");
    }

    if (dto.studentProfileId && dto.studentProfileId !== student.id) {
      throw new ForbiddenException("Students can only message from their own profile");
    }

    const teachers = student.enrollments.flatMap((enrollment) => enrollment.class.teachers).map((link) => link.teacher);
    const teacher = dto.teacherProfileId ? teachers.find((item) => item.id === dto.teacherProfileId) : teachers[0];
    if (!teacher) {
      throw new NotFoundException("No teacher found for this student");
    }

    return [{ userId: teacher.userId, type: ConversationParticipantType.TEACHER }];
  }

  private async resolveParentTargets(user: AuthUser, dto: CreateConversationDto): Promise<ParticipantSeed[]> {
    if (!dto.studentProfileId) {
      throw new ForbiddenException("Parent conversations require a student");
    }

    const parent = await this.prisma.parentProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!parent) {
      throw new ForbiddenException("Parent profile not found");
    }

    const link = await this.prisma.studentParent.findFirst({
      where: {
        parentId: parent.id,
        studentId: dto.studentProfileId,
        canMessageTeachers: true
      },
      include: {
        student: {
          include: {
            enrollments: {
              where: { status: "ACTIVE" },
              include: {
                class: {
                  include: {
                    teachers: {
                      include: { teacher: { include: { user: true } } },
                      orderBy: { createdAt: "asc" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!link) {
      throw new ForbiddenException("Parent is not linked to this student for messaging");
    }

    const teacher = link.student.enrollments.flatMap((enrollment) => enrollment.class.teachers)[0]?.teacher;
    if (!teacher) {
      throw new NotFoundException("No teacher found for this student");
    }

    return [{ userId: teacher.userId, type: ConversationParticipantType.TEACHER }];
  }

  private async ensureCanParticipate(user: AuthUser, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.id } }
    });

    if (participant) return;

    if (user.roles.includes(UserRole.ADMINISTRATIVE) || user.roles.includes(UserRole.DIRECTOR)) {
      const escalated = await this.prisma.conversation.findFirst({
        where: { id: conversationId, status: PrismaConversationStatus.ESCALATED },
        select: { id: true }
      });
      if (escalated) return;
    }

    throw new ForbiddenException("User is not a participant in this conversation");
  }

  private typeForUser(user: AuthUser): ConversationParticipantType {
    if (user.roles.includes(UserRole.TEACHER)) return ConversationParticipantType.TEACHER;
    if (user.roles.includes(UserRole.STUDENT)) return ConversationParticipantType.STUDENT;
    if (user.roles.includes(UserRole.PARENT)) return ConversationParticipantType.PARENT;
    if (user.roles.includes(UserRole.ADMINISTRATIVE) || user.roles.includes(UserRole.DIRECTOR)) return ConversationParticipantType.DIRECTOR;
    return ConversationParticipantType.TEACHER;
  }

  private uniqueParticipants(participants: ParticipantSeed[]) {
    return Array.from(new Map(participants.map((participant) => [participant.userId, participant])).values());
  }

  private mapConversationListItem(conversation: ConversationListRecord): ConversationListItem {
    return {
      id: conversation.id,
      subject: conversation.subject,
      status: conversation.status as ConversationStatus,
      updatedAt: conversation.updatedAt.toISOString(),
      escalatedAt: conversation.escalatedAt?.toISOString() ?? null,
      participants: conversation.participants.map((participant) => ({
        id: participant.id,
        type: participant.type as ConversationParticipantType,
        joinedAt: participant.joinedAt.toISOString(),
        user: this.mapUser(participant.user)
      })),
      lastMessage: conversation.messages[0] ? this.mapMessage(conversation.messages[0]) : null,
      messageCount: conversation._count.messages
    };
  }

  private mapMessage(message: {
    id: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    sender: { id: string; firstName: string; lastName: string; email: string };
  }): ConversationMessageSummary {
    return {
      id: message.id,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      sender: this.mapUser(message.sender)
    };
  }

  private mapUser(user: { id: string; firstName: string; lastName: string; email: string }) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: `${user.firstName} ${user.lastName}`,
      email: user.email
    };
  }
}
