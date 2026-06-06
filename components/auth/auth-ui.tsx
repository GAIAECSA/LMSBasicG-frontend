import type {
    ButtonHTMLAttributes,
    ReactNode,
} from "react";

/*
|--------------------------------------------------------------------------
| Clases reutilizables
|--------------------------------------------------------------------------
| Las variantes max-height compactan los elementos automáticamente cuando
| la pantalla tiene poca altura, como ocurre en 1280 × 720.
*/

export const AUTH_FORM_STACK_CLASS =
    "space-y-3 sm:space-y-4 [@media(max-height:760px)]:space-y-2.5";

export const AUTH_FORM_GRID_CLASS =
    "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 [@media(max-height:760px)]:gap-2.5";

export const AUTH_INPUT_CLASS =
    "h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff] sm:h-11 sm:rounded-2xl sm:px-4 sm:text-sm [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:rounded-xl [@media(max-height:760px)]:px-3 [@media(max-height:760px)]:text-xs";

export const AUTH_PASSWORD_INPUT_CLASS =
    "h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 pr-10 text-[13px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff] sm:h-11 sm:rounded-2xl sm:px-4 sm:pr-11 sm:text-sm [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:rounded-xl [@media(max-height:760px)]:px-3 [@media(max-height:760px)]:pr-10 [@media(max-height:760px)]:text-xs";

export const AUTH_PASSWORD_TOGGLE_CLASS =
    "absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-slate-400 transition hover:text-slate-700 sm:h-11 sm:w-11 [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:w-9";

export const AUTH_ACTION_CLASS =
    "text-[11px] font-semibold leading-4 text-[#3a63c8] transition hover:text-[#244aab] hover:underline sm:text-xs [@media(max-height:760px)]:text-[10px]";

export const AUTH_FOOTER_CLASS =
    "mt-4 text-center text-xs leading-5 text-slate-500 sm:mt-5 sm:text-[13px] [@media(max-height:760px)]:mt-3 [@media(max-height:760px)]:text-[11px]";

export const AUTH_FOOTER_LINK_CLASS =
    "font-semibold text-[#3a63c8] transition hover:text-[#244aab] hover:underline";

export const AUTH_PRIMARY_BUTTON_CLASS =
    "flex h-10 w-full items-center justify-center rounded-xl bg-[linear-gradient(180deg,#003d8f_0%,#002a66_100%)] px-4 text-[13px] font-bold text-white shadow-lg shadow-blue-950/20 transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 sm:h-11 sm:rounded-2xl sm:text-sm [@media(max-height:760px)]:h-9 [@media(max-height:760px)]:rounded-xl [@media(max-height:760px)]:text-xs";

interface AuthCardProps {
    children: ReactNode;
    className?: string;
}

export function AuthCard({
    children,
    className = "",
}: AuthCardProps) {
    return (
        <section
            className={`w-full rounded-[20px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-md sm:rounded-[26px] sm:p-5 xl:p-6 [@media(max-height:760px)]:rounded-[18px] [@media(max-height:760px)]:p-4 ${className}`}
        >
            {children}
        </section>
    );
}

interface AuthFormHeaderProps {
    title: string;
    description: string;
    badge?: string;
}

export function AuthFormHeader({
    title,
    description,
    badge = "ATHENA",
}: AuthFormHeaderProps) {
    return (
        <header className="mb-4 sm:mb-5 [@media(max-height:760px)]:mb-3">
            <span className="inline-flex rounded-full bg-[#edf3ff] px-3 py-1 text-[10px] font-semibold text-[#4a6db3] shadow-sm sm:text-[11px] [@media(max-height:760px)]:px-2.5 [@media(max-height:760px)]:py-0.5 [@media(max-height:760px)]:text-[9px]">
                {badge}
            </span>

            <h1 className="mt-3 text-[22px] font-bold leading-tight tracking-tight text-slate-950 sm:mt-4 sm:text-2xl [@media(max-height:760px)]:mt-2 [@media(max-height:760px)]:text-xl">
                {title}
            </h1>

            <p className="mt-2 text-xs leading-5 text-slate-500 sm:mt-3 sm:text-[13px] [@media(max-height:760px)]:mt-1.5 [@media(max-height:760px)]:text-[11px] [@media(max-height:760px)]:leading-4">
                {description}
            </p>
        </header>
    );
}

interface AuthFieldProps {
    label: string;
    htmlFor?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function AuthField({
    label,
    htmlFor,
    action,
    children,
    className = "",
}: AuthFieldProps) {
    return (
        <div
            className={`min-w-0 space-y-1.5 [@media(max-height:760px)]:space-y-1 ${className}`}
        >
            {action ? (
                <div className="flex flex-col gap-1 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between min-[360px]:gap-3">
                    <label
                        htmlFor={htmlFor}
                        className="text-xs font-semibold text-slate-700 sm:text-[13px] [@media(max-height:760px)]:text-[11px]"
                    >
                        {label}
                    </label>

                    {action}
                </div>
            ) : (
                <label
                    htmlFor={htmlFor}
                    className="text-xs font-semibold text-slate-700 sm:text-[13px] [@media(max-height:760px)]:text-[11px]"
                >
                    {label}
                </label>
            )}

            {children}
        </div>
    );
}

interface AuthAlertProps {
    children: ReactNode;
    variant?: "error" | "success";
}

export function AuthAlert({
    children,
    variant = "error",
}: AuthAlertProps) {
    const variantClass =
        variant === "success"
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-700";

    return (
        <div
            className={`rounded-xl border px-3 py-2.5 text-xs font-semibold leading-5 sm:rounded-2xl sm:px-4 sm:py-3 [@media(max-height:760px)]:rounded-xl [@media(max-height:760px)]:px-3 [@media(max-height:760px)]:py-2 [@media(max-height:760px)]:text-[11px] [@media(max-height:760px)]:leading-4 ${variantClass}`}
        >
            {children}
        </div>
    );
}

interface AuthInfoPanelProps {
    icon: ReactNode;
    title: string;
    children: ReactNode;
}

export function AuthInfoPanel({
    icon,
    title,
    children,
}: AuthInfoPanelProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3 [@media(max-height:760px)]:rounded-xl [@media(max-height:760px)]:px-3 [@media(max-height:760px)]:py-2">
            <div className="flex items-start gap-3 [@media(max-height:760px)]:gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#003d8f] shadow-sm [@media(max-height:760px)]:h-7 [@media(max-height:760px)]:w-7">
                    {icon}
                </div>

                <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 [@media(max-height:760px)]:text-[11px]">
                        {title}
                    </p>

                    <div className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-xs sm:leading-5 [@media(max-height:760px)]:mt-0.5 [@media(max-height:760px)]:text-[10px] [@media(max-height:760px)]:leading-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AuthPrimaryButton({
    children,
    className = "",
    type = "submit",
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            type={type}
            className={`${AUTH_PRIMARY_BUTTON_CLASS} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}