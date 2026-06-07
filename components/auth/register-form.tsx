"use client";

import Link from "next/link";
import {
    useEffect,
    useRef,
    useState,
    type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
    Eye,
    EyeOff,
    Loader2,
} from "lucide-react";

import {
    AuthCard,
    AuthField,
    AuthFormHeader,
    AuthPrimaryButton,
    AUTH_FOOTER_CLASS,
    AUTH_FOOTER_LINK_CLASS,
    AUTH_FORM_GRID_CLASS,
    AUTH_FORM_STACK_CLASS,
    AUTH_INPUT_CLASS,
    AUTH_PASSWORD_INPUT_CLASS,
    AUTH_PASSWORD_TOGGLE_CLASS,
} from "@/components/auth/auth-ui";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardRouteByRole } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { registerService } from "@/services/auth.service";

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

function isValidEmail(
    email: string,
) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email,
    );
}

function getErrorMessage(
    error: unknown,
) {
    if (
        error instanceof Error &&
        error.message.trim()
    ) {
        return error.message.trim();
    }

    if (
        typeof error === "string" &&
        error.trim()
    ) {
        return error.trim();
    }

    return "No se pudo completar el registro.";
}

export function RegisterForm() {
    const router = useRouter();

    const {
        user,
        loading,
    } = useAuth();

    const redirectTimeoutRef =
        useRef<ReturnType<
            typeof setTimeout
        > | null>(null);

    const [
        form,
        setForm,
    ] = useState<RegisterFormState>(
        INITIAL_FORM,
    );

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const isUsernameCompleted =
        Boolean(
            form.username.trim(),
        );

    const isIdNumberCompleted =
        /^\d{10}$/.test(
            form.idnumber.trim(),
        );

    const isFirstnameCompleted =
        Boolean(
            form.firstname.trim(),
        );

    const isLastnameCompleted =
        Boolean(
            form.lastname.trim(),
        );

    const isEmailCompleted =
        isValidEmail(
            form.email.trim(),
        );

    const isPhoneCompleted =
        /^\d{7,15}$/.test(
            form.phone_number.trim(),
        );

    const isPasswordCompleted =
        form.password.length >= 6;

    /*
     * Si el usuario ya inició sesión,
     * lo redirige automáticamente a su panel.
     */
    useEffect(() => {
        if (
            !loading &&
            user
        ) {
            router.replace(
                getDashboardRouteByRole(
                    user.role,
                ),
            );
        }
    }, [
        loading,
        user,
        router,
    ]);

    /*
     * Limpia el temporizador si el componente
     * se desmonta antes de la redirección.
     */
    useEffect(() => {
        return () => {
            if (
                redirectTimeoutRef.current
            ) {
                clearTimeout(
                    redirectTimeoutRef.current,
                );
            }
        };
    }, []);

    function updateField<
        K extends keyof RegisterFormState,
    >(
        key: K,
        value: RegisterFormState[K],
    ) {
        setForm(
            (previousForm) => ({
                ...previousForm,
                [key]: value,
            }),
        );
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
                "Completa todos los campos obligatorios.",
            );
        }

        if (
            form.idnumber.trim()
                .length !== 10
        ) {
            throw new Error(
                "La cédula debe tener exactamente 10 dígitos.",
            );
        }

        if (
            !isValidEmail(
                form.email.trim(),
            )
        ) {
            throw new Error(
                "Ingresa un correo electrónico válido.",
            );
        }

        if (
            form.phone_number.trim()
                .length < 7
        ) {
            throw new Error(
                "Ingresa un número de teléfono válido.",
            );
        }

        if (
            form.password.length < 6
        ) {
            throw new Error(
                "La contraseña debe tener al menos 6 caracteres.",
            );
        }
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (submitting) {
            return;
        }

        try {
            validateForm();

            setSubmitting(true);

            const payload = {
                username:
                    form.username.trim(),
                idnumber:
                    form.idnumber.trim(),
                firstname:
                    form.firstname.trim(),
                lastname:
                    form.lastname.trim(),
                email:
                    form.email
                        .trim()
                        .toLowerCase(),
                phone_number:
                    form.phone_number.trim(),
                password:
                    form.password,
            };

            const response =
                await registerService(
                    payload,
                );

            notify.success(
                response.message ||
                "Usuario registrado correctamente.",
                "Serás redirigido al inicio de sesión.",
            );

            redirectTimeoutRef.current =
                setTimeout(() => {
                    router.push(
                        "/login",
                    );
                }, 1400);
        } catch (error) {
            notify.error(
                "No se pudo crear la cuenta.",
                getErrorMessage(
                    error,
                ),
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthCard>
            <AuthFormHeader
                title="Crear cuenta"
                description="Registra tus datos personales para acceder a la plataforma ATHENA."
            />


            <form
                className={
                    AUTH_FORM_STACK_CLASS
                }
                onSubmit={
                    handleSubmit
                }
                noValidate
            >
                <div
                    className={
                        AUTH_FORM_GRID_CLASS
                    }
                >
                    <AuthField
                        label="Usuario"
                        htmlFor="register-username"
                        required
                        completed={
                            isUsernameCompleted
                        }
                    >
                        <input
                            id="register-username"
                            type="text"
                            placeholder="Tu nombre de usuario"
                            value={
                                form.username
                            }
                            onChange={(
                                event,
                            ) => {
                                updateField(
                                    "username",
                                    event.target
                                        .value,
                                );
                            }}
                            autoComplete="username"
                            disabled={
                                submitting
                            }
                            required
                            aria-required="true"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>

                    <AuthField
                        label="Cédula"
                        htmlFor="register-idnumber"
                        required
                        completed={
                            isIdNumberCompleted
                        }
                    >
                        <input
                            id="register-idnumber"
                            type="text"
                            inputMode="numeric"
                            maxLength={10}
                            placeholder="Ingrese su cédula"
                            value={
                                form.idnumber
                            }
                            onChange={(
                                event,
                            ) => {
                                updateField(
                                    "idnumber",
                                    event.target
                                        .value
                                        .replace(
                                            /\D/g,
                                            "",
                                        )
                                        .slice(
                                            0,
                                            10,
                                        ),
                                );
                            }}
                            autoComplete="off"
                            disabled={
                                submitting
                            }
                            required
                            aria-required="true"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>
                </div>

                <div
                    className={
                        AUTH_FORM_GRID_CLASS
                    }
                >
                    <AuthField
                        label="Nombres"
                        htmlFor="register-firstname"
                        required
                        completed={
                            isFirstnameCompleted
                        }
                    >
                        <input
                            id="register-firstname"
                            type="text"
                            placeholder="Tus nombres"
                            value={
                                form.firstname
                            }
                            onChange={(
                                event,
                            ) => {
                                updateField(
                                    "firstname",
                                    event.target
                                        .value,
                                );
                            }}
                            autoComplete="given-name"
                            disabled={
                                submitting
                            }
                            required
                            aria-required="true"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>

                    <AuthField
                        label="Apellidos"
                        htmlFor="register-lastname"
                        required
                        completed={
                            isLastnameCompleted
                        }
                    >
                        <input
                            id="register-lastname"
                            type="text"
                            placeholder="Tus apellidos"
                            value={
                                form.lastname
                            }
                            onChange={(
                                event,
                            ) => {
                                updateField(
                                    "lastname",
                                    event.target
                                        .value,
                                );
                            }}
                            autoComplete="family-name"
                            disabled={
                                submitting
                            }
                            required
                            aria-required="true"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>
                </div>

                <div
                    className={
                        AUTH_FORM_GRID_CLASS
                    }
                >
                    <AuthField
                        label="Correo electrónico"
                        htmlFor="register-email"
                        required
                        completed={
                            isEmailCompleted
                        }
                    >
                        <input
                            id="register-email"
                            type="email"
                            placeholder="ejemplo@correo.com"
                            value={
                                form.email
                            }
                            onChange={(
                                event,
                            ) => {
                                updateField(
                                    "email",
                                    event.target
                                        .value,
                                );
                            }}
                            autoComplete="email"
                            disabled={
                                submitting
                            }
                            required
                            aria-required="true"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>

                    <AuthField
                        label="Teléfono"
                        htmlFor="register-phone-number"
                        required
                        completed={
                            isPhoneCompleted
                        }
                    >
                        <input
                            id="register-phone-number"
                            type="tel"
                            inputMode="numeric"
                            maxLength={15}
                            placeholder="0999999999"
                            value={
                                form.phone_number
                            }
                            onChange={(
                                event,
                            ) => {
                                updateField(
                                    "phone_number",
                                    event.target
                                        .value
                                        .replace(
                                            /\D/g,
                                            "",
                                        )
                                        .slice(
                                            0,
                                            15,
                                        ),
                                );
                            }}
                            autoComplete="tel"
                            disabled={
                                submitting
                            }
                            required
                            aria-required="true"
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>
                </div>

                <AuthField
                    label="Contraseña"
                    htmlFor="register-password"
                    required
                    completed={
                        isPasswordCompleted
                    }
                >
                    <div className="relative">
                        <input
                            id="register-password"
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            placeholder="Mínimo 6 caracteres"
                            value={
                                form.password
                            }
                            onChange={(
                                event,
                            ) => {
                                updateField(
                                    "password",
                                    event.target
                                        .value,
                                );
                            }}
                            autoComplete="new-password"
                            disabled={
                                submitting
                            }
                            required
                            aria-required="true"
                            className={
                                AUTH_PASSWORD_INPUT_CLASS
                            }
                        />

                        <button
                            type="button"
                            onClick={() => {
                                setShowPassword(
                                    (
                                        previousValue,
                                    ) =>
                                        !previousValue,
                                );
                            }}
                            disabled={
                                submitting
                            }
                            className={
                                AUTH_PASSWORD_TOGGLE_CLASS
                            }
                            aria-label={
                                showPassword
                                    ? "Ocultar contraseña"
                                    : "Mostrar contraseña"
                            }
                        >
                            {showPassword ? (
                                <EyeOff
                                    className="h-[18px] w-[18px]"
                                />
                            ) : (
                                <Eye
                                    className="h-[18px] w-[18px]"
                                />
                            )}
                        </button>
                    </div>
                </AuthField>

                <AuthPrimaryButton
                    disabled={
                        submitting
                    }
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

            <div
                className={
                    AUTH_FOOTER_CLASS
                }
            >
                ¿Ya tienes cuenta?{" "}

                <Link
                    href="/login"
                    className={
                        AUTH_FOOTER_LINK_CLASS
                    }
                >
                    Inicia sesión
                </Link>
            </div>
        </AuthCard>
    );
}

export default RegisterForm;