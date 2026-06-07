"use client";

import Link from "next/link";
import {
    type FormEvent,
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2,
    Eye,
    EyeOff,
    FileText,
    Loader2,
    X,
} from "lucide-react";

import {
    AuthAlert,
    AuthCard,
    AuthField,
    AuthFormHeader,
    AuthInfoPanel,
    AuthPrimaryButton,
    AUTH_ACTION_CLASS,
    AUTH_FOOTER_CLASS,
    AUTH_FOOTER_LINK_CLASS,
    AUTH_FORM_STACK_CLASS,
    AUTH_INPUT_CLASS,
    AUTH_PASSWORD_INPUT_CLASS,
    AUTH_PASSWORD_TOGGLE_CLASS,
} from "@/components/auth/auth-ui";
import { useAuth } from "@/hooks/useAuth";
import {
    getDashboardRouteByRole,
} from "@/lib/auth";
import { notify } from "@/lib/notify";
import { loginService } from "@/services/auth.service";
import { API_URL } from "@/services/api-client.service";

import type {
    LoginResponse,
    UserRole,
} from "@/types/auth";

type LoginApiResponse = {
    accessToken?: string;
    access_token?: string;
    token?: string;
    refreshToken?: string | null;
    refresh_token?: string | null;
    tokenType?: string | null;
    token_type?: string | null;
    role_id?: number | string;
    role?: number | string;
    user?: {
        id: string | number;
        email?: string;
        username?: string;
        firstname?: string;
        lastname?: string;
        fullName?: string;
        phone_number?: string;
        role?: number | string;
        role_id?: number | string;
    };
};

type PrivacyPolicy = {
    id: number;
    title?: string;
    version?: string;
    file_url?: string;
    is_active?: boolean;
    mandatory?: boolean;
    effective_date?: string;
    deleted?: boolean;
    created_at?: string;
    updated_at?: string | null;
    content?: string;
    description?: string;
    body?: string;
};

const PRIVACY_POLICY_ENDPOINT =
    `${API_URL}/api/v1/privacy-policy`;

const USER_PRIVACY_POLICY_ENDPOINT =
    `${API_URL}/api/v1/user-privacy-policy`;

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function getErrorMessageFromData(
    data: unknown,
): string | null {
    if (
        typeof data === "string" &&
        data.trim()
    ) {
        return data.trim();
    }

    if (Array.isArray(data)) {
        for (const item of data) {
            const message =
                getErrorMessageFromData(item);

            if (message) {
                return message;
            }
        }

        return null;
    }

    if (!isRecord(data)) {
        return null;
    }

    const possibleMessages = [
        data.detail,
        data.message,
        data.error,
        data.msg,
    ];

    for (const value of possibleMessages) {
        const message =
            getErrorMessageFromData(value);

        if (message) {
            return message;
        }
    }

    return null;
}

function getErrorMessage(
    error: unknown,
    fallback: string,
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

    return fallback;
}

function getAuthHeaders(
    accessToken?: string,
) {
    const headers = new Headers();

    headers.set(
        "Accept",
        "application/json",
    );

    headers.set(
        "Content-Type",
        "application/json",
    );

    if (accessToken) {
        headers.set(
            "Authorization",
            `Bearer ${accessToken}`,
        );
    }

    return headers;
}

async function readApiResponse<T>(
    response: Response,
): Promise<T> {
    const text =
        await response.text();

    let data: unknown = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        const message =
            getErrorMessageFromData(data) ||
            "No se pudo completar la solicitud.";

        throw new Error(message);
    }

    return data as T;
}

