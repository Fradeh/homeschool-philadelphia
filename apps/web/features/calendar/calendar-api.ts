import type { CalendarEventSummary } from "@homeschool/shared";
import { apiRequest } from "@/lib/api-client";

export function getCalendarEvents() {
  return apiRequest<CalendarEventSummary[]>("/calendar/events");
}
