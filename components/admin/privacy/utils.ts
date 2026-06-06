import { API_URL } from "@/services/api-client.service";
import type { PrivacyPolicy } from "@/services/privacy-policy.service";

export function getErrorMessage(
    error: unknown,
    fallbackMessage = "Ocurrió un error inesperado.",
) {
    if (error instanceof Error) {
        return error.message;
    }

    return fallbackMessage;
}

export function normalizeResourceUrl(
    url?: string | null,
) {
    if (!url) return "";

    if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")
    ) {
        return url;
    }

    if (url.startsWith("/")) {
        return `${API_URL}${url}`;
    }

    return `${API_URL}/${url}`;
}

export function formatDate(
    value?: string | null,
) {
    if (!value) return "Sin fecha";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

export function getNowDateTimeLocal() {
    const now = new Date();
    const timezoneOffset =
        now.getTimezoneOffset() * 60000;

    const localDate = new Date(
        now.getTime() - timezoneOffset,
    );

    return localDate
        .toISOString()
        .slice(0, 16);
}

export function toBackendDateTime(
    value: string,
) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toISOString();
}

export function getPolicyStatusLabel(
    policy: PrivacyPolicy,
) {
    if (policy.deleted) return "Eliminada";
    if (policy.is_active) return "Activa";

    return "Inactiva";
}

export function getPolicyStatusClass(
    policy: PrivacyPolicy,
) {
    if (policy.deleted) {
        return "border-red-200 bg-red-50 text-red-700";
    }

    if (policy.is_active) {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    return "border-slate-200 bg-slate-100 text-slate-600";
}
