"use client";

import Link from "next/link";
import Image from "next/image";
import {
    BookOpen,
    CalendarDays,
    CirclePlay,
    Clock3,
    ExternalLink,
    Loader2,
    Radio,
    RefreshCw,
} from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AthenaLoadingBackground,
} from "@/components/ui/AthenaLoadingBackground";
import {
    getAuthSession,
} from "@/lib/auth";
import {
    notify,
} from "@/lib/notify";
import {
    getEnrollmentsByUser,
} from "@/services/enrollments.service";
import {
    listZoomMeetingsByCourse,
    openZoomMeetingForStudent,
    openZoomMeetingForTeacher,
} from "@/services/zoom-meetings.service";
import type {
    ZoomMeeting,
} from "@/services/zoom-meetings.service";

const COURSE_TIMEZONE =
    "America/Guayaquil";

const TEACHER_ROLE_ID =
    3;

const STUDENT_ROLE_ID =
    4;

type ZoomAudience =
    | "teacher"
    | "student";

type ZoomGeneralDashboardProps = {
    audience: ZoomAudience;
};

type ZoomMeetingWithCourse =
    ZoomMeeting & {
        course_name?: string | null;
    };

type CourseReference = {
    id: number;
    name: string | null;
};

type LoadMeetingsResult = {
    meetings: ZoomMeetingWithCourse[];
    warning: string | null;
};

type AuthSessionWithFallbacks = {
    id?:
    | number
    | string
    | null;
    user_id?:
    | number
    | string
    | null;
    user?: {
        id?:
        | number
        | string
        | null;
    } | null;
};

type EnrollmentRecord = {
    id?:
    | number
    | string
    | null;
    accepted?:
    | boolean
    | null;
    is_active?:
    | boolean
    | null;
    course_id?:
    | number
    | string
    | null;
    role_id?:
    | number
    | string
    | null;
    course_name?:
    | string
    | null;
    course_title?:
    | string
    | null;
    course?: {
        id?:
        | number
        | string
        | null;
        name?:
        | string
        | null;
        title?:
        | string
        | null;
    } | null;
    role?: {
        id?:
        | number
        | string
        | null;
    } | null;
};

type ZoomMeetingCardProps = {
    meeting: ZoomMeetingWithCourse;
    audience: ZoomAudience;
    highlighted: boolean;
    opening: boolean;
    disabled: boolean;
    onOpen: (
        meeting: ZoomMeetingWithCourse,
    ) => Promise<void>;
};

function getErrorMessage(
    error: unknown,
): string {
    return error instanceof Error
        ? error.message
        : "Ocurrió un error inesperado.";
}

function getSessionUserId(): number {
    const session =
        getAuthSession() as
        | AuthSessionWithFallbacks
        | null;

    const userId =
        Number(
            session?.user?.id ??
            session?.user_id ??
            session?.id ??
            0,
        );

    if (
        !Number.isInteger(
            userId,
        ) ||
        userId <= 0
    ) {
        throw new Error(
            "No se pudo identificar al usuario autenticado. Inicia sesión nuevamente.",
        );
    }

    return userId;
}

function normalizeEnrollments(
    response: unknown,
): EnrollmentRecord[] {
    if (
        Array.isArray(
            response,
        )
    ) {
        return response as EnrollmentRecord[];
    }

    if (
        !response ||
        typeof response !==
        "object"
    ) {
        return [];
    }

    const record =
        response as {
            items?: unknown;
            data?: unknown;
            enrollments?: unknown;
        };

    if (
        Array.isArray(
            record.items,
        )
    ) {
        return record.items as EnrollmentRecord[];
    }

    if (
        Array.isArray(
            record.data,
        )
    ) {
        return record.data as EnrollmentRecord[];
    }

    if (
        Array.isArray(
            record.enrollments,
        )
    ) {
        return record.enrollments as EnrollmentRecord[];
    }

    return [];
}

function getEnrollmentRoleId(
    enrollment: EnrollmentRecord,
): number {
    return Number(
        enrollment.role?.id ??
        enrollment.role_id ??
        0,
    );
}

function getEnrollmentCourseId(
    enrollment: EnrollmentRecord,
): number {
    return Number(
        enrollment.course?.id ??
        enrollment.course_id ??
        0,
    );
}

function getEnrollmentCourseName(
    enrollment: EnrollmentRecord,
): string | null {
    const courseName =
        enrollment.course?.name ??
        enrollment.course?.title ??
        enrollment.course_name ??
        enrollment.course_title ??
        null;

    if (
        typeof courseName !==
        "string"
    ) {
        return null;
    }

    return (
        courseName.trim() ||
        null
    );
}

