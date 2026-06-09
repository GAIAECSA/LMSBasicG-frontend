import {
    API_URL,
    getJsonHeaders,
    handleApiResponse,
} from "@/services/api-client.service";

const ZOOM_LTI_TICKET_PATH = (
    process.env.NEXT_PUBLIC_ZOOM_LTI_TICKET_PATH ??
    "/api/v1/zoom/api/v1/lti/zoom/launch-ticket"
).replace(/\/+$/, "");

type ZoomLtiLaunchTicketResponse = {
    launch_url: string;
    expires_in: number;
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
    launchUrl: string,
): string {
    const normalizedUrl =
        launchUrl.trim();

    if (!normalizedUrl) {
        throw new Error(
            "El backend no devolvió una URL válida.",
        );
    }

    let parsedUrl: URL;

    try {
        parsedUrl =
            new URL(
                normalizedUrl,
            );
    } catch {
        throw new Error(
            "La URL temporal para abrir Zoom no es válida.",
        );
    }

    if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
    ) {
        throw new Error(
            "La URL temporal utiliza un protocolo no permitido.",
        );
    }

    return parsedUrl.toString();
}

export async function createZoomLtiLaunchTicket(
    courseId: number,
): Promise<string> {
    const validCourseId =
        normalizeCourseId(
            courseId,
        );

    const response =
        await fetch(
            `${API_URL}${ZOOM_LTI_TICKET_PATH}/${validCourseId}`,
            {
                method: "POST",
                headers: getJsonHeaders(),
            },
        );

    const data =
        await handleApiResponse<ZoomLtiLaunchTicketResponse>(
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
            await createZoomLtiLaunchTicket(
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