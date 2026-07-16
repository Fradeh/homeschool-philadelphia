import { UserRole } from "./auth";

export enum Permission {
  MANAGE_USERS = "MANAGE_USERS",
  MANAGE_ROLES = "MANAGE_ROLES",
  MANAGE_ACADEMIC_SETUP = "MANAGE_ACADEMIC_SETUP",
  MANAGE_STUDENT_PARENT_LINKS = "MANAGE_STUDENT_PARENT_LINKS",
  MANAGE_CLASS_ENROLLMENTS = "MANAGE_CLASS_ENROLLMENTS",
  MANAGE_TEACHER_ASSIGNMENTS = "MANAGE_TEACHER_ASSIGNMENTS",
  MANAGE_PACE_SETUP = "MANAGE_PACE_SETUP",
  VIEW_ALL_ACADEMIC_REPORTS = "VIEW_ALL_ACADEMIC_REPORTS",
  VIEW_ASSIGNED_CLASSES = "VIEW_ASSIGNED_CLASSES",
  MANAGE_ASSIGNED_CLASS_CONTENT = "MANAGE_ASSIGNED_CLASS_CONTENT",
  MANAGE_ASSIGNED_CLASS_PACES = "MANAGE_ASSIGNED_CLASS_PACES",
  GRADE_ASSIGNED_STUDENTS = "GRADE_ASSIGNED_STUDENTS",
  VIEW_OWN_CLASSES = "VIEW_OWN_CLASSES",
  VIEW_OWN_PACES = "VIEW_OWN_PACES",
  VIEW_OWN_GRADES = "VIEW_OWN_GRADES",
  VIEW_CHILDREN_ACADEMICS = "VIEW_CHILDREN_ACADEMICS",
  RECEIVE_CHILDREN_COMMUNICATIONS = "RECEIVE_CHILDREN_COMMUNICATIONS",
  MESSAGE_ASSIGNED_ACADEMIC_CONTACTS = "MESSAGE_ASSIGNED_ACADEMIC_CONTACTS",
  VIEW_ESCALATED_CONVERSATIONS = "VIEW_ESCALATED_CONVERSATIONS",
  JOIN_ESCALATED_CONVERSATIONS = "JOIN_ESCALATED_CONVERSATIONS",
  VIEW_ALL_GCR = "VIEW_ALL_GCR",
  VIEW_GCR_COMPLIANCE = "VIEW_GCR_COMPLIANCE",
  VIEW_GCR_AUDIT = "VIEW_GCR_AUDIT",
  VIEW_AUDIT_LOGS = "VIEW_AUDIT_LOGS",
  MANAGE_SCHEDULES = "MANAGE_SCHEDULES",
  MANAGE_AVAILABILITY = "MANAGE_AVAILABILITY",
  MANAGE_BOOKINGS = "MANAGE_BOOKINGS",
  VIEW_OWN_SCHEDULE = "VIEW_OWN_SCHEDULE"
}