function getUniqueCourses(
    enrollments: EnrollmentRecord[],
    audience: ZoomAudience,
): CourseReference[] {
    const requiredRoleId =
        audience ===
            "teacher"
            ? TEACHER_ROLE_ID
            : STUDENT_ROLE_ID;

    const coursesById =
        new Map<
            number,
            CourseReference
        >();

    enrollments.forEach(
        (
            enrollment,
        ) => {
            const courseId =
                getEnrollmentCourseId(
                    enrollment,
                );

            const roleId =
                getEnrollmentRoleId(
                    enrollment,
                );

            const enrollmentIsRejected =
                enrollment.accepted ===
                false ||
                enrollment.is_active ===
                false;

            /*
             * Cuando el backend no devuelve role_id, se permite
             * continuar. La API de Zoom validará el acceso mediante
             * el token del usuario autenticado.
             */
            const roleIsAllowed =
                roleId === 0 ||
                roleId ===
                requiredRoleId;

            if (
                enrollmentIsRejected ||
                !roleIsAllowed ||
                !Number.isInteger(
                    courseId,
                ) ||
                courseId <= 0
            ) {
                return;
            }

            coursesById.set(
                courseId,
                {
                    id:
                        courseId,
                    name:
                        getEnrollmentCourseName(
                            enrollment,
                        ),
                },
            );
        },
    );

    return Array.from(
        coursesById.values(),
    );
}

async function loadMeetingsForAudience(
    audience: ZoomAudience,
): Promise<LoadMeetingsResult> {
    const userId =
        getSessionUserId();

    const enrollmentsResponse =
        await getEnrollmentsByUser(
            userId,
        );

    const enrollments =
        normalizeEnrollments(
            enrollmentsResponse,
        );

    const courses =
        getUniqueCourses(
            enrollments,
            audience,
        );

    if (
        courses.length ===
        0
    ) {
        return {
            meetings: [],
            warning: null,
        };
    }

    /*
     * Se utiliza exclusivamente el endpoint existente:
     *
     * GET /api/v1/zoom/courses/{course_id}/meetings
     *
     * No se realizan solicitudes a /my-meetings.
     */
    const results =
        await Promise.allSettled(
            courses.map(
                async (
                    course,
                ) => {
                    const meetings =
                        await listZoomMeetingsByCourse(
                            course.id,
                        );

                    return (
                        Array.isArray(
                            meetings,
                        )
                            ? meetings
                            : []
                    ).map(
                        (
                            meeting,
                        ) => ({
                            ...meeting,
                            course_name:
                                course.name,
                        }),
                    );
                },
            ),
        );

    const meetings =
        results.flatMap(
            (
                result,
            ) =>
                result.status ===
                    "fulfilled"
                    ? result.value
                    : [],
        );

    const failedRequests =
        results.filter(
            (
                result,
            ) =>
                result.status ===
                "rejected",
        );

    return {
        meetings,
        warning:
            failedRequests.length >
                0
                ? "Algunas reuniones no pudieron consultarse. Presiona Actualizar para intentarlo nuevamente."
                : null,
    };
}

function getMeetingEndTimestamp(
    meeting: ZoomMeetingWithCourse,
): number {
    const startTimestamp =
        Date.parse(
            meeting.start_time,
        );

    if (
        Number.isNaN(
            startTimestamp,
        )
    ) {
        return 0;
    }

    return (
        startTimestamp +
        meeting.duration *
        60 *
        1000
    );
}

function meetingIsPending(
    meeting: ZoomMeetingWithCourse,
): boolean {
    return (
        getMeetingEndTimestamp(
            meeting,
        ) >=
        Date.now()
    );
}

function formatMeetingDate(
    value: string,
): string {
    const date =
        new Date(
            value,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "Fecha no disponible";
    }

    return new Intl.DateTimeFormat(
        "es-EC",
        {
            weekday:
                "short",
            day:
                "numeric",
            month:
                "short",
            year:
                "numeric",
            timeZone:
                COURSE_TIMEZONE,
        },
    ).format(
        date,
    );
}

function formatMeetingTime(
    value: string,
): string {
    const date =
        new Date(
            value,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "Sin hora";
    }

    return new Intl.DateTimeFormat(
        "es-EC",
        {
            hour:
                "2-digit",
            minute:
                "2-digit",
            timeZone:
                COURSE_TIMEZONE,
        },
    ).format(
        date,
    );
}

