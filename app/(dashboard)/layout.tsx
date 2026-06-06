"use client";

import {
    useEffect,
    useState,
    type ReactNode,
} from "react";
import {
    usePathname,
    useRouter,
} from "next/navigation";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth";

type DashboardLayoutProps = {
    children: ReactNode;
};

function getPathSegments(
    path?: string | null,
): string[] {
    if (!path) return [];

    const normalized =
        path === "/"
            ? "/"
            : path.replace(/\/+$/, "");

    if (!normalized || normalized === "/") {
        return [];
    }

    return normalized
        .split("/")
        .filter(Boolean);
}

function getRouteRole(
    pathname: string,
): UserRole | null {
    const segments =
        getPathSegments(pathname);

    if (segments[0] === "admin") {
        return "admin";
    }

    if (segments[0] === "teacher") {
        return "teacher";
    }

    if (segments[0] === "student") {
        return "student";
    }

    return null;
}

function getEffectiveRoleByPathname(
    userRole: UserRole | string | undefined,
    pathname: string,
): UserRole {
    const routeRole =
        getRouteRole(pathname);

    if (routeRole) {
        return routeRole;
    }

    if (
        userRole === "admin" ||
        userRole === "teacher" ||
        userRole === "student"
    ) {
        return userRole;
    }

    return "student";
}

function getRoleLabel(
    role?: UserRole | string,
) {
    if (role === "admin") {
        return "Admin";
    }

    if (role === "teacher") {
        return "Profesor";
    }

    if (role === "student") {
        return "Estudiante";
    }

    return "Usuario";
}

function getUserFullName(user: unknown) {
    if (
        !user ||
        typeof user !== "object"
    ) {
        return "Usuario";
    }

    const value = user as {
        firstname?: string;
        lastname?: string;
        fullName?: string;
        name?: string;
        username?: string;
        email?: string;
    };

    const fullName =
        `${value.firstname ?? ""} ${value.lastname ?? ""}`.trim();

    return (
        value.fullName ||
        fullName ||
        value.name ||
        value.username ||
        value.email?.split("@")[0] ||
        "Usuario"
    );
}

export default function DashboardLayout({
    children,
}: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();

    const {
        user,
        signOut,
    } = useAuth();

    const [
        sidebarCollapsed,
        setSidebarCollapsed,
    ] = useState(false);

    /*
     * Tablet:
     * Entre 768px y 1023px, el sidebar se contrae
     * automáticamente para dejar mayor espacio al contenido.
     *
     * Laptop y monitor:
     * Desde 1024px, vuelve a mostrarse expandido.
     *
     * Celular:
     * El sidebar se oculta y utiliza su panel lateral móvil.
     */
    useEffect(() => {
        const tabletMediaQuery =
            window.matchMedia(
                "(min-width: 768px) and (max-width: 1023px)",
            );

        function syncSidebarWithViewport(
            event?:
                | MediaQueryListEvent
                | MediaQueryList,
        ) {
            setSidebarCollapsed(
                event?.matches ??
                tabletMediaQuery.matches,
            );
        }

        syncSidebarWithViewport(
            tabletMediaQuery,
        );

        tabletMediaQuery.addEventListener(
            "change",
            syncSidebarWithViewport,
        );

        return () => {
            tabletMediaQuery.removeEventListener(
                "change",
                syncSidebarWithViewport,
            );
        };
    }, []);

    const routeRole =
        getRouteRole(pathname);

    const effectiveRole =
        getEffectiveRoleByPathname(
            user?.role,
            pathname,
        );

    const isAdmin =
        effectiveRole === "admin";

    const isStudentRoute =
        routeRole === "student";

    const isTeacherRoute =
        routeRole === "teacher";

    const isProfileRoute =
        pathname === "/profile";

    const isHelpRoute =
        pathname === "/help";

    /*
     * Sidebar:
     * Se mantiene disponible para todos los roles.
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
        !isAdmin &&
        (
            isStudentRoute ||
            isTeacherRoute ||
            isProfileRoute ||
            isHelpRoute
        );

    function handleLogout() {
        if (
            typeof signOut === "function"
        ) {
            signOut();
        } else if (
            typeof window !== "undefined"
        ) {
            localStorage.removeItem(
                "lmsbasicg_auth",
            );
        }

        router.replace("/login");
    }

    function getMainClassName() {
        if (hideHeader) {
            return [
                "min-h-[100dvh]",
                "w-full",
                "min-w-0",
                "overflow-x-hidden",
                "bg-[var(--background)]",
            ].join(" ");
        }

        return [
            "min-h-[calc(100dvh-68px)]",
            "w-full",
            "min-w-0",
            "overflow-x-hidden",
            "bg-[var(--background)]",
            "p-3",
            "sm:p-4",
            "md:min-h-[calc(100dvh-72px)]",
            "md:p-5",
            "lg:p-6",
        ].join(" ");
    }

    /*
     * Debe coincidir exactamente con los anchos
     * definidos dentro de sidebar.tsx:
     *
     * Contraído: 76px
     * Expandido: 248px
     */
    const contentPaddingClass =
        hideSidebar
            ? ""
            : sidebarCollapsed
                ? "md:pl-[76px]"
                : "md:pl-[248px]";

    return (
        <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
            {!hideSidebar ? (
                <Sidebar
                    collapsed={
                        sidebarCollapsed
                    }
                    onToggleCollapsed={() => {
                        setSidebarCollapsed(
                            (current) =>
                                !current,
                        );
                    }}
                />
            ) : null}

            <div
                className={`min-h-[100dvh] w-full min-w-0 transition-[padding] duration-300 ease-in-out ${contentPaddingClass}`}
            >
                {!hideHeader ? (
                    <Header
                        displayName={
                            getUserFullName(
                                user,
                            )
                        }
                        roleLabel={
                            getRoleLabel(
                                effectiveRole,
                            )
                        }
                        onLogout={
                            handleLogout
                        }
                    />
                ) : null}

                <main
                    className={
                        getMainClassName()
                    }
                >
                    {children}
                </main>
            </div>
        </div>
    );
}