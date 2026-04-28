import type { ReactNode } from "react";

type AlertVariant = "error" | "success" | "warning" | "info";

interface AlertProps {
    children: ReactNode;
    variant?: AlertVariant;
}

export function Alert({ children, variant = "info" }: AlertProps) {
    const styles: Record<AlertVariant, string> = {
        error: "border-red-200 bg-red-50 text-red-700",
        success: "border-green-200 bg-green-50 text-green-700",
        warning: "border-amber-200 bg-amber-50 text-amber-700",
        info: "border-blue-200 bg-blue-50 text-blue-700",
    };

    return (
        <div className={`rounded-xl border px-4 py-3 text-sm ${styles[variant]}`}>
            {children}
        </div>
    );
}