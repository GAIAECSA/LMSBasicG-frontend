"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
    AlertCircle,
    Award,
    CalendarDays,
    Download,
    Eye,
    FileCheck2,
    Loader2,
    RefreshCcw,
    ShieldCheck,
} from "lucide-react";
import {
    getMdtCertificatesByCourseAndIdNumber,
    type MdtCertificate,
} from "../../../../services/mdt-certificates.service";

type AnyRecord = Record<string, unknown>;

type MdtCertificatePanelProps = {
    enabled?: boolean;
    room?: AnyRecord | null;
    course?: AnyRecord | null;
    selectedCourse?: AnyRecord | null;
    currentCourse?: AnyRecord | null;
    courseData?: AnyRecord | null;
    courseId?: number | string | null;
    numericCourseId?: number | string | null;
    currentCourseId?: number | string | null;
    studentIdNumber?: string | null;
    idNumber?: string | null;
    user?: AnyRecord | null;
    student?: AnyRecord | null;
    profile?: AnyRecord | null;
};

type CertificateState = {
    isLoading: boolean;
    error: string;
    certificates: MdtCertificate[];
};

const RAW_API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000";

function normalizeApiOrigin(url: string) {
    const cleanUrl = url.trim().replace(/\/+$/, "");

    if (cleanUrl.endsWith("/api/v1")) {
        return cleanUrl.replace(/\/api\/v1$/, "");
    }

    return cleanUrl;
}

const API_ORIGIN = normalizeApiOrigin(RAW_API_URL);

function toRecord(value: unknown): AnyRecord | null {
    if (!value || typeof value !== "object") return null;

    return value as AnyRecord;
}

function cleanText(value: unknown) {
    if (typeof value !== "string" && typeof value !== "number") return "";

    return String(value).trim();
}

function readNumber(value: unknown, fallback = 0) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeIdNumber(value: unknown) {
    return cleanText(value).replace(/\s+/g, "");
}

function getValue(record: unknown, keys: string[]) {
    const currentRecord = toRecord(record);

    if (!currentRecord) return null;

    for (const key of keys) {
        const value = currentRecord[key];

        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            return value;
        }
    }

    return null;
}

function findDeepValue(source: unknown, keys: string[]): string {
    const record = toRecord(source);

    if (!record) return "";

    for (const key of keys) {
        const value = record[key];

        if (typeof value === "string" || typeof value === "number") {
            const text = cleanText(value);

            if (text) return text;
        }
    }

    for (const value of Object.values(record)) {
        if (value && typeof value === "object") {
            const found = findDeepValue(value, keys);

            if (found) return found;
        }
    }

    return "";
}

function getStorageJson(key: string): AnyRecord | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(key);

        if (!raw) return null;

        const parsed: unknown = JSON.parse(raw);

        return toRecord(parsed);
    } catch {
        return null;
    }
}

function getStudentIdNumberFromLocalStorage() {
    if (typeof window === "undefined") return "";

    const possibleJsonKeys = [
        "lmsbasicg_auth",
        "user",
        "auth_user",
        "currentUser",
        "student",
        "profile",
        "session",
        "auth",
    ];

    const possibleIdKeys = [
        "idnumber",
        "id_number",
        "identification",
        "identification_number",
        "cedula",
        "dni",
        "document",
        "document_number",
    ];

    for (const key of possibleJsonKeys) {
        const data = getStorageJson(key);
        const found = findDeepValue(data, possibleIdKeys);

        if (found) return normalizeIdNumber(found);
    }

    for (const key of possibleIdKeys) {
        const value = window.localStorage.getItem(key);
        const normalizedValue = normalizeIdNumber(value);

        if (normalizedValue) return normalizedValue;
    }

    return "";
}

function getCourseIdFromPathname(pathname: string | null) {
    if (!pathname) return 0;

    const parts = pathname.split("/").filter(Boolean);
    const coursesIndex = parts.findIndex((part) => part === "courses");

    if (coursesIndex < 0) return 0;

    return readNumber(parts[coursesIndex + 1], 0);
}

function getRoomRecord(props: MdtCertificatePanelProps) {
    return toRecord(props.room);
}

function getCourseRecord(props: MdtCertificatePanelProps) {
    const room = getRoomRecord(props);

    return (
        toRecord(props.course) ??
        toRecord(props.selectedCourse) ??
        toRecord(props.currentCourse) ??
        toRecord(props.courseData) ??
        toRecord(room?.course) ??
        toRecord(room?.selectedCourse) ??
        toRecord(room?.currentCourse) ??
        toRecord(room?.courseData) ??
        null
    );
}

