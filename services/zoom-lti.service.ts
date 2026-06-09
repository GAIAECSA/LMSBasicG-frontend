import {
    getJsonHeaders,
    handleApiResponse,
} from "@/services/api-client.service";

const ZOOM_LTI_PROXY_PATH = (
    process.env.NEXT_PUBLIC_ZOOM_LTI_PROXY_PATH ??
    "/api/zoom/lti/launch-url"
).replace(/\/+$/, "");

type ZoomLtiLaunchResponse = {
    launch_url: string;
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
            "No se recibió una URL válida para abrir Zoom.",
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
            "La URL recibida para abrir Zoom no es válida.",
        );
    }

    if (
        launchUrl.protocol !== "https:" ||
        launchUrl.hostname !==
        "applications.zoom.us"
    ) {
        throw new Error(
            "La URL recibida no pertenece a Zoom.",
        );
    }

    return launchUrl.toString();
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
            `${ZOOM_LTI_PROXY_PATH}/${validCourseId}`,
            {
                method: "POST",
                headers:
                    getJsonHeaders(),
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
     * La pestaña se abre inmediatamente para que
     * el navegador no la bloquee después del await.
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