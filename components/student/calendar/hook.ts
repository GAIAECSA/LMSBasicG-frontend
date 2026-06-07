"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import { notify } from "@/lib/notify";
import type {
    LessonCalendarActivity,
} from "@/services/lessons.service";

import {
    getStudentCalendarActivities,
} from "./api";
import {
    addMonths,
    buildCalendarDays,
    getActivityDayKey,
    getActivityTimestamp,
    getDateKeyFromTimestamp,
    getInitials,
    getMonthKeyFromTimestamp,
    getUserFullName,
    readPositiveNumber,
    toRecord,
} from "./utils";

function getErrorMessage(
    error: unknown,
    fallback: string,
) {
    if (
        error instanceof Error &&
        error.message.trim()
    ) {
        return error.message.trim();
    }

    if (
        typeof error === "string" &&
        error.trim()
    ) {
        return error.trim();
    }

    return fallback;
}

export function useStudentCalendar() {
    const { user } =
        useAuth();

    const studentUserId =
        useMemo(() => {
            const userRecord =
                toRecord(user);

            return readPositiveNumber(
                userRecord?.id,
            );
        }, [user]);

    const displayName =
        useMemo(
            () =>
                getUserFullName(
                    user,
                ),
            [user],
        );

    const initials =
        useMemo(
            () =>
                getInitials(
                    displayName,
                ),
            [displayName],
        );

    const refreshInProgressRef =
        useRef(false);

    const [
        activities,
        setActivities,
    ] =
        useState<
            LessonCalendarActivity[]
        >([]);

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        isRefreshing,
        setIsRefreshing,
    ] = useState(false);

    const [
        errorMessage,
        setErrorMessage,
    ] = useState("");

    const [
        nowTimestamp,
        setNowTimestamp,
    ] = useState(0);

    const [
        currentMonthKey,
        setCurrentMonthKey,
    ] = useState("");

    const [
        selectedDayKey,
        setSelectedDayKey,
    ] = useState("");

    const todayKey =
        useMemo(() => {
            if (!nowTimestamp) {
                return "";
            }

            return getDateKeyFromTimestamp(
                nowTimestamp,
            );
        }, [nowTimestamp]);

    const nextActivities =
        useMemo(
            () =>
                activities.filter(
                    (activity) => {
                        const activityTime =
                            getActivityTimestamp(
                                activity.date_available,
                            );

                        return (
                            activityTime >
                            0 &&
                            nowTimestamp >
                            0 &&
                            activityTime >=
                            nowTimestamp
                        );
                    },
                ),
            [
                activities,
                nowTimestamp,
            ],
        );

    const expiredActivities =
        useMemo(
            () =>
                activities.filter(
                    (activity) => {
                        const activityTime =
                            getActivityTimestamp(
                                activity.date_available,
                            );

                        return (
                            activityTime >
                            0 &&
                            nowTimestamp >
                            0 &&
                            activityTime <
                            nowTimestamp
                        );
                    },
                ),
            [
                activities,
                nowTimestamp,
            ],
        );

    const calendarDays =
        useMemo(
            () =>
                currentMonthKey
                    ? buildCalendarDays(
                        {
                            monthKey:
                                currentMonthKey,
                            activities,
                            todayKey,
                        },
                    )
                    : [],
            [
                activities,
                currentMonthKey,
                todayKey,
            ],
        );

    const selectedDayActivities =
        useMemo(
            () =>
                activities.filter(
                    (activity) =>
                        getActivityDayKey(
                            activity,
                        ) ===
                        selectedDayKey,
                ),
            [
                activities,
                selectedDayKey,
            ],
        );

    /*
     * Carga inicial:
     * - No muestra toast.
     * - Si falla, muestra la alerta persistente.
     */
    const loadCalendar =
        useCallback(async () => {
            try {
                setIsLoading(
                    true,
                );

                setErrorMessage(
                    "",
                );

                const currentTimestamp =
                    Date.now();

                if (
                    !studentUserId
                ) {
                    throw new Error(
                        "No se pudo identificar al estudiante autenticado.",
                    );
                }

                const data =
                    await getStudentCalendarActivities(
                        studentUserId,
                    );

                const firstActivityTimestamp =
                    data.length >
                        0
                        ? getActivityTimestamp(
                            data[0]
                                .date_available,
                        )
                        : currentTimestamp;

                const baseTimestamp =
                    firstActivityTimestamp ||
                    currentTimestamp;

                setNowTimestamp(
                    currentTimestamp,
                );

                setActivities(
                    data,
                );

                setCurrentMonthKey(
                    getMonthKeyFromTimestamp(
                        baseTimestamp,
                    ),
                );

                setSelectedDayKey(
                    getDateKeyFromTimestamp(
                        baseTimestamp,
                    ),
                );
            } catch (error) {
                console.error(
                    "Error al cargar el calendario del estudiante:",
                    error,
                );

                setActivities(
                    [],
                );

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "No se pudieron cargar las actividades del calendario.",
                    ),
                );
            } finally {
                setIsLoading(
                    false,
                );
            }
        }, [studentUserId]);

    /*
     * Actualización manual:
     * - Muestra toast de carga.
     * - Conserva las actividades visibles si la API falla.
     * - Evita múltiples solicitudes simultáneas.
     */
    const refreshCalendar =
        useCallback(async () => {
            if (
                refreshInProgressRef.current
            ) {
                return;
            }

            refreshInProgressRef.current =
                true;

            setIsRefreshing(
                true,
            );

            setErrorMessage(
                "",
            );

            const toastId =
                notify.loading(
                    "Actualizando calendario...",
                    "Estamos consultando tus actividades académicas.",
                );

            try {
                const currentTimestamp =
                    Date.now();

                if (
                    !studentUserId
                ) {
                    throw new Error(
                        "No se pudo identificar al estudiante autenticado.",
                    );
                }

                const data =
                    await getStudentCalendarActivities(
                        studentUserId,
                    );

                setNowTimestamp(
                    currentTimestamp,
                );

                setActivities(
                    data,
                );

                if (
                    !currentMonthKey
                ) {
                    setCurrentMonthKey(
                        getMonthKeyFromTimestamp(
                            currentTimestamp,
                        ),
                    );
                }

                if (
                    !selectedDayKey
                ) {
                    setSelectedDayKey(
                        getDateKeyFromTimestamp(
                            currentTimestamp,
                        ),
                    );
                }

                notify.dismiss(
                    toastId,
                );

                notify.success(
                    "Calendario actualizado correctamente.",
                    "Tus actividades académicas se encuentran al día.",
                );
            } catch (error) {
                console.error(
                    "Error al actualizar el calendario del estudiante:",
                    error,
                );

                const message =
                    getErrorMessage(
                        error,
                        "No se pudieron actualizar las actividades del calendario.",
                    );

                /*
                 * No se eliminan las actividades existentes.
                 * El estudiante conserva la última información disponible.
                 */
                setErrorMessage(
                    message,
                );

                notify.dismiss(
                    toastId,
                );

                notify.error(
                    "No se pudo actualizar el calendario.",
                    message,
                );
            } finally {
                refreshInProgressRef.current =
                    false;

                setIsRefreshing(
                    false,
                );
            }
        }, [
            currentMonthKey,
            selectedDayKey,
            studentUserId,
        ]);

    useEffect(() => {
        const timeoutId =
            window.setTimeout(
                () => {
                    void loadCalendar();
                },
                0,
            );

        return () => {
            window.clearTimeout(
                timeoutId,
            );
        };
    }, [loadCalendar]);

    function goToPreviousMonth() {
        setCurrentMonthKey(
            (value) =>
                addMonths(
                    value,
                    -1,
                ),
        );
    }

    function goToNextMonth() {
        setCurrentMonthKey(
            (value) =>
                addMonths(
                    value,
                    1,
                ),
        );
    }

    function goToToday() {
        if (!nowTimestamp) {
            return;
        }

        setCurrentMonthKey(
            getMonthKeyFromTimestamp(
                nowTimestamp,
            ),
        );

        setSelectedDayKey(
            getDateKeyFromTimestamp(
                nowTimestamp,
            ),
        );
    }

    return {
        displayName,
        initials,
        activities,
        nextActivities,
        expiredActivities,
        calendarDays,
        selectedDayActivities,
        isLoading,
        isRefreshing,
        errorMessage,
        nowTimestamp,
        currentMonthKey,
        selectedDayKey,
        setSelectedDayKey,
        loadCalendar,
        refreshCalendar,
        goToPreviousMonth,
        goToNextMonth,
        goToToday,
    };
}

export type StudentCalendarState =
    ReturnType<
        typeof useStudentCalendar
    >;