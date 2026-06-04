import Link from "next/link";
import { AuthShell } from "./auth-shell";

function ArrowLeftIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 19.5 8.25 12l7.5-7.5"
            />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-9 w-9"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v3.75m-.75 0h10.5A2.25 2.25 0 0 1 19.5 12.75v6A2.25 2.25 0 0 1 17.25 21H6.75A2.25 2.25 0 0 1 4.5 18.75v-6a2.25 2.25 0 0 1 2.25-2.25Z"
            />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
        </svg>
    );
}

function SparklesIcon() {
    return (
        <svg
            aria-hidden="true"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9.813 15.904-.96 2.4a.75.75 0 0 1-1.394 0l-.96-2.4a4.5 4.5 0 0 0-2.403-2.403l-2.4-.96a.75.75 0 0 1 0-1.394l2.4-.96A4.5 4.5 0 0 0 6.5 7.784l.96-2.4a.75.75 0 0 1 1.394 0l.96 2.4a4.5 4.5 0 0 0 2.403 2.403l2.4.96a.75.75 0 0 1 0 1.394l-2.4.96a4.5 4.5 0 0 0-2.403 2.403ZM18.259 8.715l-.359.898a.375.375 0 0 1-.697 0l-.36-.898a2.25 2.25 0 0 0-1.201-1.202l-.898-.359a.375.375 0 0 1 0-.697l.898-.36a2.25 2.25 0 0 0 1.201-1.201l.36-.898a.375.375 0 0 1 .697 0l.359.898a2.25 2.25 0 0 0 1.202 1.201l.898.36a.375.375 0 0 1 0 .697l-.898.359a2.25 2.25 0 0 0-1.202 1.202Z"
            />
        </svg>
    );
}

export function ForgotPassword() {
    return (
        <AuthShell active="forgot">
            <section className="rounded-[28px] border border-white/80 bg-white/95 p-6 shadow-[0_22px_55px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-7">

                <div className="mt-6 rounded-[20px] border border-[#dce8f7] bg-[#f7fbff] p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#3564bf] shadow-sm">
                            <ClockIcon />
                        </div>

                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2457b8]">
                                Próximamente
                            </p>

                            <p className="mt-1.5 text-sm font-medium leading-6 text-slate-600">
                                La recuperación automática de contraseña estará
                                disponible en una próxima actualización de la
                                plataforma.
                            </p>
                        </div>
                    </div>
                </div>

            </section>
        </AuthShell>
    );
}