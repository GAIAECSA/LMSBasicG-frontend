"use client";

import Link from "next/link";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    AlertCircle,
    Bell,
    CalendarDays,
    Loader2,
    RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
    getLessonCalendarActivitiesByLessons,
    getLessonsByModule,
    type LessonCalendarActivity,
} from "@/services/lessons.service";
import { getModulesByCourse } from "@/services/modules.service";
import { getEnrollmentsByUser } from "@/services/enrollments.service";

type StudentNotificationsBellProps = {
    /*
        Esta propiedad es opcional.

        Normalmente no debes enviarla porque se utiliza automáticamente
        el identificador del usuario autenticado mediante useAuth().

        Se conserva para permitir reutilizar el componente manualmente
        en casos especiales.
    */
    studentUserId?: number | string | null;
    maxItems?: number;
};

type AnyRecord = Record<string, unknown>;

function toRecord(value: unknown): AnyRecord | null {
    if (
        !value ||
        typeof value !== "object" ||
        Array.isArray(value)
    ) {
        return null;
    }

    return value as AnyRecord;
}

function normalizeList<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value as T[];
    }

    const record = toRecord(value);

    if (!record) return [];

    if (Array.isArray(record.data)) {
        return record.data as T[];
    }

    if (Array.isArray(record.items)) {
        return record.items as T[];
    }

    if (Array.isArray(record.results)) {
        return record.results as T[];
    }

    return [];
}

function readPositiveNumber(
    ...values: unknown[]
): number | null {
    for (const value of values) {
        const numericValue = Number(value);

        if (
            Number.isFinite(numericValue) &&
            numericValue > 0
        ) {
            return numericValue;
        }
    }

    return null;
}

function readText(
    value: unknown,
    fallback = "",
) {
    return typeof value === "string" &&
        value.trim()
        ? value.trim()
        : fallback;
}

function readBoolean(
    value: unknown,
    fallback = false,
) {
    if (typeof value === "boolean") {
        return value;
    }

    if (typeof value === "number") {
        return value === 1;
    }

    if (typeof value === "string") {
        const normalizedValue = value
            .trim()
            .toLowerCase();

        if (
            [
                "true",
                "1",
                "yes",
                "si",
                "sí",
                "accepted",
                "approved",
                "aprobado",
                "aprobada",
            ].includes(normalizedValue)
        ) {
            return true;
        }

        if (
            [
                "false",
                "0",
                "no",
                "pending",
                "rejected",
                "rechazado",
                "rechazada",
            ].includes(normalizedValue)
        ) {
            return false;
        }
    }

    return fallback;
}

function getEnrollmentCourseId(
    enrollment: unknown,
): number | null {
    const record = toRecord(enrollment);
    const course = toRecord(record?.course);

    return readPositiveNumber(
        record?.course_id,
        record?.courseId,
        course?.id,
    );
}

function isStudentEnrollment(
    enrollment: unknown,
) {
    const record = toRecord(enrollment);
    const role = toRecord(record?.role);

    if (!record) return false;

    const roleId = readPositiveNumber(
        record.role_id,
        record.roleId,
        role?.id,
    );

    const roleName = readText(
        role?.name ??
        record.role_name ??
        record.roleName,
    ).toLowerCase();

    /*
        En tu LMS, role_id = 4 corresponde al estudiante.

        Si el backend no devuelve el rol dentro de la matrícula,
        se permite continuar para mantener compatibilidad.
    */
    if (!roleId && !roleName) {
        return true;
    }

    return (
        roleId === 4 ||
        roleName.includes("student") ||
        roleName.includes("estudiante")
    );
}

function isApprovedEnrollment(
    enrollment: unknown,
) {
    const record = toRecord(enrollment);

    if (!record) return false;

    return readBoolean(
        record.accepted ??
        record.is_accepted ??
        record.approved ??
        record.is_approved ??
        record.status,
        false,
    );
}

function isApprovedStudentEnrollment(
    enrollment: unknown,
) {
    return (
        isStudentEnrollment(enrollment) &&
        isApprovedEnrollment(enrollment)
    );
}

