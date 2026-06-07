import type { UserRole } from "@/types/auth";

export interface SidebarItem {
    label: string;
    href?: string;
    children?: SidebarItem[];
}

export const sidebarByRole: Record<UserRole, SidebarItem[]> = {
    admin: [
        {
            label: "Inicio",
            href: "/admin",
        },
        {
            label: "Gestión de usuarios",
            children: [
                {
                    label: "Usuarios",
                    href: "/admin/users",
                },
                {
                    label: "Docentes",
                    href: "/admin/teachers",
                },
                {
                    label: "Estudiantes",
                    href: "/admin/students",
                },
            ],
        },
        {
            label: "Cursos y contenidos",
            children: [
                {
                    label: "Lista de cursos",
                    href: "/admin/courses",
                },
                {
                    label: "Categorías",
                    href: "/admin/courses/categories",
                },
                {
                    label: "Subcategorías",
                    href: "/admin/courses/subcategories",
                },
                {
                    label: "Módulos",
                    href: "/admin/modules",
                },
            ],
        },
        {
            label: "Matrículas y notas",
            children: [
                {
                    label: "Matrículas",
                    href: "/admin/enrollments",
                },
                {
                    label: "Matriculación masiva",
                    href: "/admin/bulk-enrollment",
                },
                {
                    label: "Asistencia Estudiante",
                    href: "/admin/attendance/student",
                },
                {
                    label: "Asistencia Profesor",
                    href: "/admin/attendance/teacher",
                },
                {
                    label: "Calificaciones",
                    href: "/admin/grades",
                },
            ],
        },
        {
            label: "Certificados y MDT",
            children: [
                {
                    label: "Certificados",
                    href: "/admin/certificates",
                },
                {
                    label: "Archivos MDT",
                    href: "/admin/mdt-required-files",
                },
                {
                    label: "Certificados MDT",
                    href: "/admin/mdt-certificados",
                },
            ],
        },
        {
            label: "Administración",
            children: [
                {
                    label: "Reportes",
                    href: "/admin/reports",
                },
                {
                    label: "Políticas de privacidad",
                    href: "/admin/privacy",
                },
            ],
        },
    ],

    teacher: [
        {
            label: "Inicio",
            href: "/teacher",
        },
        {
            label: "Mis cursos",
            href: "/student/courses",
        },
        {
            label: "Evaluación",
            children: [
                {
                    label: "Calificaciones",
                    href: "/teacher/grades",
                },
                {
                    label: "Certificados",
                    href: "/teacher/certificates",
                },
            ],
        },
    ],

    student: [
        {
            label: "Inicio",
            href: "/student",
        },
        {
            label: "Mis cursos",
            href: "/student/courses",
        },
        {
            label: "Catálogo",
            href: "/student/catalog",
        },
        {
            label: "Calendario",
            href: "/student/calendar",
        },
        {
            label: "Certificados",
            href: "/student/certificates",
        },
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

    return userRole ?? "student";
}

export function getTeacherCourseIdFromPathname(
    pathname: string,
): string | null {
    const match =
        pathname.match(
            /^\/teacher\/courses\/(\d+)(?:\/.*)?$/,
        );

    return match?.[1] ?? null;
}

export function getStudentCourseIdFromPathname(
    pathname: string,
): string | null {
    const match =
        pathname.match(
            /^\/student\/courses\/(\d+)(?:\/.*)?$/,
        );

    return match?.[1] ?? null;
}

export function getAdminCourseIdFromPathname(
    pathname: string,
): string | null {
    const courseMatch =
        pathname.match(
            /^\/admin\/courses\/(\d+)(?:\/.*)?$/,
        );

    const modulesMatch =
        pathname.match(
            /^\/admin\/modules\/(\d+)(?:\/.*)?$/,
        );

    return (
        courseMatch?.[1] ??
        modulesMatch?.[1] ??
        null
    );
}

export function getSidebarItemsByRoute(
    userRole: UserRole | undefined,
    pathname: string,
    isTeacherMdtCourse = false,
): SidebarItem[] {
    const effectiveRole =
        getEffectiveRoleByPathname(
            userRole,
            pathname,
        );

    if (effectiveRole === "admin") {
        return sidebarByRole.admin;
    }

    if (effectiveRole === "student") {
        return sidebarByRole.student;
    }

    const courseId =
        getTeacherCourseIdFromPathname(
            pathname,
        );

    if (!courseId) {
        return sidebarByRole.teacher;
    }

    return [
        {
            label: "Mis cursos",
            href: "/student/courses",
        },
        {
            label: "Curso actual",
            href: `/teacher/courses/${courseId}`,
            children: [
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
                {
                    label: "Mi Asistencia",
                    href: `/teacher/courses/${courseId}/my-attendance`,
                },
                {
                    label: "Asistencia Estudiante",
                    href: `/teacher/courses/${courseId}/attendance`,
                },
                ...(isTeacherMdtCourse
                    ? [
                        {
                            label: "Certificados MDT",
                            href: `/teacher/courses/${courseId}/mdt-certificados`,
                        },
                        {
                            label: "Archivos MDT",
                            href: `/teacher/courses/${courseId}/mdt-required-files`,
                        },
                    ]
                    : []),
            ],
        },
    ];
}