"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    Award,
    Bell,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Download,
    Eye,
    ExternalLink,
    FileWarning,
    Filter,
    GraduationCap,
    Hash,
    Loader2,
    RefreshCw,
    Search,
    ShieldCheck,
    ShieldX,
    Trophy,
    X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
    getCertificatesByUser,
    type Certificate,
} from "@/services/certificates.service";

type CertificateStatusFilter = "all" | "valid" | "review";

type CertificateWithExtraFields = Certificate & {
    file_url?: string | null;
    pdf_url?: string | null;
    url?: string | null;
    certificate_url?: string | null;
    path?: string | null;
    created_at?: string | null;
    issued_at?: string | null;
    issue_date?: string | null;
    updated_at?: string | null;
    course?: {
        id?: number | string | null;
        name?: string | null;
    } | null;
    course_name?: string | null;
    title?: string | null;
};

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

function toNumericId(value: unknown) {
    if (value === null || value === undefined || value === "") return null;

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : null;
}

function normalizeResourceUrl(url?: string | null) {
    if (!url) return "";

    const cleanUrl = String(url).trim();

    if (!cleanUrl) return "";

    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://") ||
        cleanUrl.startsWith("data:")
    ) {
        return cleanUrl;
    }

    if (cleanUrl.startsWith("/")) {
        return `${API_BASE_URL}${cleanUrl}`;
    }

    return `${API_BASE_URL}/${cleanUrl.replace(/^\/+/, "")}`;
}

function getCertificateFileUrl(certificate: CertificateWithExtraFields | null) {
    if (!certificate) return "";

    return normalizeResourceUrl(
        certificate.file_url ||
        certificate.pdf_url ||
        certificate.certificate_url ||
        certificate.url ||
        certificate.path ||
        "",
    );
}

