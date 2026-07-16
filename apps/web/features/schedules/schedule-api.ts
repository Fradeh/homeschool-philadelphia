import type {
  AcademicClassOption,
  CreateScheduleTemplateRequest,
  GradeLevel,
  PhysicalBookingStatus,
  ScheduleGrid,
  ScheduleTemplate,
  ScheduleTemplateBlockInput,
  StudentPhysicalBooking,
  StudentClassDetail,
  StudentDashboardSummary,
  TeacherClassDetail,
  TeacherDashboardSummary,
  TeacherAvailabilitySlot,
  Weekday
} from "@homeschool/shared";
import { apiRequest } from "@/lib/api-client";

export const scheduleApi = {
  admin: {
    grades: () => apiRequest<GradeLevel[]>("/admin/grade-levels"),
    createGrade: (payload: { code: string; name: string; sortOrder: number }) => apiRequest<GradeLevel>("/admin/grade-levels", { method: "POST", body: JSON.stringify(payload) }),
    grid: () => apiRequest<ScheduleGrid>("/admin/schedule-grid"),
    templates: () => apiRequest<ScheduleTemplate[]>("/admin/schedule-templates"),
    createTemplate: (payload: CreateScheduleTemplateRequest) => apiRequest<ScheduleTemplate>("/admin/schedule-templates", { method: "POST", body: JSON.stringify(payload) }),
    saveGrid: (id: string, periods: Array<{ startTime: string; endTime: string; suggestedBreak: boolean }>) => apiRequest<ScheduleTemplate>(`/admin/schedule-templates/${id}/grid`, { method: "PUT", body: JSON.stringify({ periods }) }),
    saveBlocks: (id: string, blocks: ScheduleTemplateBlockInput[]) => apiRequest<ScheduleTemplate>(`/admin/schedule-templates/${id}/blocks`, { method: "PUT", body: JSON.stringify({ blocks }) }),
    publish: (id: string) => apiRequest<ScheduleTemplate>(`/admin/schedule-templates/${id}/publish`, { method: "POST" }),
    assignSubjectTeacher: (classSubjectId: string, teacherProfileId: string) => apiRequest(`/admin/class-subjects/${classSubjectId}/teachers`, { method: "POST", body: JSON.stringify({ teacherProfileId }) })
  },
  student: {
    schedule: () => apiRequest<ScheduleTemplate>("/student/schedule"),
    dashboard: () => apiRequest<StudentDashboardSummary>("/student/dashboard"),
    classes: () => apiRequest<AcademicClassOption[]>("/student/classes"),
    classDetail: (classId: string) => apiRequest<StudentClassDetail>(`/student/classes/${classId}`),
    availability: (classSubjectId: string) => apiRequest<TeacherAvailabilitySlot[]>(`/student/subjects/${classSubjectId}/availability`),
    bookings: () => apiRequest<StudentPhysicalBooking[]>("/student/bookings"),
    book: (classSubjectId: string, payload: { availabilitySlotId: string; scheduledDate: string; studentNote?: string }) => apiRequest<StudentPhysicalBooking>(`/student/subjects/${classSubjectId}/bookings`, { method: "POST", body: JSON.stringify(payload) }),
    cancel: (bookingId: string) => apiRequest<StudentPhysicalBooking>(`/student/bookings/${bookingId}/cancel`, { method: "PATCH" })
  },
  teacher: {
    schedule: () => apiRequest<ScheduleTemplate[]>("/teacher/schedule"),
    dashboard: () => apiRequest<TeacherDashboardSummary>("/teacher/dashboard"),
    classes: () => apiRequest<AcademicClassOption[]>("/teacher/classes"),
    classDetail: (classId: string) => apiRequest<TeacherClassDetail>(`/teacher/classes/${classId}`),
    availability: () => apiRequest<TeacherAvailabilitySlot[]>("/teacher/availability"),
    createAvailability: (payload: { classSubjectId: string; weekday: Weekday; startTime: string; endTime: string; location?: string; instructions?: string }) => apiRequest<TeacherAvailabilitySlot>("/teacher/availability", { method: "POST", body: JSON.stringify(payload) }),
    updateAvailability: (id: string, payload: Partial<Pick<TeacherAvailabilitySlot, "weekday" | "startTime" | "endTime" | "location" | "instructions" | "isActive">>) => apiRequest<TeacherAvailabilitySlot>(`/teacher/availability/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    bookings: () => apiRequest<StudentPhysicalBooking[]>("/teacher/bookings"),
    updateBooking: (
      id: string,
      payload: {
        status: PhysicalBookingStatus;
        teacherResponse?: string;
        availabilitySlotId?: string;
        scheduledDate?: string;
      }
    ) => apiRequest<StudentPhysicalBooking>(`/teacher/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify(payload) })
  }
};
