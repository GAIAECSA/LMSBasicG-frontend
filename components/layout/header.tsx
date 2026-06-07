"use client";

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
        <header className="static flex min-h-[68px] w-full min-w-0 items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--card)] pl-16 pr-3 sm:min-h-[72px] sm:gap-3 sm:pl-16 sm:pr-4 md:px-5 lg:px-6 [@media(max-height:760px)]:min-h-[60px]">
            {/* Conserva aquí el contenido que ya tengas dentro del header */}
        </header>
    );
}