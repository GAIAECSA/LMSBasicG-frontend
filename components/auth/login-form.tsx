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

import { getDashboardRouteByRole } from "@/lib/auth";
import { loginService } from "@/services/auth.service";
import { useAuth } from "@/hooks/useAuth";

import type {
    LoginResponse,
    UserRole,
} from "@/types/auth";

type LoginApiResponse = {
    accessToken?: string;
    access_token?: string;
    token?: string;
    role_id?: number | string;
    role?: number | string;
    user?: {
        id: string | number;
        email: string;
        username?: string;
        firstname?: string;
        lastname?: string;
        fullName?: string;
        role?: number | string;
        role_id?: number | string;
    };
};

type PrivacyPolicy = {
    id: number;
    title: string;
    version: string;
    file_url: string;
    is_active: boolean;
    mandatory: boolean;
    effective_date: string;
    deleted: boolean;
    created_at?: string;
    updated_at?: string | null;
    content?: string;
    description?: string;
    body?: string;
};

const RAW_API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://213.165.74.184:9002";

const API_URL = RAW_API_URL
    .replace(/\/$/, "")
    .replace(/\/api\/v1$/, "");

const PRIVACY_POLICY_ENDPOINT =
    `${API_URL}/api/v1/privacy-policy`;

const USER_PRIVACY_POLICY_ENDPOINT =
    `${API_URL}/api/v1/user-privacy-policy`;

