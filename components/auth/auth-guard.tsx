"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
    children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const router = useRouter();
    const { loading, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace("/login");
        }
    }, [loading, isAuthenticated, router]);

    if (loading || !isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="rounded-2xl border border-[var(--border)] bg-white px-6 py-4 text-sm text-[var(--muted-foreground)] shadow-sm">
                    Verificando sesión...
                </div>
            </div>
        );
    }

    return <>{children}</>;
}