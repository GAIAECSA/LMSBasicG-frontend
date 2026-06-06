import type {
    ElementType,
    HTMLInputTypeAttribute,
} from "react";

type ProfileFieldProps = {
    label: string;
    value: string;
    placeholder?: string;
    type?: HTMLInputTypeAttribute;
    Icon?: ElementType;
    readOnly?: boolean;
    disabled?: boolean;
    required?: boolean;
    helperText?: string;
    onChange?: (value: string) => void;
};

export function ProfileField({
    label,
    value,
    placeholder,
    type = "text",
    Icon,
    readOnly = false,
    disabled = false,
    required = false,
    helperText,
    onChange,
}: ProfileFieldProps) {
    const inactive =
        readOnly || disabled;

    return (
        <label className="block min-w-0">
            <span className="text-[11px] font-black text-[var(--foreground)] sm:text-xs">
                {label}
            </span>

            <div className="relative mt-1.5">
                {Icon ? (
                    <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)] sm:left-3.5" />
                ) : null}

                <input
                    type={type}
                    value={value}
                    readOnly={readOnly}
                    disabled={disabled}
                    required={required}
                    placeholder={placeholder}
                    onChange={(event) =>
                        onChange?.(
                            event.target.value,
                        )
                    }
                    className={`h-10 w-full rounded-xl border border-[var(--border)] px-3 text-xs font-semibold outline-none transition sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm ${
                        Icon
                            ? "pl-9 sm:pl-10"
                            : ""
                    } ${
                        inactive
                            ? "cursor-not-allowed bg-[var(--muted)] text-[var(--muted-foreground)]"
                            : "bg-[var(--card)] text-[var(--foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                    }`}
                />
            </div>

            {helperText ? (
                <span className="mt-1.5 block text-[10px] font-semibold leading-4 text-[var(--muted-foreground)] sm:text-xs sm:leading-5">
                    {helperText}
                </span>
            ) : null}
        </label>
    );
}

export default ProfileField;
