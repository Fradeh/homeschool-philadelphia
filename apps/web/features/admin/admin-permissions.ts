import { canAccessPortal, Permission, hasPermission, UserRole } from "@homeschool/shared";

export function canAccessAdminPortal(roles: UserRole[]) {
  return canAccessPortal(roles, UserRole.ADMIN);
}

export function canManageAcademicSetup(roles: UserRole[]) {
  return hasPermission(roles, Permission.MANAGE_ACADEMIC_SETUP);
}
