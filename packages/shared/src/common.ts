export interface ApiEnvelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export enum EntityStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  ARCHIVED = "ARCHIVED"
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}
