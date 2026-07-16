import { Injectable } from "@nestjs/common";
import { GroupVisibility as PrismaGroupVisibility } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateGroupDto } from "./dto/create-group.dto";

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.group.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  create(dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        visibility: dto.visibility as PrismaGroupVisibility | undefined
      }
    });
  }
}
