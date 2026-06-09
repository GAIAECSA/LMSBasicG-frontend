import {
    NextRequest,
    NextResponse,
} from "next/server";

const ZOOM_API_URL = (
    process.env.ZOOM_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
).replace(/\/+$/, "");

const ZOOM_LTI_BACKEND_LAUNCH_PATH = (
    process.env.ZOOM_LTI_BACKEND_LAUNCH_PATH ??
    "/api/v1/zoom/api/v1/lti/zoom/launch"
).replace(/\/+$/, "");

const ALLOWED_ZOOM_REDIRECT_HOSTS =
    new Set([
        "applications.zoom.us",
    ]);

type RouteContext = {
    params: Promise<{
        courseId: string;
    }>;
};

function validateCourseId(
    value: string,
): number {
    const courseId =
        Number(value);

    if (
        !Number.isInteger(courseId) ||
        courseId <= 0
    ) {
        throw new Error(
            "El identificador del curso no es válido.",
        );
    }

    return courseId;
}

function validateZoomRedirectUrl(
    value: string,
): string {
    let redirectUrl: URL;

    try {
        redirectUrl =
            new URL(value);
    } catch {
        throw new Error(
            "El backend devolvió una URL de Zoom inválida.",
        );
    }

    if (
        redirectUrl.protocol !== "https:" ||
        !ALLOWED_ZOOM_REDIRECT_HOSTS.has(
            redirectUrl.hostname,
        )
    ) {
        throw new Error(
            "El backend intentó redirigir hacia un dominio no autorizado.",
        );
    }

    return redirectUrl.toString();
}

async function readBackendError(
    response: Response,
): Promise<string> {
    const rawText =
        await response.text();

    if (!rawText.trim()) {
        return (
            `Error ${response.status}: ` +
            response.statusText
        );
    }

    try {
        const parsedError =
            JSON.parse(
                rawText,
            ) as {
                detail?: string;
                message?: string;
            };

        return (
            parsedError.detail ??
            parsedError.message ??
            rawText
        );
    } catch {
        return rawText;
    }
}

export async function POST(
    request: NextRequest,
    context: RouteContext,
) {
    try {
        if (!ZOOM_API_URL) {
            return NextResponse.json(
                {
                    detail:
                        "No se configuró la URL del microservicio Zoom.",
                },
                {
                    status: 500,
                },
            );
        }

        const {
            courseId: rawCourseId,
        } = await context.params;

        const courseId =
            validateCourseId(
                rawCourseId,
            );

        const authorization =
            request.headers.get(
                "authorization",
            );

        if (!authorization) {
            return NextResponse.json(
                {
                    detail:
                        "No se encontró la sesión del usuario.",
                },
                {
                    status: 401,
                },
            );
        }

        const backendResponse =
            await fetch(
                `${ZOOM_API_URL}${ZOOM_LTI_BACKEND_LAUNCH_PATH}/${courseId}`,
                {
                    method: "GET",
                    headers: {
                        Accept: "application/json",
                        Authorization:
                            authorization,
                    },
                    redirect: "manual",
                    cache: "no-store",
                },
            );

        if (
            backendResponse.status >= 300 &&
            backendResponse.status < 400
        ) {
            const location =
                backendResponse.headers.get(
                    "location",
                );

            if (!location) {
                return NextResponse.json(
                    {
                        detail:
                            "El backend inició la redirección, pero no devolvió la URL de Zoom.",
                    },
                    {
                        status: 502,
                    },
                );
            }

            const launchUrl =
                validateZoomRedirectUrl(
                    location,
                );

            return NextResponse.json(
                {
                    launch_url:
                        launchUrl,
                },
                {
                    status: 200,
                },
            );
        }

        if (!backendResponse.ok) {
            const detail =
                await readBackendError(
                    backendResponse,
                );

            return NextResponse.json(
                {
                    detail,
                },
                {
                    status:
                        backendResponse.status,
                },
            );
        }

        return NextResponse.json(
            {
                detail:
                    "El backend respondió correctamente, pero no generó una redirección hacia Zoom.",
            },
            {
                status: 502,
            },
        );
    } catch (error) {
        return NextResponse.json(
            {
                detail:
                    error instanceof Error
                        ? error.message
                        : "No fue posible generar el acceso a Zoom.",
            },
            {
                status: 500,
            },
        );
    }
}