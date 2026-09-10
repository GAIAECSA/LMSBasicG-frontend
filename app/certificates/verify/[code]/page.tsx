"use client";

import type { ReactNode } from "react";

import Image from "next/image";

import {
    useEffect,
    useState,
} from "react";

import {
    useParams,
} from "next/navigation";

import {
    CalendarDays,
    FileBadge2,
    GraduationCap,
    IdCard,
    LoaderCircle,
    ShieldAlert,
    ShieldCheck,
    Star,
    Timer,
    UserRound,
} from "lucide-react";

/* =========================================================
   API
========================================================= */

const RAW_API_URL =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://213.165.74.184:9000";

function normalizeApiBaseUrl(
    url: string,
) {
    const cleanUrl =
        url
            .trim()
            .replace(
                /\/+$/,
                "",
            );

    if (
        cleanUrl.endsWith(
            "/api/v1",
        )
    ) {
        return cleanUrl;
    }

    return `${cleanUrl}/api/v1`;
}

const API_BASE_URL =
    normalizeApiBaseUrl(
        RAW_API_URL,
    );

const API_ORIGIN =
    API_BASE_URL.replace(
        /\/api\/v1$/,
        "",
    );

/* =========================================================
   DOMINIO
========================================================= */

function cleanDomain(
    value: string,
) {
    return value
        .trim()
        .replace(
            /^https?:\/\//i,
            "",
        )
        .replace(
            /\/+$/,
            "",
        );
}

function getVerifyDomain() {
    if (typeof window === "undefined") {
        return "lms.gaiaecsa.com";
    }

    const params =
        new URLSearchParams(
            window.location.search,
        );

    const queryDomain =
        params.get("domain");

    if (queryDomain?.trim()) {
        return cleanDomain(
            queryDomain,
        );
    }

    const hostname =
        window.location.hostname;

    /*
     * En producción usamos el dominio actual.
     */
    if (
        hostname &&
        hostname !== "localhost" &&
        hostname !== "127.0.0.1"
    ) {
        return cleanDomain(
            hostname,
        );
    }

    /*
     * En desarrollo localhost debe enviar
     * el dominio real del LMS.
     */
    return cleanDomain(
        process.env.NEXT_PUBLIC_DOMAIN ??
        process.env.NEXT_PUBLIC_APP_DOMAIN ??
        "lms.gaiaecsa.com",
    );
}

function addDomainToUrl(
    url: string,
) {
    const domain =
        getVerifyDomain();

    if (!domain) {
        return url;
    }

    const separator =
        url.includes("?")
            ? "&"
            : "?";

    return `${url}${separator}domain=${encodeURIComponent(
        domain,
    )}`;
}

/* =========================================================
   TIPOS
========================================================= */

type CertificateResponse = {
    id?: number;

    user_id?:
    | number
    | null;

    course_id?:
    | number
    | null;

    student_name?:
    | string
    | null;

    student_full_name?:
    | string
    | null;

    course_name?:
    | string
    | null;

    final_grade?:
    | number
    | string
    | null;

    idnumber?:
    | string
    | null;

    student_idnumber?:
    | string
    | null;

    student_id_number?:
    | string
    | null;

    duration_hours?:
    | number
    | string
    | null;

    certificate_code?:
    | string
    | null;

    code?:
    | string
    | null;

    file_url?:
    | string
    | null;

    pdf_url?:
    | string
    | null;

    certificate_url?:
    | string
    | null;

    url?:
    | string
    | null;

    path?:
    | string
    | null;

    is_valid?:
    | boolean
    | number
    | string
    | null;

    valid?:
    | boolean
    | number
    | string
    | null;

    is_active?:
    | boolean
    | number
    | string
    | null;

    status?:
    | string
    | null;

    created_at?:
    | string
    | null;

    issued_at?:
    | string
    | null;

    generated_at?:
    | string
    | null;

    start_date?:
    | string
    | null;

    end_date?:
    | string
    | null;
};

/* =========================================================
   HELPERS
========================================================= */

