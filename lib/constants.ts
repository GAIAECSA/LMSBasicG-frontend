import type { UserRole } from "@/types/auth";

export interface SidebarItem {
    label: string;
    href?: string;
    children?: SidebarItem[];
    businessModuleKey?: string;
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
               /*  {
                    label: "Módulos",
                    href: "/admin/modules",
                }, */
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
                    businessModuleKey: "mdt",
                },
                {
                    label: "Asistencia Profesor",
                    href: "/admin/attendance/teacher",
                    businessModuleKey: "mdt",
                },
                {
                    label: "Calificaciones",
                    href: "/admin/grades",
                },
            ],
        },
        /* {
            label: "Certificados y MDT",
            children: [
                {
                    label: "Certificados",
                    href: "/admin/certificates",
                },
                {
                    label: "Archivos MDT",
                    href: "/admin/mdt-required-files",
                    businessModuleKey: "mdt",
                },
                {
                    label: "Certificados MDT",
                    href: "/admin/mdt-certificados",
                    businessModuleKey: "mdt",
                },
                {
                    label: "Evidencia MDT",
                    href: "/admin/mdt-evidence",
                    businessModuleKey: "mdt",
                },
            ],
        }, */

        /*
        {
            label: "Clases en vivo",
            href: "/admin/live-classes",
        },
        */

        {
            label: "Administración",
            children: [
                {
                    label: "Reportes",
                    href: "/admin/reports",
                    businessModuleKey: "mdt",
                },
                /* {
                    label: "Formularios",
                    href: "/admin/forms",
                }, */
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

        /*
        {
            label: "Clases en vivo",
            href: "/teacher/live-classes",
        },
        */

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

        /*
        {
            label: "Clases en vivo",
            href: "/student/live-classes",
        },
        */

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


/* =====================================================
   ROL EFECTIVO SEGÚN RUTA
===================================================== */

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


/* =====================================================
   COURSE ID - DOCENTE
===================================================== */

export function getTeacherCourseIdFromPathname(
    pathname: string,
): string | null {
    const courseMatch =
        pathname.match(
            /^\/teacher\/courses\/(\d+)(?:\/.*)?$/,
        );

    const liveClassesMatch =
        pathname.match(
            /^\/teacher\/live-classes\/(\d+)(?:\/.*)?$/,
        );

    return (
        courseMatch?.[1] ??
        liveClassesMatch?.[1] ??
        null
    );
}


/* =====================================================
   COURSE ID - ESTUDIANTE
===================================================== */

export function getStudentCourseIdFromPathname(
    pathname: string,
): string | null {
    const courseMatch =
        pathname.match(
            /^\/student\/courses\/(\d+)(?:\/.*)?$/,
        );

    const liveClassesMatch =
        pathname.match(
            /^\/student\/live-classes\/(\d+)(?:\/.*)?$/,
        );

    return (
        courseMatch?.[1] ??
        liveClassesMatch?.[1] ??
        null
    );
}


/* =====================================================
   COURSE ID - ADMINISTRADOR
===================================================== */

export function getAdminCourseIdFromPathname(
    pathname: string,
): string | null {
    /*
     * /admin/courses/3
     * /admin/courses/3/grades
     * /admin/courses/3/certificates
     * /admin/courses/3/attendance
     * etc.
     */
    const courseMatch =
        pathname.match(
            /^\/admin\/courses\/(\d+)(?:\/.*)?$/,
        );

    /*
     * /admin/modules/3
     * /admin/modules/3/items/...
     */
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


/* =====================================================
   SIDEBAR SEGÚN RUTA
===================================================== */

export function getSidebarItemsByRoute(
    userRole: UserRole | undefined,
    pathname: string,
    isTeacherMdtCourse = false,
): SidebarItem[] {
    /*
     * ADMIN dentro del editor de módulos.
     */
    if (userRole === "admin") {
        const adminCourseId =
            getAdminCourseIdFromPathname(pathname);

        if (adminCourseId) {
            return [
                {
                    label: "Volver a administración",
                    href: "/admin/courses",
                },
                {
                    label: "Curso actual",
                    href: `/admin/modules/${adminCourseId}`,
                    children: [
                        {
                            label: "Módulos",
                            href: `/admin/modules/${adminCourseId}`,
                        },
                        {
                            label: "Calificaciones",
                            href: `/teacher/courses/${adminCourseId}/grades`,
                        },
                        {
                            label: "Certificados",
                            href: `/teacher/courses/${adminCourseId}/certificates`,
                        },
                        {
                            label: "Mi Asistencia",
                            href: `/teacher/courses/${adminCourseId}/my-attendance`,
                            businessModuleKey: "mdt",
                        },
                        {
                            label: "Asistencia Estudiante",
                            href: `/teacher/courses/${adminCourseId}/attendance`,
                            businessModuleKey: "mdt",
                        },
                        {
                            label: "Archivos MDT",
                            href: `/teacher/courses/${adminCourseId}/mdt-required-files`,
                            businessModuleKey: "mdt",
                        },
                        {
                            label: "Evidencia MDT",
                            href: `/teacher/courses/${adminCourseId}/evidence`,
                            businessModuleKey: "mdt",
                        },
                        ...(isTeacherMdtCourse
                            ? [
                                {
                                    label: "Certificados MDT",
                                    href: `/teacher/courses/${adminCourseId}/mdt-certificados`,
                                    businessModuleKey: "mdt",
                                },
                            ]
                            : []),
                    ],
                },
            ];
        }
    }

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

    /*
     * Importante:
     * aunque pathname sea /teacher/..., el usuario real
     * puede seguir siendo ADMIN.
     */
    const isAdminViewingCourse =
        userRole === "admin";

    return [
        {
            label: isAdminViewingCourse
                ? "Volver a administración"
                : "Mis cursos",

            href: isAdminViewingCourse
                ? "/admin/courses"
                : "/student/courses",
        },

        {
            label: "Curso actual",
            href: isAdminViewingCourse
                ? `/admin/modules/${courseId}`
                : `/teacher/courses/${courseId}`,

            children: [
                {
                    label: "Módulos",
                    href: isAdminViewingCourse
                        ? `/admin/modules/${courseId}`
                        : `/teacher/courses/${courseId}/modules`,
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
                    businessModuleKey: "mdt",
                },
                {
                    label: "Asistencia Estudiante",
                    href: `/teacher/courses/${courseId}/attendance`,
                    businessModuleKey: "mdt",
                },
                {
                    label: "Archivos MDT",
                    href: `/teacher/courses/${courseId}/mdt-required-files`,
                    businessModuleKey: "mdt",
                },
                {
                    label: "Evidencia MDT",
                    href: `/teacher/courses/${courseId}/evidence`,
                    businessModuleKey: "mdt",
                },

                ...(isTeacherMdtCourse
                    ? [
                        {
                            label: "Certificados MDT",
                            href: `/teacher/courses/${courseId}/mdt-certificados`,
                            businessModuleKey: "mdt",
                        },
                    ]
                    : []),
            ],
        },
    ];
}