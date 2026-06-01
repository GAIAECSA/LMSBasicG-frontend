export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ||
    "http://213.165.74.184:9000";

export const AUTH_STORAGE_KEY = "lmsbasicg_auth";
export const MIN_CERTIFICATE_GRADE = 70;