function buildFileUrl(
    url:
        | string
        | null
        | undefined,
) {
    if (!url) {
        return "";
    }

    const cleanUrl =
        url.trim();

    if (!cleanUrl) {
        return "";
    }

    if (
        cleanUrl.startsWith(
            "http://",
        ) ||
        cleanUrl.startsWith(
            "https://",
        ) ||
        cleanUrl.startsWith(
            "data:",
        ) ||
        cleanUrl.startsWith(
            "blob:",
        )
    ) {
        return cleanUrl;
    }

    if (
        cleanUrl.startsWith(
            "/",
        )
    ) {
        return `${API_ORIGIN}${cleanUrl}`;
    }

    return `${API_ORIGIN}/${cleanUrl}`;
}

function getCertificateFileUrl(
    certificate: CertificateResponse,
) {
    return buildFileUrl(
        certificate.file_url ??
        certificate.pdf_url ??
        certificate.certificate_url ??
        certificate.url ??
        certificate.path ??
        "",
    );
}

function getFirstText(
    ...values: unknown[]
) {
    for (
        const value
        of values
    ) {
        if (
            typeof value ===
            "string" &&
            value.trim()
        ) {
            return value.trim();
        }

        if (
            typeof value ===
            "number" &&
            Number.isFinite(
                value,
            )
        ) {
            return String(
                value,
            );
        }
    }

    return "";
}

function parseBoolean(
    value: unknown,
):
    | boolean
    | null {
    if (
        typeof value ===
        "boolean"
    ) {
        return value;
    }

    if (
        typeof value ===
        "number"
    ) {
        return value === 1;
    }

    if (
        typeof value ===
        "string"
    ) {
        const normalizedValue =
            value
                .trim()
                .toLowerCase();

        if (
            [
                "true",
                "1",
                "yes",
                "si",
                "sí",
                "activo",
                "active",
                "valido",
                "válido",
                "valid",
            ].includes(
                normalizedValue,
            )
        ) {
            return true;
        }

        if (
            [
                "false",
                "0",
                "no",
                "inactivo",
                "inactive",
                "invalido",
                "inválido",
                "invalid",
            ].includes(
                normalizedValue,
            )
        ) {
            return false;
        }
    }

    return null;
}

function isCertificateValid(
    certificate: CertificateResponse,
) {
    const explicitValidity =
        parseBoolean(
            certificate.is_valid,
        ) ??
        parseBoolean(
            certificate.valid,
        ) ??
        parseBoolean(
            certificate.is_active,
        );

    if (
        explicitValidity !==
        null
    ) {
        return explicitValidity;
    }

    const status =
        certificate.status
            ?.trim()
            .toLowerCase() ??
        "";

    const invalidStatuses =
        [
            "invalid",
            "invalido",
            "inválido",
            "revoked",
            "revocado",
            "cancelled",
            "canceled",
            "cancelado",
            "anulado",
            "expired",
            "expirado",
            "inactive",
            "inactivo",
        ];

    return !invalidStatuses.includes(
        status,
    );
}

function formatDate(
    value:
        | string
        | null
        | undefined,
) {
    if (!value) {
        return "";
    }

    const date =
        new Date(
            value,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return value;
    }

    return new Intl.DateTimeFormat(
        "es-EC",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        },
    ).format(
        date,
    );
}

function formatDateRange(
    startDate:
        | string
        | null
        | undefined,
    endDate:
        | string
        | null
        | undefined,
) {
    const formattedStartDate =
        formatDate(
            startDate,
        );

    const formattedEndDate =
        formatDate(
            endDate,
        );

    if (
        formattedStartDate &&
        formattedEndDate
    ) {
        return `${formattedStartDate} - ${formattedEndDate}`;
    }

    return (
        formattedStartDate ||
        formattedEndDate ||
        ""
    );
}

function formatHours(
    value: string,
) {
    if (!value) {
        return "";
    }

    const normalizedValue =
        value.toLowerCase();

    if (
        normalizedValue.includes(
            "hora",
        ) ||
        normalizedValue.includes(
            "hour",
        )
    ) {
        return value;
    }

    return `${value} horas`;
}

function formatGrade(
    value:
        | string
        | number
        | null
        | undefined,
) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "";
    }

    if (
        typeof value ===
        "number"
    ) {
        return Number.isInteger(
            value,
        )
            ? String(value)
            : value.toFixed(2);
    }

    return String(
        value,
    ).trim();
}

