import type { Certificate } from "@/services/certificates.service";

export type CertificateStatusFilter = "all" | "valid";

export type CertificateWithExtraFields = Certificate & {
    user_id?: number | string | null;
    course_id?: number | string | null;
    file_url?: string | null;
    pdf_url?: string | null;
    url?: string | null;
    certificate_url?: string | null;
    path?: string | null;
    created_at?: string | null;
    issued_at?: string | null;
    issue_date?: string | null;
    updated_at?: string | null;
    final_grade?: number | string | null;
    course?: {
        id?: number | string | null;
        name?: string | null;
    } | null;
    course_name?: string | null;
    title?: string | null;
};

export type EnrollmentForCertificate = {
    id?: number | string | null;
    accepted?: boolean | null;
    course_id?: number | string | null;
    user_id?: number | string | null;
    role_id?: number | string | null;
    course?: {
        id?: number | string | null;
        name?: string | null;
    } | null;
    role?: {
        id?: number | string | null;
        name?: string | null;
    } | null;
    user?: {
        id?: number | string | null;
        role_id?: number | string | null;
    } | null;
};

export type CertificateStatusStyles = {
    badge: string;
    line: string;
    iconBg: string;
    border: string;
};
