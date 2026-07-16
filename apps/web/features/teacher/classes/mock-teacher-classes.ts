export type ClassColor = "navy" | "blue" | "indigo" | "teal" | "slate";

export type StudentStatus = "Activo" | "Pendiente" | "Inactivo";

export type TeacherClassStudent = {
  id: string;
  name: string;
  email: string;
  status: StudentStatus;
};

export type TeacherAssignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: "Borrador" | "Publicada" | "Cerrada";
  submissionsCount: number;
  totalStudents: number;
  points?: number;
  submissionType?: "Archivo" | "Texto" | "Enlace" | "Sin entrega";
  attachmentName?: string;
  attachments?: Array<{ id: string; fileName: string; downloadUrl: string }>;
};

export type TeacherMaterial = {
  id: string;
  name: string;
  type: "PDF" | "Documento" | "Enlace" | "Presentación";
  uploadedAt: string;
};

export type ClassWallItem = {
  id: string;
  kind: "post" | "event";
  title: string;
  message: string;
  date: string;
  author: string;
  attachments?: string[];
};

export type ClassActivityItem = {
  id: string;
  label: string;
  detail: string;
  time: string;
};

export type PhysicalClassRequestStatus = "pending" | "accepted" | "rejected" | "reschedule_proposed";

export type PhysicalClassRequest = {
  id: string;
  studentId: string;
  studentName: string;
  requestedDate: string;
  requestedTime: string;
  reason: string;
  status: PhysicalClassRequestStatus;
  createdAt: string;
  teacherNote?: string;
  proposedDate?: string;
  proposedTime?: string;
};

export type PhysicalClassSchedule = {
  location: string;
  durationMinutes: number;
  minimumNoticeDays: number;
  instructions: string;
  availability: Array<{
    weekday: number;
    startTime: string;
    endTime: string;
  }>;
  requests: PhysicalClassRequest[];
};

export type TeacherClass = {
  id: string;
  name: string;
  code: string;
  description: string;
  color: ClassColor;
  students: TeacherClassStudent[];
  assignments: TeacherAssignment[];
  materials: TeacherMaterial[];
  wall: ClassWallItem[];
  activity: ClassActivityItem[];
  physicalSchedule: PhysicalClassSchedule;
  lastActivity: string;
};

export const classColorMap: Record<ClassColor, { bg: string; text: string; soft: string; ring: string }> = {
  navy: { bg: "#191970", text: "text-[#191970]", soft: "bg-[#eef2ff]", ring: "ring-[#191970]/15" },
  blue: { bg: "#078cc5", text: "text-[#076f9d]", soft: "bg-[#eaf7fc]", ring: "ring-[#078cc5]/15" },
  indigo: { bg: "#3949ab", text: "text-[#3949ab]", soft: "bg-[#eef1ff]", ring: "ring-[#3949ab]/15" },
  teal: { bg: "#168579", text: "text-[#13756b]", soft: "bg-[#eaf7f5]", ring: "ring-[#168579]/15" },
  slate: { bg: "#475569", text: "text-[#475569]", soft: "bg-slate-100", ring: "ring-slate-200" }
};

export const availableStudents: TeacherClassStudent[] = [
  { id: "student-001", name: "Camila Torres", email: "camila.torres@philadelphia.edu", status: "Activo" },
  { id: "student-002", name: "Mateo Rivera", email: "mateo.rivera@philadelphia.edu", status: "Activo" },
  { id: "student-003", name: "Isabella Chen", email: "isabella.chen@philadelphia.edu", status: "Activo" },
  { id: "student-004", name: "Daniel Brooks", email: "daniel.brooks@philadelphia.edu", status: "Pendiente" },
  { id: "student-005", name: "Lucía Mendoza", email: "lucia.mendoza@philadelphia.edu", status: "Activo" },
  { id: "student-006", name: "Samuel Ortiz", email: "samuel.ortiz@philadelphia.edu", status: "Activo" }
];

