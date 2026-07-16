import { Body, Controller, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AuthUser, UserRole } from "@homeschool/shared";
import { Roles } from "../../common/decorators/roles.decorator";
import { Permission } from "@homeschool/shared";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import {
  CreateGcrReportDto,
  CreateGcrDemeritsDto,
  CreateGcrMeritDto,
  GcrDateQueryDto,
  GcrAttendanceSessionQueryDto,
  GcrStudentsQueryDto,
  GcrWeekQueryDto,
  SaveGcrDraftDto,
  SubmitGcrReportDto,
  UpdateGcrReportDto,
  UpsertGcrAttendanceDto,
  UpsertGcrSubjectTaskDto,
  UpsertGcrVerseDto
} from "./dto/gcr.dto";
import { GcrService } from "./gcr.service";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER)
@Controller("gcr/teacher")
export class GcrController {
  constructor(private readonly gcr: GcrService) {}

  @Get("filters/classes")
  classes(@CurrentUser() user: AuthUser, @Query() query: GcrDateQueryDto) {
    return this.gcr.teacherClasses(user.id, query.date);
  }

  @Get("filters/students")
  students(@CurrentUser() user: AuthUser, @Query() query: GcrStudentsQueryDto) {
    return this.gcr.teacherStudents(user.id, query.date);
  }

  @Get("attendance-session")
  attendanceSession(@CurrentUser() user: AuthUser, @Query() query: GcrAttendanceSessionQueryDto) {
    return this.gcr.attendanceSession(user.id, query.classId, query.date);
  }

  @Get("students/:studentId/week")
  week(
    @CurrentUser() user: AuthUser,
    @Param("studentId") studentId: string,
    @Query() query: GcrWeekQueryDto
  ) {
    return this.gcr.studentWeek(user.id, studentId, query.date);
  }

  @Post("reports")
  report(@CurrentUser() user: AuthUser, @Body() dto: CreateGcrReportDto) {
    return this.gcr.openDraft(user.id, dto);
  }

  @Patch("reports/:reportId")
  updateReport(
    @CurrentUser() user: AuthUser,
    @Param("reportId") reportId: string,
    @Body() dto: UpdateGcrReportDto
  ) {
    return this.gcr.updateReport(user.id, reportId, dto);
  }

  @Put("reports/:reportId/draft")
  saveDraft(
    @CurrentUser() user: AuthUser,
    @Param("reportId") reportId: string,
    @Body() dto: SaveGcrDraftDto
  ) {
    return this.gcr.saveDraft(user.id, reportId, dto);
  }

  @Put("reports/:reportId/attendance")
  attendance(
    @CurrentUser() user: AuthUser,
    @Param("reportId") reportId: string,
    @Body() dto: UpsertGcrAttendanceDto
  ) {
    return this.gcr.upsertAttendance(user.id, reportId, dto);
  }

  @Put("reports/:reportId/subject-tasks/:classSubjectId")
  subjectTask(
    @CurrentUser() user: AuthUser,
    @Param("reportId") reportId: string,
    @Param("classSubjectId") classSubjectId: string,
    @Body() dto: UpsertGcrSubjectTaskDto
  ) {
    return this.gcr.upsertSubjectTask(user.id, reportId, classSubjectId, dto);
  }

  @Put("reports/:reportId/verse")
  verse(
    @CurrentUser() user: AuthUser,
    @Param("reportId") reportId: string,
    @Body() dto: UpsertGcrVerseDto
  ) {
    return this.gcr.upsertVerse(user.id, reportId, dto);
  }

  @Post("reports/:reportId/merits")
  merit(
    @CurrentUser() user: AuthUser,
    @Param("reportId") reportId: string,
    @Body() dto: CreateGcrMeritDto
  ) {
    return this.gcr.createMerit(user.id, reportId, dto);
  }

  @Post("reports/:reportId/demerits")
  demerits(
    @CurrentUser() user: AuthUser,
    @Param("reportId") reportId: string,
    @Body() dto: CreateGcrDemeritsDto
  ) {
    return this.gcr.createDemerits(user.id, reportId, dto);
  }

  @Post("reports/:reportId/submit")
  submit(
    @CurrentUser() user: AuthUser,
    @Param("reportId") reportId: string,
    @Body() dto: SubmitGcrReportDto
  ) {
    return this.gcr.submit(user.id, reportId, dto.version);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMINISTRATIVE, UserRole.DIRECTOR, UserRole.ADMIN)
@Controller("gcr/administrative")
export class GcrAdministrativeController {
  constructor(private readonly gcr: GcrService) {}

  @Get("compliance")
  @Permissions(Permission.VIEW_GCR_COMPLIANCE)
  compliance(@Query() query: GcrDateQueryDto) {
    return this.gcr.administrativeCompliance(query.date);
  }
}
