import { Injectable } from "@nestjs/common";
import { EventScope as PrismaEventScope } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateEventDto } from "./dto/create-event.dto";

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.event.findMany({
      orderBy: { startsAt: "asc" }
    });
  }

  create(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...dto,
        scope: dto.scope as PrismaEventScope,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined
      }
    });
  }
}
