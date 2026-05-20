"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
    Award,
    BookOpen,
    CalendarDays,
    ChevronDown,
    ChevronRight,
    CircleHelp,
    FileText,
    GraduationCap,
    Grid2X2,
    Home,
    LayoutDashboard,
    LineChart,
    LogOut,
    Menu,
    Settings,
    ShieldCheck,
    UserCircle,
    UsersRound,
    X,
} from "lucide-react";
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

function getUserFullName(user: unknown) {
    if (!user || typeof user !== "object") return "Usuario";

    const value = user as {
        firstname?: string;
        lastname?: string;
        name?: string;
        username?: string;
        email?: string;
    };

    const fullName = `${value.firstname ?? ""} ${value.lastname ?? ""}`.trim();

    return (
        fullName ||
        value.name ||
        value.username ||
        value.email?.split("@")[0] ||
        "Usuario"
    );
}

function getInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "U";

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function renderSidebarIcon(label: string) {
    const normalizedLabel = label.toLowerCase();
    const className = "h-5 w-5 shrink-0";

    if (normalizedLabel.includes("inicio")) {
        return <Home className={className} />;
    }

    if (normalizedLabel.includes("mis cursos")) {
        return <GraduationCap className={className} />;
    }

    if (normalizedLabel.includes("curso")) {
        return <BookOpen className={className} />;
    }

    if (
        normalizedLabel.includes("catálogo") ||
        normalizedLabel.includes("catalogo")
    ) {
        return <Grid2X2 className={className} />;
    }

    if (normalizedLabel.includes("calendario")) {
        return <CalendarDays className={className} />;
    }

    if (
        normalizedLabel.includes("calificación") ||
        normalizedLabel.includes("calificacion")
    ) {
        return <LineChart className={className} />;
    }

    if (normalizedLabel.includes("certificado")) {
        return <Award className={className} />;
    }

    if (normalizedLabel.includes("usuario")) {
        return <UsersRound className={className} />;
    }

    if (normalizedLabel.includes("admin")) {
        return <ShieldCheck className={className} />;
    }

    if (normalizedLabel.includes("config")) {
        return <Settings className={className} />;
    }

    if (normalizedLabel.includes("reporte")) {
        return <FileText className={className} />;
    }

    return <LayoutDashboard className={className} />;
}

