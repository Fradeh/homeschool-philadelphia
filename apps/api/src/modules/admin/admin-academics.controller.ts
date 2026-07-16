import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuthUser, Permission, UserRole } from "@homeschool/shared";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AdminAcademicsService } from "./admin-academics.service";
import {
  AssignClassSubjectDto,
  AssignClassTeacherDto,
  CreateAcademicTermDto,
  CreateAcademicYearDto,
  CreateAdminClassDto,
  CreateAdminSubjectDto,
  CreateAdminUserDto,
  EnrollClassStudentDto,
  UpdateAdminSubjectDto,
  UpdateFamilyLinkDto,
  UpsertFamilyLinkDto
} from "./dto/admin-academics.dto";

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.ADMIN)
@Controller("admin")
export class AdminAcademicsController {
  constructor(private readonly adminAcademicsService: AdminAcademicsService) {}

  @Get("overview")
  @Permissions(Permission.MANAGE_ACADEMIC_SETUP)
  overview() {
    return this.adminAcademicsService.overview();
  }

  @Get("academic-years")
  @Permissions(Permission.MANAGE_ACADEMIC_SETUP)
  academicYears() {
    return this.adminAcademicsService.academicYears();
  }

  @Post("academic-years")
  @Permissions(Permission.MANAGE_ACADEMIC_SETUP)
  createAcademicYear(@Body() dto: CreateAcademicYearDto) {
    return this.adminAcademicsService.createAcademicYear(dto);
  }

  @Patch("academic-years/:academicYearId/activate")
  @Permissions(Permission.MANAGE_ACADEMIC_SETUP)
  activateAcademicYear(@Param("academicYearId") academicYearId: string) {
    return this.adminAcademicsService.activateAcademicYear(academicYearId);
  }

  @Post("academic-years/:academicYearId/terms")
  @Permissions(Permission.MANAGE_ACADEMIC_SETUP)
  createAcademicTerm(@Param("academicYearId") academicYearId: string, @Body() dto: CreateAcademicTermDto) {
    return this.adminAcademicsService.createAcademicTerm(academicYearId, dto);
  }

  @Get("academic-users")
  @Permissions(Permission.MANAGE_USERS)
  users(@Query("role") role?: UserRole) {
    return this.adminAcademicsService.users(role);
  }

  @Post("academic-users")
  @Permissions(Permission.MANAGE_USERS)
  createUser(@Body() dto: CreateAdminUserDto) {
    return this.adminAcademicsService.createUser(dto);
  }

  @Patch("academic-users/:userId/administrative")
  @Permissions(Permission.MANAGE_ROLES)
  configureAdministrative(
    @CurrentUser() actor: AuthUser,
    @Param("userId") userId: string
  ) {
    return this.adminAcademicsService.configureAdministrative(userId, actor.id);
  }

  @Get("classes")
  @Permissions(Permission.MANAGE_CLASS_ENROLLMENTS)
  classes() {
    return this.adminAcademicsService.classes();
  }

  @Post("classes")
  @Permissions(Permission.MANAGE_CLASS_ENROLLMENTS)
  createClass(@Body() dto: CreateAdminClassDto) {
    return this.adminAcademicsService.createClass(dto);
  }

  @Post("classes/:classId/teachers")
  @Permissions(Permission.MANAGE_TEACHER_ASSIGNMENTS)
  assignTeacher(@Param("classId") classId: string, @Body() dto: AssignClassTeacherDto) {
    return this.adminAcademicsService.assignTeacher(classId, dto);
  }

  @Delete("classes/:classId/teachers/:teacherProfileId")
  @Permissions(Permission.MANAGE_TEACHER_ASSIGNMENTS)
  removeTeacher(@Param("classId") classId: string, @Param("teacherProfileId") teacherProfileId: string) {
    return this.adminAcademicsService.removeTeacher(classId, teacherProfileId);
  }

  @Post("classes/:classId/students")
  @Permissions(Permission.MANAGE_CLASS_ENROLLMENTS)
  enrollStudent(@Param("classId") classId: string, @Body() dto: EnrollClassStudentDto) {
    return this.adminAcademicsService.enrollStudent(classId, dto);
  }

  @Delete("classes/:classId/students/:studentProfileId")
  @Permissions(Permission.MANAGE_CLASS_ENROLLMENTS)
  unenrollStudent(@Param("classId") classId: string, @Param("studentProfileId") studentProfileId: string) {
    return this.adminAcademicsService.unenrollStudent(classId, studentProfileId);
  }

  @Post("classes/:classId/subjects")
  @Permissions(Permission.MANAGE_ACADEMIC_SETUP)
  assignSubject(@Param("classId") classId: string, @Body() dto: AssignClassSubjectDto) {
    return this.adminAcademicsService.assignSubject(classId, dto);
  }

  @Get("subjects")
  @Permissions(Permission.MANAGE_PACE_SETUP)
  subjects() {
    return this.adminAcademicsService.subjects();
  }

  @Post("subjects")
  @Permissions(Permission.MANAGE_PACE_SETUP)
  createSubject(@Body() dto: CreateAdminSubjectDto) {
    return this.adminAcademicsService.createSubject(dto);
  }

  @Patch("subjects/:subjectId")
  @Permissions(Permission.MANAGE_PACE_SETUP)
  updateSubject(@Param("subjectId") subjectId: string, @Body() dto: UpdateAdminSubjectDto) {
    return this.adminAcademicsService.updateSubject(subjectId, dto);
  }

  @Get("family-links")
  @Permissions(Permission.MANAGE_STUDENT_PARENT_LINKS)
  familyLinks() {
    return this.adminAcademicsService.familyLinks();
  }

  @Post("family-links")
  @Permissions(Permission.MANAGE_STUDENT_PARENT_LINKS)
  upsertFamilyLink(@Body() dto: UpsertFamilyLinkDto) {
    return this.adminAcademicsService.upsertFamilyLink(dto);
  }

  @Patch("family-links/:studentProfileId/:parentProfileId")
  @Permissions(Permission.MANAGE_STUDENT_PARENT_LINKS)
  updateFamilyLink(
    @Param("studentProfileId") studentProfileId: string,
    @Param("parentProfileId") parentProfileId: string,
    @Body() dto: UpdateFamilyLinkDto
  ) {
    return this.adminAcademicsService.updateFamilyLink(studentProfileId, parentProfileId, dto);
  }
}
