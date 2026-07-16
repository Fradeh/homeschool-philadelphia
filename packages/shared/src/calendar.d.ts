export declare enum EventScope {
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
