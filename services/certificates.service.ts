const RAW_API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000";

function normalizeApiBaseUrl(url: string) {
    const cleanUrl = url.trim().replace(/\/+$/, "");

    if (cleanUrl.endsWith("/api/v1")) {
        return cleanUrl;
    }

    return `${cleanUrl}/api/v1`;
}

const API_BASE_URL = normalizeApiBaseUrl(RAW_API_URL);
const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, "");

const CERTIFICATE_TEMPLATES_URL = `${API_BASE_URL}/certificate_templates`;
const CERTIFICATES_URL = `${API_BASE_URL}/certificates`;

const AUTH_STORAGE_KEY = "lmsbasicg_auth";
const AUTH_FALLBACK_KEYS = [
    "token",
    "access_token",
    "accessToken",
    "authToken",
];

export type CertificateFieldType =
    | "student_name"
    | "course_name"
    | "completion_date"
    | "instructor_name"
    | "certificate_code"
    | "final_grade"
    | "signature_instructor"
    | "signature_director"
    | "custom";

export type CertificateVariableKey =
    | "student_name"
    | "course_name"
    | "completion_date"
    | "instructor_name"
    | "certificate_code"
    | "final_grade"
    | "custom";

export type CertificateTextAlign = "left" | "center" | "right";

export type CertificateFieldMode = "text" | "signature";

export type CertificateField = {
    id: string;
    name?: CertificateFieldType;
    type: CertificateFieldType;
    variableKey?: CertificateVariableKey;
    label: string;
    value: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    fontWeight: "normal" | "bold";
    color: string;
    textAlign: CertificateTextAlign;
    fieldMode: CertificateFieldMode;
    signatureImage?: string | null;
    fontFamily?: string;
    textCase?: "none" | "uppercase" | "lowercase" | "sentence";
};

export type CertificateQrConfig = {
    enabled?: boolean;
    x: number;
    y: number;
    size: number;
    [key: string]: unknown;
};

export type CertificateTemplate = {
    id?: number;
    courseId: number;
    backgroundImage: string;
    fields: CertificateField[];
    qrConfig: CertificateQrConfig;
};

export type CertificateSignatureFiles = Record<
    string,
    File | Blob | null | undefined
>;

export type Certificate = {
    id: number;
    user_id: number;
    course_id: number;
    template_id: number | null;
    student_name: string;
    course_name: string;
    final_grade: string;
    certificate_code: string;
    file_url: string;
    is_valid: boolean;
    created_at: string;
};

export type CertificatePdfValues = {
    studentName: string;
    courseName: string;
    completionDate: string;
    instructorName?: string;
    certificateCode?: string;
    finalGrade?: string | number;
    fileUrl?: string;
};

type ApiCertificateTemplate = {
    id: number;
    course_id: number;
    background_image_url: string | null;
    fields: unknown;
    qr_config: unknown;
};

type ApiCertificate = {
    id: number;
    user_id: number;
    course_id: number;
    template_id: number | null;
    student_name: string | null;
    course_name: string | null;
    final_grade: string | number | null;
    certificate_code: string | null;
    file_url: string | null;
    is_valid: boolean;
    created_at: string | null;
};

export class CertificateServiceError extends Error {
    status: number;
    data: unknown;

    constructor(message: string, status: number, data: unknown) {
        super(message);
        this.name = "CertificateServiceError";
        this.status = status;
        this.data = data;
    }
}

const certificateFieldTypes: CertificateFieldType[] = [
    "student_name",
    "course_name",
    "completion_date",
    "instructor_name",
    "certificate_code",
    "final_grade",
    "signature_instructor",
    "signature_director",
    "custom",
];

const textAlignOptions: CertificateTextAlign[] = ["left", "center", "right"];

function createId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clearAuthSession() {
    if (typeof window === "undefined") return;

    localStorage.removeItem(AUTH_STORAGE_KEY);

    AUTH_FALLBACK_KEYS.forEach((key) => {
        localStorage.removeItem(key);
    });
}

function decodeJwtPayload(token: string): { exp?: number } | null {
    try {
        const payload = token.split(".")[1];

        if (!payload) return null;

        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const paddedPayload = normalizedPayload.padEnd(
            normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
            "=",
        );

        return JSON.parse(window.atob(paddedPayload)) as { exp?: number };
    } catch {
        return null;
    }
}

function isTokenExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);

    if (!payload?.exp) return false;

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);

    return payload.exp <= currentTimeInSeconds;
}

function cleanToken(value: unknown): string | null {
    if (typeof value !== "string") return null;

    const token = value.trim().replace(/^Bearer\s+/i, "");

    return token || null;
}

function getToken(): string | null {
    if (typeof window === "undefined") return null;

    const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!rawSession) {
        clearAuthSession();
        return null;
    }

    try {
        const parsedSession = JSON.parse(rawSession) as {
            accessToken?: string;
            token?: string;
            access_token?: string;
            data?: {
                accessToken?: string;
                token?: string;
                access_token?: string;
            };
            session?: {
                accessToken?: string;
                token?: string;
                access_token?: string;
            };
            user?: {
                accessToken?: string;
                token?: string;
                access_token?: string;
            };
        };

        const token = cleanToken(
            parsedSession.accessToken ??
            parsedSession.token ??
            parsedSession.access_token ??
            parsedSession.data?.accessToken ??
            parsedSession.data?.token ??
            parsedSession.data?.access_token ??
            parsedSession.session?.accessToken ??
            parsedSession.session?.token ??
            parsedSession.session?.access_token ??
            parsedSession.user?.accessToken ??
            parsedSession.user?.token ??
            parsedSession.user?.access_token,
        );

        if (!token) {
            clearAuthSession();
            return null;
        }

        if (isTokenExpired(token)) {
            clearAuthSession();
            return null;
        }

        return token;
    } catch {
        const token = cleanToken(rawSession);

        if (!token) {
            clearAuthSession();
            return null;
        }

        if (isTokenExpired(token)) {
            clearAuthSession();
            return null;
        }

        return token;
    }
}