function getCourseName(
    meeting: ZoomMeetingWithCourse,
): string {
    return (
        meeting.course_name?.trim() ||
        `Curso #${meeting.course_id}`
    );
}

function getCourseHref(
    meeting: ZoomMeetingWithCourse,
    audience: ZoomAudience,
): string {
    return audience ===
        "teacher"
        ? `/teacher/courses/${meeting.course_id}?tab=summary`
        : `/student/courses/${meeting.course_id}?tab=summary`;
}

function ZoomMeetingCard({
    meeting,
    audience,
    highlighted,
    opening,
    disabled,
    onOpen,
}: ZoomMeetingCardProps) {
    const isTeacher =
        audience ===
        "teacher";

    return (
        <article
            className={`group flex min-h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${highlighted
                ? "border-[#172861]/40 ring-2 ring-[#172861]/10"
                : "border-slate-200 hover:border-[#172861]/25"
                }`}
        >
            <div
                className={`relative px-5 py-4 ${highlighted
                    ? "bg-gradient-to-br from-[#172861] to-[#25408f] text-white"
                    : "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900"
                    }`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p
                            className={`text-[11px] font-black uppercase tracking-[0.14em] ${highlighted
                                ? "text-white/70"
                                : "text-slate-500"
                                }`}
                        >
                            Curso
                        </p>

                        <h3
                            className={`mt-1 line-clamp-2 text-base font-black ${highlighted
                                ? "text-white"
                                : "text-[#172861]"
                                }`}
                        >
                            {getCourseName(
                                meeting,
                            )}
                        </h3>
                    </div>

                    <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${highlighted
                            ? "bg-white/15 text-white"
                            : "bg-emerald-100 text-emerald-700"
                            }`}
                    >
                        <Radio className="h-3 w-3" />

                        {highlighted
                            ? "Próxima"
                            : "Programada"}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#e9702c]">
                    <Image
                        src="/images/zoom-icon.svg"
                        alt=""
                        width={18}
                        height={18}
                        aria-hidden="true"
                        className="h-[18px] w-[18px] rounded object-contain"
                    />

                    Clase en vivo
                </div>

                <h4 className="mt-3 line-clamp-2 text-lg font-black leading-snug text-slate-900">
                    {meeting.topic}
                </h4>

                <div className="mt-4 space-y-2.5 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 shrink-0 text-[#172861]" />

                        <span className="capitalize">
                            {formatMeetingDate(
                                meeting.start_time,
                            )}
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="inline-flex items-center gap-2">
                            <Clock3 className="h-4 w-4 shrink-0 text-[#172861]" />

                            {formatMeetingTime(
                                meeting.start_time,
                            )}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                            {meeting.duration} minutos
                        </span>
                    </div>
                </div>

                <div className="mt-auto grid gap-2 pt-5 sm:grid-cols-2">
                    <Link
                        href={getCourseHref(
                            meeting,
                            audience,
                        )}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
                    >
                        <BookOpen className="h-4 w-4" />

                        {isTeacher
                            ? "Administrar"
                            : "Ver curso"}
                    </Link>

                    <button
                        type="button"
                        onClick={() =>
                            void onOpen(
                                meeting,
                            )
                        }
                        disabled={
                            disabled
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#172861] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#21377d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {opening ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ExternalLink className="h-4 w-4" />
                        )}

                        {isTeacher
                            ? "Iniciar"
                            : "Unirme"}
                    </button>
                </div>
            </div>
        </article>
    );
}

export function ZoomGeneralDashboard({
    audience,
}: ZoomGeneralDashboardProps) {
    const [
        meetings,
        setMeetings,
    ] = useState<
        ZoomMeetingWithCourse[]
    >([]);

    const [
        loading,
        setLoading,
    ] = useState(
        true,
    );

    const [
        refreshing,
        setRefreshing,
    ] = useState(
        false,
    );

    const [
        meetingError,
        setMeetingError,
    ] = useState<
        string | null
    >(null);

    const [
        busyKey,
        setBusyKey,
    ] = useState<
        string | null
    >(null);

    const isTeacher =
        audience ===
        "teacher";

    const reloadDashboard =
        useCallback(
            async () => {
                setRefreshing(
                    true,
                );

                setMeetingError(
                    null,
                );

                const toastId =
                    notify.loading(
                        "Actualizando clases virtuales...",
                        "Estamos consultando las reuniones disponibles.",
                    );

                try {
                    const result =
                        await loadMeetingsForAudience(
                            audience,
                        );

                    setMeetings(
                        result.meetings,
                    );

                    setMeetingError(
                        result.warning,
                    );

                    notify.dismiss(
                        toastId,
                    );

                    if (
                        result.warning
                    ) {
                        notify.warning(
                            "Actualización completada con observaciones.",
                            result.warning,
                        );

                        return;
                    }

                    notify.success(
                        "Clases virtuales actualizadas.",
                        result.meetings.length >
                            0
                            ? "La lista de reuniones se encuentra al día."
                            : "No existen reuniones pendientes.",
                    );
                } catch (
                loadError
                ) {
                    const message =
                        getErrorMessage(
                            loadError,
                        );

                    setMeetings(
                        [],
                    );

                    setMeetingError(
                        message,
                    );

                    notify.dismiss(
                        toastId,
                    );

                    notify.error(
                        "No fue posible actualizar las clases.",
                        message,
                    );
                } finally {
                    setRefreshing(
                        false,
                    );
                }
            },
            [
                audience,
            ],
        );

    useEffect(() => {
        let cancelled =
            false;

        loadMeetingsForAudience(
            audience,
        )
            .then(
                (
                    result,
                ) => {
                    if (
                        cancelled
                    ) {
                        return;
                    }

                    setMeetings(
                        result.meetings,
                    );

                    setMeetingError(
                        result.warning,
                    );
                },
            )
            .catch(
                (
                    loadError,
                ) => {
                    if (
                        cancelled
                    ) {
                        return;
                    }

                    setMeetings(
                        [],
                    );

                    setMeetingError(
                        getErrorMessage(
                            loadError,
                        ),
                    );
                },
            )
            .finally(
                () => {
                    if (
                        cancelled
                    ) {
                        return;
                    }

                    setLoading(
                        false,
                    );
                },
            );

        return () => {
            cancelled =
                true;
        };
    }, [
        audience,
    ]);

    const pendingMeetings =
        useMemo(
            () =>
                meetings
                    .filter(
                        meetingIsPending,
                    )
                    .sort(
                        (
                            first,
                            second,
                        ) =>
                            Date.parse(
                                first.start_time,
                            ) -
                            Date.parse(
                                second.start_time,
                            ),
                    ),
            [
                meetings,
            ],
        );

    const coursesWithMeetings =
        useMemo(
            () =>
                new Set(
                    pendingMeetings.map(
                        (
                            meeting,
                        ) =>
                            meeting.course_id,
                    ),
                ).size,
            [
                pendingMeetings,
            ],
        );

    const nextMeeting =
        pendingMeetings[0] ??
        null;

    const handleOpenMeeting =
        async (
            meeting: ZoomMeetingWithCourse,
        ) => {
            const currentBusyKey =
                `meeting-${meeting.course_id}-${meeting.id}`;

            setBusyKey(
                currentBusyKey,
            );

            setMeetingError(
                null,
            );

            const toastId =
                notify.loading(
                    isTeacher
                        ? "Preparando la reunión..."
                        : "Preparando el acceso...",
                    isTeacher
                        ? "Zoom se abrirá para iniciar la clase."
                        : "Zoom se abrirá para ingresar a la clase virtual.",
                );

            try {
                const opened =
                    isTeacher
                        ? await openZoomMeetingForTeacher(
                            meeting.id,
                        )
                        : openZoomMeetingForStudent(
                            meeting.join_url,
                        );

                if (!opened) {
                    throw new Error(
                        "El navegador bloqueó la nueva pestaña. Permite las ventanas emergentes e intenta nuevamente.",
                    );
                }

                notify.dismiss(
                    toastId,
                );

                notify.success(
                    isTeacher
                        ? "Reunión abierta correctamente."
                        : "Acceso preparado correctamente.",
                    isTeacher
                        ? "Ya puede iniciar la clase desde Zoom."
                        : "La reunión se abrió en una nueva pestaña.",
                );
            } catch (
            openError
            ) {
                const message =
                    getErrorMessage(
                        openError,
                    );

                setMeetingError(
                    message,
                );

                notify.dismiss(
                    toastId,
                );

                notify.error(
                    "No fue posible abrir Zoom.",
                    message,
                );
            } finally {
                setBusyKey(
                    null,
                );
            }
        };

    if (
        loading
    ) {
        return (
            <AthenaLoadingBackground
                label="Cargando clases virtuales..."
            />
        );
    }

    return (
        <section className="w-full px-3 py-5 sm:px-5 sm:py-6 lg:px-6 xl:px-8">
            <div className="mx-auto w-full max-w-[1680px] space-y-5">
                <header className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-[#172861]/5 shadow-sm">
                    <div className="flex flex-col gap-5 px-5 py-5 sm:px-7 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-slate-200">
                                <Image
                                    src="/images/zoom-icon.svg"
                                    alt="Zoom"
                                    width={48}
                                    height={48}
                                    priority
                                    className="h-full w-full object-contain"
                                />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-black text-slate-900">
                                        Clases virtuales
                                    </h1>

                                    <span className="rounded-full bg-[#172861]/10 px-3 py-1 text-xs font-black text-[#172861]">
                                        Zoom
                                    </span>
                                </div>

                                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                                    {isTeacher
                                        ? "Revise las reuniones programadas de sus cursos, inicie cada clase y consulte las grabaciones disponibles."
                                        : "Revise las clases en vivo de sus cursos matriculados, ingrese a las reuniones y consulte las grabaciones disponibles."}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                void reloadDashboard()
                            }
                            disabled={
                                refreshing
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${refreshing
                                    ? "animate-spin"
                                    : ""
                                    }`}
                            />

                            {refreshing
                                ? "Actualizando..."
                                : "Actualizar"}
                        </button>
                    </div>
                </header>

                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
                    <main className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 text-xl font-black text-slate-900">
                                    <Radio className="h-5 w-5 text-[#e9702c]" />
                                    Próximas clases en vivo
                                </h2>

                                <p className="mt-1 text-sm leading-6 text-slate-600">
                                    Seleccione una reunión para ingresar rápidamente o revisar el curso correspondiente.
                                </p>
                            </div>

                            <span className="inline-flex w-fit rounded-full bg-[#172861]/10 px-3 py-1.5 text-xs font-black text-[#172861]">
                                {pendingMeetings.length}{" "}
                                {pendingMeetings.length ===
                                    1
                                    ? "reunión disponible"
                                    : "reuniones disponibles"}
                            </span>
                        </div>


                        {meetingError ? (
                            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                                {meetingError}
                            </div>
                        ) : null}

                        {pendingMeetings.length ===
                            0 ? (
                            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                                <CalendarDays className="mx-auto h-10 w-10 text-slate-400" />

                                <p className="mt-4 text-sm font-black text-slate-700">
                                    No existen clases virtuales pendientes.
                                </p>

                                <p className="mx-auto mt-1 max-w-xl text-sm leading-6 text-slate-600">
                                    {isTeacher
                                        ? "Puede programar una nueva reunión desde el panel de clases virtuales del curso correspondiente."
                                        : "Las reuniones aparecerán aquí cuando el docente programe una nueva clase."}
                                </p>
                            </div>
                        ) : (
                            <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                                {pendingMeetings.map(
                                    (
                                        meeting,
                                        index,
                                    ) => {
                                        const cardBusyKey =
                                            `meeting-${meeting.course_id}-${meeting.id}`;

                                        return (
                                            <ZoomMeetingCard
                                                key={
                                                    cardBusyKey
                                                }
                                                meeting={
                                                    meeting
                                                }
                                                audience={
                                                    audience
                                                }
                                                highlighted={
                                                    index ===
                                                    0
                                                }
                                                opening={
                                                    busyKey ===
                                                    cardBusyKey
                                                }
                                                disabled={
                                                    Boolean(
                                                        busyKey,
                                                    )
                                                }
                                                onOpen={
                                                    handleOpenMeeting
                                                }
                                            />
                                        );
                                    },
                                )}
                            </div>
                        )}
                    </main>

                    <aside className="min-w-0 xl:sticky xl:top-5">
                        <section
                            id="recordings"
                            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                        >
                            <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-orange-50 px-5 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e9702c]/10 text-[#e9702c]">
                                        <CirclePlay className="h-6 w-6" />
                                    </div>

                                    <div>
                                        <h2 className="text-lg font-black text-slate-900">
                                            Clases grabadas
                                        </h2>

                                        <p className="mt-0.5 text-sm leading-5 text-slate-600">
                                            Revise las sesiones disponibles.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="rounded-2xl border border-dashed border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 px-4 py-8 text-center">
                                    <CirclePlay className="mx-auto h-10 w-10 text-[#e9702c]" />

                                    <p className="mt-3 text-sm font-black text-amber-900">
                                        El apartado de grabaciones está preparado.
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-amber-800">
                                        Las clases grabadas aparecerán aquí cuando el backend habilite la consulta de archivos procesados por Zoom.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </section>
    );
}