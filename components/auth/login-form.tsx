"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { getDashboardRouteByRole } from "@/lib/auth";
import { loginService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";
import type { LoginResponse, UserRole } from "@/types/auth";

type LoginApiResponse = {
    accessToken?: string;
    access_token?: string;
    token?: string;
    role_id?: number | string;
    role?: number | string;
    user?: {
        id: string;
        email: string;
        username?: string;
        firstname?: string;
        lastname?: string;
        fullName?: string;
        role?: number | string;
        role_id?: number | string;
    };
};

function resolveRole(rawRole: unknown): UserRole {
    const value = String(rawRole ?? "").trim().toLowerCase();

    if (
        value === "1" ||
        value === "admin" ||
        value === "administrador" ||
        value === "administrator"
    ) {
        return "admin";
    }

    if (
        value === "2" ||
        value === "visitor" ||
        value === "visitante" ||
        value === "guest" ||
        value === "invitado"
    ) {
        return "student";
    }

    if (
        value === "3" ||
        value === "teacher" ||
        value === "docente" ||
        value === "profesor"
    ) {
        return "teacher";
    }

    if (
        value === "4" ||
        value === "student" ||
        value === "estudiante" ||
        value === "alumno"
    ) {
        return "student";
    }

    return "student";
}

function buildSession(response: LoginApiResponse): LoginResponse {
    const apiUser = response.user;

    if (!apiUser) {
        throw new Error("La respuesta del login no contiene el usuario.");
    }

    const fullName =
        apiUser.fullName?.trim() ||
        [apiUser.firstname?.trim(), apiUser.lastname?.trim()]
            .filter(Boolean)
            .join(" ")
            .trim() ||
        apiUser.username?.trim() ||
        apiUser.email?.trim() ||
        "Usuario";

    const rawRole =
        apiUser.role ??
        apiUser.role_id ??
        response.role ??
        response.role_id;

    const roleId =
        typeof apiUser.role_id === "number"
            ? apiUser.role_id
            : typeof apiUser.role_id === "string" && apiUser.role_id.trim()
                ? Number(apiUser.role_id)
                : typeof response.role_id === "number"
                    ? response.role_id
                    : typeof response.role_id === "string" && response.role_id.trim()
                        ? Number(response.role_id)
                        : null;

    const accessToken =
        response.accessToken ??
        response.access_token ??
        response.token ??
        "";

    if (!accessToken) {
        throw new Error("La respuesta del login no contiene token.");
    }

    return {
        accessToken,
        refreshToken: null,
        tokenType: "Bearer",
        user: {
            id: String(apiUser.id ?? ""),
            username: apiUser.username?.trim() || apiUser.email?.trim() || "",
            firstname: apiUser.firstname?.trim() || "",
            lastname: apiUser.lastname?.trim() || "",
            fullName,
            email: apiUser.email?.trim() || "",
            phone_number: "",
            role: resolveRole(rawRole),
            role_id: Number.isFinite(roleId) ? roleId : null,
        },
    };
}

export function LoginForm() {
    const router = useRouter();
    const { user, loading, signIn } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!loading && user) {
            router.replace(getDashboardRouteByRole(user.role));
        }
    }, [loading, user, router]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!username.trim() || !password.trim()) {
            setError("Debes ingresar tu usuario y contraseña.");
            return;
        }

        try {
            setSubmitting(true);

            const response = (await loginService({
                username: username.trim(),
                password,
            })) as LoginApiResponse;

            const session = buildSession(response);

            signIn(session);
            router.replace(getDashboardRouteByRole(session.user.role));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo iniciar sesión. Inténtalo nuevamente."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="rounded-[22px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-md sm:rounded-[28px] sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-7">
                <span className="inline-flex rounded-full bg-[#edf3ff] px-3 py-1 text-[11px] font-semibold text-[#4a6db3] shadow-sm">
                    LMS BasicG
                </span>

                <h2 className="mt-4 text-[28px] font-bold leading-tight tracking-tight text-slate-950 sm:text-[34px] sm:leading-none">
                    Iniciar sesión
                </h2>

                <p className="mt-3 text-[13px] leading-6 text-slate-500 sm:text-sm">
                    Accede con tu usuario y contraseña.
                </p>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                {error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                <div className="space-y-2">
                    <label
                        htmlFor="username"
                        className="block text-[13px] font-semibold text-slate-700"
                    >
                        Usuario
                    </label>

                    <input
                        id="username"
                        type="text"
                        placeholder="Ingresa tu usuario"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff] sm:h-12"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <label
                            htmlFor="password"
                            className="block text-[13px] font-semibold text-slate-700"
                        >
                            Contraseña
                        </label>

                        <Link
                            href="/forgot-password"
                            className="text-xs font-medium text-[#003d8f] transition hover:text-[#244aab] sm:text-sm"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Ingresa tu contraseña"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff] sm:h-12"
                        />

                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={
                                showPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"
                            }
                            title={
                                showPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"
                            }
                            className="absolute right-0 top-0 flex h-11 w-12 items-center justify-center text-slate-400 transition hover:text-[#2d4f91] sm:h-12"
                        >
                            {showPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-11 w-full items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#003d8f_0%,#002a66_100%)] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,61,143,0.28)] transition-all hover:translate-y-[-1px] hover:shadow-[0_12px_24px_rgba(0,61,143,0.33)] disabled:cursor-not-allowed disabled:opacity-70 sm:h-12"
                >
                    {submitting ? "Ingresando..." : "Entrar al sistema"}
                </button>
            </form>

            <div className="mt-4 text-center text-sm text-slate-500 sm:mt-5">
                ¿No tienes cuenta?{" "}
                <Link
                    href="/register"
                    className="font-semibold text-[#003d8f] transition hover:text-[#244aab]"
                >
                    Regístrate
                </Link>
            </div>
        </div>
    );
}