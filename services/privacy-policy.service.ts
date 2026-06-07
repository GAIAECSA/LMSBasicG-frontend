import {
    API_URL,
    appendFile,
    appendFormValue,
    getJsonHeaders,
    getMultipartHeaders,
    handleApiResponse,
    validateId,
} from "./api-client.service";

const PRIVACY_POLICY_ENDPOINT = `${API_URL}/api/v1/privacy-policy`;
const USER_PRIVACY_POLICY_ENDPOINT = `${API_URL}/api/v1/user-privacy-policy`;

export function resolvePrivacyPolicyFileUrl(
    fileUrl?: string | null,
): string {
    const cleanFileUrl =
        String(fileUrl ?? "")
            .trim()
            .replace(/\\/g, "/");

    if (!cleanFileUrl) {
        return "";
    }

    if (
        cleanFileUrl.startsWith("http://") ||
        cleanFileUrl.startsWith("https://") ||
        cleanFileUrl.startsWith("blob:") ||
        cleanFileUrl.startsWith("data:")
    ) {
        return cleanFileUrl;
    }

    const cleanApiUrl =
        API_URL.replace(/\/+$/, "");

    const cleanRelativePath =
        cleanFileUrl.replace(/^\/+/, "");

    return `${cleanApiUrl}/${cleanRelativePath}`;
}

function getPrivacyPolicyFileErrorMessage(
    value: unknown,
    fallback: string,
): string {
    if (
        typeof value === "object" &&
        value !== null
    ) {
        const record =
            value as Record<string, unknown>;

        if (
            typeof record.detail === "string" &&
            record.detail.trim()
        ) {
            return record.detail.trim();
        }

        if (
            typeof record.message === "string" &&
            record.message.trim()
        ) {
            return record.message.trim();
        }
    }

    return fallback;
}

export async function createPrivacyPolicyPdfPreviewUrl(
    fileUrl: string,
    accessToken?: string,
): Promise<string> {
    const resolvedFileUrl =
        resolvePrivacyPolicyFileUrl(
            fileUrl,
        );

    if (!resolvedFileUrl) {
        throw new Error(
            "La política no tiene un archivo asociado.",
        );
    }

    const response =
        await fetch(resolvedFileUrl, {
            method: "GET",
            headers: withBearerToken(
                {},
                accessToken,
            ),
            cache: "no-store",
        });

    if (!response.ok) {
        let errorMessage =
            `No se pudo cargar el PDF de la política. Código ${response.status}.`;

        try {
            const data =
                await response.json();

            errorMessage =
                getPrivacyPolicyFileErrorMessage(
                    data,
                    errorMessage,
                );
        } catch {
            // La respuesta del archivo puede no ser JSON.
        }

        throw new Error(errorMessage);
    }

    const blob =
        await response.blob();

    if (!blob.size) {
        throw new Error(
            "El archivo PDF recibido está vacío.",
        );
    }

    const responseContentType =
        String(
            response.headers.get(
                "content-type",
            ) ?? "",
        )
            .trim()
            .toLowerCase();

    const blobContentType =
        String(blob.type ?? "")
            .trim()
            .toLowerCase();

    const cleanResolvedFileUrl =
        resolvedFileUrl
            .split("?")[0]
            .split("#")[0]
            .toLowerCase();

    const isPdf =
        responseContentType.includes(
            "application/pdf",
        ) ||
        blobContentType.includes(
            "application/pdf",
        ) ||
        cleanResolvedFileUrl.endsWith(
            ".pdf",
        );

    if (!isPdf) {
        throw new Error(
            "El archivo asociado a la política no es un PDF válido.",
        );
    }

    return URL.createObjectURL(blob);
}

export type PrivacyPolicy = {
    id: number;
    title: string;
    version: string;
    file_url: string;
    is_active: boolean;
    mandatory: boolean;
    effective_date: string;
    deleted: boolean;
    created_at?: string;
    updated_at?: string | null;
};

export type PrivacyPolicyPayload = {
    title: string;
    version: string;
    is_active?: boolean;
    mandatory?: boolean;
    effective_date: string | Date;
    file?: File | Blob | null;
};

