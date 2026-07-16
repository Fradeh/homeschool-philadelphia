export type PaceStatus = "completed" | "current" | "planned";
export type PaceItem = { number: number; status: PaceStatus; note?: string };
export type PaceSubject = { id: string; name: string; shortName: string; color: string; classId?: string };
export type StudentPacePlan = { studentId: string; studentName: string; grade: string; targetPerSubject: number; plans: Record<string, PaceItem[]> };

export const paceSubjects: PaceSubject[] = [
  { id: "math", name: "Matemáticas", shortName: "MATH", color: "#eab308", classId: "research-projects" },
  { id: "english", name: "Inglés", shortName: "ENG", color: "#ef4444", classId: "english-8" },
  { id: "word-building", name: "Word Building", shortName: "WB", color: "#9333ea", classId: "english-8" },
  { id: "spanish", name: "Español", shortName: "ESP", color: "#f59e0b", classId: "homeroom-7a" },
  { id: "science", name: "Ciencias", shortName: "SC", color: "#38bdf8", classId: "research-projects" },
  { id: "social-studies", name: "Estudios Sociales", shortName: "SS", color: "#4d9f38", classId: "homeroom-7a" }
];

function sequence(start: number): PaceItem[] {
  return [0, 1, 2].map((offset) => ({ number: start + offset, status: offset === 0 ? "completed" : offset === 1 ? "current" : "planned" }));
}
function plans(starts: number[]): Record<string, PaceItem[]> {
  return Object.fromEntries(paceSubjects.map((subject, index) => [subject.id, sequence(starts[index])]));
}

export const initialPacePlans: StudentPacePlan[] = [
  { studentId: "student-001", studentName: "Camila Torres", grade: "8°", targetPerSubject: 3, plans: plans([1061, 1060, 1061, 1063, 1060, 1059]) },
  { studentId: "student-002", studentName: "Mateo Rivera", grade: "8°", targetPerSubject: 3, plans: plans([1057, 1054, 1054, 1063, 1054, 1054]) },
  { studentId: "student-003", studentName: "Isabella Chen", grade: "8°", targetPerSubject: 3, plans: plans([1060, 1048, 1048, 1061, 1048, 1049]) },
  { studentId: "student-005", studentName: "Lucía Mendoza", grade: "8°", targetPerSubject: 3, plans: plans([1055, 1055, 1052, 1062, 1055, 1055]) },
  { studentId: "student-006", studentName: "Samuel Ortiz", grade: "8°", targetPerSubject: 4, plans: plans([1064, 1061, 1065, 1062, 1062, 1060]) }
];

export const activeTerm = { id: "2026-t2", name: "Segundo trimestre", year: 2026 };
