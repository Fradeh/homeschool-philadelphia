export enum EventScope {
  GENERAL = "GENERAL",
  GROUP = "GROUP"
}

export interface CalendarEventSummary {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string | null;
  scope: EventScope;
  groupId?: string | null;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  scope: EventScope;
  groupId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}
