export type UserRole = "admin" | "teacher" | "student";

export interface AuthUser {
    id: string;
    username: string;
    firstname: string;
    lastname: string;
    fullName: string;
    email: string;
    phone_number: string;
    role: UserRole;
    role_id?: number | null;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken?: string | null;
    tokenType?: string | null;
    user: AuthUser;
}