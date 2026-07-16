export declare enum UserRole {
    ADMIN = "ADMIN",
    TEACHER = "TEACHER",
    STUDENT = "STUDENT",
    PARENT = "PARENT",
    DIRECTOR = "DIRECTOR"
}
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    roles: UserRole[];
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface LoginResponse {
    accessToken: string;
    user: AuthUser;
}
