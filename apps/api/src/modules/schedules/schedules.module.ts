import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AdminSchedulesController, StudentSchedulesController, TeacherSchedulesController } from "./schedules.controller";
import { SchedulesService } from "./schedules.service";

@Module({
  imports: [PrismaModule],
  controllers: [AdminSchedulesController, StudentSchedulesController, TeacherSchedulesController],
  providers: [SchedulesService]
})
export class SchedulesModule {}
