"use client";

import Link from "next/link";
import { useState } from "react";
import { forgotPasswordService } from "@/services/auth.service";

export function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!email.trim()) {
            setError("Debes ingresar tu correo.");
            return;
        }

        try {
            setSubmitting(true);

            const response = await forgotPasswordService({ email });

            setSuccess(response.message);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo procesar la recuperación."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="rounded-[28px] border border-white/70 bg-white/88 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-md sm:p-8">
            <div className="mb-7">
                <span className="inline-flex rounded-full bg-[#edf3ff] px-3 py-1 text-[11px] font-semibold text-[#4a6db3] shadow-sm">
                    LMS BasicG
                </span>

                <h2 className="mt-4 text-[34px] font-bold leading-none tracking-tight text-slate-950">
                    Recuperar acceso
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                    Ingresa tu correo y te mostraremos el flujo de recuperación.
                </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {success ? (
                    <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {success}
                    </div>
                ) : null}

                <div className="space-y-2">
                    <label
                        htmlFor="forgot-email"
                        className="block text-[13px] font-semibold text-slate-700"
                    >
                        Correo electrónico
                    </label>

                    <input
                        id="forgot-email"
                        type="email"
                        placeholder="ejemplo@correo.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff]"
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#4176ea_0%,#2f63d8_100%)] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(47,99,216,0.28)] transition-all hover:translate-y-[-1px] hover:shadow-[0_12px_24px_rgba(47,99,216,0.33)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {submitting ? "Procesando..." : "Enviar recuperación"}
                </button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-500">
                <Link
                    href="/login"
                    className="font-semibold text-[#3a63c8] transition hover:text-[#244aab]"
                >
                    Volver al inicio de sesión
                </Link>
            </div>
        </div>
    );
}