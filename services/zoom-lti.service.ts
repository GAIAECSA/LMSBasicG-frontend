import {
    API_URL,
    getJsonHeaders,
} from "@/services/api-client.service";

const ZOOM_LTI_LAUNCH_PATH = (
    process.env.NEXT_PUBLIC_ZOOM_LTI_LAUNCH_PATH ??
    "/api/v1/zoom/api/v1/lti/zoom/launch"
).replace(/\/+$/, "");

type ZoomLtiLaunchObjectResponse = {
    launch_url?: string;
    redirect_url?: string;
    url?: string;
};

type ZoomLtiLaunchResponse =
    | string
    | ZoomLtiLaunchObjectResponse;

function normalizeCourseId(
    courseId: number,
): number {
    const numericCourseId =
        Number(courseId);

    if (
        !Number.isInteger(numericCourseId) ||
        numericCourseId <= 0
    ) {
        throw new Error(
            "El identificador del curso no es válido.",
        );
    }

    return numericCourseId;
}

function normalizeLaunchUrl(
    value: unknown,
): string {
    let launchUrl: string | undefined;

    if (
        typeof value === "string"
    ) {
        launchUrl =
            value;
    } else if (
        value &&
        typeof value === "object"
    ) {
        const response =
            value as ZoomLtiLaunchObjectResponse;

        launchUrl =
            response.launch_url ??
            response.redirect_url ??
            response.url;
    }

    const normalizedUrl =
        launchUrl?.trim();

    if (!normalizedUrl) {
        throw new Error(
            "El backend no devolvió una URL válida para abrir Zoom.",
        );
    }

    let parsedUrl: URL;

    try {
        parsedUrl =
            new URL(normalizedUrl);
    } catch {
        throw new Error(
            "El backend devolvió una URL de lanzamiento inválida.",
        );
    }

    if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
    ) {
        throw new Error(
            "La URL para abrir Zoom utiliza un protocolo no permitido.",
        );
    }

    return parsedUrl.toString();
}

async function readLaunchResponse(
    response: Response,
): Promise<string> {
    const contentType =
        response.headers.get(
            "content-type",
        ) ?? "";

    /*
     * Algunos backends devuelven una redirección HTTP.
     * En ese caso intentamos recuperar la cabecera Location.
     */
    if (
        response.status >= 300 &&
        response.status < 400
    ) {
        const location =
            response.headers.get(
                "location",
            );

        if (!location) {
            throw new Error(
                "El backend redirigió hacia Zoom, pero no expuso la cabecera Location. Configure Access-Control-Expose-Headers: Location o devuelva la URL como JSON.",
            );
        }

        return normalizeLaunchUrl(
            location,
        );
    }

    const rawText =
        await response.text();

    if (!response.ok) {
        let errorMessage =
            `Error ${response.status}: ${response.statusText}`;

        if (rawText) {
            try {
                const parsedError =
                    JSON.parse(
                        rawText,
                    ) as {
                        detail?: string;
                        message?: string;
                    };

                errorMessage =
                    parsedError.detail ??
                    parsedError.message ??
                    rawText;
            } catch {
                errorMessage =
                    rawText;
            }
        }

        throw new Error(
            errorMessage,
        );
    }

    if (!rawText.trim()) {
        throw new Error(
            "El backend respondió correctamente, pero no devolvió la URL para abrir Zoom.",
        );
    }

    if (
        contentType.includes(
            "application/json",
        )
    ) {
        const parsedResponse =
            JSON.parse(
                rawText,
            ) as ZoomLtiLaunchResponse;

        return normalizeLaunchUrl(
            parsedResponse,
        );
    }

    return normalizeLaunchUrl(
        rawText,
    );
}

export async function getZoomLtiLaunchUrl(
    courseId: number,
): Promise<string> {
    const validCourseId =
        normalizeCourseId(
            courseId,
        );

    const response =
        await fetch(
            `${API_URL}${ZOOM_LTI_LAUNCH_PATH}/${validCourseId}`,
            {
                method: "GET",
                headers: getJsonHeaders(),
                redirect: "manual",
            },
        );

    return readLaunchResponse(
        response,
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
     * Abrimos primero una pestaña vacía.
     * Esto evita que el navegador bloquee la ventana
     * después de esperar la respuesta del backend.
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
                Preparando el acceso a Zoom...
            </p>
        </main>
    `;

    try {
        const launchUrl =
            await getZoomLtiLaunchUrl(
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