"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type OpenGroupState = {
    pathname: string;
    openLabel: string | null;
};

const DASHBOARD_HOME_PATHS = ["/admin", "/teacher", "/student"];

function normalizePath(path?: string | null): string {
    if (!path) return "";
    if (path === "/") return "/";

    return path.replace(/\/+$/, "");
}

function isDashboardHomePath(pathname: string) {
    return DASHBOARD_HOME_PATHS.includes(normalizePath(pathname));
}

function getUserFullName(user: unknown) {
    if (!user || typeof user !== "object") {
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
    const className =
        "h-[18px] w-[18px] shrink-0 [@media(max-height:760px)]:h-4 [@media(max-height:760px)]:w-4";

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

/*
 * Verifica si una ruta puede corresponder a un enlace.
 * Los inicios de cada rol solo coinciden de forma exacta.
 */
function isRouteMatch(pathname: string, href?: string | null) {
    if (!href) return false;

    const currentPath = normalizePath(pathname);
    const targetPath = normalizePath(href);

    if (!targetPath) return false;

    if (DASHBOARD_HOME_PATHS.includes(targetPath)) {
        return currentPath === targetPath;
    }

    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

/*
 * Selecciona únicamente la coincidencia más específica.
 * Ejemplo:
 * /admin/courses/subcategories coincide con /admin/courses y también
 * con /admin/courses/subcategories. Se elige la segunda por ser más larga.
 */
function findBestMatchingHref(
    items: SidebarItem[],
    pathname: string,
): string | null {
    const matches: string[] = [];

    function visit(entries: SidebarItem[]) {
        for (const item of entries) {
            if (item.href && isRouteMatch(pathname, item.href)) {
                matches.push(normalizePath(item.href));
            }

            if (item.children?.length) {
                visit(item.children);
            }
        }
    }

    visit(items);

    if (matches.length === 0) return null;

    return matches.sort((first, second) => {
        return second.length - first.length;
    })[0];
}

function containsActiveHref(
    item: SidebarItem,
    activeHref: string | null,
): boolean {
    if (!activeHref) return false;

    if (normalizePath(item.href) === activeHref) {
        return true;
    }

    return (
        item.children?.some((child) => containsActiveHref(child, activeHref)) ??
        false
    );
}

function isDashboardHomeItem(item: SidebarItem) {
    return DASHBOARD_HOME_PATHS.includes(normalizePath(item.href));
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
    const className = `
        group flex min-h-[42px] items-center gap-3 rounded-xl
        text-[13px] font-bold transition-colors duration-150
        [@media(max-height:760px)]:min-h-[36px]
        [@media(max-height:760px)]:text-xs
        ${collapsed
            ? "justify-center px-0 py-2.5 [@media(max-height:760px)]:py-2"
            : "px-3.5 py-2.5 [@media(max-height:760px)]:px-3 [@media(max-height:760px)]:py-2"
        }
        ${active
            ? "bg-white/18 text-white shadow-sm ring-1 ring-white/12"
            : "text-white/78 hover:bg-white/10 hover:text-white"
        }
    `;

    if (!item.href) {
        return (
            <div className={className} title={collapsed ? item.label : undefined}>
                {renderSidebarIcon(item.label)}

                {!collapsed ? <span className="truncate">{item.label}</span> : null}
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

            {!collapsed ? <span className="truncate">{item.label}</span> : null}
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
    const isDashboardHome = isDashboardHomePath(pathname);

    const activeHref = useMemo(() => {
        return findBestMatchingHref(items, pathname);
    }, [items, pathname]);

    const activeGroupLabel = useMemo(() => {
        if (isDashboardHome) return null;

        return (
            items.find((item) => {
                return (
                    Boolean(item.children?.length) && containsActiveHref(item, activeHref)
                );
            })?.label ?? null
        );
    }, [activeHref, isDashboardHome, items]);

    const [menuState, setMenuState] = useState<OpenGroupState>({
        pathname: "",
        openLabel: null,
    });

    /*
     * Al navegar se usa el grupo de la ruta activa.
     * Al hacer clic manualmente se usa el grupo elegido por el usuario.
     * No se necesita ningún useEffect ni una carga adicional.
     */
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
            className={`
                min-h-0 flex-1 space-y-1 overflow-y-auto
                py-2.5 [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
                [@media(max-height:760px)]:space-y-0.5
                [@media(max-height:760px)]:py-1.5
                ${collapsed ? "px-2" : "px-3"}
            `}
        >
            {items.map((item) => {
                const hasChildren = Boolean(item.children?.length);

                const isOpen = openLabel === item.label;

                const directActive =
                    Boolean(item.href) && normalizePath(item.href) === activeHref;

                const simpleLinkActive =
                    directActive &&
                    !(isDashboardHome && openLabel !== null && isDashboardHomeItem(item));

                if (!hasChildren) {
                    return (
                        <SidebarLink
                            key={item.label}
                            item={item}
                            active={simpleLinkActive}
                            collapsed={collapsed}
                            onNavigate={onNavigate}
                        />
                    );
                }

                return (
                    <div
                        key={item.label}
                        className="space-y-1 [@media(max-height:760px)]:space-y-0.5"
                    >
                        <button
                            type="button"
                            onClick={() => {
                                if (collapsed) {
                                    openGroupFromCollapsed(item.label);
                                    return;
                                }

                                toggleGroup(item.label);
                            }}
                            className={`
                                group flex min-h-[42px] w-full
                                items-center gap-3 rounded-xl text-left
                                text-[13px] font-bold transition-colors duration-150
                                [@media(max-height:760px)]:min-h-[36px]
                                [@media(max-height:760px)]:text-xs
                                ${collapsed
                                    ? "justify-center px-0 py-2.5 [@media(max-height:760px)]:py-2"
                                    : "px-3.5 py-2.5 [@media(max-height:760px)]:px-3 [@media(max-height:760px)]:py-2"
                                }
                                ${isOpen
                                    ? "bg-white/18 text-white shadow-sm ring-1 ring-white/12"
                                    : "text-white/78 hover:bg-white/10 hover:text-white"
                                }
                            `}
                            aria-expanded={isOpen}
                            title={collapsed ? item.label : undefined}
                        >
                            {renderSidebarIcon(item.label)}

                            {!collapsed ? (
                                <>
                                    <span className="min-w-0 flex-1 truncate">{item.label}</span>

                                    <ChevronDown
                                        className={`h-4 w-4 shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""
                                            }`}
                                    />
                                </>
                            ) : null}
                        </button>

                        {isOpen && !collapsed ? (
                            <div className="ml-5 mt-1 space-y-1 border-l border-white/15 pl-2 [@media(max-height:760px)]:ml-4 [@media(max-height:760px)]:mt-0.5 [@media(max-height:760px)]:space-y-0.5">
                                {item.children?.map((child) => {
                                    const childActive = containsActiveHref(child, activeHref);

                                    if (!child.href) {
                                        return (
                                            <div
                                                key={child.label}
                                                className={`
                                                    flex min-h-[34px] items-center
                                                    rounded-xl px-3 text-[12px]
                                                    font-bold transition-colors duration-150
                                                    [@media(max-height:760px)]:min-h-[29px]
                                                    [@media(max-height:760px)]:text-[11px]
                                                    ${childActive
                                                        ? "bg-white/18 text-white"
                                                        : "text-white/65"
                                                    }
                                                `}
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
                                            className={`
                                                flex min-h-[34px] items-center
                                                rounded-xl px-3 text-[12px]
                                                font-bold transition-colors duration-150
                                                [@media(max-height:760px)]:min-h-[29px]
                                                [@media(max-height:760px)]:text-[11px]
                                                ${childActive
                                                    ? "bg-white/18 text-white"
                                                    : "text-white/65 hover:bg-white/10 hover:text-white"
                                                }
                                            `}
                                        >
                                            <span className="truncate">{child.label}</span>
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
        width: 220,
    });

    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);

    const updateMenuPosition = useCallback(() => {
        const button = buttonRef.current;

        if (!button) return;

        const rect = button.getBoundingClientRect();
        const safeGap = 8;
        const menuHeight = 122;
        const menuWidth = Math.min(220, window.innerWidth - safeGap * 2);

        let left = rect.right + 12;
        let top = rect.top;

        if (window.innerWidth < 768) {
            left = Math.min(
                Math.max(safeGap, rect.left),
                window.innerWidth - menuWidth - safeGap,
            );

            top = rect.top - menuHeight - safeGap;

            if (top < safeGap) {
                top = rect.bottom + safeGap;
            }
        } else {
            if (left + menuWidth > window.innerWidth - safeGap) {
                left = rect.left - menuWidth - 12;
            }

            if (top + menuHeight > window.innerHeight - safeGap) {
                top = window.innerHeight - menuHeight - safeGap;
            }

            if (top < safeGap) {
                top = safeGap;
            }
        }

        setPosition({
            top,
            left,
            width: menuWidth,
        });
    }, []);

    function handleToggleMenu() {
        setIsOpen((current) => {
            const nextValue = !current;

            if (nextValue) {
                window.requestAnimationFrame(updateMenuPosition);
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

        const animationFrameId = window.requestAnimationFrame(updateMenuPosition);

        window.addEventListener("resize", updateMenuPosition);
        window.addEventListener("scroll", updateMenuPosition, true);
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            window.removeEventListener("resize", updateMenuPosition);
            window.removeEventListener("scroll", updateMenuPosition, true);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen, updateMenuPosition]);

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                type="button"
                onClick={handleToggleMenu}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                title={collapsed ? displayName : undefined}
                className={`
                    flex w-full items-center rounded-2xl border text-left
                    transition-colors duration-150
                    [@media(max-height:760px)]:rounded-xl
                    [@media(max-height:760px)]:p-1.5
                    ${collapsed ? "justify-center p-1.5" : "gap-2.5 p-2"}
                    ${isOpen
                        ? "border-white/35 bg-white/16 shadow-sm"
                        : "border-white/15 bg-white/10 hover:bg-white/15"
                    }
                `}
            >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/12 text-[13px] font-black text-white [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:w-9 [@media(max-height:760px)]:text-xs">
                    {initials}
                </div>

                {!collapsed ? (
                    <>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-black text-white [@media(max-height:760px)]:text-xs">
                                {displayName}
                            </p>

                            <p className="truncate text-[11px] font-semibold text-white/60 [@media(max-height:760px)]:text-[10px]">
                                Mi cuenta
                            </p>
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white [@media(max-height:760px)]:h-7 [@media(max-height:760px)]:w-7">
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
                    className="fixed z-[9999] rounded-2xl border border-white/20 bg-[#07499a] p-2 text-white shadow-2xl shadow-slate-950/35 sm:rounded-3xl"
                    style={{
                        top: position.top,
                        left: position.left,
                        width: position.width,
                    }}
                >
                    <Link
                        href="/admin/profile"
                        onClick={handleCloseMenu}
                        className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-black text-white/90 transition-colors duration-150 hover:bg-white/10 hover:text-white sm:rounded-2xl"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                            <UserCircle className="h-4 w-4" />
                        </span>

                        <span>Mi perfil</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="mt-2 flex h-11 w-full items-center gap-3 rounded-xl bg-red-600 px-3 text-left text-sm font-black text-white shadow-sm transition-colors duration-150 hover:cursor-pointer hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 sm:rounded-2xl"
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/18 [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:w-9 [@media(max-height:760px)]:rounded-xl">
                <GraduationCap
                    className="h-6 w-6 text-white [@media(max-height:760px)]:h-5 [@media(max-height:760px)]:w-5"
                    strokeWidth={2.4}
                />
            </div>

            {!collapsed ? (
                <div className="min-w-0">
                    <p className="truncate text-lg font-black leading-none tracking-wide text-white [@media(max-height:760px)]:text-base">
                        GAIA
                    </p>

                    <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.24em] text-orange-300 [@media(max-height:760px)]:mt-0.5 [@media(max-height:760px)]:text-[9px]">
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

    const items = useMemo(() => {
        if (!user) return [];

        return getSidebarItemsByRoute(user.role, pathname);
    }, [pathname, user]);

    const displayName = useMemo(() => {
        return getUserFullName(user);
    }, [user]);

    const initials = useMemo(() => {
        return getInitials(displayName);
    }, [displayName]);

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
                className="fixed left-3 top-3 z-40 flex h-10 w-10 items-center justify-center rounded-xl bg-[#07499a] text-white shadow-lg transition-colors duration-150 hover:bg-[#063f85] active:scale-[0.96] md:hidden sm:left-4 sm:top-4 sm:h-11 sm:w-11 sm:rounded-2xl"
                aria-label="Abrir menú"
                aria-expanded={isMobileOpen}
            >
                <Menu className="h-5 w-5" />
            </button>

            {isMobileOpen ? (
                <div className="fixed inset-0 z-50 md:hidden">
                    <button
                        type="button"
                        aria-label="Cerrar menú"
                        onClick={closeMobileSidebar}
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[1px]"
                    />

                    <aside
                        role="dialog"
                        aria-modal="true"
                        aria-label="Menú principal"
                        className="fixed left-0 top-0 z-50 flex h-dvh w-[min(88vw,286px)] flex-col overflow-hidden bg-[#07499a] text-white shadow-2xl"
                    >
                        <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-4">
                            <AthenaSidebarLogo collapsed={false} />

                            <button
                                type="button"
                                onClick={closeMobileSidebar}
                                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 active:scale-[0.96]"
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

                        <div className="shrink-0 space-y-2 border-t border-white/12 p-3">
                            <Link
                                href="/admin/help"
                                onClick={closeMobileSidebar}
                                className="flex min-h-[40px] items-center gap-3 rounded-xl px-3 text-[13px] font-bold text-white/78 transition-colors duration-150 hover:bg-white/10 hover:text-white"
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
                className={`
                    fixed left-0 top-0 z-40 hidden h-dvh
                    shrink-0 flex-col overflow-hidden
                    bg-[#07499a] text-white shadow-2xl
                    transition-[width] duration-300 md:flex
                    ${collapsed
                        ? "w-[70px] lg:w-[76px]"
                        : "w-[220px] lg:w-[236px] xl:w-[248px]"
                    }
                `}
            >
                <div
                    className={`
                        flex h-16 shrink-0 items-center gap-3
                        [@media(max-height:760px)]:h-14
                        ${collapsed
                            ? "justify-center px-2"
                            : "justify-between px-3 lg:px-4"
                        }
                    `}
                >
                    <AthenaSidebarLogo collapsed={collapsed} />

                    {!collapsed ? (
                        <button
                            type="button"
                            onClick={handleToggleCollapsed}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 active:scale-[0.96]"
                            aria-label="Contraer menú"
                            title="Contraer menú"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    ) : null}
                </div>

                {collapsed ? (
                    <div className="shrink-0 px-2 pb-2 [@media(max-height:760px)]:pb-1.5">
                        <button
                            type="button"
                            onClick={handleToggleCollapsed}
                            className="flex h-10 w-full items-center justify-center rounded-xl bg-white/10 text-white transition-colors duration-150 hover:bg-white/20 active:scale-[0.96] [@media(max-height:760px)]:h-9"
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
                    className={`
                        shrink-0 space-y-3 border-t border-white/12
                        [@media(max-height:760px)]:space-y-2
                        ${collapsed
                            ? "p-2"
                            : "p-3 [@media(max-height:760px)]:p-2"
                        }
                    `}
                >
                    <Link
                        href="/admin/help"
                        title={collapsed ? "Ayuda y soporte" : undefined}
                        className={`
                            flex min-h-[42px] items-center rounded-xl
                            text-[13px] font-bold text-white/78
                            transition-colors duration-150
                            hover:bg-white/10 hover:text-white
                            [@media(max-height:760px)]:min-h-[36px]
                            [@media(max-height:760px)]:text-xs
                            ${collapsed ? "justify-center px-0" : "gap-3 px-3"}
                        `}
                    >
                        <CircleHelp className="h-[18px] w-[18px] shrink-0 [@media(max-height:760px)]:h-4 [@media(max-height:760px)]:w-4" />

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
