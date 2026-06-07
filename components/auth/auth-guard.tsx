"use client";

import {
    useEffect,
    type ReactNode,
} from "react";
import {
    usePathname,
    useRouter,
} from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { getDashboardRouteByRole } from "@/lib/auth";
import type { UserRole } from "@/types/auth";

interface AuthGuardProps {
    children: ReactNode;
}

function getRequiredRole(
    pathname: string,
): UserRole | null {
    if (
        pathname === "/admin" ||
        pathname.startsWith("/admin/")
    ) {
        return "admin";
    }

    if (
        pathname === "/teacher" ||
        pathname.startsWith("/teacher/")
    ) {
        return "teacher";
    }

    if (
        pathname === "/student" ||
        pathname.startsWith("/student/")
    ) {
        return "student";
    }

    return null;
}

function getTeacherCourseIdFromPathname(
    pathname: string,
): number | null {
    const match =
        pathname.match(
            /^\/teacher\/courses\/(\d+)(?:\/|$)/,
        );

    if (!match?.[1]) {
        return null;
    }

    const courseId =
        Number(match[1]);

    return (
        Number.isFinite(courseId) &&
        courseId > 0
    )
        ? courseId
        : null;
}

export function AuthGuard({
    children,
}: AuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();

    const {
        loading,
        isAuthenticated,
        user,
    } = useAuth();

    const requiredRole =
        getRequiredRole(pathname);

    const teacherCourseId =
        getTeacherCourseIdFromPathname(
            pathname,
        );

    /*
     * Un usuario con rol principal student puede intentar abrir
     * únicamente una ruta docente asociada a un curso concreto.
     *
     * Este guard permite que la solicitud continúe hasta el layout
     * del dashboard. El layout verifica la matrícula docente real
     * antes de renderizar cualquier contenido del curso.
     */
    const canValidateMixedTeacherCourseAccess =
        user?.role === "student" &&
        requiredRole === "teacher" &&
        teacherCourseId !== null;

    const hasCorrectRole =
        !requiredRole ||
        user?.role === requiredRole ||
        canValidateMixedTeacherCourseAccess;

    useEffect(() => {
        if (loading) return;

        if (
            !isAuthenticated ||
            !user
        ) {
            router.replace("/login");
            return;
        }

        if (!hasCorrectRole) {
            router.replace(
                getDashboardRouteByRole(
                    user.role,
                ),
            );
        }
    }, [
        loading,
        isAuthenticated,
        user,
        hasCorrectRole,
        router,
    ]);

    if (
        loading ||
        !isAuthenticated ||
        !user ||
        !hasCorrectRole
    ) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
                <div className="rounded-2xl border border-[var(--border)] bg-white px-6 py-4 text-sm font-semibold text-[var(--muted-foreground)] shadow-sm">
                    Verificando permisos...
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
