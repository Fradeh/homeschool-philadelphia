export declare enum GroupVisibility {
    PRIVATE = "PRIVATE",
    SCHOOL_WIDE = "SCHOOL_WIDE"
}
export declare enum PostStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export interface GroupSummary {
    id: string;
    name: string;
    description?: string | null;
    visibility: GroupVisibility;
}
export interface Group {
    id: string;
    name: string;
    description?: string | null;
    visibility: GroupVisibility;
    membersCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface GroupMember {
    userId: string;
    groupId: string;
    role: "OWNER" | "MEMBER";
    joinedAt: string;
}
export interface Post {
    id: string;
    groupId: string;
    authorId: string;
    title: string;
    content: string;
    status: PostStatus;
    attachments: FileAttachment[];
    commentsCount: number;
    createdAt: string;
    updatedAt: string;
}
export interface Comment {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}
export interface FileAttachment {
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    url?: string | null;
    uploadedById: string;
    createdAt: string;
}
export declare enum ConversationStatus {
    OPEN = "OPEN",
    ESCALATED = "ESCALATED",
    CLOSED = "CLOSED"
}
export declare enum ConversationParticipantType {
    STUDENT = "STUDENT",
    TEACHER = "TEACHER",
    PARENT = "PARENT",
    DIRECTOR = "DIRECTOR"
}
export interface ConversationUserSummary {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    email: string;
}
export interface ConversationParticipantSummary {
    id: string;
    type: ConversationParticipantType;
    joinedAt: string;
    user: ConversationUserSummary;
}
export interface ConversationMessageSummary {
    id: string;
    body: string;
    createdAt: string;
    sender: ConversationUserSummary;
}
export interface ConversationSummary {
    id: string;
    subject: string;
    status: ConversationStatus;
    createdAt: string;
    updatedAt: string;
    escalatedAt?: string | null;
    participants: ConversationParticipantSummary[];
    messages: ConversationMessageSummary[];
    lastMessage?: ConversationMessageSummary | null;
}
export interface CreateConversationRequest {
    subject: string;
    body: string;
    studentProfileId?: string;
    parentProfileId?: string;
}
export interface SendConversationMessageRequest {
    body: string;
}
export interface EscalateConversationRequest {
    directorProfileId?: string;
    body?: string;
}
