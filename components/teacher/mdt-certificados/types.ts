import type { MdtCertificate } from "@/services/mdt-certificates.service";

export type UploadType = "individual" | "bulk";

export type MdtCertificatesTeacherViewProps = {
    initialCourseId?: number;
    lockCourse?: boolean;
};

export type CourseStudent = {
    id: number;
    userId: number;
    enrollmentId: number;
    firstname: string;
    lastname: string;
    email: string;
    idnumber: string;
};

export type FlexibleRecord = Record<string, unknown>;

export type DeleteModalState = {
    certificate: MdtCertificate;
};

export type EditModalState = {
    certificate: MdtCertificate;
    certificateType: string;
    idNumber: string;
    file: File | null;
};

export type UpdateMdtCertificatePayload = {
    course_id?: number;
    id_number?: string;
    certificate_type?: string;
    file?: File;
    deleted?: boolean;
};
