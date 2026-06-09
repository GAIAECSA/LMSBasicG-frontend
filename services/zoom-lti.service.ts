import {
    API_URL,
    getJsonHeaders,
    handleApiResponse,
} from "@/services/api-client.service";

const ZOOM_API_URL = (
    process.env.NEXT_PUBLIC_ZOOM_API_URL ??
    API_URL
).replace(/\/+$/, "");

const ZOOM_LTI_TICKET_PATH = (
    process.env.NEXT_PUBLIC_ZOOM_LTI_TICKET_PATH ??
    "/api/v1/zoom/zoom/launch-ticket"
).replace(/\/+$/, "");

const ALLOWED_LAUNCH_HOSTS =
    new Set(
        (
            process.env
                .NEXT_PUBLIC_ZOOM_LTI_ALLOWED_LAUNCH_HOSTS ??
            "demo-sva.gaiaecsa.com"
        )
            .split(",")
            .map((host) =>
                host.trim().toLowerCase(),
            )
            .filter(Boolean),
    );

type ZoomLtiLaunchResponse = {
    launch_url: string;
    expires_in?: number;
};

function normalizeCourseId(
    courseId: number,
): number {
    const numericCourseId =
        Number(courseId);

    if (
        !Number.isInteger(
            numericCourseId,
        ) ||
        numericCourseId <= 0
    ) {
        throw new Error(
            "El identificador del curso no es válido.",
        );
    }

    return numericCourseId;
}

function validateLaunchUrl(
    value: string,
): string {
    const normalizedValue =
        value.trim();

    if (!normalizedValue) {
        throw new Error(
            "El backend no devolvió una URL válida para abrir Zoom.",
        );
    }

    let launchUrl: URL;

    try {
        launchUrl =
            new URL(
                normalizedValue,
            );
    } catch {
        throw new Error(
            "La URL temporal recibida no es válida.",
        );
    }

    if (
        launchUrl.protocol !== "https:"
    ) {
        throw new Error(
            "La URL temporal debe utilizar HTTPS.",
        );
    }

    if (
        ALLOWED_LAUNCH_HOSTS.size > 0 &&
        !ALLOWED_LAUNCH_HOSTS.has(
            launchUrl.hostname.toLowerCase(),
        )
    ) {
        throw new Error(
            "La URL temporal pertenece a un dominio no autorizado.",
        );
    }

    return launchUrl.toString();
}

export async function createZoomLtiLaunchUrl(
    courseId: number,
): Promise<string> {
    const validCourseId =
        normalizeCourseId(
            courseId,
        );

    const response =
        await fetch(
            `${ZOOM_API_URL}${ZOOM_LTI_TICKET_PATH}/${validCourseId}`,
            {
                method: "POST",
                headers:
                    getJsonHeaders(),
                cache: "no-store",
            },
        );

    const data =
        await handleApiResponse<ZoomLtiLaunchResponse>(
            response,
        );

    return validateLaunchUrl(
        data.launch_url,
    );
}

export async function openZoomLtiCourse(
    courseId: number,
): Promise<boolean> {
    if (
        typeof window === "undefined"
    ) {
        return false;
    }

    /*
     * Se abre la pestaña antes del await para evitar
     * que el navegador la bloquee como popup.
     */
    const zoomWindow =
        window.open(
            "about:blank",
            "_blank",
        );

    if (!zoomWindow) {
        return false;
    }

    zoomWindow.opener =
        null;

    zoomWindow.document.title =
        "Abriendo Zoom...";

    zoomWindow.document.body.innerHTML = `
        <main style="
            min-height: 100vh;
            display: grid;
            place-items: center;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
            background: #f8fafc;
            color: #172861;
        ">
            <p style="
                margin: 0;
                font-size: 15px;
                font-weight: 700;
            ">
                Preparando la clase en vivo...
            </p>
        </main>
    `;

    try {
        const launchUrl =
            await createZoomLtiLaunchUrl(
                courseId,
            );

        zoomWindow.location.replace(
            launchUrl,
        );

        return true;
    } catch (error) {
        zoomWindow.close();

        throw error;
    }
}