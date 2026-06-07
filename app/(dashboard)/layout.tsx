"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type FormEvent,
    type ReactNode,
} from "react";
import {
    usePathname,
    useRouter,
} from "next/navigation";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AthenaLoadingBackground } from "@/components/ui/AthenaLoadingBackground";
import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/notify";
import {
    hasAcceptedTeacherEnrollmentByUserAndCourse,
} from "@/services/enrollments.service";
import {
    acceptPrivacyPolicy,
    confirmActivePrivacyPolicyAcceptance,
    createPrivacyPolicyPdfPreviewUrl,
    getActivePrivacyPolicy,
    resolvePrivacyPolicyFileUrl,
    type PrivacyPolicy,
} from "@/services/privacy-policy.service";
import type { UserRole } from "@/types/auth";

type DashboardLayoutProps = {
    children: ReactNode;
};

type PrivacyValidationState =
    | "checking"
    | "pending"
    | "accepted"
    | "error";

type MixedTeacherAccessStatus =
    | "checking"
    | "allowed"
    | "denied"
    | "error";

type MixedTeacherAccessState = {
    userId: number | null;
    courseId: number | null;
    status: MixedTeacherAccessStatus;
};

const ROLE_HOME_ROUTE: Record<
    UserRole,
    string
> = {
    admin: "/admin",
    teacher: "/teacher",
    student: "/student",
};

function isUserRole(
    value?: string | null,
): value is UserRole {
    return (
        value === "admin" ||
        value === "teacher" ||
        value === "student"
    );
}

function getPathSegments(
    path?: string | null,
): string[] {
    if (!path) return [];

    const normalized =
        path === "/"
            ? "/"
            : path.replace(/\/+$/, "");

    if (
        !normalized ||
        normalized === "/"
    ) {
        return [];
    }

    return normalized
        .split("/")
        .filter(Boolean);
}

function getRouteRole(
    pathname: string,
): UserRole | null {
    const segments =
        getPathSegments(pathname);

    if (segments[0] === "admin") {
        return "admin";
    }

    if (segments[0] === "teacher") {
        return "teacher";
    }

    if (segments[0] === "student") {
        return "student";
    }

    return null;
}

function getTeacherCourseIdFromPathname(
    pathname: string,
): number | null {
    const match =
        pathname.match(
            /^\/teacher\/courses\/([^/]+)(?:\/|$)/,
        );

    if (!match?.[1]) {
        return null;
    }

    const courseId =
        Number(match[1]);

    if (
        !Number.isInteger(courseId) ||
        courseId <= 0
    ) {
        return null;
    }

    return courseId;
}

function getEffectiveRoleByPathname(
    userRole: UserRole,
    pathname: string,
): UserRole {
    return (
        getRouteRole(pathname) ??
        userRole
    );
}

function getRoleLabel(
    role?: UserRole | string,
) {
    if (role === "admin") {
        return "Admin";
    }

    if (role === "teacher") {
        return "Profesor";
    }

    if (role === "student") {
        return "Estudiante";
    }

    return "Usuario";
}

function getUserFullName(
    user: unknown,
) {
    if (
        !user ||
        typeof user !== "object"
    ) {
        return "Usuario";
    }

    const value = user as {
        firstname?: string;
        lastname?: string;
        fullName?: string;
        name?: string;
        username?: string;
        email?: string;
    };

    const fullName =
        `${value.firstname ?? ""} ${value.lastname ?? ""}`.trim();

    return (
        value.fullName ||
        fullName ||
        value.name ||
        value.username ||
        value.email?.split("@")[0] ||
        "Usuario"
    );
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

    return fallback;
}

function SessionVerificationScreen() {
    return (
        <AthenaLoadingBackground>
            <div className="rounded-2xl border border-[var(--border)] bg-white/95 px-6 py-4 text-center text-sm font-semibold text-[var(--muted-foreground)] shadow-sm backdrop-blur-sm">
                Verificando sesión y permisos...
            </div>
        </AthenaLoadingBackground>
    );
}

type PrivacyPolicyModalProps = {
    policy: PrivacyPolicy;
    accessToken: string;
    accepted: boolean;
    isSubmitting: boolean;
    onAcceptedChange: (
        accepted: boolean,
    ) => void;
    onSubmit: (
        event: FormEvent<HTMLFormElement>,
    ) => void;
    onLogout: () => void;
};