function getActivityTimestamp(
    value: unknown,
) {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        return 0;
    }

    const timestamp = new Date(value).getTime();

    return Number.isNaN(timestamp)
        ? 0
        : timestamp;
}

function getActivityId(
    activity: unknown,
): number | null {
    const record = toRecord(activity);

    return readPositiveNumber(
        record?.lesson_block_id,
        record?.lessonBlockId,
        record?.id,
    );
}

function getActivityUrl(
    activity: unknown,
) {
    const record = toRecord(activity);

    return readText(record?.url) ||
        "/student/calendar";
}

function getActivityTitle(
    activity: unknown,
) {
    const record = toRecord(activity);

    return (
        readText(record?.title) ||
        readText(record?.name) ||
        "Actividad programada"
    );
}

function getActivityTypeKey(
    activity: unknown,
) {
    const record = toRecord(activity);

    return (
        readText(record?.type_key) ||
        readText(record?.typeKey) ||
        readText(record?.type) ||
        "activity"
    );
}

function formatNotificationDate(
    value: unknown,
) {
    if (
        typeof value !== "string" ||
        !value.trim()
    ) {
        return "Fecha no definida";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat("es-EC", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function getActivityTypeLabel(
    typeKey: unknown,
) {
    const normalizedType = String(
        typeKey ?? "",
    )
        .trim()
        .toLowerCase();

    if (normalizedType === "survey") {
        return "Encuesta";
    }

    if (normalizedType === "quiz") {
        return "Evaluación";
    }

    if (normalizedType === "homework") {
        return "Tarea";
    }

    if (normalizedType === "forum") {
        return "Foro";
    }

    if (normalizedType === "video") {
        return "Video";
    }

    if (normalizedType === "image") {
        return "Imagen";
    }

    if (normalizedType === "pdf") {
        return "PDF";
    }

    if (normalizedType === "resource") {
        return "Recurso";
    }

    if (normalizedType === "text") {
        return "Contenido";
    }

    return "Actividad";
}

async function getEnrolledCoursesActivities(
    studentUserId: number,
): Promise<LessonCalendarActivity[]> {
    /*
        1. Consultar únicamente las matrículas
           del usuario autenticado.
    */
    const enrollmentsResponse =
        await getEnrollmentsByUser(studentUserId);

    const enrollments =
        normalizeList<unknown>(
            enrollmentsResponse,
        );

    /*
        2. Conservar únicamente las matrículas:
           - aprobadas;
           - pertenecientes al rol estudiante.
    */
    const courseIds = Array.from(
        new Set(
            enrollments
                .filter(
                    isApprovedStudentEnrollment,
                )
                .map(getEnrollmentCourseId)
                .filter(
                    (
                        courseId,
                    ): courseId is number =>
                        courseId !== null,
                ),
        ),
    );

    if (courseIds.length === 0) {
        return [];
    }

    /*
        3. Obtener módulos, lecciones y actividades
           únicamente de los cursos matriculados.
    */
    const activitiesByCourse =
        await Promise.all(
            courseIds.map(async (courseId) => {
                const modulesResponse =
                    await getModulesByCourse(
                        courseId,
                    );

                const modules =
                    normalizeList<unknown>(
                        modulesResponse,
                    );

                const lessonsByModule =
                    await Promise.all(
                        modules.map(
                            async (moduleItem) => {
                                const moduleRecord =
                                    toRecord(
                                        moduleItem,
                                    );

                                const moduleId =
                                    readPositiveNumber(
                                        moduleRecord?.id,
                                    );

                                if (!moduleId) {
                                    return [];
                                }

                                const lessonsResponse =
                                    await getLessonsByModule(
                                        moduleId,
                                    );

                                return normalizeList<unknown>(
                                    lessonsResponse,
                                );
                            },
                        ),
                    );

                const lessonIds = Array.from(
                    new Set(
                        lessonsByModule
                            .flat()
                            .map(
                                (lessonItem) => {
                                    const lessonRecord =
                                        toRecord(
                                            lessonItem,
                                        );

                                    return readPositiveNumber(
                                        lessonRecord?.id,
                                    );
                                },
                            )
                            .filter(
                                (
                                    lessonId,
                                ): lessonId is number =>
                                    lessonId !== null,
                            ),
                    ),
                );

                if (lessonIds.length === 0) {
                    return [];
                }

                /*
                    Las lecciones ya pertenecen únicamente
                    a cursos matriculados por el estudiante.
                */
                const activitiesResponse =
                    await getLessonCalendarActivitiesByLessons(
                        lessonIds,
                    );

                return normalizeList<LessonCalendarActivity>(
                    activitiesResponse,
                );
            }),
        );

    /*
        4. Eliminar actividades repetidas.
    */
    const activitiesById = new Map<
        number,
        LessonCalendarActivity
    >();

    activitiesByCourse
        .flat()
        .forEach((activity) => {
            const activityId =
                getActivityId(activity);

            if (!activityId) return;

            activitiesById.set(
                activityId,
                activity,
            );
        });

    return Array.from(
        activitiesById.values(),
    );
}

export function StudentNotificationsBell({
    studentUserId,
    maxItems = 5,
}: StudentNotificationsBellProps) {
    const { user } = useAuth();

    /*
        Se prioriza el identificador enviado manualmente.

        Si no existe, se utiliza automáticamente
        el usuario autenticado.
    */
    const authenticatedStudentUserId =
        useMemo(() => {
            const candidateId =
                studentUserId ?? user?.id;

            return readPositiveNumber(
                candidateId,
            );
        }, [
            studentUserId,
            user?.id,
        ]);

    const containerRef =
        useRef<HTMLDivElement | null>(null);

    const [isOpen, setIsOpen] =
        useState(false);

    const [activities, setActivities] =
        useState<LessonCalendarActivity[]>([]);

    const [isLoading, setIsLoading] =
        useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        nowTimestamp,
        setNowTimestamp,
    ] = useState(() => Date.now());

    const nextActivities = useMemo(
        () =>
            activities
                .filter((activity) => {
                    const activityRecord =
                        toRecord(activity);

                    const activityTime =
                        getActivityTimestamp(
                            activityRecord?.date_available ??
                            activityRecord?.dateAvailable,
                        );

                    return (
                        activityTime > 0 &&
                        activityTime >=
                        nowTimestamp
                    );
                })
                .sort(
                    (
                        firstActivity,
                        secondActivity,
                    ) => {
                        const firstRecord =
                            toRecord(
                                firstActivity,
                            );

                        const secondRecord =
                            toRecord(
                                secondActivity,
                            );

                        return (
                            getActivityTimestamp(
                                firstRecord?.date_available ??
                                firstRecord?.dateAvailable,
                            ) -
                            getActivityTimestamp(
                                secondRecord?.date_available ??
                                secondRecord?.dateAvailable,
                            )
                        );
                    },
                ),
        [
            activities,
            nowTimestamp,
        ],
    );

    const visibleActivities =
        nextActivities.slice(0, maxItems);

    const notificationCount =
        nextActivities.length;

    const loadNotifications =
        useCallback(async () => {
            if (
                !authenticatedStudentUserId
            ) {
                setActivities([]);
                setNowTimestamp(
                    Date.now(),
                );

                return;
            }

            try {
                setIsLoading(true);
                setErrorMessage("");

                const data =
                    await getEnrolledCoursesActivities(
                        authenticatedStudentUserId,
                    );

                setActivities(data);
                setNowTimestamp(
                    Date.now(),
                );
            } catch (error) {
                setActivities([]);

                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "No se pudieron cargar las notificaciones.",
                );
            } finally {
                setIsLoading(false);
            }
        }, [
            authenticatedStudentUserId,
        ]);

    /*
        Carga inicial de notificaciones.
    */
    useEffect(() => {
        const timeoutId =
            window.setTimeout(() => {
                void loadNotifications();
            }, 0);

        return () => {
            window.clearTimeout(
                timeoutId,
            );
        };
    }, [
        loadNotifications,
    ]);

    /*
        Actualiza el reloj interno cada minuto.

        Cuando una actividad alcanza su fecha de disponibilidad,
        deja de aparecer automáticamente como actividad próxima.
    */
    useEffect(() => {
        const intervalId =
            window.setInterval(() => {
                setNowTimestamp(
                    Date.now(),
                );
            }, 60_000);

        return () => {
            window.clearInterval(
                intervalId,
            );
        };
    }, []);

    /*
        Cierra la campana cuando el usuario
        hace clic fuera del menú.
    */
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(
            event: MouseEvent,
        ) {
            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target as Node,
                )
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside,
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside,
            );
        };
    }, [
        isOpen,
    ]);

    return (
        <div
            ref={containerRef}
            className="relative"
        >
            <button
                type="button"
                onClick={() =>
                    setIsOpen(
                        (currentValue) =>
                            !currentValue,
                    )
                }
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] shadow-sm transition hover:bg-[var(--muted)]"
                aria-label="Notificaciones"
                title="Actividades próximas"
            >
                {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <Bell className="h-5 w-5" />
                )}

                {notificationCount > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-black text-[var(--primary-foreground)]">
                        {notificationCount > 9
                            ? "9+"
                            : notificationCount}
                    </span>
                ) : null}
            </button>

            {isOpen ? (
                <div className="absolute right-0 top-14 z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-[24px] border border-[var(--border)] bg-[var(--card)] shadow-xl">
                    <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
                        <div>
                            <h3 className="text-sm font-black text-[var(--foreground)]">
                                Actividades próximas
                            </h3>

                            <p className="mt-1 text-xs font-semibold text-[var(--muted-foreground)]">
                                Tienes{" "}
                                {notificationCount}{" "}
                                actividad(es)
                                próxima(s).
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                void loadNotifications()
                            }
                            disabled={isLoading}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
                            aria-label="Actualizar notificaciones"
                            title="Actualizar"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    {errorMessage ? (
                        <div className="m-3 flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                            <AlertCircle className="h-4 w-4 shrink-0" />

                            <span>
                                {errorMessage}
                            </span>
                        </div>
                    ) : null}

                    {!isLoading &&
                        visibleActivities.length ===
                        0 ? (
                        <div className="p-6 text-center">
                            <Bell className="mx-auto h-8 w-8 text-[var(--muted-foreground)]" />

                            <p className="mt-3 text-sm font-bold text-[var(--muted-foreground)]">
                                No tienes actividades próximas.
                            </p>
                        </div>
                    ) : null}

                    {visibleActivities.length >
                        0 ? (
                        <div className="max-h-[360px] overflow-y-auto p-2">
                            {visibleActivities.map(
                                (
                                    activity,
                                    index,
                                ) => {
                                    const activityRecord =
                                        toRecord(
                                            activity,
                                        );

                                    const activityUrl =
                                        getActivityUrl(
                                            activity,
                                        );

                                    const activityDate =
                                        activityRecord?.date_available ??
                                        activityRecord?.dateAvailable;

                                    const activityId =
                                        getActivityId(
                                            activity,
                                        );

                                    return (
                                        <Link
                                            key={
                                                activityId ??
                                                `${getActivityTitle(
                                                    activity,
                                                )}-${index}`
                                            }
                                            href={
                                                activityUrl
                                            }
                                            onClick={() =>
                                                setIsOpen(
                                                    false,
                                                )
                                            }
                                            className="block rounded-2xl px-3 py-3 transition hover:bg-[var(--muted)]"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--secondary)] text-[var(--primary)]">
                                                    <CalendarDays className="h-5 w-5" />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <span className="inline-flex rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-black uppercase text-[var(--primary)]">
                                                        {getActivityTypeLabel(
                                                            getActivityTypeKey(
                                                                activity,
                                                            ),
                                                        )}
                                                    </span>

                                                    <p className="mt-2 line-clamp-1 text-sm font-black text-[var(--foreground)]">
                                                        {getActivityTitle(
                                                            activity,
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-xs font-bold text-[var(--muted-foreground)]">
                                                        {formatNotificationDate(
                                                            activityDate,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                },
                            )}
                        </div>
                    ) : null}

                    <div className="border-t border-[var(--border)] p-3">
                        <Link
                            href="/student/calendar"
                            onClick={() =>
                                setIsOpen(false)
                            }
                            className="inline-flex h-10 w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-4 text-sm font-black !text-white transition hover:opacity-95"
                        >
                            <span className="!text-white">
                                Ver calendario completo
                            </span>
                        </Link>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

export default StudentNotificationsBell;