"use client";

import type { FormEvent } from "react";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { notify } from "@/lib/notify";

import {
    createCourseAttendance,
    deleteCourseAttendance,
    getAttendancesByCourseAttendance,
    getCourseAttendancesByCourse,
    updateAttendance,
    updateCourseAttendance,
    type Attendance,
    type AttendanceState,
    type CourseAttendance,
} from "@/services/attendance.service";

import { ATTENDANCE_STATUS_OPTIONS } from "./constants";

import type {
    AttendanceFormState,
    AttendanceModalMode,
    AttendanceSummary,
    TeacherAttendanceWorkspaceProps,
} from "./types";

import {
    buildFormFromSession,
    buildInitialForm,
    getErrorMessage,
    getStudentName,
    normalizeTimeForApi,
    sortAttendancesByStudent,
    sortSessionsByDateDesc,
} from "./utils";

function createLoadingToast(message: string) {
    const toastId = notify.loading(message);
    let dismissed = false;

    return () => {
        if (dismissed) return;

        notify.dismiss(toastId);
        dismissed = true;
    };
}

function getAttendanceState(attendance: Attendance): AttendanceState {
    return attendance.attendance_state ?? attendance.state ?? "PENDIENTE";
}

export function useAttendance({
    courseId,
}: TeacherAttendanceWorkspaceProps) {
    const numericCourseId = Number(courseId);

    const [sessions, setSessions] = useState<CourseAttendance[]>([]);
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingAttendances, setIsLoadingAttendances] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [updatingAttendanceId, setUpdatingAttendanceId] = useState<
        number | null
    >(null);

    const [errorMessage, setErrorMessage] = useState("");
    const [actionError, setActionError] = useState("");

    const [modalMode, setModalMode] = useState<AttendanceModalMode | null>(
        null,
    );
    const [formState, setFormState] = useState<AttendanceFormState>(
        buildInitialForm(),
    );
    const [editingSession, setEditingSession] =
        useState<CourseAttendance | null>(null);
    const [deleteSession, setDeleteSession] =
        useState<CourseAttendance | null>(null);

    const hasLoadedOnceRef = useRef(false);
    const sessionsLoadingRef = useRef(false);
    const sessionMutationRef = useRef(false);
    const attendanceMutationRef = useRef(false);
    const attendanceRequestIdRef = useRef(0);
    const loadingAttendanceSessionIdRef = useRef("");
    const lastLoadedAttendanceSessionIdRef = useRef("");
    const selectedSessionIdRef = useRef("");

    const selectSessionId = useCallback((value: string) => {
        selectedSessionIdRef.current = value;
        setSelectedSessionId(value);
    }, []);

    const selectedSession = useMemo(
        () =>
            sessions.find(
                (session) => String(session.id) === selectedSessionId,
            ) ?? null,
        [sessions, selectedSessionId],
    );

    const filteredAttendances = useMemo(() => {
        const cleanSearchTerm = searchTerm.trim().toLowerCase();

        if (!cleanSearchTerm) return attendances;

        return attendances.filter((attendance) => {
            const studentName = getStudentName(attendance).toLowerCase();
            const status = String(getAttendanceState(attendance)).toLowerCase();

            return (
                studentName.includes(cleanSearchTerm) ||
                status.includes(cleanSearchTerm) ||
                String(attendance.enrollment_id).includes(cleanSearchTerm)
            );
        });
    }, [attendances, searchTerm]);

    const summary = useMemo<AttendanceSummary>(() => {
        const countByStatus = ATTENDANCE_STATUS_OPTIONS.reduce<
            Record<string, number>
        >((accumulator, option) => {
            accumulator[option.value] = attendances.filter(
                (attendance) => getAttendanceState(attendance) === option.value,
            ).length;

            return accumulator;
        }, {});

        return {
            total: attendances.length,
            present: countByStatus.PRESENTE ?? 0,
            absent: countByStatus.FALTA ?? 0,
            late: countByStatus.ATRASO ?? 0,
            pending: countByStatus.PENDIENTE ?? 0,
            justified: countByStatus.JUSTIFICADO ?? 0,
        };
    }, [attendances]);

    const backHref = `/teacher/courses/${numericCourseId}`;

    const loadAttendances = useCallback(
        async (sessionId: string, force = false): Promise<boolean> => {
            const cleanSessionId = String(sessionId ?? "").trim();

            if (!cleanSessionId) {
                attendanceRequestIdRef.current += 1;
                loadingAttendanceSessionIdRef.current = "";
                lastLoadedAttendanceSessionIdRef.current = "";
                setAttendances([]);
                setIsLoadingAttendances(false);
                return true;
            }

            if (
                !force &&
                (lastLoadedAttendanceSessionIdRef.current === cleanSessionId ||
                    loadingAttendanceSessionIdRef.current === cleanSessionId)
            ) {
                return true;
            }

            const requestId = attendanceRequestIdRef.current + 1;
            attendanceRequestIdRef.current = requestId;
            loadingAttendanceSessionIdRef.current = cleanSessionId;

            try {
                setIsLoadingAttendances(true);
                setErrorMessage("");

                const data = await getAttendancesByCourseAttendance(
                    Number(cleanSessionId),
                );

                if (attendanceRequestIdRef.current !== requestId) {
                    return true;
                }

                setAttendances(sortAttendancesByStudent(data));
                lastLoadedAttendanceSessionIdRef.current = cleanSessionId;

                return true;
            } catch (error) {
                if (attendanceRequestIdRef.current !== requestId) {
                    return false;
                }

                const message = getErrorMessage(error);

                setAttendances([]);
                setErrorMessage(message);

                return false;
            } finally {
                if (attendanceRequestIdRef.current === requestId) {
                    loadingAttendanceSessionIdRef.current = "";
                    setIsLoadingAttendances(false);
                }
            }
        },
        [],
    );

    const loadSessions = useCallback(
        async (preferredSessionId?: string) => {
            if (!Number.isFinite(numericCourseId) || numericCourseId <= 0) {
                setSessions([]);
                selectSessionId("");
                throw new Error("ID del curso no válido.");
            }

            const data = await getCourseAttendancesByCourse(numericCourseId);
            const orderedSessions = sortSessionsByDateDesc(data);

            setSessions(orderedSessions);

            const requestedSessionId =
                preferredSessionId ||
                selectedSessionIdRef.current ||
                String(orderedSessions[0]?.id ?? "");

            const sessionExists = orderedSessions.some(
                (session) => String(session.id) === requestedSessionId,
            );

            const nextSelectedSessionId = sessionExists
                ? requestedSessionId
                : String(orderedSessions[0]?.id ?? "");

            selectSessionId(nextSelectedSessionId);

            return nextSelectedSessionId;
        },
        [numericCourseId, selectSessionId],
    );

    const refreshAll = useCallback(
        async (preferredSessionId?: string, showRefresh = false) => {
            if (sessionsLoadingRef.current) {
                if (showRefresh) {
                    notify.warning(
                        "La actualización de asistencias ya está en proceso.",
                    );
                }

                return;
            }

            if (
                showRefresh &&
                (sessionMutationRef.current || attendanceMutationRef.current)
            ) {
                notify.warning(
                    "Espera a que termine la acción en curso antes de actualizar.",
                );
                return;
            }

            sessionsLoadingRef.current = true;

            const isInitialLoad = !hasLoadedOnceRef.current;
            const dismissLoadingToast = showRefresh
                ? createLoadingToast("Actualizando asistencias...")
                : null;

            try {
                if (isInitialLoad) {
                    setIsLoading(true);
                }

                if (showRefresh) {
                    setIsRefreshing(true);
                }

                setErrorMessage("");
                setActionError("");

                const nextSelectedSessionId =
                    await loadSessions(preferredSessionId);

                const attendanceLoaded = await loadAttendances(
                    nextSelectedSessionId,
                    true,
                );

                if (!attendanceLoaded) {
                    throw new Error(
                        "No se pudieron cargar los registros de asistencia.",
                    );
                }

                if (showRefresh) {
                    dismissLoadingToast?.();
                    notify.success("Asistencias actualizadas correctamente.");
                }
            } catch (error) {
                const message = getErrorMessage(error);

                setErrorMessage(message);
                dismissLoadingToast?.();

                if (showRefresh) {
                    notify.error(message);
                }
            } finally {
                dismissLoadingToast?.();
                sessionsLoadingRef.current = false;
                hasLoadedOnceRef.current = true;
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [loadAttendances, loadSessions],
    );

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void refreshAll();
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [refreshAll]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void loadAttendances(selectedSessionId);
        }, 0);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [selectedSessionId, loadAttendances]);

    function beginSessionMutation(message: string) {
        if (sessionsLoadingRef.current) {
            notify.warning("Espera a que termine la actualización en curso.");
            return false;
        }

        if (sessionMutationRef.current || attendanceMutationRef.current) {
            notify.warning(message);
            return false;
        }

        sessionMutationRef.current = true;
        return true;
    }

    function endSessionMutation() {
        sessionMutationRef.current = false;
    }

    function openCreateModal() {
        if (sessionsLoadingRef.current || sessionMutationRef.current) {
            notify.warning("Espera a que termine la acción en curso.");
            return;
        }

        setModalMode("create");
        setEditingSession(null);
        setFormState(buildInitialForm());
        setActionError("");
    }

    function openEditModal(session: CourseAttendance) {
        if (sessionsLoadingRef.current || sessionMutationRef.current) {
            notify.warning("Espera a que termine la acción en curso.");
            return;
        }

        setModalMode("edit");
        setEditingSession(session);
        setFormState(buildFormFromSession(session));
        setActionError("");
    }

    function closeModal() {
        if (isSaving) return;

        setModalMode(null);
        setEditingSession(null);
        setFormState(buildInitialForm());
        setActionError("");
    }

    function closeModalForce() {
        setModalMode(null);
        setEditingSession(null);
        setFormState(buildInitialForm());
        setActionError("");
    }

    function openDeleteModal(session: CourseAttendance) {
        if (sessionsLoadingRef.current || sessionMutationRef.current) {
            notify.warning("Espera a que termine la acción en curso.");
            return;
        }

        setActionError("");
        setDeleteSession(session);
    }

    function closeDeleteModal() {
        if (isSaving) return;

        setDeleteSession(null);
        setActionError("");
    }

    async function handleSubmitSession(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!formState.day) {
            notify.warning("Selecciona la fecha de la asistencia.");
            return;
        }

        if (!formState.start_time || !formState.end_time) {
            notify.warning("Ingresa hora de inicio y hora de fin.");
            return;
        }

        if (formState.end_time <= formState.start_time) {
            notify.warning("La hora de fin debe ser posterior a la hora de inicio.");
            return;
        }

        if (
            modalMode === "edit" &&
            !editingSession
        ) {
            notify.error("No se encontró la sesión que deseas editar.");
            return;
        }

        if (
            !beginSessionMutation(
                "Ya existe una sesión de asistencia procesándose.",
            )
        ) {
            return;
        }

        const dismissLoadingToast = createLoadingToast(
            modalMode === "create"
                ? "Creando sesión de asistencia..."
                : "Actualizando sesión de asistencia...",
        );

        try {
            setIsSaving(true);
            setActionError("");

            const payload = {
                course_id: numericCourseId,
                day: formState.day,
                start_time: normalizeTimeForApi(formState.start_time),
                end_time: normalizeTimeForApi(formState.end_time),
            };

            if (modalMode === "create") {
                const createdSession = await createCourseAttendance(payload);

                closeModalForce();
                await refreshAll(String(createdSession.id));

                dismissLoadingToast();
                notify.success("Sesión de asistencia creada correctamente.");
                return;
            }

            if (modalMode === "edit" && editingSession) {
                const updatedSession = await updateCourseAttendance(
                    editingSession.id,
                    payload,
                );

                closeModalForce();
                await refreshAll(String(updatedSession.id));

                dismissLoadingToast();
                notify.success("Sesión de asistencia actualizada correctamente.");
            }
        } catch (error) {
            const message = getErrorMessage(error);

            setActionError(message);
            dismissLoadingToast();
            notify.error(message);
        } finally {
            dismissLoadingToast();
            setIsSaving(false);
            endSessionMutation();
        }
    }

    async function handleDeleteSession() {
        if (!deleteSession) return;

        if (
            !beginSessionMutation(
                "Ya existe una sesión de asistencia procesándose.",
            )
        ) {
            return;
        }

        const dismissLoadingToast = createLoadingToast(
            "Eliminando sesión de asistencia...",
        );

        try {
            setIsSaving(true);
            setActionError("");

            await deleteCourseAttendance(deleteSession.id);

            setDeleteSession(null);
            selectSessionId("");
            await refreshAll();

            dismissLoadingToast();
            notify.success("Sesión de asistencia eliminada correctamente.");
        } catch (error) {
            const message = getErrorMessage(error);

            setActionError(message);
            dismissLoadingToast();
            notify.error(message);
        } finally {
            dismissLoadingToast();
            setIsSaving(false);
            endSessionMutation();
        }
    }

    const handleChangeAttendanceStatus = async (
        attendance: Attendance,
        status: AttendanceState,
    ) => {
        if (!attendance.id) return;

        if (getAttendanceState(attendance) === status) {
            return;
        }

        if (
            sessionsLoadingRef.current ||
            sessionMutationRef.current ||
            attendanceMutationRef.current
        ) {
            notify.warning("Espera a que termine la actualización en curso.");
            return;
        }

        attendanceMutationRef.current = true;
        setUpdatingAttendanceId(attendance.id);

        const dismissLoadingToast = createLoadingToast(
            `Actualizando asistencia de ${getStudentName(attendance)}...`,
        );

        try {
            const updatedAttendance = await updateAttendance(attendance.id, {
                enrollment_id: attendance.enrollment_id,
                course_attendance_id: attendance.course_attendance_id,
                attendance_state: status,
                deleted: attendance.deleted ?? false,
            });

            setAttendances((currentAttendances) =>
                currentAttendances.map((item) =>
                    item.id === attendance.id
                        ? {
                              ...item,
                              ...updatedAttendance,
                              state: status,
                              attendance_state: status,
                          }
                        : item,
                ),
            );

            dismissLoadingToast();
            notify.success("Estado de asistencia actualizado correctamente.");
        } catch (error) {
            const message = getErrorMessage(error);

            dismissLoadingToast();
            notify.error(message);
        } finally {
            dismissLoadingToast();
            attendanceMutationRef.current = false;
            setUpdatingAttendanceId(null);
        }
    };

    const isBusy =
        isLoading ||
        isRefreshing ||
        isLoadingAttendances ||
        isSaving ||
        updatingAttendanceId !== null;

    return {
        numericCourseId,
        backHref,

        sessions,
        attendances,
        selectedSessionId,
        selectedSession,
        searchTerm,
        filteredAttendances,
        summary,

        isLoading,
        isRefreshing,
        isLoadingAttendances,
        isSaving,
        isBusy,
        updatingAttendanceId,

        errorMessage,
        actionError,

        modalMode,
        formState,
        editingSession,
        deleteSession,

        setSearchTerm,
        setFormState,
        selectSessionId,

        refreshAll,
        openCreateModal,
        openEditModal,
        closeModal,
        openDeleteModal,
        closeDeleteModal,
        handleSubmitSession,
        handleDeleteSession,
        handleChangeAttendanceStatus,
    };
}

export type AttendanceStateHook = ReturnType<typeof useAttendance>;