function getProtectedPdfViewerUrl(url: string) {
    if (!url) return "";

    const cleanUrl = url.split("#")[0];

    return `${cleanUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
}

function getCertificateStatusLabel(certificate: CertificateWithExtraFields) {
    return certificate.is_valid ? "Emitido" : "En revisión";
}

function getCertificateStatusStyles(certificate: CertificateWithExtraFields) {
    if (certificate.is_valid) {
        return {
            badge: "bg-[var(--success-soft)] text-[var(--success)]",
            line: "bg-[var(--success)]",
            iconBg: "bg-[var(--success-soft)] text-[var(--success)]",
            border: "border-[var(--success)]/20",
        };
    }

    return {
        badge: "bg-[var(--warning-soft)] text-[var(--warning)]",
        line: "bg-[var(--warning)]",
        iconBg: "bg-[var(--warning-soft)] text-[var(--warning)]",
        border: "border-[var(--warning)]/20",
    };
}

function getCourseName(certificate: CertificateWithExtraFields) {
    return (
        certificate.course?.name ||
        certificate.course_name ||
        certificate.title ||
        "Curso certificado"
    );
}

function getCertificateCode(certificate: CertificateWithExtraFields) {
    return certificate.certificate_code || `CERT-${certificate.id}`;
}

function getCertificateCourseId(certificate: CertificateWithExtraFields) {
    return (
        toNumericId(certificate.course_id) ||
        toNumericId(certificate.course?.id) ||
        null
    );
}

function formatDate(value?: string | null) {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("es-EC", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function getCertificateDate(certificate: CertificateWithExtraFields) {
    return formatDate(
        certificate.issued_at ||
        certificate.issue_date ||
        certificate.created_at ||
        certificate.updated_at ||
        null,
    );
}

function getFilteredCertificates(
    certificates: CertificateWithExtraFields[],
    filter: CertificateStatusFilter,
    searchTerm: string,
) {
    const cleanSearchTerm = searchTerm.trim().toLowerCase();

    return certificates.filter((certificate) => {
        const matchesFilter =
            filter === "all" ||
            (filter === "valid" && certificate.is_valid) ||
            (filter === "review" && !certificate.is_valid);

        const courseName = getCourseName(certificate).toLowerCase();
        const code = getCertificateCode(certificate).toLowerCase();

        const matchesSearch =
            cleanSearchTerm.length === 0 ||
            courseName.includes(cleanSearchTerm) ||
            code.includes(cleanSearchTerm);

        return matchesFilter && matchesSearch;
    });
}

function getUserFullName(user: unknown) {
    if (!user || typeof user !== "object") return "Estudiante";

    const value = user as {
        firstname?: string;
        lastname?: string;
        fullName?: string;
        name?: string;
        username?: string;
        email?: string;
    };

    const fullName = `${value.firstname ?? ""} ${value.lastname ?? ""}`.trim();

    return (
        value.fullName ||
        fullName ||
        value.name ||
        value.username ||
        value.email?.split("@")[0] ||
        "Estudiante"
    );
}

function getInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "ES";

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function CertificatePreviewCard({
    certificate,
}: {
    certificate: CertificateWithExtraFields;
}) {
    const fileUrl = getCertificateFileUrl(certificate);
    const courseName = getCourseName(certificate);

    if (fileUrl) {
        return (
            <div className="relative h-[190px] overflow-hidden rounded-2xl border border-[var(--border)] bg-white md:h-[210px]">
                <iframe
                    src={getProtectedPdfViewerUrl(fileUrl)}
                    title={`Vista previa ${courseName}`}
                    className="h-[420px] w-full origin-top scale-[0.52] bg-white md:scale-[0.58]"
                    tabIndex={-1}
                />

                <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
            </div>
        );
    }

    return (
        <div className="relative flex h-[190px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-white md:h-[210px]">
            <div className="absolute left-0 top-0 h-24 w-24 rounded-br-[60px] bg-[var(--primary)]" />
            <div className="absolute bottom-0 right-0 h-24 w-24 rounded-tl-[60px] bg-[var(--primary)]" />

            <Award className="relative h-12 w-12 text-[var(--primary)]" />

            <p className="relative mt-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--foreground)]">
                Certificado
            </p>

            <p className="relative mt-1 max-w-[220px] truncate text-center text-xs font-bold text-[var(--muted-foreground)]">
                {courseName}
            </p>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    detail,
    tone,
    icon,
}: {
    title: string;
    value: string;
    detail: string;
    tone: "green" | "orange" | "blue";
    icon: React.ReactNode;
}) {
    const styles = {
        green: {
            bg: "bg-[var(--success-soft)] text-[var(--success)]",
            line: "bg-[var(--success)]",
        },
        orange: {
            bg: "bg-[var(--warning-soft)] text-[var(--warning)]",
            line: "bg-[var(--warning)]",
        },
        blue: {
            bg: "bg-[var(--secondary)] text-[var(--primary)]",
            line: "bg-[var(--primary)]",
        },
    }[tone];

    return (
        <div className="overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${styles.bg}`}
                >
                    {icon}
                </div>

                <div>
                    <p className="text-sm font-semibold text-[var(--muted-foreground)]">
                        {title}
                    </p>

                    <p className="mt-1 text-3xl font-black text-[var(--foreground)]">
                        {value}
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                        {detail}
                    </p>
                </div>
            </div>

            <div className="mt-5 h-1.5 rounded-full bg-[var(--muted)]">
                <div className={`h-1.5 w-4/5 rounded-full ${styles.line}`} />
            </div>
        </div>
    );
}

