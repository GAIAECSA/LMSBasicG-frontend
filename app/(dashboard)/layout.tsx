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

function isStudentCourseWorkspace(pathname: string) {
    const segments = getPathSegments(pathname);

    return (
        segments.length === 3 &&
        segments[0] === "student" &&
        segments[1] === "courses" &&
        !!segments[2]
    );
}

function getRoleLabel(role?: string) {
    if (role === "admin") return "Admin";
    if (role === "teacher") return "Profesor";
    if (role === "student") return "Estudiante";

    return "Usuario";
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();

    const hideSidebar = isStudentCourseWorkspace(pathname);

    function handleLogout() {
        localStorage.removeItem("lmsbasicg_auth");
        router.push("/login");
    }

    return (
        <div
            className={
                hideSidebar
                    ? "min-h-screen bg-slate-100"
                    : "grid min-h-screen bg-slate-100 md:grid-cols-[240px_1fr]"
            }
        >
            {!hideSidebar ? <Sidebar /> : null}

            <div className="flex min-w-0 flex-col">
                {!hideSidebar ? (
                    <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white px-5 md:px-6">
                        <div>
                            <p className="text-sm text-slate-500">
                                Bienvenido
                            </p>

                            <h1 className="text-lg font-black text-slate-950">
                                {user?.fullName || "Usuario"}
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                                Rol:{" "}
                                <span className="font-bold">
                                    {getRoleLabel(user?.role)}
                                </span>
                            </span>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-sm font-semibold text-slate-700 transition hover:text-blue-700"
                            >
                                Cerrar sesión
                            </button>
                        </div>
                    </header>
                ) : null}

                <main
                    className={
                        hideSidebar
                            ? "min-h-screen w-full bg-slate-100 px-4 py-4 md:px-6"
                            : "min-h-[calc(100vh-72px)] w-full bg-slate-100 p-5 md:p-6"
                    }
                >
                    {children}
                </main>
            </div>
        </div>
    );
}