function normalizeResourceUrl(
    url?: string | null,
) {
    if (!url) return "";

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")
    ) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${API_URL}${url}`;
    }

    return `${API_URL}/${url}`;
}

function resolveRole(
    rawRole: unknown,
): UserRole {
    const value =
        String(rawRole ?? "")
            .trim()
            .toLowerCase();

    if (
        value === "1" ||
        value === "admin" ||
        value === "administrador"
    ) {
        return "admin";
    }

    if (
        value === "3" ||
        value === "teacher" ||
        value === "docente" ||
        value === "profesor"
    ) {
        return "teacher";
    }

    return "student";
}

function resolveRoleId(
    value: unknown,
): number | null {
    const parsed =
        Number(value ?? 0);

    if (
        !Number.isFinite(parsed) ||
        parsed <= 0
    ) {
        return null;
    }

    return parsed;
}

function buildSession(
    response: LoginApiResponse,
): LoginResponse {
    const apiUser =
        response.user;

    if (!apiUser) {
        throw new Error(
            "La respuesta del login no contiene los datos del usuario.",
        );
    }

    const accessToken =
        response.accessToken ??
        response.access_token ??
        response.token ??
        "";

    if (!accessToken) {
        throw new Error(
            "La respuesta del login no contiene el token de acceso.",
        );
    }

    const firstname =
        apiUser.firstname?.trim() ??
        "";

    const lastname =
        apiUser.lastname?.trim() ??
        "";

    const email =
        apiUser.email?.trim() ??
        "";

    const username =
        apiUser.username?.trim() ||
        email ||
        "";

    const fullName =
        apiUser.fullName?.trim() ||
        `${firstname} ${lastname}`.trim() ||
        username ||
        "Usuario";

    return {
        accessToken,
        refreshToken:
            response.refreshToken ??
            response.refresh_token ??
            null,
        tokenType:
            response.tokenType ??
            response.token_type ??
            "Bearer",
        user: {
            id: String(
                apiUser.id ?? "",
            ),
            username,
            firstname,
            lastname,
            fullName,
            email,
            phone_number:
                apiUser.phone_number ??
                "",
            role: resolveRole(
                apiUser.role ??
                apiUser.role_id ??
                response.role ??
                response.role_id,
            ),
            role_id: resolveRoleId(
                apiUser.role_id ??
                response.role_id,
            ),
        },
    };
}

function getActivePolicyFromList(
    policies: PrivacyPolicy[],
): PrivacyPolicy | null {
    const activePolicies =
        policies
            .filter(
                (policy) =>
                    policy.is_active !==
                    false &&
                    policy.deleted !==
                    true,
            )
            .sort((a, b) => {
                const dateA =
                    new Date(
                        a.effective_date ??
                        a.created_at ??
                        "",
                    ).getTime();

                const dateB =
                    new Date(
                        b.effective_date ??
                        b.created_at ??
                        "",
                    ).getTime();

                return dateB - dateA;
            });

    return (
        activePolicies[0] ??
        null
    );
}

function normalizePolicyResponse(
    value: unknown,
): PrivacyPolicy | null {
    if (!value) return null;

    let data = value;

    if (isRecord(data)) {
        data =
            data.data ??
            data.policy ??
            data.privacyPolicy ??
            data.privacy_policy ??
            data.result ??
            data.results ??
            data.items ??
            data;
    }

    if (Array.isArray(data)) {
        const policies =
            data
                .filter(isRecord)
                .map(
                    (item) =>
                        item as PrivacyPolicy,
                );

        return getActivePolicyFromList(
            policies,
        );
    }

    if (!isRecord(data)) {
        return null;
    }

    return data as PrivacyPolicy;
}

async function getActivePrivacyPolicyDirect(
    accessToken: string,
): Promise<PrivacyPolicy | null> {
    let activeEndpointError: unknown = null;

    try {
        const response =
            await fetch(
                `${PRIVACY_POLICY_ENDPOINT}/active/current`,
                {
                    method: "GET",
                    headers:
                        getAuthHeaders(
                            accessToken,
                        ),
                    cache: "no-store",
                },
            );

        if (response.ok) {
            const data =
                await readApiResponse<unknown>(
                    response,
                );

            const policy =
                normalizePolicyResponse(
                    data,
                );

            if (
                policy &&
                policy.is_active !== false &&
                policy.deleted !== true
            ) {
                return policy;
            }
        } else if (
            response.status !== 404
        ) {
            await readApiResponse<unknown>(
                response,
            );
        }
    } catch (error) {
        activeEndpointError = error;
    }

    try {
        const response =
            await fetch(
                `${PRIVACY_POLICY_ENDPOINT}/`,
                {
                    method: "GET",
                    headers:
                        getAuthHeaders(
                            accessToken,
                        ),
                    cache: "no-store",
                },
            );

        const data =
            await readApiResponse<unknown>(
                response,
            );

        return normalizePolicyResponse(
            data,
        );
    } catch (error) {
        const message =
            getErrorMessage(
                error,
                getErrorMessage(
                    activeEndpointError,
                    "No se pudo verificar la política de privacidad activa.",
                ),
            );

        throw new Error(message);
    }
}

async function acceptPrivacyPolicyDirect(
    privacyPolicyId: number,
    accessToken: string,
) {
    const response =
        await fetch(
            `${USER_PRIVACY_POLICY_ENDPOINT}/accept/${privacyPolicyId}`,
            {
                method: "POST",
                headers:
                    getAuthHeaders(
                        accessToken,
                    ),
                body: JSON.stringify({
                    privacy_policy_id:
                        privacyPolicyId,
                    accepted: true,
                }),
                cache: "no-store",
            },
        );

    return readApiResponse<unknown>(
        response,
    );
}

async function checkActivePrivacyPolicyAcceptanceDirect(
    accessToken: string,
) {
    const response =
        await fetch(
            `${USER_PRIVACY_POLICY_ENDPOINT}/check-active`,
            {
                method: "GET",
                headers:
                    getAuthHeaders(
                        accessToken,
                    ),
                cache: "no-store",
            },
        );

    return readApiResponse<unknown>(
        response,
    );
}

function isAcceptanceValid(
    value: unknown,
): boolean {
    if (
        typeof value === "boolean"
    ) {
        return value;
    }

    if (
        typeof value === "number"
    ) {
        return value === 1;
    }

    if (
        typeof value === "string"
    ) {
        const normalized =
            value
                .trim()
                .toLowerCase();

        return (
            normalized === "accepted" ||
            normalized === "aceptado" ||
            normalized === "true" ||
            normalized === "1" ||
            normalized === "si" ||
            normalized === "sí"
        );
    }

    if (!isRecord(value)) {
        return false;
    }

    const possibleValues = [
        value.accepted,
        value.is_accepted,
        value.has_accepted,
        value.accepted_privacy_policy,
        value.privacy_policy_accepted,
        value.data,
        value.result,
    ];

    return possibleValues.some(
        (item) =>
            isAcceptanceValid(item),
    );
}

function isPolicyRequired(
    policy: PrivacyPolicy | null,
) {
    if (!policy) return false;

    if (
        typeof policy.mandatory ===
        "boolean"
    ) {
        return policy.mandatory;
    }

    return true;
}

function getPolicyContent(
    policy: PrivacyPolicy | null,
) {
    if (!policy) return "";

    return (
        policy.content ||
        policy.body ||
        policy.description ||
        ""
    );
}

function wait(
    milliseconds: number,
) {
    return new Promise<void>(
        (resolve) => {
            window.setTimeout(
                resolve,
                milliseconds,
            );
        },
    );
}

export function LoginForm() {
    const router =
        useRouter();

    const {
        user,
        loading,
        signIn,
    } = useAuth();

    const [
        username,
        setUsername,
    ] = useState("");

    const [
        password,
        setPassword,
    ] = useState("");

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        loadingPolicy,
        setLoadingPolicy,
    ] = useState(false);

    const [
        modalError,
        setModalError,
    ] = useState("");

    const [
        privacyPolicy,
        setPrivacyPolicy,
    ] =
        useState<PrivacyPolicy | null>(
            null,
        );

    const [
        showPrivacyModal,
        setShowPrivacyModal,
    ] = useState(false);

    const [
        acceptingPolicy,
        setAcceptingPolicy,
    ] = useState(false);

    const [
        pendingSession,
        setPendingSession,
    ] =
        useState<LoginResponse | null>(
            null,
        );

    const [
        policyChecked,
        setPolicyChecked,
    ] = useState(false);

    useEffect(() => {
        if (
            !loading &&
            user &&
            !showPrivacyModal &&
            !pendingSession
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
        showPrivacyModal,
        pendingSession,
    ]);

    async function hasAcceptedCurrentPolicy(
        accessToken: string,
    ): Promise<boolean> {
        try {
            const response =
                await checkActivePrivacyPolicyAcceptanceDirect(
                    accessToken,
                );

            return isAcceptanceValid(
                response,
            );
        } catch {
            return false;
        }
    }

    async function confirmAcceptedPolicy(
        accessToken: string,
    ): Promise<boolean> {
        for (
            let attempt = 0;
            attempt < 3;
            attempt += 1
        ) {
            const accepted =
                await hasAcceptedCurrentPolicy(
                    accessToken,
                );

            if (accepted) {
                return true;
            }

            await wait(350);
        }

        return false;
    }

    function finishLogin(
        session: LoginResponse,
    ) {
        setShowPrivacyModal(false);
        setPendingSession(null);
        setPrivacyPolicy(null);
        setPolicyChecked(false);
        setModalError("");

        signIn(session);

        const displayName =
            session.user.fullName ||
            session.user.username ||
            "Usuario";

        notify.success(
            "Inicio de sesión exitoso.",
            `Bienvenido, ${displayName}.`,
        );

        router.replace(
            getDashboardRouteByRole(
                session.user.role,
            ),
        );
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            submitting ||
            loadingPolicy
        ) {
            return;
        }

        setModalError("");
        setPolicyChecked(false);

        if (
            !username.trim() ||
            !password.trim()
        ) {
            notify.warning(
                "Completa tus credenciales.",
                "Ingresa tu usuario y contraseña para continuar.",
            );

            return;
        }

        try {
            setSubmitting(true);

            const response =
                (await loginService({
                    username:
                        username.trim(),
                    password,
                })) as LoginApiResponse;

            const session =
                buildSession(response);

            setLoadingPolicy(true);

            const activePolicy =
                await getActivePrivacyPolicyDirect(
                    session.accessToken,
                );

            if (
                !activePolicy ||
                !isPolicyRequired(
                    activePolicy,
                )
            ) {
                finishLogin(session);
                return;
            }

            const alreadyAccepted =
                await hasAcceptedCurrentPolicy(
                    session.accessToken,
                );

            if (alreadyAccepted) {
                finishLogin(session);
                return;
            }

            setPrivacyPolicy(
                activePolicy,
            );

            setPendingSession(
                session,
            );

            setShowPrivacyModal(
                true,
            );

            setModalError(
                "Debes aceptar la política de privacidad para ingresar.",
            );

            notify.info(
                "Política de privacidad pendiente.",
                "Revisa el documento y acepta la política para continuar.",
            );
        } catch (error) {
            notify.error(
                "No se pudo iniciar sesión.",
                getErrorMessage(
                    error,
                    "Verifica tus credenciales e intenta nuevamente.",
                ),
            );
        } finally {
            setSubmitting(false);
            setLoadingPolicy(false);
        }
    }

    async function handleAcceptPolicy() {
        setModalError("");

        if (!privacyPolicy) {
            const message =
                "No se encontró la política de privacidad.";

            setModalError(message);

            notify.error(
                "No se pudo continuar.",
                message,
            );

            return;
        }

        if (!policyChecked) {
            const message =
                "Marca la casilla para aceptar la política.";

            setModalError(message);

            notify.warning(
                "Aceptación pendiente.",
                message,
            );

            return;
        }

        try {
            setAcceptingPolicy(true);

            let session =
                pendingSession;

            if (!session) {
                if (
                    !username.trim() ||
                    !password.trim()
                ) {
                    const message =
                        "Primero ingresa tu usuario y contraseña.";

                    setModalError(
                        message,
                    );

                    notify.warning(
                        "Credenciales requeridas.",
                        message,
                    );

                    return;
                }

                const response =
                    (await loginService({
                        username:
                            username.trim(),
                        password,
                    })) as LoginApiResponse;

                session =
                    buildSession(
                        response,
                    );
            }

            await acceptPrivacyPolicyDirect(
                privacyPolicy.id,
                session.accessToken,
            );

            const confirmed =
                await confirmAcceptedPolicy(
                    session.accessToken,
                );

            if (!confirmed) {
                const message =
                    "La aceptación fue enviada, pero todavía no pudo confirmarse. Intenta nuevamente.";

                setModalError(
                    message,
                );

                notify.warning(
                    "No se confirmó la aceptación.",
                    message,
                );

                return;
            }

            finishLogin(session);
        } catch (error) {
            const message =
                getErrorMessage(
                    error,
                    "No se pudo aceptar la política de privacidad.",
                );

            setModalError(message);

            notify.error(
                "No se pudo guardar la aceptación.",
                message,
            );
        } finally {
            setAcceptingPolicy(false);
        }
    }

    function closePrivacyModal() {
        if (acceptingPolicy) {
            return;
        }

        setShowPrivacyModal(false);
        setPendingSession(null);
        setPrivacyPolicy(null);
        setModalError("");
        setPolicyChecked(false);

        notify.info(
            "Ingreso cancelado.",
            "Debes aceptar la política de privacidad para acceder a la plataforma.",
        );
    }

    const privacyPolicyUrl =
        normalizeResourceUrl(
            privacyPolicy?.file_url,
        );

    const privacyPolicyContent =
        getPolicyContent(
            privacyPolicy,
        );

    const isSubmitting =
        submitting ||
        loadingPolicy;

    return (
        <>
            <AuthCard>
                <AuthFormHeader
                    title="Iniciar sesión"
                    description="Accede con tu usuario y contraseña para continuar."
                />

                <form
                    className={
                        AUTH_FORM_STACK_CLASS
                    }
                    onSubmit={
                        handleSubmit
                    }
                >
                    <AuthField
                        label="Usuario"
                        htmlFor="login-username"
                    >
                        <input
                            id="login-username"
                            type="text"
                            value={
                                username
                            }
                            onChange={(
                                event,
                            ) => {
                                setUsername(
                                    event
                                        .target
                                        .value,
                                );

                                setPendingSession(
                                    null,
                                );

                                setPolicyChecked(
                                    false,
                                );

                                setModalError(
                                    "",
                                );
                            }}
                            placeholder="Ingresa tu usuario"
                            autoComplete="username"
                            disabled={
                                isSubmitting
                            }
                            className={
                                AUTH_INPUT_CLASS
                            }
                        />
                    </AuthField>

                    <AuthField
                        label="Contraseña"
                        htmlFor="login-password"
                        action={
                            <Link
                                href="/forgot-password"
                                className={
                                    AUTH_ACTION_CLASS
                                }
                            >
                                ¿Olvidaste tu
                                contraseña?
                            </Link>
                        }
                    >
                        <div className="relative">
                            <input
                                id="login-password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={
                                    password
                                }
                                onChange={(
                                    event,
                                ) => {
                                    setPassword(
                                        event
                                            .target
                                            .value,
                                    );

                                    setPendingSession(
                                        null,
                                    );

                                    setPolicyChecked(
                                        false,
                                    );

                                    setModalError(
                                        "",
                                    );
                                }}
                                placeholder="Ingresa tu contraseña"
                                autoComplete="current-password"
                                disabled={
                                    isSubmitting
                                }
                                className={
                                    AUTH_PASSWORD_INPUT_CLASS
                                }
                            />

                            <button
                                type="button"
                                onClick={() => {
                                    setShowPassword(
                                        (
                                            previous,
                                        ) =>
                                            !previous,
                                    );
                                }}
                                disabled={
                                    isSubmitting
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
                                        size={
                                            18
                                        }
                                    />
                                ) : (
                                    <Eye
                                        size={
                                            18
                                        }
                                    />
                                )}
                            </button>
                        </div>
                    </AuthField>

                    <AuthInfoPanel
                        icon={
                            <FileText className="h-4 w-4" />
                        }
                        title="Política de privacidad"
                    >
                        Si tienes una política
                        pendiente, se mostrará
                        después de validar tus
                        credenciales.
                    </AuthInfoPanel>

                    <AuthPrimaryButton
                        disabled={
                            isSubmitting
                        }
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />

                                {loadingPolicy
                                    ? "Verificando política..."
                                    : "Validando acceso..."}
                            </span>
                        ) : (
                            "Entrar al sistema"
                        )}
                    </AuthPrimaryButton>
                </form>

                <div
                    className={
                        AUTH_FOOTER_CLASS
                    }
                >
                    ¿No tienes cuenta?{" "}

                    <Link
                        href="/register"
                        className={
                            AUTH_FOOTER_LINK_CLASS
                        }
                    >
                        Regístrate
                    </Link>
                </div>
            </AuthCard>

            {showPrivacyModal &&
                privacyPolicy ? (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 p-3 sm:p-5">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="privacy-policy-title"
                        className="flex h-[92dvh] max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl sm:rounded-[26px]"
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#003d8f]">
                                    Política
                                    pendiente
                                </p>

                                <h2
                                    id="privacy-policy-title"
                                    className="mt-1 text-lg font-black text-slate-900 sm:text-xl"
                                >
                                    {privacyPolicy
                                        .title ||
                                        "Política de privacidad"}
                                </h2>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                                    <span>
                                        Versión{" "}
                                        {privacyPolicy
                                            .version ||
                                            "actual"}
                                    </span>

                                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                                        Obligatoria
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closePrivacyModal
                                }
                                disabled={
                                    acceptingPolicy
                                }
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label="Cerrar política"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-hidden bg-slate-100">
                            {privacyPolicyUrl ? (
                                <iframe
                                    title="Política de privacidad"
                                    src={
                                        privacyPolicyUrl
                                    }
                                    className="h-full w-full border-0 bg-white"
                                />
                            ) : privacyPolicyContent ? (
                                <div className="h-full overflow-y-auto whitespace-pre-line bg-white p-4 text-sm leading-7 text-slate-700 sm:p-7">
                                    {
                                        privacyPolicyContent
                                    }
                                </div>
                            ) : (
                                <div className="flex h-full items-center justify-center p-4 text-center sm:p-6">
                                    <div className="max-w-md rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                                        <FileText className="mx-auto h-10 w-10 text-slate-300" />

                                        <p className="mt-3 text-sm font-semibold text-slate-600">
                                            No existe un
                                            documento o
                                            contenido
                                            disponible para
                                            esta política.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <footer className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
                            {modalError ? (
                                <div className="mb-3">
                                    <AuthAlert
                                        variant="warning"
                                    >
                                        {
                                            modalError
                                        }
                                    </AuthAlert>
                                </div>
                            ) : null}

                            <div className="flex flex-col gap-4">
                                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                    <input
                                        type="checkbox"
                                        checked={
                                            policyChecked
                                        }
                                        disabled={
                                            acceptingPolicy
                                        }
                                        onChange={(
                                            event,
                                        ) => {
                                            setPolicyChecked(
                                                event
                                                    .target
                                                    .checked,
                                            );

                                            if (
                                                event
                                                    .target
                                                    .checked
                                            ) {
                                                setModalError(
                                                    "",
                                                );
                                            }
                                        }}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#003d8f] focus:ring-[#003d8f]"
                                    />

                                    <span className="text-sm font-semibold leading-6 text-slate-700">
                                        He leído y acepto
                                        la política de
                                        privacidad.
                                    </span>
                                </label>

                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs leading-5 text-slate-500">
                                        Debes aceptar la
                                        política para
                                        continuar.
                                    </p>

                                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                                        <button
                                            type="button"
                                            onClick={
                                                closePrivacyModal
                                            }
                                            disabled={
                                                acceptingPolicy
                                            }
                                            className="h-11 rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            Cancelar
                                        </button>

                                        <button
                                            type="button"
                                            disabled={
                                                acceptingPolicy ||
                                                !policyChecked
                                            }
                                            onClick={() => {
                                                void handleAcceptPolicy();
                                            }}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                                        >
                                            {acceptingPolicy ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />

                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4" />

                                                    Aceptar y
                                                    continuar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </section>
                </div>
            ) : null}
        </>
    );
}