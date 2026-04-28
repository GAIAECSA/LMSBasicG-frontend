import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: ButtonVariant;
    fullWidth?: boolean;
}

export function Button({
    children,
    variant = "primary",
    fullWidth = false,
    className = "",
    ...props
}: ButtonProps) {
    const baseClasses =
        "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60";

    const variantClasses: Record<ButtonVariant, string> = {
        primary:
            "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 shadow-sm",
        secondary:
            "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90",
        ghost:
            "bg-transparent text-[var(--foreground)] hover:bg-[var(--muted)]",
        danger:
            "bg-[var(--danger)] text-white hover:opacity-90 shadow-sm",
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${fullWidth ? "w-full" : ""
                } ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}