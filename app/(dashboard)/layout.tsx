"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/useAuth";

type DashboardLayoutProps = {
    children: React.ReactNode;
};

function getPathSegments(path?: string | null): string[] {
    if (!path) return [];

    const normalized = path === "/" ? "/" : path.replace(/\/+$/, "");

    if (!normalized || normalized === "/") return [];

    return normalized.split("/").filter(Boolean);
}

function isStudentRoute(pathname: string) {
    const segments = getPathSegments(pathname);

    return segments[0] === "student";
}

function getRoleLabel(role?: string) {
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

    const studentRoute = isStudentRoute(pathname);

    /*
     * El sidebar se mantiene visible también en:
     * /student/courses/[courseId]
     */
    const hideSidebar = false;

    /*
     * El header superior se oculta solo en estudiante.
     * Admin y docente mantienen header.
     */
    const hideHeader = studentRoute;

    function handleLogout() {
        if (typeof signOut === "function") {
            signOut();
        } else {
            localStorage.removeItem("lmsbasicg_auth");
        }

        router.push("/login");
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            {!hideSidebar ? <Sidebar /> : null}

            <div className="min-h-screen w-full md:pl-[280px]">
                {!hideHeader ? (
                    <header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-5 md:px-6">
                        <div>
                            <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                                Bienvenido
                            </p>

                            <h1 className="text-lg font-black text-[var(--foreground)]">
                                {getUserFullName(user)}
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="rounded-2xl bg-[var(--muted)] px-4 py-2 text-sm text-[var(--muted-foreground)]">
                                Rol:{" "}
                                <span className="font-bold text-[var(--foreground)]">
                                    {getRoleLabel(user?.role)}
                                </span>
                            </span>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-sm font-semibold text-[var(--muted-foreground)] transition hover:text-[var(--primary)]"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </header>
                ) : null}

                <main
                    className={
                        hideHeader
                            ? "min-h-screen w-full bg-[var(--background)]"
                            : "min-h-[calc(100vh-72px)] w-full bg-[var(--background)] p-5 md:p-6"
                    }
                >
                    {children}
                </main>
            </div>
        </div>
    );
}