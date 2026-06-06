"use client";

import { LogOut } from "lucide-react";

interface HeaderProps {
    displayName: string;
    roleLabel: string;
    onLogout: () => void;
}

export function Header({
    displayName,
    roleLabel,
    onLogout,
}: HeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex min-h-[68px] w-full min-w-0 items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--card)] pl-16 pr-3 shadow-sm sm:min-h-[72px] sm:gap-3 sm:pl-16 sm:pr-4 md:px-5 lg:px-6 [@media(max-height:760px)]:min-h-[60px]">
            <div className="min-w-0 flex-1">
                <p className="hidden text-[11px] font-semibold leading-4 text-[var(--muted-foreground)] xs:block sm:text-xs lg:text-sm [@media(max-height:760px)]:text-[11px]">
                    Bienvenido
                </p>

                <h1
                    className="truncate text-sm font-black leading-5 text-[var(--foreground)] xs:text-base sm:text-lg [@media(max-height:760px)]:text-sm"
                    title={displayName}
                >
                    {displayName}
                </h1>
            </div>

            <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
                <div className="hidden min-w-0 items-center rounded-xl bg-[var(--muted)] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] sm:flex md:max-w-[230px] lg:max-w-[300px] lg:rounded-2xl lg:text-sm [@media(max-height:760px)]:py-1.5 [@media(max-height:760px)]:text-xs">
                    <span className="shrink-0">Rol:</span>

                    <span
                        className="ml-1 truncate font-black text-[var(--foreground)]"
                        title={roleLabel}
                    >
                        {roleLabel}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--danger)] px-3 text-sm font-black text-white shadow-sm transition hover:opacity-90 active:scale-[0.97] focus:outline-none focus:ring-4 focus:ring-red-200 sm:px-3.5 lg:rounded-2xl lg:px-4 [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:px-3"
                    aria-label="Cerrar sesión"
                    title="Cerrar sesión"
                >
                    <LogOut className="h-4 w-4 shrink-0" />

                    <span className="hidden lg:inline">
                        Cerrar sesión
                    </span>
                </button>
            </div>
        </header>
    );
}