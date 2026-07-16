import { classColorMap, teacherClasses, type TeacherMaterial } from "@/features/teacher/classes/mock-teacher-classes";
import { studentAssignments, studentClasses, studentMessages } from "./mock-student-data";

export type StudentResource = TeacherMaterial & {
  classId: string;
  className: string;
  classCode: string;
  size: string;
  color: string;
};

export type StudentCalendarEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  type: "Tarea" | "Encuentro" | "Clase";
  classId: string;
  className: string;
  classCode: string;
  detail: string;
  color: string;
};

export function getStudentResources(): StudentResource[] {
  const enrolledIds = new Set(studentClasses.map((item) => item.id));

  return teacherClasses
    .filter((item) => enrolledIds.has(item.id))
    .flatMap((owner, ownerIndex) =>
      owner.materials.map((material, index) => ({
        ...material,
        classId: owner.id,
        className: owner.name,
        classCode: owner.code,
        size: material.type === "Enlace" ? "Enlace externo" : `${(1.2 + ownerIndex * 0.6 + index * 0.35).toFixed(1)} MB`,
        color: classColorMap[owner.color].bg
      }))
    );
}

export function getStudentCalendarEvents(): StudentCalendarEvent[] {
  const assignmentEvents: StudentCalendarEvent[] = studentAssignments.map((item) => ({
    id: `assignment-${item.id}`,
    title: item.title,
    date: item.dueDate,
    type: "Tarea",
    classId: item.classId,
    className: item.className,
    classCode: item.classCode,
    detail: `${item.status} · ${item.points} puntos`,
    color: item.color
  }));

  const meetingEvents: StudentCalendarEvent[] = teacherClasses.flatMap((owner) =>
    owner.physicalSchedule.requests
      .filter((request) => request.studentId === "student-001" && request.status !== "rejected")
      .map((request) => ({
        id: `meeting-${request.id}`,
        title: `Encuentro con ${studentClasses.find((item) => item.id === owner.id)?.teacher ?? "profesor"}`,
        date: request.status === "reschedule_proposed" && request.proposedDate ? request.proposedDate : request.requestedDate,
        time: request.status === "reschedule_proposed" && request.proposedTime ? request.proposedTime : request.requestedTime,
        type: "Encuentro" as const,
        classId: owner.id,
        className: owner.name,
        classCode: owner.code,
        detail: request.reason,
        color: "#078cc5"
      }))
  );

  const classEvents: StudentCalendarEvent[] = studentClasses.map((item, index) => ({
    id: `class-${item.id}`,
    title: item.name,
    date: `2026-06-${String(23 + index).padStart(2, "0")}`,
    time: item.nextClass.split("·")[1]?.trim(),
    type: "Clase",
    classId: item.id,
    className: item.name,
    classCode: item.code,
    detail: item.description,
    color: item.color
  }));

  return [...assignmentEvents, ...meetingEvents, ...classEvents].sort((a, b) => a.date.localeCompare(b.date));
}

export function getStudentMessageThreads() {
  return studentMessages.map((message) => {
    const owner = studentClasses.find((item) => item.id === message.classId);

    return {
      ...message,
      className: owner?.name ?? "Clase",
      color: owner?.color ?? "#191970"
    };
  });
}
