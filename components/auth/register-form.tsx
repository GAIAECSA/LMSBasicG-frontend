"use client";

import Link from "next/link";
import {
    useEffect,
    useState,
    type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import {
    AuthAlert,
    AuthCard,
    AuthField,
    AuthFormHeader,
    AuthPrimaryButton,
    AUTH_ACTION_CLASS,
    AUTH_FOOTER_CLASS,
    AUTH_FOOTER_LINK_CLASS,
    AUTH_FORM_GRID_CLASS,
    AUTH_FORM_STACK_CLASS,
    AUTH_INPUT_CLASS,
} from "@/components/auth/auth-ui";
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

    const [form, setForm] =
        useState<RegisterFormState>(INITIAL_FORM);

    const [showPassword, setShowPassword] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    useEffect(() => {
        if (!loading && user) {
            router.replace(
                getDashboardRouteByRole(user.role),
            );
        }
    }, [loading, user, router]);

    function updateField<
        K extends keyof RegisterFormState,
    >(
        key: K,
        value: RegisterFormState[K],
    ) {
        setForm((previousForm) => ({
            ...previousForm,
            [key]: value,
        }));

        setError("");
        setSuccess("");
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
            throw new Error(
                "Completa todos los campos.",
            );
        }

        if (
            form.idnumber.trim().length !== 10
        ) {
            throw new Error(
                "La cédula debe tener 10 dígitos.",
            );
        }

        if (form.password.length < 6) {
            throw new Error(
                "La contraseña debe tener al menos 6 caracteres.",
            );
        }
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
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
                phone_number:
                    form.phone_number.trim(),
                password: form.password,
            };

            const response =
                await registerService(payload);

            setSuccess(
                response.message ||
                "Usuario registrado correctamente.",
            );

            window.setTimeout(() => {
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
        <AuthCard>
            <AuthFormHeader
                title="Crear cuenta"
                description="Registra tu usuario con los datos requeridos."
            />

            <form
                className={AUTH_FORM_STACK_CLASS}
                onSubmit={handleSubmit}
            >
                {error ? (
                    <AuthAlert>
                        {error}
                    </AuthAlert>
                ) : null}

                {success ? (
                    <AuthAlert variant="success">
                        {success}
                    </AuthAlert>
                ) : null}

                <div className={AUTH_FORM_GRID_CLASS}>
                    <AuthField
                        label="Usuario"
                        htmlFor="register-username"
                    >
                        <input
                            id="register-username"
                            type="text"
                            placeholder="Tu nombre de usuario"
                            value={form.username}
                            onChange={(event) => {
                                updateField(
                                    "username",
                                    event.target.value,
                                );
                            }}
                            autoComplete="username"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>

                    <AuthField
                        label="Cédula"
                        htmlFor="register-idnumber"
                    >
                        <input
                            id="register-idnumber"
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="Ingrese su cédula"
                            value={form.idnumber}
                            onChange={(event) => {
                                updateField(
                                    "idnumber",
                                    event.target.value
                                        .replace(
                                            /\D/g,
                                            "",
                                        )
                                        .slice(0, 10),
                                );
                            }}
                            autoComplete="off"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>
                </div>

                <div className={AUTH_FORM_GRID_CLASS}>
                    <AuthField
                        label="Nombres"
                        htmlFor="register-firstname"
                    >
                        <input
                            id="register-firstname"
                            type="text"
                            placeholder="Tus nombres"
                            value={form.firstname}
                            onChange={(event) => {
                                updateField(
                                    "firstname",
                                    event.target.value,
                                );
                            }}
                            autoComplete="given-name"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>

                    <AuthField
                        label="Apellidos"
                        htmlFor="register-lastname"
                    >
                        <input
                            id="register-lastname"
                            type="text"
                            placeholder="Tus apellidos"
                            value={form.lastname}
                            onChange={(event) => {
                                updateField(
                                    "lastname",
                                    event.target.value,
                                );
                            }}
                            autoComplete="family-name"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>
                </div>

                <div className={AUTH_FORM_GRID_CLASS}>
                    <AuthField
                        label="Correo electrónico"
                        htmlFor="register-email"
                    >
                        <input
                            id="register-email"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={form.email}
                            onChange={(event) => {
                                updateField(
                                    "email",
                                    event.target.value,
                                );
                            }}
                            autoComplete="email"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>

                    <AuthField
                        label="Teléfono"
                        htmlFor="register-phone-number"
                    >
                        <input
                            id="register-phone-number"
                            type="tel"
                            inputMode="tel"
                            placeholder="0999999999"
                            value={form.phone_number}
                            onChange={(event) => {
                                updateField(
                                    "phone_number",
                                    event.target.value,
                                );
                            }}
                            autoComplete="tel"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>
                </div>

                <AuthField
                    label="Contraseña"
                    htmlFor="register-password"
                    action={
                        <button
                            type="button"
                            onClick={() => {
                                setShowPassword(
                                    (
                                        previousShowPassword,
                                    ) =>
                                        !previousShowPassword,
                                );
                            }}
                            className={AUTH_ACTION_CLASS}
                        >
                            {showPassword
                                ? "Ocultar"
                                : "Mostrar"}
                        </button>
                    }
                >
                    <input
                        id="register-password"
                        type={
                            showPassword
                                ? "text"
                                : "password"
                        }
                        placeholder="Crea tu contraseña"
                        value={form.password}
                        onChange={(event) => {
                            updateField(
                                "password",
                                event.target.value,
                            );
                        }}
                        autoComplete="new-password"
                        className={
                            AUTH_INPUT_CLASS
                        }
                    />
                </AuthField>

                <AuthPrimaryButton
                    disabled={submitting}
                >
                    {submitting ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creando cuenta...
                        </span>
                    ) : (
                        "Crear cuenta"
                    )}
                </AuthPrimaryButton>
            </form>

            <div className={AUTH_FOOTER_CLASS}>
                ¿Ya tienes cuenta?{" "}
                <Link
                    href="/login"
                    className={AUTH_FOOTER_LINK_CLASS}
                >
                    Inicia sesión
                </Link>
            </div>
        </AuthCard>
    );
}

export default RegisterForm;