function getAuthHeaders(accessToken?: string) {
    const headers = new Headers();

    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`);
    }

    return headers;
}

async function readApiResponse<T>(
    response: Response,
): Promise<T> {
    const text = await response.text();

    let data: unknown = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!response.ok) {
        let message = "No se pudo completar la solicitud.";

        if (
            data &&
            typeof data === "object" &&
            "detail" in data
        ) {
            const detail =
                (data as { detail?: unknown }).detail;

            if (typeof detail === "string") {
                message = detail;
            }
        } else if (
            data &&
            typeof data === "object" &&
            "message" in data
        ) {
            const apiMessage =
                (data as { message?: unknown }).message;

            if (typeof apiMessage === "string") {
                message = apiMessage;
            }
        } else if (typeof data === "string") {
            message = data;
        }

        throw new Error(message);
    }

    return data as T;
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function normalizeResourceUrl(url?: string | null) {
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

function resolveRole(rawRole: unknown): UserRole {
    const value = String(rawRole ?? "")
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

function buildSession(
    response: LoginApiResponse,
): LoginResponse {
    const apiUser = response.user;

    if (!apiUser) {
        throw new Error(
            "La respuesta del login no contiene usuario.",
        );
    }

    const accessToken =
        response.accessToken ??
        response.access_token ??
        response.token ??
        "";

    if (!accessToken) {
        throw new Error(
            "La respuesta del login no contiene token.",
        );
    }

    const firstname =
        apiUser.firstname?.trim() ?? "";

    const lastname =
        apiUser.lastname?.trim() ?? "";

    const fullName =
        apiUser.fullName?.trim() ||
        `${firstname} ${lastname}`.trim() ||
        apiUser.username?.trim() ||
        apiUser.email?.trim() ||
        "Usuario";

    return {
        accessToken,
        refreshToken: null,
        tokenType: "Bearer",
        user: {
            id: String(apiUser.id ?? ""),
            username:
                apiUser.username?.trim() ||
                apiUser.email?.trim() ||
                "",
            firstname,
            lastname,
            fullName,
            email: apiUser.email || "",
            phone_number: "",
            role: resolveRole(
                apiUser.role ??
                apiUser.role_id ??
                response.role ??
                response.role_id,
            ),
            role_id: Number(
                apiUser.role_id ??
                response.role_id ??
                0,
            ),
        },
    };
}

function getActivePolicyFromList(
    policies: PrivacyPolicy[],
): PrivacyPolicy | null {
    const activePolicies = policies
        .filter(
            (policy) =>
                policy.is_active === true &&
                policy.deleted !== true,
        )
        .sort((a, b) => {
            const dateA = new Date(
                a.effective_date ??
                a.created_at ??
                "",
            ).getTime();

            const dateB = new Date(
                b.effective_date ??
                b.created_at ??
                "",
            ).getTime();

            return dateB - dateA;
        });

    return activePolicies[0] ?? null;
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
            data;
    }

    if (Array.isArray(data)) {
        return getActivePolicyFromList(
            data.filter(isRecord) as PrivacyPolicy[],
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
    try {
        const response = await fetch(
            `${PRIVACY_POLICY_ENDPOINT}/active/current`,
            {
                method: "GET",
                headers: getAuthHeaders(accessToken),
                cache: "no-store",
            },
        );

        if (response.ok) {
            const data =
                await readApiResponse<unknown>(response);

            const policy =
                normalizePolicyResponse(data);

            if (
                policy &&
                policy.is_active !== false &&
                policy.deleted !== true
            ) {
                return policy;
            }
        }
    } catch {
        // Si falla active/current, intenta con el listado.
    }

    try {
        const response = await fetch(
            `${PRIVACY_POLICY_ENDPOINT}/`,
            {
                method: "GET",
                headers: getAuthHeaders(accessToken),
                cache: "no-store",
            },
        );

        const data =
            await readApiResponse<unknown>(response);

        return normalizePolicyResponse(data);
    } catch {
        return null;
    }
}

async function acceptPrivacyPolicyDirect(
    privacyPolicyId: number,
    accessToken: string,
) {
    const response = await fetch(
        `${USER_PRIVACY_POLICY_ENDPOINT}/accept/${privacyPolicyId}`,
        {
            method: "POST",
            headers: getAuthHeaders(accessToken),
            body: JSON.stringify({
                privacy_policy_id: privacyPolicyId,
                accepted: true,
            }),
            cache: "no-store",
        },
    );

    return readApiResponse<unknown>(response);
}

async function checkActivePrivacyPolicyAcceptanceDirect(
    accessToken: string,
) {
    const response = await fetch(
        `${USER_PRIVACY_POLICY_ENDPOINT}/check-active`,
        {
            method: "GET",
            headers: getAuthHeaders(accessToken),
            cache: "no-store",
        },
    );

    return readApiResponse<unknown>(response);
}

function isAcceptanceValid(value: unknown) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value
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

    if (isRecord(value)) {
        return (
            value.accepted === true ||
            value.is_accepted === true ||
            value.has_accepted === true ||
            value.accepted_privacy_policy === true ||
            value.privacy_policy_accepted === true
        );
    }

    return false;
}

function isPolicyRequired(policy: PrivacyPolicy | null) {
    if (!policy) return false;

    if (typeof policy.mandatory === "boolean") {
        return policy.mandatory;
    }

    return true;
}

function getPolicyContent(policy: PrivacyPolicy | null) {
    if (!policy) return "";

    return (
        policy.content ||
        policy.body ||
        policy.description ||
        ""
    );
}

function wait(milliseconds: number) {
    return new Promise<void>((resolve) => {
        window.setTimeout(resolve, milliseconds);
    });
}

export function LoginForm() {
    const router = useRouter();

    const {
        user,
        loading,
        signIn,
    } = useAuth();

    const [username, setUsername] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [modalError, setModalError] =
        useState("");

    const [privacyPolicy, setPrivacyPolicy] =
        useState<PrivacyPolicy | null>(null);

    const [loadingPolicy, setLoadingPolicy] =
        useState(false);

    const [showPrivacyModal, setShowPrivacyModal] =
        useState(false);

    const [acceptingPolicy, setAcceptingPolicy] =
        useState(false);

    const [pendingSession, setPendingSession] =
        useState<LoginResponse | null>(null);

    const [policyChecked, setPolicyChecked] =
        useState(false);

    useEffect(() => {
        if (
            !loading &&
            user &&
            !showPrivacyModal &&
            !pendingSession
        ) {
            router.replace(
                getDashboardRouteByRole(user.role),
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

            return isAcceptanceValid(response);
        } catch {
            return false;
        }
    }

    async function confirmAcceptedPolicy(
        accessToken: string,
    ): Promise<boolean> {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            const accepted =
                await hasAcceptedCurrentPolicy(accessToken);

            if (accepted) {
                return true;
            }

            await wait(350);
        }

        return false;
    }

    function finishLogin(session: LoginResponse) {
        signIn(session);

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

        setError("");
        setModalError("");
        setPolicyChecked(false);

        if (!username.trim() || !password.trim()) {
            setError(
                "Primero ingresa tu usuario y contraseña.",
            );

            return;
        }

        try {
            setSubmitting(true);

            const response =
                (await loginService({
                    username: username.trim(),
                    password,
                })) as LoginApiResponse;

            const session = buildSession(response);

            const activePolicy =
                await getActivePrivacyPolicyDirect(
                    session.accessToken,
                );

            if (
                !activePolicy ||
                !isPolicyRequired(activePolicy)
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

            setPrivacyPolicy(activePolicy);
            setPendingSession(session);
            setShowPrivacyModal(true);
            setModalError(
                "Debes aceptar la política para ingresar.",
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudo iniciar sesión.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleAcceptPolicy() {
        setError("");
        setModalError("");

        if (!privacyPolicy) {
            setModalError(
                "No se encontró la política de privacidad.",
            );

            return;
        }

        if (!policyChecked) {
            setModalError(
                "Marca la casilla para aceptar la política.",
            );

            return;
        }

        try {
            setAcceptingPolicy(true);

            let session = pendingSession;

            if (!session) {
                if (!username.trim() || !password.trim()) {
                    setModalError(
                        "Primero ingresa tu usuario y contraseña.",
                    );

                    return;
                }

                const response =
                    (await loginService({
                        username: username.trim(),
                        password,
                    })) as LoginApiResponse;

                session = buildSession(response);
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
                setModalError(
                    "La aceptación fue enviada, pero el servidor todavía responde en false.",
                );

                return;
            }

            setShowPrivacyModal(false);
            setPendingSession(null);
            setPolicyChecked(false);

            finishLogin(session);
        } catch (err) {
            setModalError(
                err instanceof Error
                    ? err.message
                    : "No se pudo aceptar la política.",
            );
        } finally {
            setAcceptingPolicy(false);
        }
    }

    function closePrivacyModal() {
        if (acceptingPolicy) return;

        setShowPrivacyModal(false);
        setModalError("");
        setPolicyChecked(false);
    }

    const privacyPolicyUrl =
        normalizeResourceUrl(
            privacyPolicy?.file_url,
        );

    const privacyPolicyContent =
        getPolicyContent(privacyPolicy);

    return (
        <>
            <div className="rounded-[22px] border border-white/70 bg-white/90 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-md sm:rounded-[28px] sm:p-6 lg:p-8">
                <div className="mb-6 sm:mb-7">
                    <span className="inline-flex rounded-full bg-[#edf3ff] px-3 py-1 text-[11px] font-semibold text-[#4a6db3] shadow-sm">
                        LMS BasicG
                    </span>

                    <h2 className="mt-4 text-[28px] font-bold text-slate-950">
                        Iniciar sesión
                    </h2>

                    <p className="mt-3 text-sm text-slate-500">
                        Accede con tu usuario y contraseña.
                    </p>
                </div>

                <form
                    className="space-y-5"
                    onSubmit={handleSubmit}
                >
                    {error ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                            {error}
                        </div>
                    ) : null}

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                            Usuario
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(event) => {
                                setUsername(
                                    event.target.value,
                                );
                                setPendingSession(null);
                                setPolicyChecked(false);
                                setError("");
                                setModalError("");
                            }}
                            placeholder="Ingresa tu usuario"
                            autoComplete="username"
                            className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff]"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-sm font-semibold text-slate-700">
                                Contraseña
                            </label>

                            <Link
                                href="/forgot-password"
                                className="text-xs font-semibold text-[#003d8f] hover:underline"
                            >
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <div className="relative">
                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(event) => {
                                    setPassword(
                                        event.target.value,
                                    );
                                    setPendingSession(null);
                                    setPolicyChecked(false);
                                    setError("");
                                    setModalError("");
                                }}
                                placeholder="Ingresa tu contraseña"
                                autoComplete="current-password"
                                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4d7ce5] focus:ring-4 focus:ring-[#d9e6ff]"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        (previous) =>
                                            !previous,
                                    )
                                }
                                className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-slate-400 transition hover:text-slate-700"
                                aria-label={
                                    showPassword
                                        ? "Ocultar contraseña"
                                        : "Mostrar contraseña"
                                }
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#003d8f] shadow-sm">
                                <FileText className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800">
                                    Política de privacidad
                                </p>

                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Si tienes una política pendiente, se mostrará después de validar tus datos.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || loadingPolicy}
                        className="flex h-12 w-full items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#003d8f_0%,#002a66_100%)] px-4 text-sm font-bold text-white shadow-lg shadow-blue-950/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Validando...
                            </span>
                        ) : (
                            "Entrar al sistema"
                        )}
                    </button>
                </form>

                <div className="mt-5 text-center text-sm text-slate-500">
                    ¿No tienes cuenta?{" "}
                    <Link
                        href="/register"
                        className="font-bold text-[#003d8f] hover:underline"
                    >
                        Regístrate
                    </Link>
                </div>
            </div>

            {showPrivacyModal && privacyPolicy ? (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 p-3 sm:p-5">
                    <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
                            <div className="min-w-0">
                                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#003d8f]">
                                    Política pendiente
                                </p>

                                <h2 className="mt-1 text-lg font-black text-slate-900 sm:text-xl">
                                    {privacyPolicy.title ||
                                        "Política de privacidad"}
                                </h2>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                                    <span>
                                        Versión {privacyPolicy.version}
                                    </span>

                                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                                        Obligatoria
                                    </span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closePrivacyModal}
                                disabled={acceptingPolicy}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                                aria-label="Cerrar política"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden bg-slate-100">
                            {privacyPolicyUrl ? (
                                <iframe
                                    title="Política de privacidad"
                                    src={privacyPolicyUrl}
                                    className="h-full w-full border-0 bg-white"
                                />
                            ) : privacyPolicyContent ? (
                                <div className="h-full overflow-y-auto whitespace-pre-line bg-white p-5 text-sm leading-7 text-slate-700 sm:p-7">
                                    {privacyPolicyContent}
                                </div>
                            ) : (
                                <div className="flex h-full items-center justify-center p-6 text-center">
                                    <div className="max-w-md rounded-3xl bg-white p-6 shadow-sm">
                                        <FileText className="mx-auto h-10 w-10 text-slate-300" />

                                        <p className="mt-3 text-sm font-semibold text-slate-600">
                                            No existe documento o contenido para esta política.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
                            {modalError ? (
                                <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    {modalError}
                                </div>
                            ) : null}

                            <div className="flex flex-col gap-4">
                                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                    <input
                                        type="checkbox"
                                        checked={policyChecked}
                                        disabled={acceptingPolicy}
                                        onChange={(event) => {
                                            setPolicyChecked(
                                                event.target.checked,
                                            );

                                            if (event.target.checked) {
                                                setModalError("");
                                                setError("");
                                            }
                                        }}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#003d8f] focus:ring-[#003d8f]"
                                    />

                                    <span className="text-sm font-semibold leading-6 text-slate-700">
                                        Acepto la política de privacidad.
                                    </span>
                                </label>

                                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-xs leading-5 text-slate-500">
                                        Debes aceptar para continuar.
                                    </p>

                                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                                        <button
                                            type="button"
                                            onClick={closePrivacyModal}
                                            disabled={acceptingPolicy}
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
                                                    Aceptar y continuar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}