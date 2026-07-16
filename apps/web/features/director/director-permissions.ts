import { canAccessPortal, Permission, hasPermission, UserRole } from "@homeschool/shared";

export function canAccessDirectorPortal(roles: UserRole[]) {
  return canAccessPortal(roles, UserRole.DIRECTOR);
}

export function canJoinEscalatedConversations(roles: UserRole[]) {
  return hasPermission(roles, Permission.JOIN_ESCALATED_CONVERSATIONS);
}