export type UserPrivacyPolicyAcceptance = {
    id: number;
    user_id: number;
    privacy_policy_id: number;
    accepted: boolean;
    accepted_at: string;
    created_at: string;
};

export type ActivePrivacyPolicyAcceptanceResponse =
    | string
    | boolean
    | {
        accepted?: boolean;
        is_accepted?: boolean;
        has_accepted?: boolean;
        accepted_privacy_policy?: boolean;
        privacy_policy_accepted?: boolean;
        privacy_policy_id?: number;
        version?: string;
        message?: string;
    }
    | null;

function normalizeDateTime(value?: string | Date) {
    if (!value) return undefined;

    if (value instanceof Date) {
        return value.toISOString();
    }

    const cleanValue = value.trim();

    if (!cleanValue) return undefined;

    const parsedDate = new Date(cleanValue);

    if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
    }

    return cleanValue;
}

function buildPrivacyPolicyFormData(
    payload: PrivacyPolicyPayload,
): FormData {
    const data = new FormData();

    appendFormValue(data, "title", payload.title);
    appendFormValue(data, "version", payload.version);
    appendFormValue(data, "is_active", payload.is_active);
    appendFormValue(data, "mandatory", payload.mandatory);

    appendFormValue(
        data,
        "effective_date",
        normalizeDateTime(payload.effective_date),
    );

    appendFile(data, payload.file);

    return data;
}

function withBearerToken(
    headers: HeadersInit,
    accessToken?: string,
): HeadersInit {
    const finalHeaders = new Headers(headers);

    if (accessToken) {
        finalHeaders.set("Authorization", `Bearer ${accessToken}`);
    }

    return finalHeaders;
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function normalizePolicyResponse(
    value: unknown,
): PrivacyPolicy | null {
    if (!value) return null;

    let data = value;

    if (isRecord(data)) {
        data =
            data.data ??
            data.policy ??
            data.privacyPolicy ??
            data.privacy_policy ??
            data.result ??
            data;
    }

    if (Array.isArray(data)) {
        return getActivePolicyFromList(
            data.filter(isRecord) as PrivacyPolicy[],
        );
    }

    if (!isRecord(data)) {
        return null;
    }

    return data as PrivacyPolicy;
}

function getActivePolicyFromList(
    policies: PrivacyPolicy[],
): PrivacyPolicy | null {
    const activePolicies = policies
        .filter(
            (policy) =>
                policy.is_active === true &&
                policy.deleted !== true,
        )
        .sort((a, b) => {
            const dateA = new Date(
                a.effective_date ??
                a.created_at ??
                "",
            ).getTime();

            const dateB = new Date(
                b.effective_date ??
                b.created_at ??
                "",
            ).getTime();

            return dateB - dateA;
        });

    return activePolicies[0] ?? null;
}

export function isPrivacyPolicyAccepted(
    value: ActivePrivacyPolicyAcceptanceResponse,
): boolean {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        return (
            normalized === "true" ||
            normalized === "1" ||
            normalized === "accepted" ||
            normalized === "aceptado" ||
            normalized === "si" ||
            normalized === "sí"
        );
    }

    if (isRecord(value)) {
        return (
            value.accepted === true ||
            value.is_accepted === true ||
            value.has_accepted === true ||
            value.accepted_privacy_policy === true ||
            value.privacy_policy_accepted === true
        );
    }

    return false;
}

/* =========================================================
   GET ALL
========================================================= */

export async function getAllPrivacyPolicies(
    accessToken?: string,
): Promise<PrivacyPolicy[]> {
    const response = await fetch(`${PRIVACY_POLICY_ENDPOINT}/`, {
        method: "GET",
        headers: withBearerToken(
            getJsonHeaders(),
            accessToken,
        ),
        cache: "no-store",
    });

    const data =
        await handleApiResponse<unknown>(response);

    if (Array.isArray(data)) {
        return data as PrivacyPolicy[];
    }

    if (
        isRecord(data) &&
        Array.isArray(data.data)
    ) {
        return data.data as PrivacyPolicy[];
    }

    return [];
}

