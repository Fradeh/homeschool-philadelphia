import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("files")
export class FilesController {
  @Get()
  findAll() {
    return {
      items: [],
      message: "File metadata module ready. Storage provider is pending."
    };
  }
}
