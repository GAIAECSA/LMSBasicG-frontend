export const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL?.replace(
        /\/+$/,
        "",
    ) ||
    "http://213.165.74.184:9000";

export const ROLE_ID_TEACHER = 3;
export const ROLE_ID_STUDENT = 4;
