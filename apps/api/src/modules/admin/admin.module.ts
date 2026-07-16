import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AdminAcademicsController } from "./admin-academics.controller";
import { AdminAcademicsService } from "./admin-academics.service";
import { AdminController } from "./admin.controller";

@Module({
  imports: [PrismaModule],
  controllers: [AdminController, AdminAcademicsController],
  providers: [AdminAcademicsService]
})
export class AdminModule {}
