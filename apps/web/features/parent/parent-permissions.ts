import { canAccessPortal, Permission, hasPermission, UserRole } from "@homeschool/shared";

export function canAccessParentPortal(roles: UserRole[]) {
  return canAccessPortal(roles, UserRole.PARENT);
}

export function canViewChildrenAcademics(roles: UserRole[]) {
  return hasPermission(roles, Permission.VIEW_CHILDREN_ACADEMICS);
}