function getHeaders(): HeadersInit {
    const token = getToken();

    if (!token) {
        throw new CertificateServiceError(
            "No se encontró un token válido. Inicia sesión nuevamente.",
            401,
            null,
        );
    }

    return {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };
}

function getApiErrorMessage(data: unknown) {
    if (!data) return "";

    if (typeof data === "string") return data;

    if (typeof data === "object" && data !== null) {
        const record = data as Record<string, unknown>;

        if (typeof record.detail === "string") {
            return record.detail;
        }

        if (Array.isArray(record.detail)) {
            return record.detail
                .map((item) => {
                    if (
                        typeof item === "object" &&
                        item !== null &&
                        "msg" in item
                    ) {
                        return String((item as { msg: unknown }).msg);
                    }

                    return "";
                })
                .filter(Boolean)
                .join(", ");
        }

        if (typeof record.message === "string") {
            return record.message;
        }
    }

    return "";
}

async function parseResponse<T>(response: Response): Promise<T> {
    const text = await response.text();

    let data: unknown = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        if (response.status === 401) {
            clearAuthSession();

            throw new CertificateServiceError(
                "Tu sesión expiró o no es válida. Inicia sesión nuevamente.",
                response.status,
                data,
            );
        }

        if (response.status === 403) {
            throw new CertificateServiceError(
                getApiErrorMessage(data) ||
                "No tienes permisos para realizar esta acción. Inicia sesión con un usuario ADMIN o DOCENTE.",
                response.status,
                data,
            );
        }

        const message =
            getApiErrorMessage(data) ||
            `Error ${response.status}: no se pudo completar la solicitud.`;

        throw new CertificateServiceError(message, response.status, data);
    }

    return data as T;
}

function buildFileUrl(url: string | null | undefined) {
    if (!url) return "";

    const cleanUrl = url.trim();

    if (
        cleanUrl.startsWith("http://") ||
        cleanUrl.startsWith("https://") ||
        cleanUrl.startsWith("data:") ||
        cleanUrl.startsWith("blob:")
    ) {
        return cleanUrl;
    }

    if (cleanUrl.startsWith("/")) {
        return `${API_ORIGIN}${cleanUrl}`;
    }

    return `${API_ORIGIN}/${cleanUrl}`;
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
    if (!value) return fallback;

    if (typeof value === "string") {
        try {
            return JSON.parse(value) as T;
        } catch {
            return fallback;
        }
    }

    return value as T;
}

function getFieldTypeFromValue(value: unknown): CertificateFieldType {
    if (typeof value !== "string") return "custom";

    const normalized = value.trim().toLowerCase();

    if (normalized === "date") return "completion_date";
    if (normalized === "student") return "student_name";
    if (normalized === "course") return "course_name";
    if (normalized === "grade") return "final_grade";
    if (normalized === "score") return "final_grade";

    if (certificateFieldTypes.includes(normalized as CertificateFieldType)) {
        return normalized as CertificateFieldType;
    }

    return "custom";
}

function isTextAlign(value: unknown): value is CertificateTextAlign {
    return (
        typeof value === "string" &&
        textAlignOptions.includes(value as CertificateTextAlign)
    );
}

function isSignatureType(type: CertificateFieldType) {
    return type === "signature_instructor" || type === "signature_director";
}

