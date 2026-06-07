import type { PolicyFormState } from "./types";

export const EMPTY_POLICY_FORM: PolicyFormState = {
    title: "",
    version: "",
    is_active: true,
    mandatory: true,
    effective_date: "",
    file: null,
};

export const ALLOWED_POLICY_FILE_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
];

export const ALLOWED_POLICY_FILE_EXTENSIONS = [
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
];