function PrivacyPolicyModal({
    policy,
    accessToken,
    accepted,
    isSubmitting,
    onAcceptedChange,
    onSubmit,
    onLogout,
}: PrivacyPolicyModalProps) {
    const resolvedFileUrl =
        resolvePrivacyPolicyFileUrl(
            policy.file_url,
        );

    const [
        previewState,
        setPreviewState,
    ] = useState<{
        status:
        | "loading"
        | "ready"
        | "error";
        previewUrl: string;
        errorMessage: string;
    }>(() => ({
        status: resolvedFileUrl
            ? "loading"
            : "error",
        previewUrl: "",
        errorMessage:
            resolvedFileUrl
                ? ""
                : "La política no tiene un archivo PDF asociado.",
    }));

    useEffect(() => {
        let isMounted = true;
        let generatedBlobUrl = "";

        if (!resolvedFileUrl) {
            return;
        }

        async function loadPdfPreview() {
            try {
                generatedBlobUrl =
                    await createPrivacyPolicyPdfPreviewUrl(
                        resolvedFileUrl,
                        accessToken,
                    );

                if (!isMounted) {
                    URL.revokeObjectURL(
                        generatedBlobUrl,
                    );

                    generatedBlobUrl =
                        "";

                    return;
                }

                setPreviewState({
                    status: "ready",
                    previewUrl:
                        generatedBlobUrl,
                    errorMessage: "",
                });
            } catch (error) {
                if (!isMounted) {
                    return;
                }

                setPreviewState({
                    status: "error",
                    previewUrl: "",
                    errorMessage:
                        getErrorMessage(
                            error,
                            "No se pudo cargar la vista previa del PDF.",
                        ),
                });
            }
        }

        void loadPdfPreview();

        return () => {
            isMounted = false;

            if (generatedBlobUrl) {
                URL.revokeObjectURL(
                    generatedBlobUrl,
                );
            }
        };
    }, [
        resolvedFileUrl,
        accessToken,
    ]);

    const previewUrl =
        previewState.previewUrl;

    const isLoadingPreview =
        previewState.status ===
        "loading";

    const previewError =
        previewState.errorMessage;

    const documentOpenUrl =
        previewUrl ||
        resolvedFileUrl;

    return (
        <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#F8FAFC] p-3 sm:p-5">
            <form
                onSubmit={onSubmit}
                className="flex max-h-[96dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            >
                <div className="shrink-0 bg-gradient-to-r from-[#07111F] via-[#172861] to-[#E9702C] px-5 py-4 text-white sm:px-6 sm:py-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">
                        Seguridad y privacidad
                    </p>

                    <h1 className="mt-2 text-xl font-black sm:text-2xl">
                        Política de privacidad pendiente
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-white/85">
                        Debes revisar y aceptar la política vigente antes de continuar en la plataforma.
                    </p>
                </div>

                <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.7fr)]">
                    <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:border-b-0 lg:border-r lg:p-6">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#172861]">
                                Documento vigente
                            </p>

                            <h2 className="mt-2 text-base font-black text-slate-950">
                                {policy.title}
                            </h2>

                            <p className="mt-1 text-sm text-slate-600">
                                Versión {policy.version}
                            </p>

                            {documentOpenUrl ? (
                                <a
                                    href={
                                        documentOpenUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[#172861]/20 bg-white px-4 py-2 text-center text-sm font-bold text-[#172861] transition hover:bg-[#172861] hover:text-white"
                                >
                                    Abrir PDF en otra pestaña
                                </a>
                            ) : null}
                        </div>

                        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                            <input
                                type="checkbox"
                                checked={accepted}
                                disabled={isSubmitting}
                                onChange={(event) => {
                                    onAcceptedChange(
                                        event.target.checked,
                                    );
                                }}
                                className="mt-1 h-4 w-4 shrink-0 accent-[#172861]"
                            />

                            <span>
                                He leído el documento y acepto la política de privacidad vigente.
                            </span>
                        </label>

                        <div className="mt-auto flex flex-col-reverse gap-2 sm:flex-row lg:flex-col-reverse xl:flex-row xl:justify-end">
                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={onLogout}
                                className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Cerrar sesión
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    !accepted ||
                                    isSubmitting
                                }
                                className="min-h-11 rounded-xl bg-[#172861] px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#0f1d4d] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting
                                    ? "Registrando aceptación..."
                                    : "Aceptar y continuar"}
                            </button>
                        </div>
                    </div>

                    <div className="flex min-h-[420px] flex-col bg-slate-100 p-3 sm:min-h-[520px] sm:p-4 lg:min-h-[620px]">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#172861]">
                                    Vista previa
                                </p>

                                <p className="mt-1 text-sm text-slate-600">
                                    Revisa el documento antes de confirmar tu aceptación.
                                </p>
                            </div>

                            {documentOpenUrl ? (
                                <a
                                    href={
                                        documentOpenUrl
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#172861] transition hover:bg-slate-50"
                                >
                                    Ampliar PDF
                                </a>
                            ) : null}
                        </div>

                        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {isLoadingPreview ? (
                                <div className="flex h-full min-h-[380px] items-center justify-center p-6 text-center sm:min-h-[470px] lg:min-h-[550px]">
                                    <p className="text-sm font-bold text-slate-600">
                                        Cargando vista previa del PDF...
                                    </p>
                                </div>
                            ) : previewUrl ? (
                                <iframe
                                    src={previewUrl}
                                    title={`Vista previa de ${policy.title}`}
                                    className="h-full min-h-[380px] w-full bg-white sm:min-h-[470px] lg:min-h-[550px]"
                                />
                            ) : (
                                <div className="flex h-full min-h-[380px] items-center justify-center p-6 text-center sm:min-h-[470px] lg:min-h-[550px]">
                                    <div className="max-w-sm">
                                        <p className="text-sm font-black text-slate-950">
                                            No se pudo mostrar la vista previa
                                        </p>

                                        <p className="mt-2 text-sm leading-6 text-slate-600">
                                            {previewError ||
                                                "No se encontró el archivo PDF de la política."}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

type PrivacyVerificationErrorScreenProps = {
    onRetry: () => void;
    onLogout: () => void;
};

function PrivacyVerificationErrorScreen({
    onRetry,
    onLogout,
}: PrivacyVerificationErrorScreenProps) {
    return (
        <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#F8FAFC] p-6">
            <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-6 text-center shadow-xl">
                <h1 className="text-lg font-black text-slate-950">
                    No se pudo validar la privacidad
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                    No es posible habilitar el acceso hasta comprobar si existe una política pendiente.
                </p>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <button
                        type="button"
                        onClick={onLogout}
                        className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                        Cerrar sesión
                    </button>

                    <button
                        type="button"
                        onClick={onRetry}
                        className="min-h-11 rounded-xl bg-[#172861] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0f1d4d]"
                    >
                        Intentar nuevamente
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: DashboardLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();

    const {
        user,
        accessToken,
        loading,
        isAuthenticated,
        signOut,
    } = useAuth();

    const [
        sidebarCollapsed,
        setSidebarCollapsed,
    ] = useState(false);

    const [
        privacyValidationState,
        setPrivacyValidationState,
    ] = useState<PrivacyValidationState>(
        "checking",
    );

    const [
        pendingPrivacyPolicy,
        setPendingPrivacyPolicy,
    ] = useState<PrivacyPolicy | null>(
        null,
    );

    const [
        privacyAccepted,
        setPrivacyAccepted,
    ] = useState(false);

    const [
        isAcceptingPrivacy,
        setIsAcceptingPrivacy,
    ] = useState(false);

    const [
        mixedTeacherAccessState,
        setMixedTeacherAccessState,
    ] = useState<MixedTeacherAccessState>({
        userId: null,
        courseId: null,
        status: "checking",
    });

    const privacyRequestRef =
        useRef<Promise<void> | null>(
            null,
        );

    const acceptingPrivacyRef =
        useRef(false);

    const privacyWarningShownRef =
        useRef(false);

    const mixedTeacherAccessRequestsRef =
        useRef<
            Map<
                string,
                Promise<boolean>
            >
        >(
            new Map(),
        );

    const deniedTeacherCourseToastRef =
        useRef<number | null>(
            null,
        );

    useEffect(() => {
        const tabletMediaQuery =
            window.matchMedia(
                "(min-width: 768px) and (max-width: 1023px)",
            );

        const animationFrameId =
            window.requestAnimationFrame(
                () => {
                    setSidebarCollapsed(
                        tabletMediaQuery.matches,
                    );
                },
            );

        function syncSidebarWithViewport(
            event: MediaQueryListEvent,
        ) {
            setSidebarCollapsed(
                event.matches,
            );
        }

        tabletMediaQuery.addEventListener(
            "change",
            syncSidebarWithViewport,
        );

        return () => {
            window.cancelAnimationFrame(
                animationFrameId,
            );

            tabletMediaQuery.removeEventListener(
                "change",
                syncSidebarWithViewport,
            );
        };
    }, []);

    const routeRole =
        getRouteRole(pathname);

    const userRole =
        isUserRole(user?.role)
            ? user.role
            : null;

    const authenticatedUserId =
        Number(user?.id);

    const hasValidAuthenticatedUserId =
        Number.isInteger(
            authenticatedUserId,
        ) &&
        authenticatedUserId > 0;

    const teacherCourseId =
        getTeacherCourseIdFromPathname(
            pathname,
        );

    const requiresMixedTeacherCourseAccess =
        userRole === "student" &&
        routeRole === "teacher";

    const canCheckMixedTeacherCourseAccess =
        requiresMixedTeacherCourseAccess &&
        hasValidAuthenticatedUserId &&
        teacherCourseId !== null;

    const matchesCurrentMixedTeacherRequest =
        mixedTeacherAccessState.userId ===
        authenticatedUserId &&
        mixedTeacherAccessState.courseId ===
        teacherCourseId;

    const effectiveMixedTeacherAccessStatus:
        MixedTeacherAccessStatus =
        !requiresMixedTeacherCourseAccess
            ? "allowed"
            : !canCheckMixedTeacherCourseAccess
                ? "denied"
                : matchesCurrentMixedTeacherRequest
                    ? mixedTeacherAccessState.status
                    : "checking";

    const isCheckingMixedTeacherCourseAccess =
        requiresMixedTeacherCourseAccess &&
        effectiveMixedTeacherAccessStatus ===
        "checking";

    const hasMixedTeacherCourseAccess =
        requiresMixedTeacherCourseAccess &&
        effectiveMixedTeacherAccessStatus ===
        "allowed";

    const hasDirectRoleAccess =
        !routeRole ||
        routeRole === userRole;

    const hasCorrectRole =
        hasDirectRoleAccess ||
        hasMixedTeacherCourseAccess;

    useEffect(() => {
        if (
            !canCheckMixedTeacherCourseAccess ||
            teacherCourseId === null ||
            !Number.isInteger(
                authenticatedUserId,
            ) ||
            authenticatedUserId <= 0
        ) {
            return;
        }

        const validUserId =
            authenticatedUserId;

        const validCourseId =
            teacherCourseId;

        const requestKey =
            `${validUserId}:${validCourseId}`;

        let isMounted = true;

        let request =
            mixedTeacherAccessRequestsRef
                .current
                .get(requestKey);

        if (!request) {
            request =
                hasAcceptedTeacherEnrollmentByUserAndCourse(
                    validUserId,
                    validCourseId,
                );

            mixedTeacherAccessRequestsRef
                .current
                .set(
                    requestKey,
                    request,
                );

            void request.finally(() => {
                const currentRequest =
                    mixedTeacherAccessRequestsRef
                        .current
                        .get(requestKey);

                if (
                    currentRequest ===
                    request
                ) {
                    mixedTeacherAccessRequestsRef
                        .current
                        .delete(
                            requestKey,
                        );
                }
            });
        }

        void request
            .then((hasAccess) => {
                if (!isMounted) {
                    return;
                }

                setMixedTeacherAccessState({
                    userId:
                        validUserId,
                    courseId:
                        validCourseId,
                    status:
                        hasAccess
                            ? "allowed"
                            : "denied",
                });

                if (hasAccess) {
                    deniedTeacherCourseToastRef.current =
                        null;
                }
            })
            .catch(() => {
                if (!isMounted) {
                    return;
                }

                setMixedTeacherAccessState({
                    userId:
                        validUserId,
                    courseId:
                        validCourseId,
                    status:
                        "error",
                });
            });

        return () => {
            isMounted = false;
        };
    }, [
        canCheckMixedTeacherCourseAccess,
        authenticatedUserId,
        teacherCourseId,
    ]);

    useEffect(() => {
        if (loading) {
            return;
        }

        if (
            !isAuthenticated ||
            !user
        ) {
            router.replace("/login");
            return;
        }

        if (!userRole) {
            signOut();
            router.replace("/login");
            return;
        }

        if (
            isCheckingMixedTeacherCourseAccess
        ) {
            return;
        }

        if (!hasCorrectRole) {
            if (
                requiresMixedTeacherCourseAccess &&
                teacherCourseId !== null &&
                deniedTeacherCourseToastRef.current !==
                teacherCourseId
            ) {
                deniedTeacherCourseToastRef.current =
                    teacherCourseId;

                notify.error(
                    "No tienes acceso docente autorizado para este curso.",
                );
            }

            router.replace(
                ROLE_HOME_ROUTE[
                userRole
                ],
            );
        }
    }, [
        loading,
        isAuthenticated,
        user,
        userRole,
        hasCorrectRole,
        requiresMixedTeacherCourseAccess,
        isCheckingMixedTeacherCourseAccess,
        teacherCourseId,
        router,
        signOut,
    ]);

    const verifyPrivacyPolicy =
        useCallback(async () => {
            if (
                privacyRequestRef.current
            ) {
                return privacyRequestRef.current;
            }

            const request = (async () => {
                try {
                    if (!accessToken) {
                        throw new Error(
                            "No se encontró una sesión válida.",
                        );
                    }

                    const activePolicy =
                        await getActivePrivacyPolicy(
                            accessToken,
                        );

                    if (
                        !activePolicy ||
                        activePolicy.deleted === true ||
                        activePolicy.is_active !== true ||
                        activePolicy.mandatory !== true
                    ) {
                        setPendingPrivacyPolicy(
                            null,
                        );

                        setPrivacyAccepted(
                            false,
                        );

                        setPrivacyValidationState(
                            "accepted",
                        );

                        privacyWarningShownRef.current =
                            false;

                        return;
                    }

                    const alreadyAccepted =
                        await confirmActivePrivacyPolicyAcceptance(
                            accessToken,
                        );

                    if (alreadyAccepted) {
                        setPendingPrivacyPolicy(
                            null,
                        );

                        setPrivacyAccepted(
                            false,
                        );

                        setPrivacyValidationState(
                            "accepted",
                        );

                        privacyWarningShownRef.current =
                            false;

                        return;
                    }

                    setPendingPrivacyPolicy(
                        activePolicy,
                    );

                    setPrivacyAccepted(
                        false,
                    );

                    setPrivacyValidationState(
                        "pending",
                    );

                    if (
                        !privacyWarningShownRef.current
                    ) {
                        privacyWarningShownRef.current =
                            true;

                        notify.warning(
                            "Política de privacidad pendiente. Revisa el documento y acepta la política para continuar.",
                        );
                    }
                } catch (error) {
                    setPendingPrivacyPolicy(
                        null,
                    );

                    setPrivacyValidationState(
                        "error",
                    );

                    notify.error(
                        getErrorMessage(
                            error,
                            "No se pudo verificar la política de privacidad.",
                        ),
                    );
                }
            })();

            privacyRequestRef.current =
                request;

            try {
                await request;
            } finally {
                if (
                    privacyRequestRef.current ===
                    request
                ) {
                    privacyRequestRef.current =
                        null;
                }
            }
        }, [
            accessToken,
        ]);

    useEffect(() => {
        if (
            loading ||
            !isAuthenticated ||
            !user ||
            !userRole ||
            !hasCorrectRole ||
            isCheckingMixedTeacherCourseAccess ||
            privacyValidationState !==
            "checking"
        ) {
            return;
        }

        void verifyPrivacyPolicy();
    }, [
        loading,
        isAuthenticated,
        user,
        userRole,
        hasCorrectRole,
        isCheckingMixedTeacherCourseAccess,
        privacyValidationState,
        verifyPrivacyPolicy,
    ]);

    function handleLogout() {
        signOut();

        notify.success(
            "Sesión cerrada correctamente.",
        );

        router.replace("/login");
    }

    function handleRetryPrivacyValidation() {
        setPrivacyValidationState(
            "checking",
        );

        void verifyPrivacyPolicy();
    }

    async function handleAcceptPrivacyPolicy(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (!pendingPrivacyPolicy) {
            notify.error(
                "No se encontró una política activa para aceptar.",
            );

            return;
        }

        if (!privacyAccepted) {
            notify.warning(
                "Debes confirmar que leíste y aceptas la política.",
            );

            return;
        }

        if (
            acceptingPrivacyRef.current
        ) {
            notify.warning(
                "La aceptación ya se está registrando.",
            );

            return;
        }

        if (!accessToken) {
            notify.error(
                "No se encontró una sesión válida.",
            );

            return;
        }

        acceptingPrivacyRef.current =
            true;

        setIsAcceptingPrivacy(true);

        const toastId =
            notify.loading(
                "Registrando aceptación...",
            );

        try {
            await acceptPrivacyPolicy(
                pendingPrivacyPolicy.id,
                accessToken,
            );

            setPendingPrivacyPolicy(
                null,
            );

            setPrivacyAccepted(
                false,
            );

            setPrivacyValidationState(
                "accepted",
            );

            privacyWarningShownRef.current =
                false;

            notify.dismiss(
                toastId,
            );

            notify.success(
                "Política de privacidad aceptada correctamente.",
            );
        } catch (error) {
            notify.dismiss(
                toastId,
            );

            notify.error(
                getErrorMessage(
                    error,
                    "No se pudo registrar la aceptación.",
                ),
            );
        } finally {
            acceptingPrivacyRef.current =
                false;

            setIsAcceptingPrivacy(
                false,
            );
        }
    }

    if (
        loading ||
        !isAuthenticated ||
        !user ||
        !userRole ||
        isCheckingMixedTeacherCourseAccess ||
        !hasCorrectRole
    ) {
        return (
            <SessionVerificationScreen />
        );
    }

    if (
        privacyValidationState ===
        "checking"
    ) {
        return (
            <SessionVerificationScreen />
        );
    }

    if (
        privacyValidationState ===
        "pending" &&
        pendingPrivacyPolicy &&
        accessToken
    ) {
        return (
            <PrivacyPolicyModal
                key={`${pendingPrivacyPolicy.id}-${pendingPrivacyPolicy.file_url}`}
                policy={
                    pendingPrivacyPolicy
                }
                accessToken={
                    accessToken
                }
                accepted={
                    privacyAccepted
                }
                isSubmitting={
                    isAcceptingPrivacy
                }
                onAcceptedChange={
                    setPrivacyAccepted
                }
                onSubmit={
                    handleAcceptPrivacyPolicy
                }
                onLogout={
                    handleLogout
                }
            />
        );
    }

    if (
        privacyValidationState ===
        "error"
    ) {
        return (
            <PrivacyVerificationErrorScreen
                onRetry={
                    handleRetryPrivacyValidation
                }
                onLogout={
                    handleLogout
                }
            />
        );
    }

    const effectiveRole =
        getEffectiveRoleByPathname(
            userRole,
            pathname,
        );

    const isAdmin =
        effectiveRole === "admin";

    const isStudentRoute =
        routeRole === "student";

    const isTeacherRoute =
        routeRole === "teacher";

    const isProfileRoute =
        pathname === "/profile";

    const isHelpRoute =
        pathname === "/help";

    const hideSidebar = false;

    const hideHeader =
        !isAdmin &&
        (
            isStudentRoute ||
            isTeacherRoute ||
            isProfileRoute ||
            isHelpRoute
        );

    function getMainClassName() {
        if (hideHeader) {
            return [
                "min-h-[100dvh]",
                "w-full",
                "min-w-0",
                "overflow-x-hidden",
                "bg-[var(--background)]",
            ].join(" ");
        }

        return [
            "min-h-[calc(100dvh-68px)]",
            "w-full",
            "min-w-0",
            "overflow-x-hidden",
            "bg-[var(--background)]",
            "p-3",
            "sm:p-4",
            "md:min-h-[calc(100dvh-72px)]",
            "md:p-5",
            "lg:p-6",
        ].join(" ");
    }

    const contentPaddingClass =
        hideSidebar
            ? ""
            : sidebarCollapsed
                ? "md:pl-[76px]"
                : "md:pl-[248px]";

    return (
        <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[var(--background)] text-[var(--foreground)]">
            {!hideSidebar ? (
                <Sidebar
                    collapsed={
                        sidebarCollapsed
                    }
                    onToggleCollapsed={() => {
                        setSidebarCollapsed(
                            (current) =>
                                !current,
                        );
                    }}
                />
            ) : null}

            <div
                className={`min-h-[100dvh] w-full min-w-0 transition-[padding] duration-300 ease-in-out ${contentPaddingClass}`}
            >
                {!hideHeader ? (
                    <Header
                        displayName={
                            getUserFullName(
                                user,
                            )
                        }
                        roleLabel={
                            getRoleLabel(
                                effectiveRole,
                            )
                        }
                        onLogout={
                            handleLogout
                        }
                    />
                ) : null}

                <main
                    className={
                        getMainClassName()
                    }
                >
                    {children}
                </main>
            </div>
        </div>
    );
}