/* =========================================================
   HEADER
========================================================= */

function AthenaHeader() {
    return (
        <header className="border-b-4 border-[var(--primary)] bg-[var(--primary)] shadow-md">
            <div className="flex min-h-[76px] w-full items-center bg-[var(--card)] px-5 py-2.5 sm:w-fit sm:min-w-[300px] sm:px-7 [@media(max-height:760px)]:min-h-[62px] [@media(max-height:760px)]:py-1.5">
                <div className="flex items-center gap-3">
                    <Image
                        src="/images/athena.png"
                        alt="Logo ATHENA"
                        width={64}
                        height={64}
                        priority
                        className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14 [@media(max-height:760px)]:h-11 [@media(max-height:760px)]:w-11"
                    />

                    <div className="h-10 w-px bg-[var(--border)] [@media(max-height:760px)]:h-8" />

                    <h1 className="text-xl font-black uppercase tracking-[0.24em] text-[var(--primary)] sm:text-2xl [@media(max-height:760px)]:text-xl">
                        ATHENA
                    </h1>
                </div>
            </div>
        </header>
    );
}

/* =========================================================
   LAYOUT
========================================================= */

type ValidatorLayoutProps = {
    children: ReactNode;
};

function ValidatorLayout({
    children,
}: ValidatorLayoutProps) {
    return (
        <main className="min-h-screen bg-[var(--background)]">
            <AthenaHeader />

            <div className="relative mx-auto min-h-[calc(100dvh-80px)] max-w-7xl overflow-hidden px-3 py-5 sm:px-4 sm:py-7 md:py-8 [@media(max-height:760px)]:min-h-[calc(100dvh-66px)] [@media(max-height:760px)]:py-3">
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <Image
                        src="/images/athena.png"
                        alt=""
                        width={600}
                        height={600}
                        priority
                        aria-hidden="true"
                        className="h-auto w-[260px] select-none object-contain opacity-[0.055] sm:w-[340px] md:w-[430px] lg:w-[520px] [@media(max-height:760px)]:w-[360px]"
                    />
                </div>

                <div className="relative z-10 flex items-start justify-center">
                    {children}
                </div>
            </div>
        </main>
    );
}

/* =========================================================
   CARD
========================================================= */

type ValidatorCardProps = {
    children: ReactNode;
};

function ValidatorCard({
    children,
}: ValidatorCardProps) {
    return (
        <section className="w-full max-w-md overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg [@media(max-height:760px)]:max-h-[calc(100dvh-92px)] [@media(max-height:760px)]:overflow-y-auto">
            {children}
        </section>
    );
}

/* =========================================================
   DETAIL ROW
========================================================= */

type DetailRowProps = {
    icon: ReactNode;

    value: string;

    label: string;
};

function DetailRow({
    icon,
    value,
    label,
}: DetailRowProps) {
    return (
        <div className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-4 last:border-b-0 [@media(max-height:760px)]:gap-2.5 [@media(max-height:760px)]:py-2.5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--primary)] [@media(max-height:760px)]:h-8 [@media(max-height:760px)]:w-8">
                {icon}
            </div>

            <div className="min-w-0">
                <p className="break-words text-sm font-extrabold uppercase leading-5 text-[var(--foreground)] [@media(max-height:760px)]:text-xs [@media(max-height:760px)]:leading-4">
                    {value ||
                        "No disponible"}
                </p>

                <p className="mt-1 text-sm text-[var(--muted-foreground)] [@media(max-height:760px)]:text-xs">
                    {label}
                </p>
            </div>
        </div>
    );
}

/* =========================================================
   PAGE
========================================================= */

