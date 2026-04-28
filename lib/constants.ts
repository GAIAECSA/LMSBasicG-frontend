import type { UserRole } from "@/types/auth";

export interface SidebarItem {
    label: string;
    href?: string;
    children?: SidebarItem[];
}

export const sidebarByRole: Record<UserRole, SidebarItem[]> = {
    admin: [
        { label: "Inicio", href: "/admin" },
        { label: "Docentes", href: "/admin/teachers" },
        { label: "Estudiantes", href: "/admin/students" },
        {
            label: "Cursos",
            href: "/admin/courses",
            children: [
                { label: "Categoría", href: "/admin/courses/categories" },
                { label: "Subcategoría", href: "/admin/courses/subcategories" },
            ],
        },
        { label: "Matrículas", href: "/admin/enrollments" },
        { label: "Usuarios", href: "/admin/users" },
    ],

    teacher: [{ label: "Mis cursos", href: "/teacher/courses" }],

    student: [
        { label: "Inicio", href: "/student" },
        { label: "Mis cursos", href: "/student/courses" },
        { label: "Certificados", href: "/student/certificates" },
    ],
};

export const roleLabels: Record<UserRole, string> = {
    admin: "Administrador",
    teacher: "Profesor",
    student: "Estudiante",
};

export function getEffectiveRoleByPathname(
    userRole: UserRole | undefined,
    pathname: string,
): UserRole {
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/teacher")) return "teacher";
    if (pathname.startsWith("/student")) return "student";

    return userRole ?? "student";
}

export function getTeacherCourseIdFromPathname(pathname: string): string | null {
    const match = pathname.match(/^\/teacher\/courses\/([^/]+)/);

    return match?.[1] ?? null;
}

export function getStudentCourseIdFromPathname(pathname: string): string | null {
    const match = pathname.match(/^\/student\/courses\/([^/]+)/);

    return match?.[1] ?? null;
}

export function getSidebarItemsByRoute(
    userRole: UserRole | undefined,
    pathname: string,
): SidebarItem[] {
    const effectiveRole = getEffectiveRoleByPathname(userRole, pathname);

    if (effectiveRole === "student") {
        return sidebarByRole.student;
    }

    if (effectiveRole !== "teacher") {
        return sidebarByRole[effectiveRole];
    }

    const courseId = getTeacherCourseIdFromPathname(pathname);

    if (!courseId) {
        return sidebarByRole.teacher;
    }

    return [
        {
            label: "Curso actual",
            href: `/teacher/courses/${courseId}`,
            children: [
                {
                    label: "Presentación",
                    href: `/teacher/courses/${courseId}`,
                },
                {
                    label: "Módulos",
                    href: `/teacher/courses/${courseId}/modules`,
                },
                {
                    label: "Calificaciones",
                    href: `/teacher/courses/${courseId}/grades`,
                },
                {
                    label: "Certificados",
                    href: `/teacher/courses/${courseId}/certificates`,
                },
            ],
        },
    ];
}