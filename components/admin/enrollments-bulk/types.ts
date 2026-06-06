import type {
    MassiveEnrollmentUserPayload,
} from "@/services/enrollments.service";

export type BulkEnrollmentRow =
    MassiveEnrollmentUserPayload & {
        localId: string;
    };

export type BulkFieldConfig = {
    key: keyof MassiveEnrollmentUserPayload;
    label: string;
    placeholder: string;
    required: boolean;
    className?: string;
};

export type BulkValidation = {
    activeRows: BulkEnrollmentRow[];
    normalizedRows: MassiveEnrollmentUserPayload[];
    rowErrors: Record<string, string[]>;
    generalErrors: string[];
    canSubmit: boolean;
};
