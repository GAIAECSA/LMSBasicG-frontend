export const REQUIRED_FILE_BLOCK_TYPE_ID = 6;

export const DEFAULT_ACCEPTED_FILE_TYPES =
    ".pdf,.jpg,.jpeg,.png,.webp";

export const DEFAULT_UPLOAD_ACCEPT_TYPES =
    ".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx";

export const REVIEW_STATUS_OPTIONS = [
    {
        value: "pending",
        label: "Pendiente",
    },
    {
        value: "approved",
        label: "Aprobado",
    },
    {
        value: "observed",
        label: "Observado",
    },
    {
        value: "rejected",
        label: "Rechazado",
    },
] as const;
