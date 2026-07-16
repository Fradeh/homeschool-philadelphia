import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    return {
      items: await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 100
      })
    };
  }

  async markRead(userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({ where: { id, userId }, data: { status: "READ", readAt: new Date() } });
    if (!result.count) throw new NotFoundException("Notification not found");
    return this.prisma.notification.findUniqueOrThrow({ where: { id } });
  }
}