export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.MANAGE_ACADEMIC_SETUP,
    Permission.MANAGE_STUDENT_PARENT_LINKS,
    Permission.MANAGE_CLASS_ENROLLMENTS,
    Permission.MANAGE_TEACHER_ASSIGNMENTS,
    Permission.MANAGE_PACE_SETUP,
    Permission.VIEW_ALL_ACADEMIC_REPORTS,
    Permission.VIEW_ASSIGNED_CLASSES,
    Permission.MANAGE_ASSIGNED_CLASS_CONTENT,
    Permission.MANAGE_ASSIGNED_CLASS_PACES,
    Permission.GRADE_ASSIGNED_STUDENTS,
    Permission.VIEW_OWN_CLASSES,
    Permission.VIEW_OWN_PACES,
    Permission.VIEW_OWN_GRADES,
    Permission.VIEW_CHILDREN_ACADEMICS,
    Permission.RECEIVE_CHILDREN_COMMUNICATIONS,
    Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS,
    Permission.VIEW_ESCALATED_CONVERSATIONS,
    Permission.JOIN_ESCALATED_CONVERSATIONS,
    Permission.VIEW_ALL_GCR,
    Permission.VIEW_GCR_COMPLIANCE,
    Permission.VIEW_GCR_AUDIT,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_SCHEDULES,
    Permission.MANAGE_AVAILABILITY,
    Permission.MANAGE_BOOKINGS,
    Permission.VIEW_OWN_SCHEDULE
  ],
  [UserRole.ADMINISTRATIVE]: [
    Permission.VIEW_ALL_ACADEMIC_REPORTS,
    Permission.VIEW_ESCALATED_CONVERSATIONS,
    Permission.JOIN_ESCALATED_CONVERSATIONS,
    Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS
    ,Permission.VIEW_ALL_GCR
    ,Permission.VIEW_GCR_COMPLIANCE
    ,Permission.VIEW_GCR_AUDIT
  ],
  [UserRole.TEACHER]: [
    Permission.VIEW_ASSIGNED_CLASSES,
    Permission.MANAGE_ASSIGNED_CLASS_CONTENT,
    Permission.MANAGE_ASSIGNED_CLASS_PACES,
    Permission.GRADE_ASSIGNED_STUDENTS,
    Permission.MANAGE_AVAILABILITY,
    Permission.MANAGE_BOOKINGS,
    Permission.VIEW_OWN_SCHEDULE,
    Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS
  ],
  [UserRole.STUDENT]: [
    Permission.VIEW_OWN_CLASSES,
    Permission.VIEW_OWN_PACES,
    Permission.VIEW_OWN_GRADES,
    Permission.VIEW_OWN_SCHEDULE,
    Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS
  ],
  [UserRole.PARENT]: [
    Permission.VIEW_CHILDREN_ACADEMICS,
    Permission.RECEIVE_CHILDREN_COMMUNICATIONS,
    Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS
  ],
  [UserRole.DIRECTOR]: [
    Permission.VIEW_ALL_ACADEMIC_REPORTS,
    Permission.VIEW_ESCALATED_CONVERSATIONS,
    Permission.JOIN_ESCALATED_CONVERSATIONS,
    Permission.MESSAGE_ASSIGNED_ACADEMIC_CONTACTS,
    Permission.VIEW_ALL_GCR,
    Permission.VIEW_GCR_COMPLIANCE,
    Permission.VIEW_GCR_AUDIT
  ]
};

export const portalBaseRoutes: Record<UserRole, string> = {
  [UserRole.ADMIN]: "/admin",
  [UserRole.ADMINISTRATIVE]: "/teacher/dashboard",
  [UserRole.TEACHER]: "/teacher/dashboard",
  [UserRole.STUDENT]: "/student/dashboard",
  [UserRole.PARENT]: "/parent",
  [UserRole.DIRECTOR]: "/director"
};

export function getPermissionsForRoles(roles: UserRole[]) {
  return Array.from(new Set(roles.flatMap((role) => rolePermissions[role] ?? [])));
}

export function hasRole(roles: UserRole[], allowedRoles: UserRole[]) {
  return allowedRoles.some((role) => roles.includes(role));
}

export function hasPermission(roles: UserRole[], permission: Permission) {
  return getPermissionsForRoles(roles).includes(permission);
}

export function hasAnyPermission(roles: UserRole[], permissions: Permission[]) {
  return permissions.some((permission) => hasPermission(roles, permission));
}

export function canAccessPortal(roles: UserRole[], portalRole: UserRole) {
  return roles.includes(UserRole.ADMIN) || roles.includes(portalRole);
}

export function getDefaultPortalPath(roles: UserRole[]) {
  const priority = [UserRole.ADMIN, UserRole.ADMINISTRATIVE, UserRole.DIRECTOR, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT];
  const role = priority.find((item) => roles.includes(item));
  return role ? portalBaseRoutes[role] : "/";
}
