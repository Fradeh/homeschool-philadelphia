import { Body, Controller, Get, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { AuthUser, Permission, UserRole } from "@homeschool/shared";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import {
  AssignClassSubjectTeacherDto,
  CreateAvailabilityDto,
  CreateBookingDto,
  CreateGradeLevelDto,
  CreateScheduleTemplateDto,
  ReplaceScheduleGridDto,
  ReplaceScheduleBlocksDto,
  UpdateAvailabilityDto,
  UpdateBookingStatusDto,
  UpdateScheduleTemplateDto
} from "./dto/schedules.dto";
import { SchedulesService } from "./schedules.service";

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
@Permissions(Permission.MANAGE_SCHEDULES)
@Controller("admin")
export class AdminSchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get("grade-levels") gradeLevels() { return this.schedules.gradeLevels(); }
  @Post("grade-levels") createGradeLevel(@Body() dto: CreateGradeLevelDto) { return this.schedules.createGradeLevel(dto); }
  @Get("schedule-grid") grid() { return this.schedules.activeGrid(); }
  @Get("schedule-templates") templates() { return this.schedules.templates(); }
  @Post("schedule-templates") createTemplate(@Body() dto: CreateScheduleTemplateDto) { return this.schedules.createTemplate(dto); }
  @Patch("schedule-templates/:templateId") updateTemplate(@Param("templateId") id: string, @Body() dto: UpdateScheduleTemplateDto) { return this.schedules.updateTemplate(id, dto); }
  @Put("schedule-templates/:templateId/grid") replaceGrid(@Param("templateId") id: string, @Body() dto: ReplaceScheduleGridDto) { return this.schedules.replaceTemplateGrid(id, dto); }
  @Put("schedule-templates/:templateId/blocks") replaceBlocks(@Param("templateId") id: string, @Body() dto: ReplaceScheduleBlocksDto) { return this.schedules.replaceBlocks(id, dto); }
  @Post("schedule-templates/:templateId/publish") publish(@Param("templateId") id: string) { return this.schedules.publish(id); }
  @Post("class-subjects/:classSubjectId/teachers") assignSubjectTeacher(@Param("classSubjectId") id: string, @Body() dto: AssignClassSubjectTeacherDto) { return this.schedules.assignSubjectTeacher(id, dto); }
}

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.STUDENT)
@Permissions(Permission.VIEW_OWN_SCHEDULE)
@Controller("student")
export class StudentSchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get("schedule") schedule(@CurrentUser() user: AuthUser) { return this.schedules.studentSchedule(user.id); }
  @Get("dashboard") dashboard(@CurrentUser() user: AuthUser) { return this.schedules.studentDashboard(user.id); }
  @Get("classes") classes(@CurrentUser() user: AuthUser) { return this.schedules.studentClasses(user.id); }
  @Get("classes/:classId") classDetail(@CurrentUser() user: AuthUser, @Param("classId") id: string) { return this.schedules.studentClassDetail(user.id, id); }
  @Get("subjects/:classSubjectId/availability") availability(@CurrentUser() user: AuthUser, @Param("classSubjectId") id: string) { return this.schedules.studentAvailability(user.id, id); }
  @Post("subjects/:classSubjectId/bookings") createBooking(@CurrentUser() user: AuthUser, @Param("classSubjectId") id: string, @Body() dto: CreateBookingDto) { return this.schedules.createBooking(user.id, id, dto); }
  @Get("bookings") bookings(@CurrentUser() user: AuthUser) { return this.schedules.studentBookings(user.id); }
  @Patch("bookings/:bookingId/cancel") cancel(@CurrentUser() user: AuthUser, @Param("bookingId") id: string) { return this.schedules.cancelStudentBooking(user.id, id); }
}

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.TEACHER)
@Controller("teacher")
export class TeacherSchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get("schedule") @Permissions(Permission.VIEW_OWN_SCHEDULE) schedule(@CurrentUser() user: AuthUser) { return this.schedules.teacherSchedule(user.id); }
  @Get("dashboard") @Permissions(Permission.VIEW_ASSIGNED_CLASSES) dashboard(@CurrentUser() user: AuthUser) { return this.schedules.teacherDashboard(user.id); }
  @Get("classes") @Permissions(Permission.VIEW_ASSIGNED_CLASSES) classes(@CurrentUser() user: AuthUser) { return this.schedules.teacherClasses(user.id); }
  @Get("classes/:classId") @Permissions(Permission.VIEW_ASSIGNED_CLASSES) classDetail(@CurrentUser() user: AuthUser, @Param("classId") id: string) { return this.schedules.teacherClassDetail(user.id, id); }
  @Get("availability") @Permissions(Permission.MANAGE_AVAILABILITY) availability(@CurrentUser() user: AuthUser) { return this.schedules.teacherAvailability(user.id); }
  @Post("availability") @Permissions(Permission.MANAGE_AVAILABILITY) createAvailability(@CurrentUser() user: AuthUser, @Body() dto: CreateAvailabilityDto) { return this.schedules.createAvailability(user.id, dto); }
  @Patch("availability/:slotId") @Permissions(Permission.MANAGE_AVAILABILITY) updateAvailability(@CurrentUser() user: AuthUser, @Param("slotId") id: string, @Body() dto: UpdateAvailabilityDto) { return this.schedules.updateAvailability(user.id, id, dto); }
  @Get("bookings") @Permissions(Permission.MANAGE_BOOKINGS) bookings(@CurrentUser() user: AuthUser) { return this.schedules.teacherBookings(user.id); }
  @Patch("bookings/:bookingId/status") @Permissions(Permission.MANAGE_BOOKINGS) updateBooking(@CurrentUser() user: AuthUser, @Param("bookingId") id: string, @Body() dto: UpdateBookingStatusDto) { return this.schedules.updateBookingStatus(user.id, id, dto); }
}
