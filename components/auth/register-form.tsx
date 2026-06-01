"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getDashboardRouteByRole } from "@/lib/auth";
import { registerService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";

interface RegisterFormState {
    username: string;
    idnumber: string;
    firstname: string;
    lastname: string;
    email: string;
    phone_number: string;
    password: string;
}

const INITIAL_FORM: RegisterFormState = {
    username: "",
    idnumber: "",
    firstname: "",
    lastname: "",
    email: "",
    phone_number: "",
    password: "",
};

export function RegisterForm() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM);
    const [showPassword, setShowPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!loading && user) {
            router.replace(getDashboardRouteByRole(user.role));
        }
    }, [loading, user, router]);

    function updateField<K extends keyof RegisterFormState>(
        key: K,
        value: RegisterFormState[K],
    ) {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));
    }

    function validateForm() {
        if (
            !form.username.trim() ||
            !form.idnumber.trim() ||
            !form.firstname.trim() ||
            !form.lastname.trim() ||
            !form.email.trim() ||
            !form.phone_number.trim() ||
            !form.password.trim()
        ) {
            throw new Error("Completa todos los campos.");
        }

        if (form.idnumber.trim().length !== 10) {
            throw new Error("La cédula debe tener 10 dígitos.");
        }

        if (form.password.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccess("");

        try {
            validateForm();
            setSubmitting(true);

            const payload = {
                username: form.username.trim(),
                idnumber: form.idnumber.trim(),
                firstname: form.firstname.trim(),
                lastname: form.lastname.trim(),
                email: form.email.trim(),
                phone_number: form.phone_number.trim(),
                password: form.password,
            };

            const response = await registerService(payload);

            setSuccess(
                response.message ||
                "Usuario registrado correctamente.",
            );

            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo completar el registro.",
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
                    Crear cuenta
                </h2>

                <p className="mt-3 text-[13px] leading-6 text-slate-500 sm:text-sm">
                    Registra tu usuario con los datos requeridos.
                </p>
            </div>

            <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
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

                <div className="grid gap-4 md:grid-cols-2 md:gap-5">
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
                            placeholder="Tu nombre de usuario"
                            value={form.username}
                            onChange={(event) =>
                                updateField("username", event.target.value)
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff] sm:h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="idnumber"
                            className="block text-[13px] font-semibold text-slate-700"
                        >
                            Cédula
                        </label>

                        <input
                            id="idnumber"
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="Ingrese su cédula"
                            value={form.idnumber}
                            onChange={(event) =>
                                updateField(
                                    "idnumber",
                                    event.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 10),
                                )
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff] sm:h-12"
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                    <div className="space-y-2">
                        <label
                            htmlFor="firstname"
                            className="block text-[13px] font-semibold text-slate-700"
                        >
                            Nombres
                        </label>

                        <input
                            id="firstname"
                            type="text"
                            placeholder="Tus nombres"
                            value={form.firstname}
                            onChange={(event) =>
                                updateField("firstname", event.target.value)
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff] sm:h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="lastname"
                            className="block text-[13px] font-semibold text-slate-700"
                        >
                            Apellidos
                        </label>

                        <input
                            id="lastname"
                            type="text"
                            placeholder="Tus apellidos"
                            value={form.lastname}
                            onChange={(event) =>
                                updateField("lastname", event.target.value)
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff] sm:h-12"
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 md:gap-5">
                    <div className="space-y-2">
                        <label
                            htmlFor="register-email"
                            className="block text-[13px] font-semibold text-slate-700"
                        >
                            Correo electrónico
                        </label>

                        <input
                            id="register-email"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={form.email}
                            onChange={(event) =>
                                updateField("email", event.target.value)
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff] sm:h-12"
                        />
                    </div>

                    <div className="space-y-2">
                        <label
                            htmlFor="phone_number"
                            className="block text-[13px] font-semibold text-slate-700"
                        >
                            Teléfono
                        </label>

                        <input
                            id="phone_number"
                            type="tel"
                            placeholder="0999999999"
                            value={form.phone_number}
                            onChange={(event) =>
                                updateField("phone_number", event.target.value)
                            }
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff] sm:h-12"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                        <label
                            htmlFor="register-password"
                            className="block text-[13px] font-semibold text-slate-700"
                        >
                            Contraseña
                        </label>

                        <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="text-xs font-medium text-[#4a6db3] transition hover:text-[#2d4f91]"
                        >
                            {showPassword ? "Ocultar" : "Mostrar"}
                        </button>
                    </div>

                    <input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Crea tu contraseña"
                        value={form.password}
                        onChange={(event) =>
                            updateField("password", event.target.value)
                        }
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff] sm:h-12"
                    />
                </div>

                <button
                    type="submit"
                    disabled={submitting}
                    className="flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#003d8f_0%,#002a66_100%)] px-4 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,61,143,0.28)] transition-all hover:translate-y-[-1px] hover:shadow-[0_12px_24px_rgba(0,61,143,0.33)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {submitting ? "Creando cuenta..." : "Crear cuenta"}
                </button>
            </form>

            <div className="mt-4 text-center text-sm text-slate-500 sm:mt-5">
                ¿Ya tienes cuenta?{" "}
                <Link
                    href="/login"
                    className="font-semibold text-[#3a63c8] transition hover:text-[#244aab]"
                >
                    Inicia sesión
                </Link>
            </div>
        </div>
    );
}

export default RegisterForm;