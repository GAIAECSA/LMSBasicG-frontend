import { forwardRef, type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none transition-all placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/40 ${className}`}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";