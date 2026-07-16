import { canAccessPortal, Permission, hasPermission, UserRole } from "@homeschool/shared";

export function canAccessStudentPortal(roles: UserRole[]) {
  return canAccessPortal(roles, UserRole.STUDENT);
}

export function canViewOwnGrades(roles: UserRole[]) {
  return hasPermission(roles, Permission.VIEW_OWN_GRADES);
}
