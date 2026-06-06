const RAW_API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://213.165.74.184:9000";

function normalizeApiBaseUrl(url: string) {
    const cleanUrl = url.trim().replace(/\/+$/, "");

    if (cleanUrl.endsWith("/api/v1")) {
        return cleanUrl;
    }

    return `${cleanUrl}/api/v1`;
}

export const API_BASE_URL =
    normalizeApiBaseUrl(RAW_API_URL);

export const API_ORIGIN =
    API_BASE_URL.replace(/\/api\/v1$/, "");

export const COURSE_PRESENTATION_THEME = {
    card: "border border-[var(--border)] bg-[var(--card)] shadow-sm",
    mutedCard: "border border-[var(--border)] bg-[var(--muted)]",
    textMain: "text-[var(--foreground)]",
    primaryText: "text-[var(--primary)]",
    primaryBg: "bg-[var(--primary)] text-[var(--primary-foreground)]",
    primarySoft: "bg-[var(--secondary)] text-[var(--secondary-foreground)]",
    gradientSoft: "[background:var(--gradient-soft)]",
    successSoft: "bg-[var(--success-soft)] text-[var(--success)]",
    overlay: "bg-gradient-to-t from-black/75 via-black/20 to-transparent",
} as const;
