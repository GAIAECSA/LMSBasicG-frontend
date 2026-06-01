import { API_BASE_URL, MIN_CERTIFICATE_GRADE } from "./constants";
import type {
    CertificateStatusFilter,
    CertificateStatusStyles,
    CertificateWithExtraFields,
    EnrollmentForCertificate,
} from "./types";

export function toNumericId(value: unknown) {
    if (value === null || value === undefined || value === "") return null;

    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : null;
}

export function normalizeResourceUrl(url?: string | null) {
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

export function getCertificateFileUrl(
    certificate: CertificateWithExtraFields | null,
) {
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

export function getProtectedPdfViewerUrl(url: string) {
    if (!url) return "";

    const cleanUrl = url.split("#")[0];

    return `${cleanUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
}

export function getCertificateStatusLabel(
    certificate: CertificateWithExtraFields,
) {
    return certificate.is_valid ? "Emitido" : "En revisión";
}

export function getCertificateStatusStyles(
    certificate: CertificateWithExtraFields,
): CertificateStatusStyles {
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

export function getCourseName(certificate: CertificateWithExtraFields) {
    return (
        certificate.course?.name ||
        certificate.course_name ||
        certificate.title ||
        "Curso certificado"
    );
}

export function getCertificateCode(certificate: CertificateWithExtraFields) {
    return certificate.certificate_code || `CERT-${certificate.id}`;
}

export function getCertificateCourseId(
    certificate: CertificateWithExtraFields,
) {
    return (
        toNumericId(certificate.course_id) ||
        toNumericId(certificate.course?.id) ||
        null
    );
}

export function getCertificateFinalGrade(
    certificate: CertificateWithExtraFields,
) {
    if (
        certificate.final_grade === null ||
        certificate.final_grade === undefined ||
        certificate.final_grade === ""
    ) {
        return null;
    }

    const grade = Number(certificate.final_grade);

    return Number.isFinite(grade) ? grade : null;
}

export function isCertificateGeneratedAfterFinish(
    certificate: CertificateWithExtraFields,
) {
    const finalGrade = getCertificateFinalGrade(certificate);

    return (
        certificate.is_valid === true &&
        finalGrade !== null &&
        finalGrade >= MIN_CERTIFICATE_GRADE
    );
}

export function isApprovedEnrollmentForCertificate(
    enrollment: EnrollmentForCertificate,
    certificate: CertificateWithExtraFields,
) {
    const certificateCourseId = getCertificateCourseId(certificate);
    const enrollmentCourseId =
        toNumericId(enrollment.course?.id) || toNumericId(enrollment.course_id);

    const enrollmentRoleId =
        toNumericId(enrollment.role?.id) || toNumericId(enrollment.role_id);

    const enrollmentRoleName = String(enrollment.role?.name ?? "")
        .trim()
        .toUpperCase();

    const isStudentEnrollment =
        enrollmentRoleId === 4 ||
        enrollmentRoleName === "ESTUDIANTE" ||
        enrollmentRoleName === "STUDENT";

    return (
        enrollment.accepted === true &&
        certificateCourseId !== null &&
        enrollmentCourseId === certificateCourseId &&
        isStudentEnrollment
    );
}

export function formatDate(value?: string | null) {
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

export function getCertificateDate(certificate: CertificateWithExtraFields) {
    return formatDate(
        certificate.issued_at ||
            certificate.issue_date ||
            certificate.created_at ||
            certificate.updated_at ||
            null,
    );
}

export function getFilteredCertificates(
    certificates: CertificateWithExtraFields[],
    filter: CertificateStatusFilter,
    searchTerm: string,
) {
    const cleanSearchTerm = searchTerm.trim().toLowerCase();

    return certificates.filter((certificate) => {
        if (!isCertificateGeneratedAfterFinish(certificate)) return false;

        const matchesFilter =
            filter === "all" ||
            (filter === "valid" && certificate.is_valid);

        const courseName = getCourseName(certificate).toLowerCase();
        const code = getCertificateCode(certificate).toLowerCase();

        const matchesSearch =
            cleanSearchTerm.length === 0 ||
            courseName.includes(cleanSearchTerm) ||
            code.includes(cleanSearchTerm);

        return matchesFilter && matchesSearch;
    });
}

export function getUserFullName(user: unknown) {
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

export function getInitials(name: string) {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) return "ES";

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}
