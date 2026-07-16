import { Permission, UserRole } from "@homeschool/shared";
import { canAccessPortal, hasPermission } from "@homeschool/shared";

export const teacherAllowedPermissions = [
  Permission.VIEW_ASSIGNED_CLASSES,
  Permission.MANAGE_ASSIGNED_CLASS_CONTENT,
  Permission.MANAGE_ASSIGNED_CLASS_PACES,
  Permission.GRADE_ASSIGNED_STUDENTS,
  Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS
];

export function canAccessTeacherDashboard(roles: UserRole[]) {
  return canAccessPortal(roles, UserRole.TEACHER);
}

export function canGradeAssignedStudents(roles: UserRole[]) {
  return hasPermission(roles, Permission.GRADE_ASSIGNED_STUDENTS);
}
