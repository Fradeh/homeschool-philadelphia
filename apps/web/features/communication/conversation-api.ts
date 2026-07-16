import {
  CloseConversationRequest,
  ConversationListItem,
  ConversationMessagePage,
  ConversationMutationResult,
  CreateConversationRequest,
  EscalateConversationRequest,
  SendConversationMessageRequest
} from "@homeschool/shared";
import type { ConversationContact } from "@homeschool/shared";
import { apiRequest } from "@/lib/api-client";

export function getConversations() {
  return apiRequest<ConversationListItem[]>("/conversations");
}

export function getConversationMessages(conversationId: string, cursor?: string) {
  const query = new URLSearchParams({ limit: "30" });
  if (cursor) query.set("cursor", cursor);
  return apiRequest<ConversationMessagePage>(
    `/conversations/${conversationId}/messages?${query.toString()}`
  );
}

export function getConversationContacts() {
  return apiRequest<ConversationContact[]>("/conversations/contacts");
}

export function createConversation(payload: CreateConversationRequest) {
  return apiRequest<ConversationMutationResult>("/conversations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function sendConversationMessage(conversationId: string, payload: SendConversationMessageRequest) {
  return apiRequest<ConversationMutationResult>(`/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateConversationMessage(conversationId: string, messageId: string, body: string) {
  return apiRequest<ConversationMutationResult>(`/conversations/${conversationId}/messages/${messageId}`, { method: "PATCH", body: JSON.stringify({ body }) });
}

export function deleteConversation(conversationId: string) {
  return apiRequest<{ deleted: boolean }>(`/conversations/${conversationId}`, { method: "DELETE" });
}

export function escalateConversation(conversationId: string, payload: EscalateConversationRequest) {
  return apiRequest<ConversationMutationResult>(`/conversations/${conversationId}/escalate`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function closeConversation(conversationId: string, payload: CloseConversationRequest) {
  return apiRequest<ConversationMutationResult>(`/conversations/${conversationId}/close`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
