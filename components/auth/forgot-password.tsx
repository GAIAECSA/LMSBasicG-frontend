"use client";

import Link from "next/link";

import { AuthShell } from "./auth-shell";
import {
    AuthCard,
    AuthFormHeader,
    AuthInfoPanel,
    AuthPrimaryButton,
} from "./auth-ui";
import { notify } from "@/lib/notify";

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
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.9"
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
            className="h-4 w-4"
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
    function handleRecoveryRequest() {
        notify.info(
            "Recuperación automática próximamente.",
            "Por el momento, comunícate con el administrador de la plataforma para restablecer tu contraseña.",
        );
    }

    return (
        <AuthShell active="forgot">
            <AuthCard>
                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#dce8f7] bg-[#f7fbff] px-3 py-3 sm:px-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#3564bf] shadow-sm">
                        <LockIcon />
                    </div>

                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2457b8] sm:text-[11px]">
                            Seguridad de la cuenta
                        </p>

                        <p className="mt-0.5 text-xs font-semibold text-slate-600">
                            Recuperación de acceso a ATHENA
                        </p>
                    </div>
                </div>

                <AuthFormHeader
                    title="Recuperar contraseña"
                    description="Estamos preparando una opción segura para recuperar tu acceso automáticamente."
                />

                <div className="space-y-3">
                    <AuthInfoPanel
                        icon={<ClockIcon />}
                        title="Disponible próximamente"
                    >
                        La recuperación automática de contraseña estará
                        habilitada en una próxima actualización de la
                        plataforma.
                    </AuthInfoPanel>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3 sm:px-4">
                        <p className="text-xs font-bold text-amber-800">
                            ¿Necesitas ingresar urgentemente?
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-amber-700 sm:text-xs">
                            Solicita al administrador de la plataforma el
                            restablecimiento temporal de tu contraseña.
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Link
                        href="/login"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.99] sm:h-11 sm:rounded-2xl sm:text-sm"
                    >
                        <ArrowLeftIcon />
                        Volver al inicio
                    </Link>

                    <AuthPrimaryButton
                        type="button"
                        onClick={handleRecoveryRequest}
                        className="gap-2"
                    >
                        <SparklesIcon />
                        Solicitar recuperación
                    </AuthPrimaryButton>
                </div>
            </AuthCard>
        </AuthShell>
    );
}