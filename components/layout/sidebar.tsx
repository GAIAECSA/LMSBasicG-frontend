"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSidebarItemsByRoute, type SidebarItem } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

function normalizePath(path?: string | null): string {
    if (!path) return "";
    if (path === "/") return "/";
    return path.replace(/\/+$/, "");
}

function getPathSegments(path?: string | null): string[] {
    const normalized = normalizePath(path);

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

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();

    if (!user) return null;

    /**
     * Oculta el sidebar solo en:
     * /student/courses/[courseId]
     *
     * No lo oculta en:
     * /student/courses
     */
    if (isStudentCourseWorkspace(pathname)) {
        return null;
    }

    const items = getSidebarItemsByRoute(user.role, pathname);

    const isItemActive = (item: SidebarItem) => {
        if (!item.href) return false;

        return normalizePath(pathname) === normalizePath(item.href);
    };

    const isChildActive = (child: SidebarItem) => {
        if (!child.href) return false;

        return normalizePath(pathname) === normalizePath(child.href);
    };

    return (
        <aside className="border-b border-[var(--border)] bg-white md:min-h-screen md:border-b-0 md:border-r">
            <div className="flex h-full flex-col p-4">
                <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                        LMS BasicG
                    </p>

                    <h2 className="mt-2 text-lg font-bold">
                        Panel de control
                    </h2>
                </div>

                <nav className="flex flex-col gap-2">
                    {items.map((item) => {
                        const active = isItemActive(item);

                        return (
                            <div key={item.label} className="space-y-2">
                                {item.href ? (
                                    <Link
                                        href={item.href}
                                        className={`block rounded-xl px-4 py-3 text-sm font-medium transition-all ${active
                                                ? "bg-[var(--primary)] text-white shadow-sm"
                                                : "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]"
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <div
                                        className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${active
                                                ? "bg-[var(--primary)] text-white shadow-sm"
                                                : "bg-transparent text-[var(--foreground)]"
                                            }`}
                                    >
                                        {item.label}
                                    </div>
                                )}

                                {item.children && item.children.length > 0 ? (
                                    <div className="ml-4 flex flex-col gap-2 border-l border-[var(--border)] pl-3">
                                        {item.children.map((child) => {
                                            const childActive =
                                                isChildActive(child);

                                            return (
                                                <Link
                                                    key={child.label}
                                                    href={child.href!}
                                                    className={`rounded-lg px-3 py-2 text-sm transition-all ${childActive
                                                            ? "bg-[var(--primary)]/10 font-semibold text-[var(--primary)]"
                                                            : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                                                        }`}
                                                >
                                                    {child.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}