import { UserRole } from "@homeschool/shared";

export type StudentAssignmentStatus = "Pendiente" | "En progreso" | "Entregada";

export const studentUser = {
  id: "student-001",
  firstName: "Camila",
  lastName: "Torres",
  email: "camila.torres@philadelphia.edu",
  grade: "8° grado",
  roles: [UserRole.STUDENT]
};

export const studentClasses = [
  {
    id: "english-8",
    name: "English 8th Grade",
    code: "ENG-8",
    teacher: "Ana Garcia",
    color: "#191970",
    progress: 78,
    description: "Lectura, escritura y comunicación semanal para octavo grado.",
    nextClass: "Martes · 9:00 AM"
  },
  {
    id: "homeroom-7a",
    name: "Homeroom 7A",
    code: "HR-7A",
    teacher: "Ana Garcia",
    color: "#078cc5",
    progress: 92,
    description: "Avisos, recordatorios y seguimiento general del grupo.",
    nextClass: "Miércoles · 8:00 AM"
  },
  {
    id: "research-projects",
    name: "Research Projects",
    code: "RSP",
    teacher: "Ana Garcia",
    color: "#3949ab",
    progress: 64,
    description: "Proyectos interdisciplinarios, investigación y entregas.",
    nextClass: "Viernes · 10:00 AM"
  }
];

export const studentAssignments = [
  {
    id: "essay",
    classId: "english-8",
    classCode: "ENG-8",
    className: "English 8th Grade",
    title: "Essay draft: personal narrative",
    description: "Primer borrador del ensayo narrativo con introducción, desarrollo y cierre.",
    due: "Hoy, 11:59 PM",
    dueDate: "2026-06-23",
    points: 100,
    status: "En progreso" as StudentAssignmentStatus,
    progress: 65,
    color: "#191970",
    submissionType: "Documento"
  },
  {
    id: "family",
    classId: "homeroom-7a",
    classCode: "HR-7A",
    className: "Homeroom 7A",
    title: "Family update form",
    description: "Formulario breve para confirmar información de contacto familiar.",
    due: "Mañana, 6:00 PM",
    dueDate: "2026-06-24",
    points: 20,
    status: "Pendiente" as StudentAssignmentStatus,
    progress: 0,
    color: "#078cc5",
    submissionType: "Formulario"
  },
  {
    id: "vocabulary",
    classId: "english-8",
    classCode: "ENG-8",
    className: "English 8th Grade",
    title: "Vocabulary practice",
    description: "Práctica de vocabulario con ejemplos en contexto.",
    due: "Mié, 11:59 PM",
    dueDate: "2026-06-25",
    points: 50,
    status: "Pendiente" as StudentAssignmentStatus,
    progress: 0,
    color: "#191970",
    submissionType: "Texto"
  },
  {
    id: "topic",
    classId: "research-projects",
    classCode: "RSP",
    className: "Research Projects",
    title: "Research topic proposal",
    description: "Propuesta inicial con pregunta guía, fuentes y alcance.",
    due: "Jue, 11:59 PM",
    dueDate: "2026-06-26",
    points: 80,
    status: "Entregada" as StudentAssignmentStatus,
    progress: 100,
    color: "#3949ab",
    submissionType: "Archivo"
  }
];

export const studentAgenda = [
  {
    id: "a1",
    date: "2026-06-23",
    day: "23",
    month: "JUN",
    time: "9:00 AM",
    title: "English workshop",
    classCode: "ENG-8",
    classId: "english-8",
    type: "Clase",
    detail: "Taller de ensayo narrativo y revisión de borradores."
  },
  {
    id: "a2",
    date: "2026-06-23",
    day: "23",
    month: "JUN",
    time: "10:00 AM",
    title: "Encuentro con Ana Garcia",
    classCode: "ENG-8",
    classId: "english-8",
    type: "Encuentro",
    detail: "Revisión individual del ensayo personal."
  },
  {
    id: "a3",
    date: "2026-06-24",
    day: "24",
    month: "JUN",
    time: "2:00 PM",
    title: "Seguimiento de estudio",
    classCode: "HR-7A",
    classId: "homeroom-7a",
    type: "Orientación",
    detail: "Revisión del plan de estudio semanal."
  }
];

export const studentAnnouncements = [
  { id: "n1", classCode: "ENG-8", title: "Recordatorio para el taller de ensayo", time: "Hace 12 min" },
  { id: "n2", classCode: "HR-7A", title: "Autorización para la salida pedagógica", time: "Hace 1 h" }
];

export const studentMessages = [
  {
    id: "m1",
    classId: "english-8",
    classCode: "ENG-8",
    from: "Ana Garcia",
    subject: "Comentarios sobre tu borrador",
    preview: "Revisa la introducción y trae dos ejemplos adicionales para el taller.",
    time: "Hace 18 min",
    unread: true
  },
  {
    id: "m2",
    classId: "homeroom-7a",
    classCode: "HR-7A",
    from: "Coordinación académica",
    subject: "Confirmación de datos familiares",
    preview: "Recuerda completar el formulario antes de mañana en la tarde.",
    time: "Hace 1 h",
    unread: true
  },
  {
    id: "m3",
    classId: "research-projects",
    classCode: "RSP",
    from: "Ana Garcia",
    subject: "Fuentes para el proyecto",
    preview: "La plantilla de evaluación ya está disponible en recursos.",
    time: "Ayer",
    unread: false
  }
];
