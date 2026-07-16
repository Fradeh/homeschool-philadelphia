import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { Permission, UserRole } from "@homeschool/shared";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CalendarService } from "./calendar.service";
import { CreateEventDto } from "./dto/create-event.dto";

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller("calendar")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get("events")
  findAll() {
    return this.calendarService.findAll();
  }

  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  @Permissions(Permission.MANAGE_ASSIGNED_CLASS_CONTENT)
  @Post("events")
  create(@Body() dto: CreateEventDto) {
    return this.calendarService.create(dto);
  }
}
