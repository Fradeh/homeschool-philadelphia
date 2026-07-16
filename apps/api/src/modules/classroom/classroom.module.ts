import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { FilesModule } from "../files/files.module";
import { ClassroomController } from "./classroom.controller";
import { ClassroomService } from "./classroom.service";

@Module({ imports: [PrismaModule, FilesModule], controllers: [ClassroomController], providers: [ClassroomService] })
export class ClassroomModule {}
