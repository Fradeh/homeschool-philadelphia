import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthUser, Permission, UserRole } from "@homeschool/shared";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AcademicPacesService } from "./academic-paces.service";
import { GradePaceDto, SetStudentPaceGoalDto, UpdatePaceGradeDto, UpdatePaceStatusDto } from "./dto/academic-paces.dto";

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.TEACHER, UserRole.ADMIN)
@Controller("teacher")
export class TeacherPacesController {
  constructor(private readonly academicPacesService: AcademicPacesService) {}

  @Get("pace-workspace")
  @Permissions(Permission.MANAGE_ASSIGNED_CLASS_PACES)
  workspace(@CurrentUser() user: AuthUser) {
    return this.academicPacesService.teacherWorkspace(user.id, user.roles);
  }

  @Post("pace-workspace/reconcile")
  @Permissions(Permission.MANAGE_ASSIGNED_CLASS_PACES)
  reconcileWorkspace(@CurrentUser() user: AuthUser) {
    return this.academicPacesService.reconcileTeacherWorkspace(user.id, user.roles);
  }

  @Post("pace-goals")
  @Permissions(Permission.MANAGE_ASSIGNED_CLASS_PACES)
  setGoal(@CurrentUser() user: AuthUser, @Body() dto: SetStudentPaceGoalDto) {
    return this.academicPacesService.setStudentPaceGoal(user.id, user.roles, dto);
  }

  @Patch("pace-records/:recordId/status")
  @Permissions(Permission.MANAGE_ASSIGNED_CLASS_PACES)
  updateStatus(@CurrentUser() user: AuthUser, @Param("recordId") recordId: string, @Body() dto: UpdatePaceStatusDto) {
    return this.academicPacesService.updatePaceStatus(user.id, user.roles, recordId, dto);
  }

  @Post("pace-records/:recordId/grade")
  @Permissions(Permission.GRADE_ASSIGNED_STUDENTS)
  grade(@CurrentUser() user: AuthUser, @Param("recordId") recordId: string, @Body() dto: GradePaceDto) {
    return this.academicPacesService.gradePace(user.id, user.roles, recordId, dto);
  }

  @Patch("grades/:gradeId")
  @Permissions(Permission.GRADE_ASSIGNED_STUDENTS)
  updateGrade(@CurrentUser() user: AuthUser, @Param("gradeId") gradeId: string, @Body() dto: UpdatePaceGradeDto) {
    return this.academicPacesService.updateGrade(user.id, user.roles, gradeId, dto);
  }

  @Get("grades")
  @Permissions(Permission.GRADE_ASSIGNED_STUDENTS)
  grades(@CurrentUser() user: AuthUser) {
    return this.academicPacesService.teacherGrades(user.id, user.roles);
  }
}
