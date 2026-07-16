import { UserRole } from "@homeschool/shared";

export type AdminUserStatus = "Activo" | "Pendiente" | "Inactivo";
export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: AdminUserStatus;
};

export type AdminClass = {
  id: string;
  name: string;
  code: string;
  gradeLevel: string;
  teacherIds: string[];
  studentIds: string[];
  subjectIds: string[];
  color: string;
  status: "Activa" | "Archivada";
};

export type AdminSubject = {
  id: string;
  name: string;
  shortName: string;
  color: string;
  targetPaces: number;
  startPace: number;
};

export type AdminParentLink = {
  studentId: string;
  parentId: string;
  relationship: "Madre" | "Padre" | "Acudiente" | "Tutor";
  isPrimary: boolean;
  receivesAcademicEmails: boolean;
  canViewGrades: boolean;
  canMessageTeachers: boolean;
};

export const adminUser = {
  id: "admin-001",
  firstName: "Administrador",
  lastName: "Académico",
  email: "admin@philadelphia.edu",
  roles: [UserRole.ADMIN]
};

export const adminUsers: AdminUser[] = [
  { id: "teacher-001", firstName: "Ana", lastName: "Garcia", email: "ana.garcia@philadelphia.edu", role: UserRole.TEACHER, status: "Activo" },
  { id: "teacher-002", firstName: "Michael", lastName: "Brown", email: "michael.brown@philadelphia.edu", role: UserRole.TEACHER, status: "Pendiente" },
  { id: "student-001", firstName: "Camila", lastName: "Torres", email: "camila.torres@philadelphia.edu", role: UserRole.STUDENT, status: "Activo" },
  { id: "student-002", firstName: "Mateo", lastName: "Rivera", email: "mateo.rivera@philadelphia.edu", role: UserRole.STUDENT, status: "Activo" },
  { id: "student-003", firstName: "Isabella", lastName: "Chen", email: "isabella.chen@philadelphia.edu", role: UserRole.STUDENT, status: "Activo" },
  { id: "parent-001", firstName: "Laura", lastName: "Torres", email: "laura.torres@email.com", role: UserRole.PARENT, status: "Activo" },
  { id: "parent-002", firstName: "Andrés", lastName: "Rivera", email: "andres.rivera@email.com", role: UserRole.PARENT, status: "Activo" },
  { id: "director-001", firstName: "Claudia", lastName: "Méndez", email: "claudia.mendez@philadelphia.edu", role: UserRole.DIRECTOR, status: "Activo" }
];

export const adminSubjects: AdminSubject[] = [
  { id: "math", name: "Matemáticas", shortName: "MATH", color: "#eab308", targetPaces: 3, startPace: 1061 },
  { id: "english", name: "Inglés", shortName: "ENG", color: "#ef4444", targetPaces: 3, startPace: 1060 },
  { id: "word-building", name: "Word Building", shortName: "WB", color: "#9333ea", targetPaces: 3, startPace: 1061 },
  { id: "spanish", name: "Español", shortName: "ESP", color: "#f59e0b", targetPaces: 3, startPace: 1063 },
  { id: "science", name: "Ciencias", shortName: "SC", color: "#38bdf8", targetPaces: 3, startPace: 1060 },
  { id: "social-studies", name: "Estudios Sociales", shortName: "SS", color: "#4d9f38", targetPaces: 3, startPace: 1059 }
];

export const adminClasses: AdminClass[] = [
  {
    id: "english-8",
    name: "English 8th Grade",
    code: "ENG-8",
    gradeLevel: "8°",
    teacherIds: ["teacher-001"],
    studentIds: ["student-001", "student-002", "student-003"],
    subjectIds: ["english", "word-building"],
    color: "#191970",
    status: "Activa"
  },
  {
    id: "homeroom-7a",
    name: "Homeroom 7A",
    code: "HR-7A",
    gradeLevel: "7°",
    teacherIds: ["teacher-001"],
    studentIds: ["student-001", "student-002"],
    subjectIds: ["spanish", "social-studies"],
    color: "#078cc5",
    status: "Activa"
  },
  {
    id: "research-projects",
    name: "Research Projects",
    code: "RSP",
    gradeLevel: "8°",
    teacherIds: ["teacher-001", "teacher-002"],
    studentIds: ["student-001", "student-003"],
    subjectIds: ["math", "science"],
    color: "#3949ab",
    status: "Activa"
  }
];

export const adminParentLinks: AdminParentLink[] = [
  {
    studentId: "student-001",
    parentId: "parent-001",
    relationship: "Madre",
    isPrimary: true,
    receivesAcademicEmails: true,
    canViewGrades: true,
    canMessageTeachers: true
  },
  {
    studentId: "student-002",
    parentId: "parent-002",
    relationship: "Padre",
    isPrimary: true,
    receivesAcademicEmails: true,
    canViewGrades: true,
    canMessageTeachers: true
  }
];

export function roleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    [UserRole.ADMIN]: "ADMIN",
    [UserRole.ADMINISTRATIVE]: "Administrativo",
    [UserRole.TEACHER]: "Profesor",
    [UserRole.STUDENT]: "Alumno",
    [UserRole.PARENT]: "Padre",
    [UserRole.DIRECTOR]: "Directivo"
  };
  return labels[role];
}

export function fullName(user: AdminUser) {
  return `${user.firstName} ${user.lastName}`;
}

export function usersByRole(role: UserRole) {
  return adminUsers.filter((user) => user.role === role);
}