function getUserRecord(props: MdtCertificatePanelProps) {
    const room = getRoomRecord(props);

    return (
        toRecord(props.user) ??
        toRecord(room?.user) ??
        toRecord(room?.authUser) ??
        toRecord(room?.currentUser) ??
        null
    );
}

function getStudentRecord(props: MdtCertificatePanelProps) {
    const room = getRoomRecord(props);

    return (
        toRecord(props.student) ??
        toRecord(room?.student) ??
        toRecord(room?.studentData) ??
        null
    );
}

function getProfileRecord(props: MdtCertificatePanelProps) {
    const room = getRoomRecord(props);

    return (
        toRecord(props.profile) ??
        toRecord(room?.profile) ??
        toRecord(room?.userProfile) ??
        null
    );
}

function getCourseIdFromProps(
    props: MdtCertificatePanelProps,
    pathname: string | null,
) {
    const room = getRoomRecord(props);
    const course = getCourseRecord(props);

    const directValue =
        props.courseId ?? props.numericCourseId ?? props.currentCourseId;

    return (
        readNumber(directValue, 0) ||
        readNumber(
            getValue(room, [
                "numericCourseId",
                "currentCourseId",
                "courseId",
                "course_id",
                "selectedCourseId",
            ]),
            0,
        ) ||
        readNumber(getValue(course, ["id", "course_id", "courseId"]), 0) ||
        getCourseIdFromPathname(pathname)
    );
}

function getStudentIdNumberFromProps(props: MdtCertificatePanelProps) {
    const possibleIdKeys = [
        "idnumber",
        "id_number",
        "identification",
        "identification_number",
        "cedula",
        "dni",
        "document",
        "document_number",
    ];

    const directValue =
        normalizeIdNumber(props.studentIdNumber) ||
        normalizeIdNumber(props.idNumber);

    if (directValue) return directValue;

    const userValue = findDeepValue(getUserRecord(props), possibleIdKeys);

    if (userValue) return normalizeIdNumber(userValue);

    const studentValue = findDeepValue(getStudentRecord(props), possibleIdKeys);

    if (studentValue) return normalizeIdNumber(studentValue);

    const profileValue = findDeepValue(getProfileRecord(props), possibleIdKeys);

    if (profileValue) return normalizeIdNumber(profileValue);

    const roomValue = findDeepValue(getRoomRecord(props), possibleIdKeys);

    if (roomValue) return normalizeIdNumber(roomValue);

    return getStudentIdNumberFromLocalStorage();
}

function getCertificateValue(certificate: MdtCertificate, keys: string[]) {
    return cleanText(getValue(certificate, keys));
}

function getCertificateFileUrl(certificate: MdtCertificate) {
    return getCertificateValue(certificate, [
        "file_url",
        "fileUrl",
        "url",
        "certificate_url",
        "certificateUrl",
        "path",
    ]);
}

function getCertificateFileName(certificate: MdtCertificate) {
    return (
        getCertificateValue(certificate, [
            "file_name",
            "fileName",
            "filename",
            "name",
        ]) || "certificado.pdf"
    );
}

function getCertificateCreatedAt(certificate: MdtCertificate) {
    return getCertificateValue(certificate, [
        "created_at",
        "createdAt",
        "issue_date",
        "issueDate",
        "updated_at",
        "updatedAt",
    ]);
}

function getCertificateType(certificate: MdtCertificate) {
    return (
        getCertificateValue(certificate, [
            "certificate_type",
            "certificateType",
            "type",
        ]) || "MDT"
    );
}

function buildFileUrl(fileUrl: string | null | undefined) {
    const cleanUrl = cleanText(fileUrl);

    if (!cleanUrl) return "";

    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://") ||
        cleanUrl.startsWith("blob:") ||
        cleanUrl.startsWith("data:")
    ) {
        return cleanUrl;
    }

    if (cleanUrl.startsWith("/")) {
        return `${API_ORIGIN}${cleanUrl}`;
    }

    return `${API_ORIGIN}/${cleanUrl}`;
}

