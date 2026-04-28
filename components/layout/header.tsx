"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getEffectiveRoleByPathname, roleLabels } from "@/lib/constants";

export function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const effectiveRole = getEffectiveRoleByPathname(user?.role, pathname);
    const roleLabel = roleLabels[effectiveRole];

    function handleLogout() {
        signOut();
        router.replace("/login");
    }

    return (
        <header className="flex flex-col gap-4 border-b border-[var(--border)] bg-white px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
                <p className="text-sm text-[var(--muted-foreground)]">
                    Bienvenido
                </p>

                <h1 className="text-xl font-bold">
                    {user?.firstname} {user?.lastname}
                </h1>
            </div>

            <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[var(--muted)] px-3 py-2 text-sm text-[var(--muted-foreground)]">
                    Rol:{" "}
                    <span className="font-semibold text-[var(--foreground)]">
                        {roleLabel}
                    </span>
                </div>

                <Button variant="ghost" onClick={handleLogout}>
                    Cerrar sesión
                </Button>
            </div>
        </header>
    );
}