function CertificateCard({
    certificate,
    onPreview,
}: {
    certificate: CertificateWithExtraFields;
    onPreview: (certificate: CertificateWithExtraFields) => void;
}) {
    const fileUrl = getCertificateFileUrl(certificate);
    const statusStyles = getCertificateStatusStyles(certificate);
    const courseName = getCourseName(certificate);
    const certificateCode = getCertificateCode(certificate);
    const courseId = getCertificateCourseId(certificate);

    return (
        <article
            className={`overflow-hidden rounded-[26px] border bg-[var(--card)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statusStyles.border}`}
        >
            <div className="grid gap-0 xl:grid-cols-[340px_minmax(0,1fr)]">
                <div className="bg-[var(--muted)] p-4">
                    <CertificatePreviewCard certificate={certificate} />
                </div>

                <div className="flex min-w-0 flex-col justify-between p-5">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ${statusStyles.badge}`}
                            >
                                {certificate.is_valid ? (
                                    <ShieldCheck className="h-4 w-4" />
                                ) : (
                                    <Clock3 className="h-4 w-4" />
                                )}
                                {getCertificateStatusLabel(certificate)}
                            </span>
                        </div>

                        <h2 className="mt-3 line-clamp-2 text-xl font-black text-[var(--foreground)]">
                            {courseName}
                        </h2>

                        <div className="mt-5 grid gap-3 text-sm">
                            <div className="flex items-center gap-3">
                                <CalendarDays className="h-5 w-5 text-[var(--muted-foreground)]" />

                                <span className="text-[var(--muted-foreground)]">
                                    Fecha de emisión
                                </span>

                                <span className="ml-auto font-black text-[var(--foreground)]">
                                    {getCertificateDate(certificate)}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <Hash className="h-5 w-5 text-[var(--muted-foreground)]" />

                                <span className="text-[var(--muted-foreground)]">
                                    ID de certificado
                                </span>

                                <span className="ml-auto max-w-[180px] truncate font-black text-[var(--foreground)]">
                                    {certificateCode}
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                {certificate.is_valid ? (
                                    <ShieldCheck className="h-5 w-5 text-[var(--success)]" />
                                ) : (
                                    <ShieldX className="h-5 w-5 text-[var(--warning)]" />
                                )}

                                <span className="text-[var(--muted-foreground)]">
                                    Verificación
                                </span>

                                <Link
                                    href={`/certificates/verify/${certificateCode}`}
                                    className="ml-auto font-black text-[var(--primary)]"
                                >
                                    Verificar autenticidad
                                </Link>
                            </div>
                        </div>
                    </div>

                    {certificate.is_valid ? (
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => onPreview(certificate)}
                                disabled={!fileUrl}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 text-sm font-black text-[var(--primary-foreground)] shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Eye className="h-4 w-4" />
                                Ver certificado
                            </button>

                            {fileUrl ? (
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 text-sm font-black text-[var(--primary)] transition hover:bg-[var(--secondary)]"
                                >
                                    <Download className="h-4 w-4" />
                                    Descargar PDF
                                </a>
                            ) : (
                                <div className="inline-flex h-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--muted)] px-4 text-sm font-black text-[var(--muted-foreground)]">
                                    PDF no disponible
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-[var(--primary)]">
                            Tu certificado está siendo revisado. Te notificaremos
                            cuando esté disponible.
                        </div>
                    )}

                    {courseId ? (
                        <Link
                            href={`/student/courses/${courseId}`}
                            className="mt-3 inline-flex w-fit items-center gap-2 text-sm font-black text-[var(--primary)]"
                        >
                            Ir al curso
                            <ExternalLink className="h-4 w-4" />
                        </Link>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

export function StudentCertificatesView() {
    const { user } = useAuth();

    const numericUserId = toNumericId(user?.id);
    const displayName = getUserFullName(user);
    const initials = getInitials(displayName);

    const [certificates, setCertificates] = useState<
        CertificateWithExtraFields[]
    >([]);
    const [selectedCertificate, setSelectedCertificate] =
        useState<CertificateWithExtraFields | null>(null);
    const [statusFilter, setStatusFilter] =
        useState<CertificateStatusFilter>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const validCertificatesCount = certificates.filter(
        (certificate) => certificate.is_valid,
    ).length;

    const reviewCertificatesCount =
        certificates.length - validCertificatesCount;

    const filteredCertificates = useMemo(
        () => getFilteredCertificates(certificates, statusFilter, searchTerm),
        [certificates, statusFilter, searchTerm],
    );

    async function fetchCertificates() {
        if (!numericUserId) {
            return [];
        }

        const data = await getCertificatesByUser(numericUserId, {
            onlyValid: false,
        });

        return Array.isArray(data) ? (data as CertificateWithExtraFields[]) : [];
    }

    async function loadCertificates() {
        try {
            setIsLoading(true);
            setErrorMessage("");

            const data = await fetchCertificates();

            setCertificates(data);
        } catch (error) {
            setCertificates([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron cargar los certificados.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    async function refreshCertificates() {
        try {
            setIsRefreshing(true);
            setErrorMessage("");

            const data = await fetchCertificates();

            setCertificates(data);
        } catch (error) {
            setCertificates([]);
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "No se pudieron actualizar los certificados.",
            );
        } finally {
            setIsRefreshing(false);
        }
    }

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadCertificates();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [numericUserId]);

    function openPreviewModal(certificate: CertificateWithExtraFields) {
        const fileUrl = getCertificateFileUrl(certificate);

        if (!fileUrl) return;

        setSelectedCertificate(certificate);
    }

    function closePreviewModal() {
        setSelectedCertificate(null);
    }

    return (
        <>
            <section className="min-h-screen bg-[var(--background)] px-4 py-5 pt-16 text-[var(--foreground)] sm:px-5 md:px-8 md:pt-7 xl:px-10">
                <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                            Mis certificados
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-[var(--muted-foreground)] sm:text-base">
                            Aquí encontrarás todos tus certificados emitidos y
                            el estado de tus logros académicos.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex h-10 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-black text-[var(--foreground)] shadow-sm">
                            <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
                            Rol: Estudiante
                        </span>

                        <button
                            type="button"
                            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm transition hover:bg-[var(--muted)]"
                            aria-label="Notificaciones"
                        >
                            <Bell className="h-5 w-5" />

                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary)] text-[10px] font-black text-[var(--primary-foreground)]">
                                3
                            </span>
                        </button>

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-black text-[var(--primary-foreground)] shadow-sm">
                            {initials}
                        </div>
                    </div>
                </div>

                <div className="mb-7 grid gap-4 lg:grid-cols-3">
                    <SummaryCard
                        title="Certificados obtenidos"
                        value={String(validCertificatesCount)}
                        detail={`De ${certificates.length} certificado(s)`}
                        tone="green"
                        icon={<Award className="h-7 w-7" />}
                    />

                    <SummaryCard
                        title="En revisión"
                        value={String(reviewCertificatesCount)}
                        detail="Pendiente de validación"
                        tone="orange"
                        icon={<Clock3 className="h-7 w-7" />}
                    />

                    <SummaryCard
                        title="Horas certificadas"
                        value={`${validCertificatesCount * 40}h`}
                        detail="Horas de formación"
                        tone="blue"
                        icon={<Clock3 className="h-7 w-7" />}
                    />
                </div>

                <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => setStatusFilter("all")}
                            className={`h-12 rounded-2xl px-7 text-sm font-black transition ${statusFilter === "all"
                                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                                }`}
                        >
                            Todos ({certificates.length})
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter("valid")}
                            className={`h-12 rounded-2xl px-7 text-sm font-black transition ${statusFilter === "valid"
                                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                                }`}
                        >
                            Emitidos ({validCertificatesCount})
                        </button>

                        <button
                            type="button"
                            onClick={() => setStatusFilter("review")}
                            className={`h-12 rounded-2xl px-7 text-sm font-black transition ${statusFilter === "review"
                                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm"
                                    : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
                                }`}
                        >
                            En revisión ({reviewCertificatesCount})
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <label className="relative block w-full sm:w-[420px] xl:w-[520px]">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />

                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                placeholder="Buscar certificados..."
                                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] pl-12 pr-4 text-sm font-semibold text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--ring)]/30"
                            />
                        </label>

                        <button
                            type="button"
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-black text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)]"
                        >
                            <Filter className="h-4 w-4" />
                            Filtros
                        </button>

                        <button
                            type="button"
                            onClick={() => void refreshCertificates()}
                            disabled={isRefreshing}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-black text-[var(--foreground)] shadow-sm transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isRefreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                            Actualizar
                        </button>
                    </div>
                </div>

                {errorMessage ? (
                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[var(--danger)] bg-[var(--danger-soft)] p-4 text-sm font-semibold text-[var(--danger)]">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                        <div>
                            <p className="font-black">
                                No se pudieron cargar los certificados.
                            </p>

                            <p className="mt-1">{errorMessage}</p>
                        </div>
                    </div>
                ) : null}

                {isLoading ? (
                    <div className="grid gap-5 xl:grid-cols-2">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-[280px] animate-pulse rounded-[26px] border border-[var(--border)] bg-white"
                            />
                        ))}
                    </div>
                ) : filteredCertificates.length === 0 ? (
                    <div className="rounded-[26px] border border-[var(--border)] bg-[var(--card)] p-10 text-center shadow-sm">
                        <Trophy className="mx-auto h-12 w-12 text-[var(--muted-foreground)]" />

                        <h2 className="mt-4 text-xl font-black text-[var(--foreground)]">
                            No se encontraron certificados
                        </h2>

                        <p className="mt-2 text-sm font-semibold text-[var(--muted-foreground)]">
                            Cuando completes un curso y tu certificado sea
                            generado, aparecerá aquí.
                        </p>

                        <Link
                            href="/student/courses"
                            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[var(--primary)] px-5 text-sm font-black text-[var(--primary-foreground)] transition hover:opacity-95"
                        >
                            Ir a mis cursos
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-5 xl:grid-cols-2">
                        {filteredCertificates.map((certificate) => (
                            <CertificateCard
                                key={certificate.id}
                                certificate={certificate}
                                onPreview={openPreviewModal}
                            />
                        ))}
                    </div>
                )}
            </section>

            {selectedCertificate ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
                    <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--primary)] px-5 py-4 text-[var(--primary-foreground)]">
                            <div>
                                <h2 className="text-lg font-black">
                                    Vista previa del certificado
                                </h2>

                                <p className="mt-1 text-xs font-semibold text-white/80">
                                    {getCourseName(selectedCertificate)}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {getCertificateFileUrl(selectedCertificate) ? (
                                    <>
                                        <a
                                            href={getCertificateFileUrl(
                                                selectedCertificate,
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                            Abrir
                                        </a>

                                        <a
                                            href={getCertificateFileUrl(
                                                selectedCertificate,
                                            )}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[var(--primary)] transition hover:bg-white/90"
                                        >
                                            <Download className="h-4 w-4" />
                                            Descargar
                                        </a>
                                    </>
                                ) : null}

                                <button
                                    type="button"
                                    onClick={closePreviewModal}
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-[var(--muted)] p-4">
                            {getCertificateFileUrl(selectedCertificate) ? (
                                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
                                    <iframe
                                        src={getProtectedPdfViewerUrl(
                                            getCertificateFileUrl(
                                                selectedCertificate,
                                            ),
                                        )}
                                        title={`Vista previa certificado ${getCertificateCode(
                                            selectedCertificate,
                                        )}`}
                                        className="h-[72vh] w-full bg-white"
                                    />
                                </div>
                            ) : (
                                <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white text-center">
                                    <FileWarning className="h-10 w-10 text-[var(--warning)]" />

                                    <p className="mt-4 text-sm font-black text-[var(--foreground)]">
                                        PDF no disponible
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}