export default function VerifyCertificatePage() {
    const params =
        useParams<{
            code: string;
        }>();

    const [
        certificate,
        setCertificate,
    ] =
        useState<CertificateResponse | null>(
            null,
        );

    const [
        isLoading,
        setIsLoading,
    ] =
        useState(
            true,
        );

    const [
        errorMessage,
        setErrorMessage,
    ] =
        useState(
            "",
        );

    /* =====================================================
       CARGAR CERTIFICADO
    ===================================================== */

    useEffect(() => {
        const abortController =
            new AbortController();

        let isMounted =
            true;

        const timeoutId =
            window.setTimeout(
                () => {
                    async function loadCertificateInformation() {
                        try {
                            const code =
                                params.code;

                            if (
                                !code
                            ) {
                                if (
                                    !isMounted
                                ) {
                                    return;
                                }

                                setErrorMessage(
                                    "El código del certificado no es válido.",
                                );

                                setIsLoading(
                                    false,
                                );

                                return;
                            }

                            /*
                             * Endpoint público de verificación:
                             *
                             * GET
                             * /api/v1/certificates/verify/{code}
                             */

                            const response =
                                await fetch(
                                    addDomainToUrl(
                                        `${API_BASE_URL}/certificates/verify/${encodeURIComponent(
                                            code,
                                        )}`,
                                    ),
                                    {
                                        method: "GET",
                                        headers: {
                                            Accept: "application/json",
                                        },
                                        cache: "no-store",
                                        signal:
                                            abortController.signal,
                                    },
                                );

                            if (
                                !isMounted
                            ) {
                                return;
                            }

                            if (
                                !response.ok
                            ) {
                                if (
                                    response.status ===
                                    404
                                ) {
                                    setErrorMessage(
                                        "No encontramos un certificado registrado con este código.",
                                    );
                                } else {
                                    setErrorMessage(
                                        "No fue posible verificar el certificado en este momento.",
                                    );
                                }

                                setCertificate(
                                    null,
                                );

                                setIsLoading(
                                    false,
                                );

                                return;
                            }

                            const certificateData =
                                (await response.json()) as CertificateResponse;

                            if (
                                !isMounted
                            ) {
                                return;
                            }

                            setCertificate(
                                certificateData,
                            );

                            setErrorMessage(
                                "",
                            );

                            setIsLoading(
                                false,
                            );
                        } catch (
                        error
                        ) {
                            if (
                                error instanceof
                                Error &&
                                error.name ===
                                "AbortError"
                            ) {
                                return;
                            }

                            if (
                                !isMounted
                            ) {
                                return;
                            }

                            setCertificate(
                                null,
                            );

                            setErrorMessage(
                                "Ocurrió un error al consultar la información del certificado.",
                            );

                            setIsLoading(
                                false,
                            );
                        }
                    }

                    void loadCertificateInformation();
                },
                0,
            );

        return () => {
            isMounted =
                false;

            window.clearTimeout(
                timeoutId,
            );

            abortController.abort();
        };
    }, [params.code]);

    /* =====================================================
       LOADING
    ===================================================== */

    if (
        isLoading
    ) {
        return (
            <ValidatorLayout>
                <ValidatorCard>
                    <div className="flex flex-col items-center gap-3 bg-[var(--card)] px-6 py-9 text-center">
                        <LoaderCircle className="h-11 w-11 animate-spin text-[var(--primary)]" />

                        <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                            Verificando información del certificado...
                        </p>
                    </div>
                </ValidatorCard>
            </ValidatorLayout>
        );
    }

    /* =====================================================
       ERROR
    ===================================================== */

    if (
        !certificate ||
        errorMessage
    ) {
        return (
            <ValidatorLayout>
                <ValidatorCard>
                    <div className="bg-[var(--card)] px-4 py-6">
                        <div className="rounded-md border border-[var(--border)] bg-[var(--danger-soft)] p-4">
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="h-8 w-8 shrink-0 text-[var(--danger)]" />

                                <div>
                                    <p className="text-base font-black text-[var(--danger)]">
                                        Certificado no válido
                                    </p>

                                    <p className="mt-1 text-sm leading-5 text-[var(--danger)]">
                                        {
                                            errorMessage
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 py-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-foreground)]">
                                Código consultado
                            </p>

                            <p className="mt-1 break-all text-sm font-extrabold text-[var(--foreground)]">
                                {params.code ||
                                    "No disponible"}
                            </p>
                        </div>
                    </div>
                </ValidatorCard>
            </ValidatorLayout>
        );
    }

    /* =====================================================
       DATOS
    ===================================================== */

    const validCertificate =
        isCertificateValid(
            certificate,
        );

    const fileUrl =
        getCertificateFileUrl(
            certificate,
        );

    const studentName =
        getFirstText(
            certificate.student_name,
            certificate.student_full_name,
        );

    const studentIdNumber =
        getFirstText(
            certificate.idnumber,
            certificate.student_idnumber,
            certificate.student_id_number,
        );

    const courseName =
        getFirstText(
            certificate.course_name,
        );

    const durationHours =
        formatHours(
            getFirstText(
                certificate.duration_hours,
            ),
        );

    const finalGrade =
        formatGrade(
            certificate.final_grade,
        );

    const certificateCode =
        getFirstText(
            certificate.certificate_code,
            certificate.code,
            params.code,
        );

    const dateRange =
        formatDateRange(
            certificate.start_date,
            certificate.end_date,
        );

    const issuedDate =
        formatDate(
            certificate.issued_at ??
            certificate.generated_at ??
            certificate.created_at,
        );

    /* =====================================================
       VISTA
    ===================================================== */

    return (
        <ValidatorLayout>
            <ValidatorCard>
                {/* =========================================
                    ESTADO DEL CERTIFICADO
                ========================================== */}

                <div className="border-b border-[var(--border)] bg-[var(--card)] px-4 py-4 [@media(max-height:760px)]:py-2.5">
                    <div
                        className={`flex items-start gap-3 rounded-md px-3 py-3 [@media(max-height:760px)]:py-2 ${validCertificate
                            ? "bg-[var(--success-soft)] text-[var(--success)]"
                            : "bg-[var(--danger-soft)] text-[var(--danger)]"
                            }`}
                    >
                        {validCertificate ? (
                            <ShieldCheck className="h-7 w-7 shrink-0" />
                        ) : (
                            <ShieldAlert className="h-7 w-7 shrink-0" />
                        )}

                        <div>
                            <p className="text-sm font-black uppercase">
                                {validCertificate
                                    ? "Certificado válido"
                                    : "Certificado no válido"}
                            </p>

                            <p className="mt-0.5 text-xs font-medium leading-5">
                                {validCertificate
                                    ? "El certificado se encuentra registrado correctamente."
                                    : "El certificado fue encontrado, pero actualmente no consta como válido."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* =========================================
                    INFORMACIÓN
                ========================================== */}

                <div className="bg-[var(--card)]">
                    <DetailRow
                        icon={
                            <UserRound className="h-7 w-7" />
                        }
                        value={
                            studentName
                        }
                        label="Nombres y Apellidos"
                    />

                    <DetailRow
                        icon={
                            <IdCard className="h-7 w-7" />
                        }
                        value={
                            studentIdNumber
                        }
                        label="Documento de Identidad"
                    />

                    <DetailRow
                        icon={
                            <GraduationCap className="h-7 w-7" />
                        }
                        value={
                            courseName
                        }
                        label="Curso"
                    />

                    <DetailRow
                        icon={
                            <Timer className="h-7 w-7" />
                        }
                        value={
                            durationHours
                        }
                        label="Horas de Capacitación"
                    />

                    {finalGrade ? (
                        <DetailRow
                            icon={
                                <Star className="h-7 w-7" />
                            }
                            value={
                                finalGrade
                            }
                            label="Calificación Final"
                        />
                    ) : null}

                    <DetailRow
                        icon={
                            <FileBadge2 className="h-7 w-7" />
                        }
                        value={
                            certificateCode
                        }
                        label="Número de Certificado"
                    />

                    <DetailRow
                        icon={
                            <CalendarDays className="h-7 w-7" />
                        }
                        value={
                            dateRange ||
                            issuedDate
                        }
                        label={
                            dateRange
                                ? "Fecha Inicio - Fecha Fin"
                                : "Fecha de Emisión"
                        }
                    />
                </div>

                {/* =========================================
                    PDF
                ========================================== */}

                {fileUrl ? (
                    <div className="border-t border-[var(--border)] bg-[var(--card)] px-4 py-4">
                        <a
                            href={
                                fileUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full items-center justify-center rounded-md bg-[var(--primary)] px-4 py-3 text-sm font-bold !text-white transition hover:opacity-95 active:scale-[0.99]"
                        >
                            Ver certificado PDF
                        </a>
                    </div>
                ) : null}
            </ValidatorCard>
        </ValidatorLayout>
    );
}