export const teacherClasses: TeacherClass[] = [
  {
    id: "english-8",
    name: "English 8th Grade",
    code: "ENG-8",
    description: "Lectura, escritura y comunicación semanal para octavo grado.",
    color: "navy",
    lastActivity: "Comentario nuevo en Vocabulary list hace 12 min",
    students: availableStudents.slice(0, 4),
    assignments: [
      {
        id: "assignment-essay",
        title: "Essay draft: personal narrative",
        description: "Primer borrador del ensayo narrativo con introducción y cierre.",
        dueDate: "21 Jun 2026",
        status: "Publicada",
        submissionsCount: 16,
        totalStudents: 24
      },
      {
        id: "assignment-vocabulary",
        title: "Vocabulary practice",
        description: "Lista de vocabulario con ejemplos en contexto.",
        dueDate: "24 Jun 2026",
        status: "Borrador",
        submissionsCount: 0,
        totalStudents: 24
      }
    ],
    materials: [
      { id: "material-rubric", name: "Essay rubric.pdf", type: "PDF", uploadedAt: "17 Jun 2026" },
      { id: "material-reading", name: "Reading guide - Unit 4", type: "Documento", uploadedAt: "15 Jun 2026" },
      { id: "material-video", name: "Writing techniques reference", type: "Enlace", uploadedAt: "12 Jun 2026" }
    ],
    wall: [
      {
        id: "wall-1",
        kind: "post",
        title: "Recordatorio para el taller de ensayo",
        message: "Traigan el borrador impreso y las notas de retroalimentación para trabajar en clase.",
        date: "Hoy, 8:40 AM",
        author: "Ana Garcia",
        attachments: ["Essay rubric.pdf"]
      },
      {
        id: "wall-2",
        kind: "event",
        title: "Nueva tarea publicada",
        message: "Essay draft: personal narrative ya está disponible para los estudiantes.",
        date: "Ayer, 3:20 PM",
        author: "Sistema"
      }
    ],
    activity: [
      { id: "activity-1", label: "Comunicado publicado", detail: "Recordatorio para el taller de ensayo", time: "12 min" },
      { id: "activity-2", label: "Archivo subido", detail: "Essay rubric.pdf", time: "1 h" },
      { id: "activity-3", label: "Tarea creada", detail: "Vocabulary practice", time: "Ayer" }
    ],
    physicalSchedule: {
      location: "Sede principal · Salón 204",
      durationMinutes: 45,
      minimumNoticeDays: 1,
      instructions: "Traer el material que deseas revisar y llegar 10 minutos antes.",
      availability: [
        { weekday: 2, startTime: "09:00", endTime: "12:00" },
        { weekday: 4, startTime: "14:00", endTime: "17:00" }
      ],
      requests: [
        {
          id: "request-english-1",
          studentId: "student-001",
          studentName: "Camila Torres",
          requestedDate: "2026-06-23",
          requestedTime: "10:00",
          reason: "Quiero revisar la estructura de mi ensayo antes de entregar el borrador.",
          status: "pending",
          createdAt: "Hoy, 8:35 AM"
        },
        {
          id: "request-english-2",
          studentId: "student-003",
          studentName: "Isabella Chen",
          requestedDate: "2026-06-25",
          requestedTime: "15:30",
          reason: "Necesito practicar la presentación oral del proyecto.",
          status: "reschedule_proposed",
          createdAt: "Ayer, 4:12 PM",
          proposedDate: "2026-06-30",
          proposedTime: "09:45",
          teacherNote: "El jueves estaré en reunión académica. Puedo atenderte el martes en la mañana."
        },
        {
          id: "request-english-3",
          studentId: "student-002",
          studentName: "Mateo Rivera",
          requestedDate: "2026-06-18",
          requestedTime: "14:45",
          reason: "Resolver dudas sobre el vocabulario de la unidad cuatro.",
          status: "accepted",
          createdAt: "16 Jun, 11:20 AM",
          teacherNote: "Trae la guía de lectura y tu cuaderno de vocabulario."
        }
      ]
    }
  },
  {
    id: "homeroom-7a",
    name: "Homeroom 7A",
    code: "HR-7A",
    description: "Avisos, recordatorios y seguimiento general del grupo.",
    color: "blue",
    lastActivity: "Dos estudiantes vieron el último anuncio hace 38 min",
    students: availableStudents.slice(1, 6),
    assignments: [
      {
        id: "assignment-parent-update",
        title: "Family update form",
        description: "Formulario breve para confirmar información de contacto familiar.",
        dueDate: "22 Jun 2026",
        status: "Publicada",
        submissionsCount: 12,
        totalStudents: 21
      }
    ],
    materials: [
      { id: "material-calendar", name: "June family calendar.pdf", type: "PDF", uploadedAt: "16 Jun 2026" },
      { id: "material-rules", name: "Classroom expectations", type: "Documento", uploadedAt: "10 Jun 2026" }
    ],
    wall: [
      {
        id: "wall-3",
        kind: "post",
        title: "Salida pedagógica",
        message: "La autorización debe enviarse antes del viernes. El documento está adjunto.",
        date: "Hoy, 10:15 AM",
        author: "Ana Garcia",
        attachments: ["Autorización salida.pdf"]
      }
    ],
    activity: [
      { id: "activity-4", label: "Comunicado publicado", detail: "Salida pedagógica", time: "38 min" },
      { id: "activity-5", label: "Alumno agregado", detail: "Samuel Ortiz", time: "Ayer" }
    ],
    physicalSchedule: {
      location: "Sede principal · Sala de orientación",
      durationMinutes: 30,
      minimumNoticeDays: 1,
      instructions: "La asistencia de un acudiente puede solicitarse en el motivo de la visita.",
      availability: [
        { weekday: 1, startTime: "08:00", endTime: "10:00" },
        { weekday: 3, startTime: "13:00", endTime: "16:00" }
      ],
      requests: [
        {
          id: "request-homeroom-1",
          studentId: "student-005",
          studentName: "Lucía Mendoza",
          requestedDate: "2026-06-24",
          requestedTime: "14:00",
          reason: "Seguimiento del plan de estudio semanal.",
          status: "pending",
          createdAt: "Hoy, 9:10 AM"
        }
      ]
    }
  },
  {
    id: "research-projects",
    name: "Research Projects",
    code: "RSP",
    description: "Espacio de proyectos interdisciplinarios, recursos y entregas.",
    color: "indigo",
    lastActivity: "Archivo rubric-final.pdf subido hace 1 h",
    students: availableStudents.slice(0, 3),
    assignments: [
      {
        id: "assignment-topic",
        title: "Research topic proposal",
        description: "Propuesta inicial con pregunta guía, fuentes y alcance.",
        dueDate: "25 Jun 2026",
        status: "Publicada",
        submissionsCount: 9,
        totalStudents: 18
      }
    ],
    materials: [
      { id: "material-template", name: "Research proposal template", type: "Documento", uploadedAt: "14 Jun 2026" },
      { id: "material-sources", name: "Source evaluation checklist.pdf", type: "PDF", uploadedAt: "11 Jun 2026" }
    ],
    wall: [
      {
        id: "wall-4",
        kind: "event",
        title: "Nuevo material subido",
        message: "Source evaluation checklist.pdf se agregó a Contenido.",
        date: "Ayer, 11:05 AM",
        author: "Ana Garcia"
      }
    ],
    activity: [
      { id: "activity-6", label: "Archivo subido", detail: "rubric-final.pdf", time: "1 h" },
      { id: "activity-7", label: "Tarea creada", detail: "Research topic proposal", time: "2 días" }
    ],
    physicalSchedule: {
      location: "Biblioteca · Mesa de proyectos",
      durationMinutes: 60,
      minimumNoticeDays: 2,
      instructions: "Llevar la pregunta de investigación y al menos dos fuentes preseleccionadas.",
      availability: [
        { weekday: 3, startTime: "09:00", endTime: "12:00" },
        { weekday: 5, startTime: "10:00", endTime: "13:00" }
      ],
      requests: []
    }
  }
];

export function getTeacherClass(classId: string) {
  return teacherClasses.find((teacherClass) => teacherClass.id === classId);
}
