import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AcademicPacesService } from "./academic-paces.service";
import { StudentPacesController } from "./student-paces.controller";
import { TeacherPacesController } from "./teacher-paces.controller";

@Module({
  imports: [PrismaModule],
  controllers: [TeacherPacesController, StudentPacesController],
  providers: [AcademicPacesService]
})
export class AcademicPacesModule {}
