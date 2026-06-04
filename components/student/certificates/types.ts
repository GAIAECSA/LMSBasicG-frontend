import type { Certificate } from "@/services/certificates.service";

export type CertificateType = "mdt" | "institutional";

export type CertificateStatusFilter = "all" | CertificateType;

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

    certificate_type?: string | null;
    certificateType?: string | null;
    template_type?: string | null;
    source?: string | null;
    origin?: string | null;

    is_mdt?: boolean | string | number | null;
    isMdt?: boolean | string | number | null;
    mdt?: boolean | string | number | null;

    hours?: number | string | null;
    duration_hours?: number | string | null;

    course?: {
        id?: number | string | null;
        name?: string | null;
        mdt?: boolean | string | number | null;
        is_mdt?: boolean | string | number | null;
        isMdt?: boolean | string | number | null;
        certificate_type?: string | null;
        type?: string | null;
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
        id_number?: string | null;
        idNumber?: string | null;
        identification?: string | null;
        identification_number?: string | null;
        document_number?: string | null;
        cedula?: string | null;
    } | null;
};

export type CertificateStatusStyles = {
    badge: string;
    line: string;
    iconBg: string;
    border: string;
};

export type CertificateTypeStyles = {
    badge: string;
    icon: string;
};
export type MdtCertificateForStudent = {
    id: number | string;
    course_id?: number | string | null;
    file_url?: string | null;
    file_name?: string | null;
    id_number?: string | null;
    certificate_type?: string | null;
    deleted?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
};