function formatDate(value: string) {
    const date = value ? new Date(value) : null;

    if (!date || Number.isNaN(date.getTime())) {
        return "Sin fecha";
    }

    return new Intl.DateTimeFormat("es-EC", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(date);
}

function CertificateCard({
    certificate,
}: {
    certificate: MdtCertificate;
}) {
    const certificateUrl = buildFileUrl(
        getCertificateFileUrl(certificate),
    );

    const certificateType = getCertificateType(certificate);
    const fileName = getCertificateFileName(certificate);
    const createdAt = formatDate(getCertificateCreatedAt(certificate));

    return (
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                        <FileCheck2 className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-black text-slate-950">
                                Certificado {certificateType}
                            </h3>

                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Disponible
                            </span>
                        </div>

                        <p className="mt-2 truncate text-sm font-semibold text-slate-600">
                            {fileName}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                                <Award className="h-3.5 w-3.5" />
                                {certificateType}
                            </span>

                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {createdAt}
                            </span>
                        </div>
                    </div>
                </div>

                {certificateUrl ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                        <a
                            href={certificateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700"
                        >
                            <Eye className="h-4 w-4" />
                            Visualizar
                        </a>

                        <a
                            href={certificateUrl}
                            download={fileName}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100"
                        >
                            <Download className="h-4 w-4" />
                            Descargar
                        </a>
                    </div>
                ) : null}
            </div>
        </article>
    );
}

export function MdtCertificatePanel(props: MdtCertificatePanelProps) {
    const pathname = usePathname();
    const enabled = props.enabled ?? true;

    const courseId = useMemo(
        () => getCourseIdFromProps(props, pathname),
        [props, pathname],
    );

    const studentIdNumber = useMemo(
        () => getStudentIdNumberFromProps(props),
        [props],
    );

    const [state, setState] = useState<CertificateState>({
        isLoading: enabled,
        error: "",
        certificates: [],
    });

    const loadMdtCertificate = useCallback(async () => {
        if (!enabled) {
            setState({
                isLoading: false,
                error: "",
                certificates: [],
            });
            return;
        }

        if (!courseId) {
            setState({
                isLoading: false,
                error: "No se pudo identificar el curso seleccionado.",
                certificates: [],
            });
            return;
        }

        if (!studentIdNumber) {
            setState({
                isLoading: false,
                error:
                    "No se pudo identificar la cédula o identificación del estudiante.",
                certificates: [],
            });
            return;
        }

        try {
            setState((currentState) => ({
                ...currentState,
                isLoading: true,
                error: "",
            }));

            const certificates =
                await getMdtCertificatesByCourseAndIdNumber(
                    Number(courseId),
                    studentIdNumber,
                );

            setState({
                isLoading: false,
                error: "",
                certificates: Array.isArray(certificates)
                    ? certificates.filter(
                        (certificate) => certificate.deleted !== true,
                    )
                    : [],
            });
        } catch (error) {
            setState({
                isLoading: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "No se pudieron consultar los certificados del estudiante.",
                certificates: [],
            });
        }
    }, [courseId, enabled, studentIdNumber]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadMdtCertificate();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [loadMdtCertificate]);

    const hasCertificates = state.certificates.length > 0;

    if (!enabled) {
        return null;
    }

    return (
        <div className="rounded-[2rem] border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            {state.isLoading ? (
                                <Loader2 className="h-7 w-7 animate-spin" />
                            ) : hasCertificates ? (
                                <FileCheck2 className="h-7 w-7" />
                            ) : (
                                <Award className="h-7 w-7" />
                            )}
                        </div>

                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-lg font-black text-slate-950">
                                    Certificados del curso
                                </h2>

                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    MDT e institucional
                                </span>
                            </div>

                            {state.isLoading ? (
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Consultando certificados disponibles...
                                </p>
                            ) : hasCertificates ? (
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Se encontraron {state.certificates.length}{" "}
                                    certificado(s) asociado(s) a tu
                                    identificación para este curso.
                                </p>
                            ) : (
                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                    Todavía no hay certificados disponibles para
                                    tu usuario en este curso.
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadMdtCertificate()}
                        disabled={state.isLoading}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-700 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {state.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCcw className="h-4 w-4" />
                        )}
                        Actualizar
                    </button>
                </div>

                {state.error ? (
                    <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{state.error}</span>
                    </div>
                ) : null}

                {!state.isLoading && hasCertificates ? (
                    <div className="grid gap-3">
                        {state.certificates.map((certificate) => (
                            <CertificateCard
                                key={`${certificate.id}-${getCertificateType(
                                    certificate,
                                )}`}
                                certificate={certificate}
                            />
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export default MdtCertificatePanel;
