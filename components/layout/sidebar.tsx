"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
    Award,
    BookOpen,
    CalendarDays,
    ChevronDown,
    ChevronLeft,
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

type SidebarProps = {
    collapsed?: boolean;
    onToggleCollapsed?: () => void;
};

function normalizePath(path?: string | null): string {
    if (!path) return "";
    if (path === "/") return "/";
    return path.replace(/\/+$/, "");
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
    const className = "h-[18px] w-[18px] shrink-0";

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

    if (
        normalizedLabel.includes("usuario") ||
        normalizedLabel.includes("docente") ||
        normalizedLabel.includes("estudiante")
    ) {
        return <UsersRound className={className} />;
    }

    if (
        normalizedLabel.includes("admin") ||
        normalizedLabel.includes("política") ||
        normalizedLabel.includes("politica")
    ) {
        return <ShieldCheck className={className} />;
    }

    if (
        normalizedLabel.includes("config") ||
        normalizedLabel.includes("mdt") ||
        normalizedLabel.includes("archivo")
    ) {
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

    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function hasActiveChild(item: SidebarItem, pathname: string) {
    return (
        item.children?.some((child) => {
            return (
                isActivePath(pathname, child.href) ||
                child.children?.some((subChild) =>
                    isActivePath(pathname, subChild.href),
                )
            );
        }) ?? false
    );
}

function SidebarLink({
    item,
    active,
    collapsed,
    onNavigate,
}: {
    item: SidebarItem;
    active: boolean;
    collapsed: boolean;
    onNavigate?: () => void;
}) {
    const className = `group flex min-h-[42px] items-center gap-3 rounded-xl text-[13px] font-bold transition ${collapsed ? "justify-center px-0 py-2.5" : "px-3.5 py-2.5"
        } ${active
            ? "bg-white/18 text-white shadow-sm ring-1 ring-white/12"
            : "text-white/78 hover:bg-white/10 hover:text-white"
        }`;

    if (!item.href) {
        return (
            <div className={className} title={collapsed ? item.label : undefined}>
                {renderSidebarIcon(item.label)}

                {!collapsed ? (
                    <span className="truncate">{item.label}</span>
                ) : null}
            </div>
        );
    }

    return (
        <Link
            href={item.href}
            className={className}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
        >
            {renderSidebarIcon(item.label)}

            {!collapsed ? (
                <span className="truncate">{item.label}</span>
            ) : null}
        </Link>
    );
}

function SidebarNavigation({
    items,
    pathname,
    collapsed,
    onNavigate,
    onExpandFromCollapsed,
}: {
    items: SidebarItem[];
    pathname: string;
    collapsed: boolean;
    onNavigate?: () => void;
    onExpandFromCollapsed?: (label: string) => void;
}) {
    const activeGroupLabel =
        items.find((item) => {
            const hasChildren = !!item.children?.length;

            if (!hasChildren) return false;

            return (
                isActivePath(pathname, item.href) ||
                hasActiveChild(item, pathname)
            );
        })?.label ?? null;

    const [menuState, setMenuState] = useState<{
        pathname: string;
        openLabel: string | null;
    }>({
        pathname: "",
        openLabel: null,
    });

    const openLabel =
        menuState.pathname === pathname ? menuState.openLabel : activeGroupLabel;

    function toggleGroup(label: string) {
        setMenuState((current) => {
            const currentOpenLabel =
                current.pathname === pathname ? current.openLabel : activeGroupLabel;

            return {
                pathname,
                openLabel: currentOpenLabel === label ? null : label,
            };
        });
    }

    function openGroupFromCollapsed(label: string) {
        setMenuState({
            pathname,
            openLabel: label,
        });

        onExpandFromCollapsed?.(label);
    }

    return (
        <nav
            className={`min-h-0 flex-1 space-y-1 overflow-y-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${collapsed ? "px-2" : "px-3"
                }`}
        >
            {items.map((item) => {
                const hasChildren = !!item.children?.length;
                const active =
                    isActivePath(pathname, item.href) ||
                    hasActiveChild(item, pathname);

                const isOpen = openLabel === item.label;

                if (!hasChildren) {
                    return (
                        <SidebarLink
                            key={item.label}
                            item={item}
                            active={active}
                            collapsed={collapsed}
                            onNavigate={onNavigate}
                        />
                    );
                }

                return (
                    <div key={item.label} className="space-y-1">
                        <button
                            type="button"
                            onClick={() => {
                                if (collapsed) {
                                    openGroupFromCollapsed(item.label);
                                    return;
                                }

                                toggleGroup(item.label);
                            }}
                            className={`group flex min-h-[42px] w-full items-center gap-3 rounded-xl text-left text-[13px] font-bold transition ${collapsed ? "justify-center px-0 py-2.5" : "px-3.5 py-2.5"
                                } ${active || isOpen
                                    ? "bg-white/18 text-white shadow-sm ring-1 ring-white/12"
                                    : "text-white/78 hover:bg-white/10 hover:text-white"
                                }`}
                            aria-expanded={isOpen}
                            title={collapsed ? item.label : undefined}
                        >
                            {renderSidebarIcon(item.label)}

                            {!collapsed ? (
                                <>
                                    <span className="min-w-0 flex-1 truncate">
                                        {item.label}
                                    </span>

                                    <ChevronDown
                                        className={`h-4 w-4 shrink-0 transition ${isOpen ? "rotate-180" : ""
                                            }`}
                                    />
                                </>
                            ) : null}
                        </button>

                        {isOpen && !collapsed ? (
                            <div className="ml-5 mt-1 space-y-1 border-l border-white/15 pl-2">
                                {item.children?.map((child) => {
                                    const childActive =
                                        isActivePath(pathname, child.href) ||
                                        hasActiveChild(child, pathname);

                                    if (!child.href) {
                                        return (
                                            <div
                                                key={child.label}
                                                className={`flex min-h-[34px] items-center rounded-xl px-3 text-[12px] font-bold transition ${childActive
                                                    ? "bg-white/18 text-white"
                                                    : "text-white/65"
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
                                            className={`flex min-h-[34px] items-center rounded-xl px-3 text-[12px] font-bold transition ${childActive
                                                ? "bg-white/18 text-white"
                                                : "text-white/65 hover:bg-white/10 hover:text-white"
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
    collapsed,
    onLogout,
    onNavigate,
}: {
    displayName: string;
    initials: string;
    collapsed: boolean;
    onLogout: () => void;
    onNavigate?: () => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({
        top: 0,
        left: 0,
    });

    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    function updateMenuPosition() {
        const button = buttonRef.current;

        if (!button) return;

        const rect = button.getBoundingClientRect();

        const menuWidth = 220;
        const menuHeight = 120;
        const safeGap = 8;

        let left = rect.right + 12;
        let top = rect.top;

        if (left + menuWidth > window.innerWidth - safeGap) {
            left = rect.left - menuWidth - 12;
        }

        if (top + menuHeight > window.innerHeight - safeGap) {
            top = window.innerHeight - menuHeight - safeGap;
        }

        if (top < safeGap) {
            top = safeGap;
        }

        setPosition({
            top,
            left,
        });
    }

    function handleToggleMenu() {
        setIsOpen((current) => {
            const nextValue = !current;

            if (nextValue) {
                requestAnimationFrame(updateMenuPosition);
            }

            return nextValue;
        });
    }

    function handleCloseMenu() {
        setIsOpen(false);
        onNavigate?.();
    }

    function handleLogoutClick() {
        setIsOpen(false);
        onLogout();
    }

    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;

            const clickedButton = buttonRef.current?.contains(target);
            const clickedMenu = menuRef.current?.contains(target);

            if (!clickedButton && !clickedMenu) {
                setIsOpen(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        updateMenuPosition();

        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggleMenu}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                title={collapsed ? displayName : undefined}
                className={`flex w-full items-center rounded-2xl border text-left transition ${collapsed ? "justify-center p-1.5" : "gap-2.5 p-2"
                    } ${isOpen
                        ? "border-white/35 bg-white/16 shadow-sm"
                        : "border-white/15 bg-white/10 hover:bg-white/15"
                    }`}
            >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/12 text-[13px] font-black text-white">
                    {initials}
                </div>

                {!collapsed ? (
                    <>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-black text-white">
                                {displayName}
                            </p>
                            <p className="truncate text-[11px] font-semibold text-white/60">
                                Mi cuenta
                            </p>
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white">
                            {isOpen ? (
                                <ChevronLeft className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </div>
                    </>
                ) : null}
            </button>

            {isOpen ? (
                <div
                    ref={menuRef}
                    role="menu"
                    className="fixed z-[9999] w-[220px] rounded-3xl border border-white/20 bg-[#07499a] p-2 text-white shadow-2xl shadow-slate-950/35"
                    style={{
                        top: position.top,
                        left: position.left,
                    }}
                >
                    <Link
                        href="/profile"
                        onClick={handleCloseMenu}
                        className="flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-black text-white/90 transition hover:bg-white/10 hover:text-white"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                            <UserCircle className="h-4 w-4" />
                        </span>

                        <span>Mi perfil</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="mt-2 flex h-11 w-full items-center gap-3 rounded-2xl bg-red-600 px-3 text-left text-sm font-black text-white shadow-sm transition hover:cursor-pointer hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
                            <LogOut className="h-4 w-4" />
                        </span>

                        <span>Cerrar sesión</span>
                    </button>
                </div>
            ) : null}
        </div>
    );
}

function AthenaSidebarLogo({ collapsed }: { collapsed: boolean }) {
    return (
        <div
            className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-3"
                }`}
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/18">
                <GraduationCap className="h-6 w-6 text-white" strokeWidth={2.4} />
            </div>

            {!collapsed ? (
                <div className="min-w-0">
                    <p className="truncate text-lg font-black leading-none tracking-wide text-white">
                        GAIA
                    </p>
                    <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">
                        BY ATHENA
                    </p>
                </div>
            ) : null}
        </div>
    );
}

export function Sidebar({
    collapsed = false,
    onToggleCollapsed,
}: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        if (!isMobileOpen) return;

        const originalOverflow = document.body.style.overflow;

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsMobileOpen(false);
            }
        }

        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = originalOverflow;
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isMobileOpen]);

    if (!user) return null;

    const items = getSidebarItemsByRoute(user.role, pathname);
    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);

    function handleToggleCollapsed() {
        onToggleCollapsed?.();
    }

    function handleLogout() {
        signOut();
        router.replace("/login");
    }

    function closeMobileSidebar() {
        setIsMobileOpen(false);
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#07499a] text-white shadow-lg md:hidden"
                aria-label="Abrir menú"
            >
                <Menu className="h-5 w-5" />
            </button>

            {isMobileOpen ? (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={closeMobileSidebar}
                        className="absolute inset-0 bg-black/45"
                    />

                    <aside className="fixed left-0 top-0 z-50 flex h-dvh w-[268px] flex-col overflow-hidden bg-[#07499a] text-white shadow-2xl">
                        <div className="flex h-16 items-center justify-between gap-3 px-4">
                            <AthenaSidebarLogo collapsed={false} />

                            <button
                                type="button"
                                onClick={closeMobileSidebar}
                                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
                                aria-label="Cerrar menú"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <SidebarNavigation
                            items={items}
                            pathname={pathname}
                            collapsed={false}
                            onNavigate={closeMobileSidebar}
                        />

                        <div className="space-y-3 border-t border-white/12 p-3">
                            <Link
                                href="/help"
                                onClick={closeMobileSidebar}
                                className="flex min-h-[42px] items-center gap-3 rounded-xl px-3 text-[13px] font-bold text-white/78 transition hover:bg-white/10 hover:text-white"
                            >
                                <CircleHelp className="h-[18px] w-[18px] shrink-0" />
                                <span>Ayuda y soporte</span>
                            </Link>

                            <SidebarUserMenu
                                displayName={displayName}
                                initials={initials}
                                collapsed={false}
                                onLogout={handleLogout}
                                onNavigate={closeMobileSidebar}
                            />
                        </div>
                    </aside>
                </div>
            ) : null}

            <aside
                className={`fixed left-0 top-0 z-40 hidden h-dvh shrink-0 flex-col overflow-hidden bg-[#07499a] text-white shadow-2xl transition-[width] duration-300 md:flex ${collapsed ? "w-[76px]" : "w-[248px]"
                    }`}
            >
                <div
                    className={`flex h-16 items-center gap-3 ${collapsed ? "justify-center px-2" : "justify-between px-4"
                        }`}
                >
                    <AthenaSidebarLogo collapsed={collapsed} />

                    {!collapsed ? (
                        <button
                            type="button"
                            onClick={handleToggleCollapsed}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
                            aria-label="Contraer menú"
                            title="Contraer menú"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>

                {collapsed ? (
                    <div className="px-2 pb-2">
                        <button
                            type="button"
                            onClick={handleToggleCollapsed}
                            className="flex h-10 w-full items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
                            aria-label="Expandir menú"
                            title="Expandir menú"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                ) : null}

                <SidebarNavigation
                    items={items}
                    pathname={pathname}
                    collapsed={collapsed}
                    onExpandFromCollapsed={() => {
                        if (collapsed) {
                            handleToggleCollapsed();
                        }
                    }}
                />

                <div
                    className={`space-y-3 border-t border-white/12 ${collapsed ? "p-2" : "p-3"
                        }`}
                >
                    <Link
                        href="/help"
                        title={collapsed ? "Ayuda y soporte" : undefined}
                        className={`flex min-h-[42px] items-center rounded-xl text-[13px] font-bold text-white/78 transition hover:bg-white/10 hover:text-white ${collapsed ? "justify-center px-0" : "gap-3 px-3"
                            }`}
                    >
                        <CircleHelp className="h-[18px] w-[18px] shrink-0" />

                        {!collapsed ? <span>Ayuda y soporte</span> : null}
                    </Link>

                    <SidebarUserMenu
                        displayName={displayName}
                        initials={initials}
                        collapsed={collapsed}
                        onLogout={handleLogout}
                    />
                </div>
            </aside>
        </>
    );
}