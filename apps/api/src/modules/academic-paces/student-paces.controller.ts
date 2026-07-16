import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthUser, Permission, UserRole } from "@homeschool/shared";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AcademicPacesService } from "./academic-paces.service";

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(UserRole.STUDENT, UserRole.ADMIN)
@Controller("student")
export class StudentPacesController {
  constructor(private readonly academicPacesService: AcademicPacesService) {}

  @Get("paces")
  @Permissions(Permission.VIEW_OWN_PACES)
  paces(@CurrentUser() user: AuthUser) {
    return this.academicPacesService.studentPaces(user.id, user.roles);
  }

  @Get("grades")
  @Permissions(Permission.VIEW_OWN_GRADES)
  grades(@CurrentUser() user: AuthUser) {
    return this.academicPacesService.studentGrades(user.id, user.roles);
  }
}
