"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth";

type DashboardLayoutProps = {
    children: React.ReactNode;
};

function getPathSegments(path?: string | null): string[] {
    if (!path) return [];

    const normalized = path === "/" ? "/" : path.replace(/\/+$/, "");

    if (!normalized || normalized === "/") return [];

    return normalized.split("/").filter(Boolean);
}

function getRouteRole(pathname: string): UserRole | null {
    const segments = getPathSegments(pathname);

    if (segments[0] === "admin") return "admin";
    if (segments[0] === "teacher") return "teacher";
    if (segments[0] === "student") return "student";

    return null;
}

function getEffectiveRoleByPathname(
    userRole: UserRole | string | undefined,
    pathname: string,
): UserRole {
    const routeRole = getRouteRole(pathname);

    if (routeRole) return routeRole;

    if (userRole === "admin" || userRole === "teacher" || userRole === "student") {
        return userRole;
    }

    return "student";
}

function getRoleLabel(role?: UserRole | string) {
    if (role === "admin") return "Admin";
    if (role === "teacher") return "Profesor";
    if (role === "student") return "Estudiante";

    return "Usuario";
}

function getUserFullName(user: unknown) {
    if (!user || typeof user !== "object") return "Usuario";

    const value = user as {
        firstname?: string;
        lastname?: string;
        fullName?: string;
        name?: string;
        username?: string;
        email?: string;
    };

    const fullName = `${value.firstname ?? ""} ${value.lastname ?? ""}`.trim();

    return (
        value.fullName ||
        fullName ||
        value.name ||
        value.username ||
        value.email?.split("@")[0] ||
        "Usuario"
    );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, signOut } = useAuth();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const routeRole = getRouteRole(pathname);
    const effectiveRole = getEffectiveRoleByPathname(user?.role, pathname);

    const isAdmin = effectiveRole === "admin";
    const isStudentRoute = routeRole === "student";
    const isTeacherRoute = routeRole === "teacher";
    const isProfileRoute = pathname === "/profile";
    const isHelpRoute = pathname === "/help";

    /*
     * Sidebar visible para todos los roles.
     */
    const hideSidebar = false;

    /*
     * Header:
     * - Admin: visible.
     * - Teacher: oculto.
     * - Student: oculto.
     * - Profile y Help: oculto si no es admin.
     */
    const hideHeader =
        !isAdmin && (isStudentRoute || isTeacherRoute || isProfileRoute || isHelpRoute);

    function handleLogout() {
        if (typeof signOut === "function") {
            signOut();
        } else if (typeof window !== "undefined") {
            localStorage.removeItem("lmsbasicg_auth");
        }

        router.push("/login");
    }

    function getMainClassName() {
        if (hideHeader) {
            return "min-h-screen w-full bg-[var(--background)]";
        }

        return "min-h-[calc(100vh-72px)] w-full bg-[var(--background)] p-5 md:p-6";
    }

    const contentPaddingClass = hideSidebar
        ? ""
        : sidebarCollapsed
            ? "md:pl-20"
            : "md:pl-[280px]";

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            {!hideSidebar ? (
                <Sidebar
                    collapsed={sidebarCollapsed}
                    onToggleCollapsed={() =>
                        setSidebarCollapsed((current) => !current)
                    }
                />
            ) : null}

            <div
                className={`min-h-screen w-full transition-[padding] duration-300 ease-in-out ${contentPaddingClass}`}
            >
                {!hideHeader ? (
                    <header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-5 shadow-sm md:px-6">
                        <div>
                            <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                Bienvenido
                            </p>

                            <h1 className="text-lg font-black text-[var(--foreground)]">
                                {getUserFullName(user)}
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="rounded-2xl bg-[var(--muted)] px-4 py-2 text-sm font-semibold text-[var(--muted-foreground)]">
                                Rol:{" "}
                                <span className="font-black text-[var(--foreground)]">
                                    {getRoleLabel(effectiveRole)}
                                </span>
                            </span>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[var(--danger)] px-4 text-sm font-black text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-red-200"
                            >
                                <LogOut className="h-4 w-4" />
                                Cerrar sesión
                            </button>
                        </div>
                    </header>
                ) : null}

                <main className={getMainClassName()}>{children}</main>
            </div>
        </div>
    );
}