/* =========================================================
   GET ONE
========================================================= */

export async function getPrivacyPolicy(
    privacyPolicyId: number,
    accessToken?: string,
): Promise<PrivacyPolicy> {
    const validPrivacyPolicyId = validateId(
        privacyPolicyId,
        "ID de política de privacidad",
    );

    const response = await fetch(
        `${PRIVACY_POLICY_ENDPOINT}/${validPrivacyPolicyId}`,
        {
            method: "GET",
            headers: withBearerToken(
                getJsonHeaders(),
                accessToken,
            ),
            cache: "no-store",
        },
    );

    return handleApiResponse<PrivacyPolicy>(response);
}

/* =========================================================
   GET ACTIVE
========================================================= */

export async function getActivePrivacyPolicy(
    accessToken?: string,
): Promise<PrivacyPolicy | null> {
    const headers = withBearerToken(
        getJsonHeaders(),
        accessToken,
    );

    try {
        const response = await fetch(
            `${PRIVACY_POLICY_ENDPOINT}/active/current`,
            {
                method: "GET",
                headers,
                cache: "no-store",
            },
        );

        if (response.ok) {
            const data =
                await handleApiResponse<unknown>(response);

            const activePolicy =
                normalizePolicyResponse(data);

            if (
                activePolicy &&
                activePolicy.is_active !== false &&
                activePolicy.deleted !== true
            ) {
                return activePolicy;
            }
        }
    } catch {
        // Si falla active/current, intenta con el listado.
    }

    try {
        const policies =
            await getAllPrivacyPolicies(accessToken);

        return getActivePolicyFromList(policies);
    } catch {
        return null;
    }
}

/* =========================================================
   CREATE
========================================================= */

export async function createPrivacyPolicy(
    payload: PrivacyPolicyPayload,
): Promise<PrivacyPolicy> {
    const response = await fetch(`${PRIVACY_POLICY_ENDPOINT}/`, {
        method: "POST",
        headers: getMultipartHeaders(),
        body: buildPrivacyPolicyFormData(payload),
    });

    return handleApiResponse<PrivacyPolicy>(response);
}

/* =========================================================
   ACCEPT PRIVACY POLICY
========================================================= */

export async function acceptPrivacyPolicy(
    privacyPolicyId: number,
    accessToken?: string,
): Promise<UserPrivacyPolicyAcceptance> {
    const validPrivacyPolicyId = validateId(
        privacyPolicyId,
        "ID de política de privacidad",
    );

    const response = await fetch(
        `${USER_PRIVACY_POLICY_ENDPOINT}/accept/${validPrivacyPolicyId}`,
        {
            method: "POST",
            headers: withBearerToken(
                getJsonHeaders(),
                accessToken,
            ),
            body: JSON.stringify({
                privacy_policy_id: validPrivacyPolicyId,
                accepted: true,
            }),
            cache: "no-store",
        },
    );

    return handleApiResponse<UserPrivacyPolicyAcceptance>(response);
}

/* =========================================================
   CHECK ACTIVE PRIVACY POLICY ACCEPTANCE
========================================================= */

export async function checkActivePrivacyPolicyAcceptance(
    accessToken?: string,
): Promise<ActivePrivacyPolicyAcceptanceResponse> {
    const response = await fetch(
        `${USER_PRIVACY_POLICY_ENDPOINT}/check-active`,
        {
            method: "GET",
            headers: withBearerToken(
                getJsonHeaders(),
                accessToken,
            ),
            cache: "no-store",
        },
    );

    return handleApiResponse<ActivePrivacyPolicyAcceptanceResponse>(
        response,
    );
}

/* =========================================================
   CONFIRM ACTIVE PRIVACY POLICY ACCEPTANCE
========================================================= */

export async function confirmActivePrivacyPolicyAcceptance(
    accessToken?: string,
): Promise<boolean> {
    const response =
        await checkActivePrivacyPolicyAcceptance(accessToken);

    return isPrivacyPolicyAccepted(response);
}