function isActivePath(pathname: string, href?: string | null) {
    if (!href) return false;

    const currentPath = normalizePath(pathname);
    const targetPath = normalizePath(href);

    if (!targetPath) return false;

    if (targetPath === "/student") {
        return currentPath === "/student";
    }

    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function SidebarLink({
    item,
    active,
    onNavigate,
}: {
    item: SidebarItem;
    active: boolean;
    onNavigate?: () => void;
}) {
    const className = `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${active
        ? "bg-white/15 text-white shadow-sm"
        : "text-white/80 hover:bg-white/10 hover:text-white"
        }`;

    if (!item.href) {
        return (
            <div className={className}>
                {renderSidebarIcon(item.label)}
                <span className="truncate">{item.label}</span>
            </div>
        );
    }

    return (
        <Link href={item.href} className={className} onClick={onNavigate}>
            {renderSidebarIcon(item.label)}
            <span className="truncate">{item.label}</span>
        </Link>
    );
}

function SidebarNavigation({
    items,
    pathname,
    onNavigate,
}: {
    items: SidebarItem[];
    pathname: string;
    onNavigate?: () => void;
}) {
    return (
        <nav className="flex-1 space-y-2 px-4 py-4">
            {items.map((item) => {
                const active =
                    isActivePath(pathname, item.href) ||
                    item.children?.some((child) =>
                        isActivePath(pathname, child.href),
                    ) ||
                    false;

                return (
                    <div key={item.label} className="space-y-2">
                        <SidebarLink
                            item={item}
                            active={active}
                            onNavigate={onNavigate}
                        />

                        {item.children && item.children.length > 0 ? (
                            <div className="ml-5 space-y-2 border-l border-white/15 pl-3">
                                {item.children.map((child) => {
                                    const childActive = isActivePath(
                                        pathname,
                                        child.href,
                                    );

                                    if (!child.href) {
                                        return (
                                            <div
                                                key={child.label}
                                                className={`block rounded-xl px-3 py-2 text-sm font-bold transition ${childActive
                                                    ? "bg-white/15 text-white"
                                                    : "text-white/70"
                                                    }`}
                                            >
                                                {child.label}
                                            </div>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={child.label}
                                            href={child.href}
                                            onClick={onNavigate}
                                            className={`block rounded-xl px-3 py-2 text-sm font-bold transition ${childActive
                                                ? "bg-white/15 text-white"
                                                : "text-white/70 hover:bg-white/10 hover:text-white"
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
    );
}

function SidebarUserMenu({
    displayName,
    initials,
    onLogout,
}: {
    displayName: string;
    initials: string;
    onLogout: () => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white/10"
            >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/40 text-sm font-black">
                    {initials}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black">{displayName}</p>
                    <p className="text-xs font-semibold text-white/65">
                        Mi cuenta
                    </p>
                </div>

                <ChevronDown
                    className={`h-4 w-4 shrink-0 text-white/80 transition ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {isOpen ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-2 backdrop-blur">
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white"
                    >
                        <UserCircle className="h-4 w-4" />
                        Mi perfil
                    </Link>

                    <button
                        type="button"
                        onClick={onLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-white/85 transition hover:bg-white/10 hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar sesión
                    </button>
                </div>
            ) : null}
        </div>
    );
}

export function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    if (!user) return null;

   

    const items = getSidebarItemsByRoute(user.role, pathname);
    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);

    function handleLogout() {
        signOut();
        router.replace("/login");
    }

    function closeMobileSidebar() {
        setIsMobileOpen(false);
    }

    return (
        <>
            <div className="fixed left-4 top-4 z-50 md:hidden">
                <button
                    type="button"
                    onClick={() => setIsMobileOpen(true)}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-lg"
                    aria-label="Abrir menú"
                >
                    <Menu className="h-5 w-5" />
                </button>
            </div>

            {isMobileOpen ? (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={closeMobileSidebar}
                        className="absolute inset-0 bg-black/45"
                    />

                    <aside className="relative flex h-full w-[290px] max-w-[85vw] flex-col bg-[var(--primary)] text-[var(--primary-foreground)] shadow-2xl">
                        <div className="flex h-20 items-center justify-between gap-3 px-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <GraduationCap className="h-6 w-6 shrink-0" />
                                <span className="truncate text-lg font-black tracking-wide">
                                    LMS BASICG
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={closeMobileSidebar}
                                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white"
                                aria-label="Cerrar menú"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <SidebarNavigation
                            items={items}
                            pathname={pathname}
                            onNavigate={closeMobileSidebar}
                        />

                        <div className="space-y-5 border-t border-white/15 p-5">
                            <Link
                                href="#"
                                onClick={closeMobileSidebar}
                                className="flex items-center gap-4 rounded-2xl px-2 py-2 text-sm font-bold text-white/85 transition hover:text-white"
                            >
                                <CircleHelp className="h-5 w-5 shrink-0" />
                                <span>Ayuda y soporte</span>
                            </Link>

                            <SidebarUserMenu
                                displayName={displayName}
                                initials={initials}
                                onLogout={handleLogout}
                            />
                        </div>
                    </aside>
                </div>
            ) : null}

            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] shrink-0 overflow-y-auto bg-[var(--primary)] text-[var(--primary-foreground)] md:flex md:flex-col">
                <div className="flex h-20 items-center gap-3 px-7">
                    <GraduationCap className="h-6 w-6 shrink-0" />

                    <span className="truncate text-xl font-black tracking-wide">
                        LMS BASICG
                    </span>
                </div>

                <SidebarNavigation items={items} pathname={pathname} />

                <div className="space-y-5 border-t border-white/15 p-5">
                    <Link
                        href="#"
                        className="flex items-center gap-4 rounded-2xl px-2 py-2 text-sm font-bold text-white/85 transition hover:text-white"
                    >
                        <CircleHelp className="h-5 w-5 shrink-0" />
                        <span>Ayuda y soporte</span>
                    </Link>

                    <SidebarUserMenu
                        displayName={displayName}
                        initials={initials}
                        onLogout={handleLogout}
                    />
                </div>
            </aside>
        </>
    );
}