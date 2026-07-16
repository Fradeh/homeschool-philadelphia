import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { GcrAdministrativeController, GcrController } from "./gcr.controller";
import { GcrService } from "./gcr.service";

@Module({
  imports: [PrismaModule],
  controllers: [GcrController, GcrAdministrativeController],
  providers: [GcrService]
})
export class GcrModule {}
