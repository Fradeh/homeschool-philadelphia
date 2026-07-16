import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "./prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return {
      status: "ok",
      service: "homeschool-api"
    };
  }

  @Get("readiness")
  async readiness() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: "ready", service: "homeschool-api", database: "up" };
  }
}