function normalizeNumber(value: unknown, fallback: number) {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeString(value: unknown, fallback: string) {
    return typeof value === "string" ? value : fallback;
}

function shouldUseEmptyTemplate(error: unknown) {
    if (!(error instanceof CertificateServiceError)) return false;

    const message = String(error.message).toLowerCase();

    return (
        error.status === 404 ||
        error.status === 500 ||
        message.includes("not found") ||
        message.includes("internal server error")
    );
}

export function getFieldLabel(type: CertificateFieldType) {
    const labels: Record<CertificateFieldType, string> = {
        student_name: "Nombre del estudiante",
        course_name: "Nombre del curso",
        completion_date: "Fecha de finalización",
        instructor_name: "Nombre del instructor",
        certificate_code: "Código del certificado",
        final_grade: "Promedio final",
        signature_instructor: "Firma del instructor",
        signature_director: "Firma del director",
        custom: "Texto personalizado",
    };

    return labels[type];
}

export function getVariableKeyByFieldType(
    type: CertificateFieldType,
): CertificateVariableKey {
    if (type === "student_name") return "student_name";
    if (type === "course_name") return "course_name";
    if (type === "completion_date") return "completion_date";
    if (type === "instructor_name") return "instructor_name";
    if (type === "certificate_code") return "certificate_code";
    if (type === "final_grade") return "final_grade";

    return "custom";
}

export function getCertificateVariableToken(variableKey: CertificateVariableKey) {
    if (variableKey === "custom") return "";

    return `{{${variableKey}}}`;
}

export function getCertificatePreviewValue(variableKey: CertificateVariableKey) {
    const values: Record<CertificateVariableKey, string> = {
        student_name: "Nombre del estudiante",
        course_name: "Nombre del curso",
        completion_date: "30/04/2026",
        instructor_name: "Nombre del instructor",
        certificate_code: "CERT-000001",
        final_grade: "9.5",
        custom: "Texto personalizado",
    };

    return values[variableKey];
}

export function renderCertificateVariableText(value: string) {
    return value
        .replaceAll("{{student_name}}", "Nombre del estudiante")
        .replaceAll("{{course_name}}", "Nombre del curso")
        .replaceAll("{{completion_date}}", "30/04/2026")
        .replaceAll("{{instructor_name}}", "Nombre del instructor")
        .replaceAll("{{certificate_code}}", "CERT-000001")
        .replaceAll("{{final_grade}}", "9.5");
}

export function getCertificateFieldPreviewValue(field: CertificateField) {
    if (
        field.type === "signature_instructor" ||
        field.type === "signature_director" ||
        field.fieldMode === "signature"
    ) {
        return field.value || field.label;
    }

    return renderCertificateVariableText(field.value || field.label);
}

export function getFieldDefaultValue(type: CertificateFieldType) {
    const variableKey = getVariableKeyByFieldType(type);

    if (variableKey !== "custom") {
        return getCertificateVariableToken(variableKey);
    }

    const values: Record<CertificateFieldType, string> = {
        student_name: "{{student_name}}",
        course_name: "{{course_name}}",
        completion_date: "{{completion_date}}",
        instructor_name: "{{instructor_name}}",
        certificate_code: "{{certificate_code}}",
        final_grade: "{{final_grade}}",
        signature_instructor: "Firma del instructor",
        signature_director: "Firma del director",
        custom: "Texto personalizado",
    };

    return values[type];
}

function normalizeField(value: unknown, index: number): CertificateField {
    const field =
        typeof value === "object" && value !== null
            ? (value as Record<string, unknown>)
            : {};

    const rawName = field.name ?? field.type;
    const type = getFieldTypeFromValue(rawName);
    const isSignature = isSignatureType(type);
    const variableKey = getVariableKeyByFieldType(type);

    const fieldMode =
        field.fieldMode === "signature" ||
            field.field_mode === "signature" ||
            isSignature
            ? "signature"
            : "text";

    const rawSignature =
        field.signatureImage ??
        field.signature_image ??
        field.signature_image_url ??
        field.signature_url ??
        null;

    const signatureImage =
        typeof rawSignature === "string" && rawSignature.trim()
            ? buildFileUrl(rawSignature)
            : null;

    return {
        id: normalizeString(field.id, createId()),
        name: type,
        type,
        variableKey,
        label: normalizeString(field.label, getFieldLabel(type)),
        value: normalizeString(field.value, getFieldDefaultValue(type)),
        x: normalizeNumber(field.x, 50),
        y: normalizeNumber(field.y, 25 + index * 8),
        width: normalizeNumber(field.width, isSignature ? 24 : 45),
        height: normalizeNumber(field.height, isSignature ? 15 : 8),
        fontSize: normalizeNumber(
            field.fontSize ?? field.font_size,
            isSignature ? 12 : 24,
        ),
        fontWeight:
            field.fontWeight === "bold" || field.font_weight === "bold"
                ? "bold"
                : "normal",
        color: normalizeString(field.color, "#111827"),
        textAlign: isTextAlign(field.textAlign)
            ? field.textAlign
            : isTextAlign(field.text_align)
                ? field.text_align
                : "center",
        fieldMode,
        signatureImage,
    };
}

function normalizeQrConfig(value: unknown): CertificateQrConfig {
    const qrValue = parseJsonValue<Record<string, unknown>>(value, {});

    return {
        ...qrValue,
        enabled: Boolean(qrValue.enabled),
        x: normalizeNumber(qrValue.x, 84),
        y: normalizeNumber(qrValue.y, 72),
        size: normalizeNumber(qrValue.size, 13),
    };
}

function normalizeTemplate(apiTemplate: ApiCertificateTemplate): CertificateTemplate {
    const fieldsValue = parseJsonValue<unknown[]>(apiTemplate.fields, []);

    return {
        id: apiTemplate.id,
        courseId: Number(apiTemplate.course_id),
        backgroundImage: buildFileUrl(apiTemplate.background_image_url),
        fields: Array.isArray(fieldsValue)
            ? fieldsValue.map((field, index) => normalizeField(field, index))
            : [],
        qrConfig: normalizeQrConfig(apiTemplate.qr_config),
    };
}

function serializeFields(fields: CertificateField[]) {
    return fields.map((field) => ({
        name: field.name ?? field.type,
        type: field.type,
        x: field.x,
        y: field.y,
        id: field.id,
        label: field.label,
        value: field.value,
        variableKey: field.variableKey ?? getVariableKeyByFieldType(field.type),
        width: field.width,
        height: field.height ?? 8,
        fontSize: field.fontSize,
        fontWeight: field.fontWeight,
        color: field.color,
        textAlign: field.textAlign,
        fieldMode:
            field.fieldMode ??
            (isSignatureType(field.type) ? "signature" : "text"),
        signatureImage: null,
        fontFamily: field.fontFamily ?? "georgia",
        textCase: field.textCase ?? "none",
    }));
}

function serializeQrConfig(qrConfig: CertificateQrConfig) {
    return {
        ...qrConfig,
        enabled: Boolean(qrConfig.enabled),
        x: normalizeNumber(qrConfig.x, 84),
        y: normalizeNumber(qrConfig.y, 72),
        size: normalizeNumber(qrConfig.size, 13),
    };
}

function buildTemplateFormData(
    courseId: number,
    template: CertificateTemplate,
    backgroundImage?: File | Blob | null,
    signatureFiles?: CertificateSignatureFiles,
) {
    const formData = new FormData();

    const safeCourseId = Number(courseId);

    if (!Number.isFinite(safeCourseId) || safeCourseId <= 0) {
        throw new Error(
            "No se pudo identificar el curso para guardar la plantilla.",
        );
    }

    const serializedFields = serializeFields(template.fields);
    const serializedQrConfig = serializeQrConfig(template.qrConfig);

    const templateData = {
        course_id: safeCourseId,
        fields: serializedFields,
        qr_config: serializedQrConfig,
    };

    formData.append("course_id", String(safeCourseId));
    formData.append("data", JSON.stringify(templateData));
    formData.append("fields", JSON.stringify(serializedFields));
    formData.append("qr_config", JSON.stringify(serializedQrConfig));

    if (backgroundImage) {
        formData.append("background_image", backgroundImage);
    }

    Object.entries(signatureFiles ?? {}).forEach(([fieldId, file]) => {
        if (!file) return;

        formData.append(`signature_${fieldId}`, file);
    });

    return formData;
}

export function createCertificateField(
    type: CertificateFieldType,
): CertificateField {
    const isSignature = isSignatureType(type);
    const variableKey = getVariableKeyByFieldType(type);

    const baseField: CertificateField = {
        id: createId(),
        name: type,
        type,
        variableKey,
        label: getFieldLabel(type),
        value: getFieldDefaultValue(type),
        x: 50,
        y: 50,
        width: isSignature ? 26 : 45,
        height: isSignature ? 15 : 8,
        fontSize: isSignature ? 12 : 24,
        fontWeight: isSignature ? "normal" : "bold",
        color: "#111827",
        textAlign: "center",
        fieldMode: isSignature ? "signature" : "text",
        signatureImage: null,
        fontFamily: "helvetica",
        textCase: "none",
    };

    if (type === "student_name") {
        return {
            ...baseField,
            y: 45,
            fontSize: 30,
            width: 55,
        };
    }

    if (type === "course_name") {
        return {
            ...baseField,
            y: 58,
            fontSize: 24,
            width: 60,
        };
    }

    if (type === "completion_date") {
        return {
            ...baseField,
            y: 72,
            fontSize: 14,
            fontWeight: "normal",
            width: 35,
        };
    }

    if (type === "certificate_code") {
        return {
            ...baseField,
            x: 80,
            y: 90,
            fontSize: 10,
            fontWeight: "normal",
            width: 25,
        };
    }

    if (type === "final_grade") {
        return {
            ...baseField,
            x: 50,
            y: 76,
            fontSize: 16,
            fontWeight: "bold",
            width: 35,
        };
    }

    if (type === "signature_instructor") {
        return {
            ...baseField,
            x: 35,
            y: 78,
        };
    }

    if (type === "signature_director") {
        return {
            ...baseField,
            x: 65,
            y: 78,
        };
    }

    return baseField;
}

export function createEmptyCertificateTemplate(
    courseId: number,
): CertificateTemplate {
    return {
        courseId,
        backgroundImage: "",
        fields: [
            createCertificateField("student_name"),
            createCertificateField("course_name"),
            createCertificateField("completion_date"),
            createCertificateField("signature_instructor"),
            createCertificateField("signature_director"),
            createCertificateField("certificate_code"),
        ],
        qrConfig: {
            enabled: false,
            x: 84,
            y: 72,
            size: 13,
        },
    };
}

export async function getAllCertificateTemplates() {
    const response = await fetch(`${CERTIFICATE_TEMPLATES_URL}/`, {
        method: "GET",
        headers: getHeaders(),
    });

    const data = await parseResponse<ApiCertificateTemplate[]>(response);

    return Array.isArray(data) ? data.map(normalizeTemplate) : [];
}

export async function getCertificateTemplateById(templateId: number) {
    const response = await fetch(`${CERTIFICATE_TEMPLATES_URL}/${templateId}`, {
        method: "GET",
        headers: getHeaders(),
    });

    const data = await parseResponse<ApiCertificateTemplate>(response);

    return normalizeTemplate(data);
}

export async function getCertificateTemplateByCourse(courseId: number) {
    const response = await fetch(
        `${CERTIFICATE_TEMPLATES_URL}/course/${courseId}`,
        {
            method: "GET",
            headers: getHeaders(),
        },
    );

    const data = await parseResponse<ApiCertificateTemplate>(response);

    return normalizeTemplate(data);
}

export async function getCertificateTemplate(courseId: number) {
    try {
        return await getCertificateTemplateByCourse(courseId);
    } catch (error) {
        if (shouldUseEmptyTemplate(error)) {
            return createEmptyCertificateTemplate(courseId);
        }

        throw error;
    }
}

export async function createCertificateTemplate(
    courseId: number,
    template: CertificateTemplate,
    backgroundImage?: File | Blob | null,
    signatureFiles?: CertificateSignatureFiles,
) {
    const formData = buildTemplateFormData(
        courseId,
        template,
        backgroundImage,
        signatureFiles,
    );

    const response = await fetch(`${CERTIFICATE_TEMPLATES_URL}/`, {
        method: "POST",
        headers: getHeaders(),
        body: formData,
    });

    const data = await parseResponse<ApiCertificateTemplate>(response);

    return normalizeTemplate(data);
}

export async function updateCertificateTemplate(
    templateId: number,
    courseId: number,
    template: CertificateTemplate,
    backgroundImage?: File | Blob | null,
    signatureFiles?: CertificateSignatureFiles,
) {
    const formData = buildTemplateFormData(
        courseId,
        template,
        backgroundImage,
        signatureFiles,
    );

    const headers = getHeaders();

    const response = await fetch(`${CERTIFICATE_TEMPLATES_URL}/${templateId}`, {
        method: "PUT",
        headers,
        body: formData,
    });

    const data = await parseResponse<ApiCertificateTemplate>(response);

    return normalizeTemplate(data);
}

export async function saveCertificateTemplate(
    courseId: number,
    template: CertificateTemplate,
    backgroundImage?: File | Blob | null,
    signatureFiles?: CertificateSignatureFiles,
) {
    if (template.id) {
        try {
            return await updateCertificateTemplate(
                template.id,
                courseId,
                template,
                backgroundImage,
                signatureFiles,
            );
        } catch (error) {
            if (shouldUseEmptyTemplate(error)) {
                return createCertificateTemplate(
                    courseId,
                    {
                        ...template,
                        id: undefined,
                    },
                    backgroundImage,
                    signatureFiles,
                );
            }

            throw error;
        }
    }

    return createCertificateTemplate(
        courseId,
        template,
        backgroundImage,
        signatureFiles,
    );
}

export async function deleteCertificateTemplate(templateId: number) {
    const response = await fetch(`${CERTIFICATE_TEMPLATES_URL}/${templateId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });

    return parseResponse<string>(response);
}

export function replaceCertificateVariables(
    value: string,
    data: {
        studentName?: string;
        courseName?: string;
        completionDate?: string;
        instructorName?: string;
        certificateCode?: string;
        finalGrade?: string | number;
    },
) {
    return value
        .replaceAll("{{student_name}}", data.studentName ?? "")
        .replaceAll("{{course_name}}", data.courseName ?? "")
        .replaceAll("{{completion_date}}", data.completionDate ?? "")
        .replaceAll("{{instructor_name}}", data.instructorName ?? "")
        .replaceAll("{{certificate_code}}", data.certificateCode ?? "")
        .replaceAll("{{final_grade}}", String(data.finalGrade ?? ""));
}

function normalizeCertificate(certificate: ApiCertificate): Certificate {
    return {
        id: Number(certificate.id),
        user_id: Number(certificate.user_id),
        course_id: Number(certificate.course_id),
        template_id:
            certificate.template_id === null ||
                certificate.template_id === undefined
                ? null
                : Number(certificate.template_id),
        student_name: certificate.student_name ?? "",
        course_name: certificate.course_name ?? "",
        final_grade:
            certificate.final_grade === null ||
                certificate.final_grade === undefined
                ? ""
                : String(certificate.final_grade),
        certificate_code: certificate.certificate_code ?? "",
        file_url: buildFileUrl(certificate.file_url),
        is_valid: Boolean(certificate.is_valid),
        created_at: certificate.created_at ?? "",
    };
}

export async function getAllCertificates() {
    const response = await fetch(`${CERTIFICATES_URL}/`, {
        method: "GET",
        headers: getHeaders(),
    });

    const data = await parseResponse<ApiCertificate[]>(response);

    return Array.isArray(data) ? data.map(normalizeCertificate) : [];
}

export async function getCertificateById(certificateId: number) {
    const response = await fetch(`${CERTIFICATES_URL}/${certificateId}`, {
        method: "GET",
        headers: getHeaders(),
    });

    const data = await parseResponse<ApiCertificate>(response);

    return normalizeCertificate(data);
}

export async function getCertificatesByUser(
    userId: number,
    options?: {
        onlyValid?: boolean;
    },
) {
    const response = await fetch(`${CERTIFICATES_URL}/user/${userId}`, {
        method: "GET",
        headers: getHeaders(),
    });

    const data = await parseResponse<ApiCertificate[]>(response);

    const onlyValid = options?.onlyValid ?? true;

    const certificates = Array.isArray(data) ? data.map(normalizeCertificate) : [];

    return certificates
        .filter((certificate) => (onlyValid ? certificate.is_valid : true))
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
        );
}

export async function getCertificatesByCourse(courseId: number) {
    const certificates = await getAllCertificates();

    return certificates
        .filter(
            (certificate) =>
                Number(certificate.course_id) === Number(courseId) &&
                certificate.is_valid,
        )
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
        );
}

export async function getCertificateByUserAndCourse(
    userId: number,
    courseId: number,
) {
    const certificates = await getCertificatesByUser(userId);

    return (
        certificates.find(
            (certificate) =>
                Number(certificate.user_id) === Number(userId) &&
                Number(certificate.course_id) === Number(courseId) &&
                certificate.is_valid,
        ) ?? null
    );
}

export async function getValidCertificateByUserAndCourse(
    userId: number,
    courseId: number,
) {
    return getCertificateByUserAndCourse(userId, courseId);
}

export async function getCertificateByCode(code: string) {
    const response = await fetch(`${CERTIFICATES_URL}/code/${code}`, {
        method: "GET",
        headers: getHeaders(),
    });

    const data = await parseResponse<ApiCertificate>(response);

    return normalizeCertificate(data);
}

export async function verifyCertificate(code: string) {
    const response = await fetch(`${CERTIFICATES_URL}/verify/${code}`, {
        method: "GET",
        headers: getHeaders(),
    });

    const data = await parseResponse<ApiCertificate>(response);

    return normalizeCertificate(data);
}

export async function createCertificate(params: {
    userId: number;
    courseId: number;
    templateId?: number | null;
    file: File | Blob;
    filename?: string;
}) {
    const formData = new FormData();

    formData.append("user_id", String(params.userId));
    formData.append("course_id", String(params.courseId));

    if (params.templateId !== undefined && params.templateId !== null) {
        formData.append("template_id", String(params.templateId));
    }

    const filename =
        params.filename ??
        `certificado-curso-${params.courseId}-usuario-${params.userId}.pdf`;

    formData.append("file", params.file, filename);

    const response = await fetch(`${CERTIFICATES_URL}/`, {
        method: "POST",
        headers: getHeaders(),
        body: formData,
    });

    const data = await parseResponse<ApiCertificate>(response);

    return normalizeCertificate(data);
}

export async function updateCertificate(params: {
    certificateId: number;
    templateId?: number | null;
    isValid?: boolean;
    file?: File | Blob | null;
    filename?: string;
}) {
    const formData = new FormData();

    if (params.templateId !== undefined && params.templateId !== null) {
        formData.append("template_id", String(params.templateId));
    }

    if (typeof params.isValid === "boolean") {
        formData.append("is_valid", String(params.isValid));
    }

    if (params.file) {
        formData.append(
            "file",
            params.file,
            params.filename ?? `certificado-${params.certificateId}.pdf`,
        );
    }

    const response = await fetch(`${CERTIFICATES_URL}/${params.certificateId}`, {
        method: "PUT",
        headers: getHeaders(),
        body: formData,
    });

    const data = await parseResponse<ApiCertificate>(response);

    return normalizeCertificate(data);
}

export async function deleteCertificate(certificateId: number) {
    const response = await fetch(`${CERTIFICATES_URL}/${certificateId}`, {
        method: "DELETE",
        headers: getHeaders(),
    });

    return parseResponse<string>(response);
}

function certificatePxToPt(px: number) {
    return px * 0.75;
}

function certificatePtToMm(pt: number) {
    return pt * 0.352778;
}

function certificateHexToRgb(color: string): [number, number, number] {
    const fallback: [number, number, number] = [17, 24, 39];

    if (!color || !color.startsWith("#")) return fallback;

    const clean = color.replace("#", "");

    if (clean.length === 3) {
        return [
            parseInt(clean[0] + clean[0], 16),
            parseInt(clean[1] + clean[1], 16),
            parseInt(clean[2] + clean[2], 16),
        ];
    }

    if (clean.length === 6) {
        return [
            parseInt(clean.slice(0, 2), 16),
            parseInt(clean.slice(2, 4), 16),
            parseInt(clean.slice(4, 6), 16),
        ];
    }

    return fallback;
}

function getCertificatePdfImageFormat(image: string) {
    const normalizedImage = image.toLowerCase();

    if (
        normalizedImage.startsWith("data:image/jpeg") ||
        normalizedImage.startsWith("data:image/jpg") ||
        normalizedImage.endsWith(".jpg") ||
        normalizedImage.endsWith(".jpeg")
    ) {
        return "JPEG";
    }

    return "PNG";
}

function certificateBlobToDataUrl(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () =>
            reject(new Error("No se pudo procesar la imagen."));

        reader.readAsDataURL(blob);
    });
}

function getCertificateImageFetchUrl(image: string) {
    if (
        image.startsWith("data:image/") ||
        image.startsWith("blob:")
    ) {
        return image;
    }

    if (
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {
        return `/api/certificate-image-proxy?url=${encodeURIComponent(image)}`;
    }

    return image;
}

async function certificateImageToDataUrl(image: string) {
    if (!image) {
        throw new Error("No se encontró la imagen del certificado.");
    }

    if (image.startsWith("data:image/")) return image;

    const imageFetchUrl = getCertificateImageFetchUrl(image);

    const response = await fetch(imageFetchUrl, {
        method: "GET",
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            "No se pudo cargar una imagen del certificado. Verifica que la imagen de fondo o firma exista en /uploads.",
        );
    }

    const blob = await response.blob();

    return certificateBlobToDataUrl(blob);
}

type CertificateImageCompressionOptions = {
    maxWidth: number;
    maxHeight: number;
    quality?: number;
    output?: "image/jpeg" | "image/png";
    backgroundColor?: string;
};

function loadCertificateImageElement(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();

        image.onload = () => resolve(image);
        image.onerror = () =>
            reject(new Error("No se pudo leer la imagen del certificado."));

        image.src = src;
    });
}

async function compressCertificateImage(
    image: string,
    options: CertificateImageCompressionOptions,
) {
    const dataUrl = await certificateImageToDataUrl(image);
    const imageElement = await loadCertificateImageElement(dataUrl);

    const naturalWidth = imageElement.naturalWidth || imageElement.width;
    const naturalHeight = imageElement.naturalHeight || imageElement.height;

    const scale = Math.min(
        options.maxWidth / naturalWidth,
        options.maxHeight / naturalHeight,
        1,
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(naturalHeight * scale));

    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("No se pudo comprimir la imagen del certificado.");
    }

    if (options.output === "image/jpeg") {
        context.fillStyle = options.backgroundColor ?? "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
    }

    context.drawImage(imageElement, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL(
        options.output ?? "image/jpeg",
        options.quality ?? 0.72,
    );
}

function getCertificateImageNaturalSize(src: string) {
    return new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new window.Image();

        image.onload = () => {
            resolve({
                width: image.naturalWidth || image.width,
                height: image.naturalHeight || image.height,
            });
        };

        image.onerror = () => {
            reject(new Error("No se pudo leer la imagen."));
        };

        image.src = src;
    });
}

function isCertificateSignatureField(field: CertificateField) {
    return (
        field.fieldMode === "signature" ||
        field.type === "signature_instructor" ||
        field.type === "signature_director"
    );
}

function replaceCertificateTemplateVariables(
    value: string,
    values: CertificatePdfValues,
) {
    return replaceCertificateVariables(value, {
        studentName: values.studentName,
        courseName: values.courseName,
        completionDate: values.completionDate,
        instructorName: values.instructorName ?? "",
        certificateCode: values.certificateCode ?? "",
        finalGrade: values.finalGrade ?? "",
    });
}

async function createCertificateQrDataUrl(value: string) {
    const QRCode = await import("qrcode");

    return QRCode.toDataURL(value, {
        errorCorrectionLevel: "M",
        margin: 1,
        scale: 8,
        color: {
            dark: "#0f172a",
            light: "#ffffff",
        },
    });
}

function getAppBaseUrl() {
    if (process.env.NEXT_PUBLIC_APP_URL) {
        return process.env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
    }

    if (typeof window !== "undefined") {
        return window.location.origin;
    }

    return API_ORIGIN;
}

function getCertificateQrValue(certificateCode?: string) {
    const code = certificateCode?.trim();

    if (!code || code === "PENDIENTE") return "";

    return `${getAppBaseUrl()}/certificates/verify/${encodeURIComponent(code)}`;
}

async function drawCertificateQrInPdf(params: {
    pdf: {
        addImage: (
            imageData: string,
            format: string,
            x: number,
            y: number,
            width: number,
            height: number,
            alias?: string,
            compression?: "NONE" | "FAST" | "MEDIUM" | "SLOW",
        ) => void;
    };
    qrConfig: CertificateQrConfig;
    certificateCode?: string;
    pageWidth: number;
    pageHeight: number;
}) {
    const { pdf, qrConfig, certificateCode, pageWidth, pageHeight } = params;

    if (!qrConfig?.enabled) return;

    const qrValue = getCertificateQrValue(certificateCode);

    if (!qrValue) return;

    const x = Number.isFinite(Number(qrConfig.x)) ? Number(qrConfig.x) : 86;
    const y = Number.isFinite(Number(qrConfig.y)) ? Number(qrConfig.y) : 84;
    const size = Number.isFinite(Number(qrConfig.size))
        ? Number(qrConfig.size)
        : 10;

    const qrSizeMm = (size / 100) * pageWidth;
    const qrCenterX = (x / 100) * pageWidth;
    const qrCenterY = (y / 100) * pageHeight;

    const qrX = qrCenterX - qrSizeMm / 2;
    const qrY = qrCenterY - qrSizeMm / 2;

    const qrImage = await createCertificateQrDataUrl(qrValue);

    pdf.addImage(
        qrImage,
        "PNG",
        qrX,
        qrY,
        qrSizeMm,
        qrSizeMm,
        undefined,
        "FAST",
    );
}

function getCertificatePdfFontFamily(fontFamily?: string) {
    if (fontFamily === "Georgia" || fontFamily === "Times New Roman") {
        return "times";
    }

    if (fontFamily === "Courier New") {
        return "courier";
    }

    return "helvetica";
}

function applyCertificateSentenceCase(text: string) {
    const lowerText = text.toLowerCase();

    return lowerText.replace(
        /(^\s*[a-záéíóúñü])|([.!?]\s+[a-záéíóúñü])|(\n\s*[a-záéíóúñü])/g,
        (match) => match.toUpperCase(),
    );
}

function applyCertificateTextCase(
    text: string,
    textCase?: "none" | "uppercase" | "lowercase" | "sentence",
) {
    if (textCase === "uppercase") return text.toUpperCase();
    if (textCase === "lowercase") return text.toLowerCase();
    if (textCase === "sentence") return applyCertificateSentenceCase(text);

    return text;
}


export async function generateCertificatePdfFile(params: {
    template: CertificateTemplate;
    values: CertificatePdfValues;
    filename: string;
}) {
    const jsPdfModule = await import("jspdf");
    const JsPDF = jsPdfModule.default;

    const pdf = new JsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
    });

    const pageWidth = 297;
    const pageHeight = 210;

    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    if (params.template.backgroundImage) {
        const backgroundImage = await compressCertificateImage(
            params.template.backgroundImage,
            {
                maxWidth: 1600,
                maxHeight: 1200,
                quality: 0.72,
                output: "image/jpeg",
                backgroundColor: "#ffffff",
            },
        );

        pdf.addImage(
            backgroundImage,
            "JPEG",
            0,
            0,
            pageWidth,
            pageHeight,
            undefined,
            "FAST",
        );
    }

    for (const field of params.template.fields) {
        const fieldWidthMm = (field.width / 100) * pageWidth;
        const fieldHeightMm = ((field.height ?? 8) / 100) * pageHeight;

        const centerX = (field.x / 100) * pageWidth;
        const centerY = (field.y / 100) * pageHeight;

        const leftX = centerX - fieldWidthMm / 2;
        const topY = centerY - fieldHeightMm / 2;

        const align: "left" | "center" | "right" =
            field.textAlign === "left"
                ? "left"
                : field.textAlign === "right"
                    ? "right"
                    : "center";

        const textX =
            align === "left"
                ? leftX
                : align === "right"
                    ? leftX + fieldWidthMm
                    : centerX;

        const [r, g, b] = certificateHexToRgb(field.color || "#111827");

        pdf.setTextColor(r, g, b);
        pdf.setFont(
            getCertificatePdfFontFamily(field.fontFamily),
            field.fontWeight === "bold" ? "bold" : "normal",
        );

        const fontSizePt = Math.max(6, certificatePxToPt(field.fontSize));
        pdf.setFontSize(fontSizePt);

        if (isCertificateSignatureField(field)) {
            const signatureZoneHeight = fieldHeightMm * 0.66;
            const linePadding = 2;

            if (field.signatureImage) {
                const signatureImage = await compressCertificateImage(
                    field.signatureImage,
                    {
                        maxWidth: 500,
                        maxHeight: 220,
                        quality: 0.78,
                        output: "image/png",
                    },
                );

                const { width: naturalWidth, height: naturalHeight } =
                    await getCertificateImageNaturalSize(signatureImage);

                const maxImageWidth = Math.max(1, fieldWidthMm - 4);
                const maxImageHeight = Math.max(1, signatureZoneHeight - 2);

                const widthRatio = maxImageWidth / naturalWidth;
                const heightRatio = maxImageHeight / naturalHeight;
                const scale = Math.min(widthRatio, heightRatio);

                const renderWidth = naturalWidth * scale;
                const renderHeight = naturalHeight * scale;

                const imageX = centerX - renderWidth / 2;
                const imageY =
                    topY + (signatureZoneHeight - renderHeight) / 2;

                pdf.addImage(
                    signatureImage,
                    getCertificatePdfImageFormat(signatureImage),
                    imageX,
                    imageY,
                    renderWidth,
                    renderHeight,
                    undefined,
                    "FAST",
                );
            }

            const lineY = topY + signatureZoneHeight;

            pdf.setDrawColor(r, g, b);
            pdf.setLineWidth(0.25);
            pdf.line(
                leftX + linePadding,
                lineY,
                leftX + fieldWidthMm - linePadding,
                lineY,
            );

            const labelFontPt = Math.max(6, certificatePxToPt(field.fontSize));
            pdf.setFontSize(labelFontPt);

            const labelMm = certificatePtToMm(labelFontPt);
            const labelY = lineY + labelMm * 1.15;

            const signatureText = applyCertificateTextCase(
                replaceCertificateTemplateVariables(
                    field.value || field.label,
                    params.values,
                ),
                field.textCase,
            );

            pdf.text(signatureText, centerX, labelY, {
                align: "center",
                maxWidth: fieldWidthMm,
            });

            continue;
        }

        const safeText = applyCertificateTextCase(
            replaceCertificateTemplateVariables(
                field.value || field.label,
                params.values,
            ),
            field.textCase,
        );

        const lines = safeText
            .split("\n")
            .flatMap((line) => pdf.splitTextToSize(line || " ", fieldWidthMm));

        const lineHeightMm = certificatePtToMm(fontSizePt) * 1.15;
        const totalTextHeight = lines.length * lineHeightMm;

        const firstLineY =
            centerY - totalTextHeight / 2 + lineHeightMm * 0.8;

        pdf.text(lines, textX, firstLineY, {
            align,
            maxWidth: fieldWidthMm,
            lineHeightFactor: 1.15,
        });
    }

    await drawCertificateQrInPdf({
        pdf,
        qrConfig: params.template.qrConfig,
        certificateCode: params.values.certificateCode,
        pageWidth,
        pageHeight,
    });

    const blob = pdf.output("blob");

    return new File([blob], params.filename, {
        type: "application/pdf",
    });
}

export async function createCertificateFromTemplate(params: {
    userId: number;
    courseId: number;
    template: CertificateTemplate;
    values: CertificatePdfValues;
}) {
    const templateId = params.template.id ?? null;

    const temporaryPdf = await generateCertificatePdfFile({
        template: params.template,
        values: {
            ...params.values,
            certificateCode: "PENDIENTE",
            fileUrl: "",
        },
        filename: `certificado-${params.courseId}-${params.userId}.pdf`,
    });

    const createdCertificate = await createCertificate({
        userId: params.userId,
        courseId: params.courseId,
        templateId,
        file: temporaryPdf,
        filename: `certificado-${params.courseId}-${params.userId}.pdf`,
    });

    const finalPdf = await generateCertificatePdfFile({
        template: params.template,
        values: {
            ...params.values,
            certificateCode: createdCertificate.certificate_code,
            fileUrl: createdCertificate.file_url,
        },
        filename: `certificado-${createdCertificate.certificate_code}.pdf`,
    });

    const updatedCertificate = await updateCertificate({
        certificateId: createdCertificate.id,
        templateId,
        isValid: true,
        file: finalPdf,
        filename: `certificado-${createdCertificate.certificate_code}.pdf`,
    });

    return {
        ...updatedCertificate,
        final_grade:
            updatedCertificate.final_grade ||
            String(params.values.finalGrade ?? ""),
    };
}

export async function reissueCertificateFromTemplate(params: {
    certificateId: number;
    userId: number;
    courseId: number;
    template: CertificateTemplate;
    values: CertificatePdfValues;
}) {
    const currentCertificate = await getCertificateById(params.certificateId);

    const finalPdf = await generateCertificatePdfFile({
        template: params.template,
        values: {
            ...params.values,
            certificateCode:
                params.values.certificateCode ||
                currentCertificate.certificate_code,
            fileUrl: currentCertificate.file_url,
        },
        filename: `certificado-reemitido-${params.courseId}-${params.userId}.pdf`,
    });

    const updatedCertificate = await updateCertificate({
        certificateId: params.certificateId,
        templateId: params.template.id ?? null,
        isValid: true,
        file: finalPdf,
        filename: `certificado-reemitido-${params.courseId}-${params.userId}.pdf`,
    });

    return {
        ...updatedCertificate,
        final_grade:
            updatedCertificate.final_grade ||
            String(params.values.finalGrade ?? ""),
    };
}