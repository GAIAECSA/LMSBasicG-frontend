import type { LoginResponse, UserRole } from "@/types/auth";

export const AUTH_STORAGE_KEY = "lmsbasicg_auth";
export const AUTH_CHANGE_EVENT = "lmsbasicg_auth_changed";

function emitAuthChange() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getDashboardRouteByRole(role: UserRole | null | undefined): string {
    switch (role) {
        case "admin":
            return "/admin";
        case "teacher":
            return "/teacher";
        case "student":
        default:
            return "/student";
    }
}

export function getDashboardRouteByRoleId(roleId: number | null | undefined): string {
    switch (roleId) {
        case 1:
            return "/admin";
        case 3:
            return "/teacher";
        case 2:
        case 4:
        default:
            return "/student";
    }
}

export function saveAuthSession(session: LoginResponse) {
    if (typeof window === "undefined") return;
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    emitAuthChange();
}

export function getAuthSession(): LoginResponse | null {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    try {
        return JSON.parse(raw) as LoginResponse;
    } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return null;
    }
}

export function clearAuthSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    emitAuthChange();
}